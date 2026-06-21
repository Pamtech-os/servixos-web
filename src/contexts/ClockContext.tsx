'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
  useCallback,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clock, type EmployeeClockStatus } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentEmployee, useEmployeeClockStatus } from '@/hooks/queries/use-employees';
import { toast } from '@/components/ui/sonner';
import { getApiErrorMessage } from '@/common/network/http-client';
import { parseBusinessLocalDateTime } from '@/common/utils/datetime';

export type ClockStatus = EmployeeClockStatus;
export type ClockTrackingMode = 'api' | 'local';
export type EmployeeMappingState = 'loading' | 'mapped' | 'unmapped' | 'error';

interface ClockEntry {
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  time: Date;
}

interface ClockContextType {
  status: ClockStatus;
  clockIn: () => Promise<void>;
  clockOut: () => Promise<void>;
  startBreak: () => Promise<void>;
  endBreak: () => Promise<void>;
  clockedInAt: Date | null;
  history: ClockEntry[];
  isActionPending: boolean;
  isTrackingAvailable: boolean;
  trackingMode: ClockTrackingMode;
  employeeMappingState: EmployeeMappingState;
  mappedEmployeeId: string | null;
}

const ClockContext = createContext<ClockContextType | null>(null);

function toSafeDate(value?: string | null): Date | null {
  return parseBusinessLocalDateTime(value);
}

export const ClockProvider = ({ children }: { children: ReactNode }) => {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [history, setHistory] = useState<ClockEntry[]>([]);
  const [isActionPending, setIsActionPending] = useState(false);
  const [localStatus, setLocalStatus] = useState<ClockStatus>('clocked_out');
  const [localClockedInAt, setLocalClockedInAt] = useState<Date | null>(null);
  const [localBreakStartedAt, setLocalBreakStartedAt] = useState<Date | null>(null);

  const businessId = auth.user?.businessId ?? '';
  const currentEmployeeQuery = useCurrentEmployee();
  const employeeId = currentEmployeeQuery.data?._id ?? null;
  const clockStatusQuery = useEmployeeClockStatus(employeeId ?? '');
  const trackingMode: ClockTrackingMode = employeeId ? 'api' : 'local';
  const employeeMappingState: EmployeeMappingState = employeeId
    ? 'mapped'
    : currentEmployeeQuery.isPending
      ? 'loading'
      : currentEmployeeQuery.isError
        ? 'error'
        : 'unmapped';
  const isApiBacked = trackingMode === 'api';

  const status = isApiBacked
    ? clockStatusQuery.data?.status ?? 'clocked_out'
    : localStatus;
  const clockedInAt = isApiBacked
    ? toSafeDate(clockStatusQuery.data?.clockInAt) ??
      toSafeDate(clockStatusQuery.data?.currentRecord?.clockInAt)
    : localClockedInAt;
  const breakStartedAt = isApiBacked
    ? toSafeDate(clockStatusQuery.data?.currentRecord?.breakStartedAt ?? null)
    : localBreakStartedAt;
  const isTrackingAvailable = true;

  const addEntry = useCallback((type: ClockEntry['type']) => {
    setHistory((prev) => [...prev, { type, time: new Date() }]);
  }, []);

  const invalidateClockQueries = useCallback(
    async (targetEmployeeId: string) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['employees', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['employees', businessId, 'online'] }),
        queryClient.invalidateQueries({
          queryKey: ['employee-clock-status', businessId, targetEmployeeId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['employee-clock-history', businessId, targetEmployeeId],
        }),
      ]);
    },
    [businessId, queryClient]
  );

  const resolveEmployeeId = useCallback(async (): Promise<string | null> => {
    if (employeeId) return employeeId;
    if (!businessId || !auth.isPinVerified) return null;

    try {
      const result = await currentEmployeeQuery.refetch();
      return result.data?._id ?? null;
    } catch {
      return null;
    }
  }, [auth.isPinVerified, businessId, currentEmployeeQuery, employeeId]);

  const clockIn = useCallback(async () => {
    if (isActionPending) return;

    const targetEmployeeId = await resolveEmployeeId();
    if (!targetEmployeeId) {
      setLocalStatus('clocked_in');
      setLocalClockedInAt(new Date());
      setLocalBreakStartedAt(null);
      addEntry('clock_in');
      toast.success('Clocked in locally', {
        description: 'Employee mapping is pending, so no clock API request was sent.',
      });
      return;
    }

    setIsActionPending(true);
    try {
      await clock.in(businessId, targetEmployeeId);
      addEntry('clock_in');
      await invalidateClockQueries(targetEmployeeId);
      toast.success('Clocked in successfully');
    } catch (err) {
      toast.error('Unable to clock in', { description: getApiErrorMessage(err) });
    } finally {
      setIsActionPending(false);
    }
  }, [addEntry, businessId, invalidateClockQueries, isActionPending, resolveEmployeeId]);

  const clockOut = useCallback(async () => {
    if (isActionPending) return;

    const targetEmployeeId = await resolveEmployeeId();
    if (!targetEmployeeId) {
      setLocalStatus('clocked_out');
      setLocalClockedInAt(null);
      setLocalBreakStartedAt(null);
      addEntry('clock_out');
      toast.success('Clocked out locally', {
        description: 'Employee mapping is pending, so no clock API request was sent.',
      });
      return;
    }

    setIsActionPending(true);
    try {
      await clock.out(businessId, targetEmployeeId);
      addEntry('clock_out');
      await invalidateClockQueries(targetEmployeeId);
      toast.success('Clocked out successfully');
    } catch (err) {
      toast.error('Unable to clock out', { description: getApiErrorMessage(err) });
    } finally {
      setIsActionPending(false);
    }
  }, [addEntry, businessId, invalidateClockQueries, isActionPending, resolveEmployeeId]);

  const startBreak = useCallback(async () => {
    if (isActionPending) return;

    const targetEmployeeId = await resolveEmployeeId();
    if (!targetEmployeeId) {
      setLocalStatus('on_break');
      setLocalBreakStartedAt(new Date());
      addEntry('break_start');
      toast.success('Break started locally', {
        description: 'Employee mapping is pending, so no clock API request was sent.',
      });
      return;
    }

    setIsActionPending(true);
    try {
      await clock.startBreak(businessId, targetEmployeeId);
      addEntry('break_start');
      await invalidateClockQueries(targetEmployeeId);
      toast.success('Break started');
    } catch (err) {
      toast.error('Unable to start break', { description: getApiErrorMessage(err) });
    } finally {
      setIsActionPending(false);
    }
  }, [addEntry, businessId, invalidateClockQueries, isActionPending, resolveEmployeeId]);

  const endBreak = useCallback(async () => {
    if (isActionPending) return;

    const targetEmployeeId = await resolveEmployeeId();
    if (!targetEmployeeId) {
      setLocalStatus('clocked_in');
      setLocalBreakStartedAt(null);
      addEntry('break_end');
      toast.success('Break ended locally', {
        description: 'Employee mapping is pending, so no clock API request was sent.',
      });
      return;
    }

    const durationMinutes = (() => {
      if (!breakStartedAt) return 1;
      const diffMs = Date.now() - breakStartedAt.getTime();
      const rounded = Math.round(diffMs / 60000);
      return Math.min(480, Math.max(1, rounded));
    })();

    setIsActionPending(true);
    try {
      await clock.endBreak(businessId, targetEmployeeId, durationMinutes);
      addEntry('break_end');
      await invalidateClockQueries(targetEmployeeId);
      toast.success('Break ended');
    } catch (err) {
      toast.error('Unable to end break', { description: getApiErrorMessage(err) });
    } finally {
      setIsActionPending(false);
    }
  }, [
    addEntry,
    breakStartedAt,
    businessId,
    invalidateClockQueries,
    isActionPending,
    resolveEmployeeId,
  ]);

  const value = useMemo(
    () => ({
      status,
      clockIn,
      clockOut,
      startBreak,
      endBreak,
      clockedInAt,
      history,
      isActionPending,
      isTrackingAvailable,
      trackingMode,
      employeeMappingState,
      mappedEmployeeId: employeeId,
    }),
    [
      status,
      clockIn,
      clockOut,
      startBreak,
      endBreak,
      clockedInAt,
      history,
      isActionPending,
      isTrackingAvailable,
      trackingMode,
      employeeMappingState,
      employeeId,
    ]
  );

  return <ClockContext.Provider value={value}>{children}</ClockContext.Provider>;
};

export const useClock = () => {
  const ctx = useContext(ClockContext);
  if (!ctx) throw new Error('useClock must be used within ClockProvider');
  return ctx;
};
