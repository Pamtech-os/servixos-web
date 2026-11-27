'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clock, type EmployeeClockStatus } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { CLOCK_ME_KEY, useClockMe } from '@/hooks/queries/use-employees';
import { toast } from '@/components/ui/sonner';
import { getApiErrorDetails, getApiErrorMessage } from '@/common/network/http-client';
import { apiEvents } from '@/lib/api-events';
import { parseBusinessLocalDateTime } from '@/common/utils/datetime';

export type ClockStatus = EmployeeClockStatus;

interface ClockContextType {
  status: ClockStatus;
  clockIn: () => Promise<void>;
  clockOut: () => Promise<void>;
  startBreak: () => Promise<void>;
  endBreak: () => Promise<void>;
  clockedInAt: Date | null;
  isActionPending: boolean;
  /** False for owners and staff with no employee record: they have nothing to clock in to. */
  isClockAvailable: boolean;
  /** The portal is blocked until this employee clocks in. Owners are never gated. */
  isClockInRequired: boolean;
  employeeName: string | null;
}

const ClockContext = createContext<ClockContextType | null>(null);

type ClockAction = 'in' | 'out' | 'break_start' | 'break_end';

const ACTION_COPY: Record<ClockAction, { success: string; failure: string }> = {
  in: { success: 'Clocked in successfully', failure: 'Unable to clock in' },
  out: { success: 'Clocked out successfully', failure: 'Unable to clock out' },
  break_start: { success: 'Break started', failure: 'Unable to start break' },
  break_end: { success: 'Break ended', failure: 'Unable to end break' },
};

const MAX_BREAK_MINUTES = 480;

export const ClockProvider = ({ children }: { children: ReactNode }) => {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [isActionPending, setIsActionPending] = useState(false);
  // Set when a route refuses with CLOCK_IN_REQUIRED, which can arrive before /clock/me does
  // (or after a clock-out on another device). Its details carry the employee id.
  const [blockedEmployeeId, setBlockedEmployeeId] = useState<string | null>(null);

  const businessId = auth.user?.businessId ?? '';
  const isOwner = auth.userRole === 'owner';
  const clockMeQuery = useClockMe({ enabled: !isOwner });
  const me = clockMeQuery.data ?? null;
  const employeeId = me?.employee.id ?? blockedEmployeeId;

  const status: ClockStatus = me?.clock.status ?? 'clocked_out';
  const clockedInAtRaw = me?.clock.clockedInAt ?? null;
  const breakStartedAtRaw = me?.clock.breakStartedAt ?? null;
  // Parsed once per value so the context doesn't change on every poll that returns the same time.
  const clockedInAt = useMemo(() => parseBusinessLocalDateTime(clockedInAtRaw), [clockedInAtRaw]);
  const breakStartedAt = useMemo(
    () => parseBusinessLocalDateTime(breakStartedAtRaw),
    [breakStartedAtRaw]
  );

  useEffect(() => {
    if (isOwner) return;
    return apiEvents.on('CLOCK_IN_REQUIRED', (error) => {
      const details = getApiErrorDetails<{ employeeId?: string }>(error);
      setBlockedEmployeeId((prev) => details?.employeeId ?? prev ?? '');
      void queryClient.invalidateQueries({ queryKey: [CLOCK_ME_KEY, businessId] });
    });
  }, [businessId, isOwner, queryClient]);

  const isClockInRequired =
    !isOwner && ((!!me && status === 'clocked_out') || (!me && blockedEmployeeId !== null));

  const runAction = useCallback(
    async (action: ClockAction) => {
      if (isActionPending) return;
      if (!employeeId) {
        toast.error(ACTION_COPY[action].failure, {
          description: 'Your account isn’t linked to an employee record.',
        });
        return;
      }

      setIsActionPending(true);
      try {
        if (action === 'in') await clock.in(businessId, employeeId);
        else if (action === 'out') await clock.out(businessId, employeeId);
        else if (action === 'break_start') await clock.startBreak(businessId, employeeId);
        else {
          const minutes = breakStartedAt
            ? Math.round((Date.now() - breakStartedAt.getTime()) / 60_000)
            : 1;
          await clock.endBreak(
            businessId,
            employeeId,
            Math.min(MAX_BREAK_MINUTES, Math.max(1, minutes))
          );
        }

        if (action === 'in') {
          setBlockedEmployeeId(null);
          // Every screen that was refused while clocked out reloads now.
          await queryClient.invalidateQueries();
        } else {
          // Clocking out ends access: the refreshed status brings the clock-in prompt back.
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: [CLOCK_ME_KEY, businessId] }),
            queryClient.invalidateQueries({ queryKey: ['employees', businessId] }),
            queryClient.invalidateQueries({
              queryKey: ['employee-clock-status', businessId, employeeId],
            }),
            queryClient.invalidateQueries({
              queryKey: ['employee-clock-history', businessId, employeeId],
            }),
          ]);
        }
        toast.success(ACTION_COPY[action].success);
      } catch (err) {
        toast.error(ACTION_COPY[action].failure, { description: getApiErrorMessage(err) });
      } finally {
        setIsActionPending(false);
      }
    },
    [breakStartedAt, businessId, employeeId, isActionPending, queryClient]
  );

  const clockIn = useCallback(() => runAction('in'), [runAction]);
  const clockOut = useCallback(() => runAction('out'), [runAction]);
  const startBreak = useCallback(() => runAction('break_start'), [runAction]);
  const endBreak = useCallback(() => runAction('break_end'), [runAction]);

  const value = useMemo(
    () => ({
      status,
      clockIn,
      clockOut,
      startBreak,
      endBreak,
      clockedInAt,
      isActionPending,
      isClockAvailable: !!employeeId,
      isClockInRequired,
      employeeName: me?.employee.fullName ?? null,
    }),
    [
      status,
      clockIn,
      clockOut,
      startBreak,
      endBreak,
      clockedInAt,
      isActionPending,
      employeeId,
      isClockInRequired,
      me?.employee.fullName,
    ]
  );

  return <ClockContext.Provider value={value}>{children}</ClockContext.Provider>;
};

export const useClock = () => {
  const ctx = useContext(ClockContext);
  if (!ctx) throw new Error('useClock must be used within ClockProvider');
  return ctx;
};
