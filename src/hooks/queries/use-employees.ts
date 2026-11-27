'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  employees,
  clock,
  type EmployeesQuery,
  type EmployeeClockHistoryQuery,
  type ClockMe,
} from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';
import { HttpError } from '@/common/network/http-client';

export function useEmployees(query: EmployeesQuery = {}, options?: { enabled?: boolean }) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['employees', businessId, query],
    queryFn: () => employees.list(businessId, query),
    enabled: isReady && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
  });
}

export function useEmployee(id: string) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['employees', businessId, id],
    queryFn: () => employees.get(businessId, id),
    enabled: isReady && !!id,
  });
}

export const CLOCK_ME_KEY = 'clock-me';
const CLOCK_ME_POLL_MS = 15_000;

/**
 * The signed-in employee and their clock (GET /clock/me), or null for an owner or a staff
 * account with no employee record. Polled while linked so a clock-out elsewhere shows here.
 */
export function useClockMe(options?: { enabled?: boolean }) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: [CLOCK_ME_KEY, businessId],
    queryFn: async (): Promise<ClockMe | null> => {
      try {
        return await clock.me(businessId);
      } catch (error) {
        if (error instanceof HttpError && error.status === 404) return null;
        throw error;
      }
    },
    enabled: isReady && (options?.enabled ?? true),
    staleTime: 0,
    refetchInterval: (query) => (query.state.data ? CLOCK_ME_POLL_MS : false),
  });
}

export function useOnlineEmployees() {
  const { businessId } = useBusinessAuth();

  return useQuery({
    queryKey: ['employees', businessId, 'online'],
    queryFn: () => employees.online(businessId),
    enabled: false,
    staleTime: 0,
    refetchInterval: false,
  });
}

export function useEmployeeClockHistory(employeeId: string, query: EmployeeClockHistoryQuery = {}) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['employee-clock-history', businessId, employeeId, query],
    queryFn: () => employees.getClockHistory(businessId, employeeId, query),
    enabled: isReady && !!employeeId,
    placeholderData: keepPreviousData,
  });
}

export function useEmployeeClockStatus(employeeId: string) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['employee-clock-status', businessId, employeeId],
    queryFn: () => clock.status(businessId, employeeId),
    enabled: isReady && !!employeeId,
    staleTime: 0,
    refetchInterval: 15_000,
  });
}
