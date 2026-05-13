'use client';

import { useQuery } from '@tanstack/react-query';
import {
  employees,
  clock,
  type EmployeesQuery,
  type EmployeeClockHistoryQuery,
  type Employee,
} from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { HttpError } from '@/common/network/http-client';

const CURRENT_EMPLOYEE_LIMIT = 50;
const CURRENT_EMPLOYEE_MAX_PAGES = 4;

function findEmployeeMatch(
  records: Employee[],
  userId: string,
  email: string
): Employee | null {
  const exactByUserId = records.find((item) => item.userId && item.userId === userId);
  if (exactByUserId) return exactByUserId;

  if (!email) return null;
  return records.find((item) => item.email.toLowerCase() === email) ?? null;
}

async function scanEmployeePages(
  businessId: string,
  firstPage: { data: Employee[]; meta: { totalPages?: number } },
  userId: string,
  email: string
): Promise<Employee | null> {
  const firstMatch = findEmployeeMatch(firstPage.data, userId, email);
  if (firstMatch) return firstMatch;

  const totalPages = Math.min(
    Math.max(firstPage.meta?.totalPages ?? 1, 1),
    CURRENT_EMPLOYEE_MAX_PAGES
  );

  for (let page = 2; page <= totalPages; page += 1) {
    const nextPage = await employees.list(businessId, {
      page,
      limit: CURRENT_EMPLOYEE_LIMIT,
    });
    const nextMatch = findEmployeeMatch(nextPage.data, userId, email);
    if (nextMatch) return nextMatch;
  }

  return null;
}

export function useEmployees(query: EmployeesQuery = {}, options?: { enabled?: boolean }) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['employees', businessId, query],
    queryFn: () => employees.list(businessId, query),
    enabled: !!businessId && auth.isPinVerified && (options?.enabled ?? true),
  });
}

export function useEmployee(id: string) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['employees', businessId, id],
    queryFn: () => employees.get(businessId, id),
    enabled: !!businessId && auth.isPinVerified && !!id,
  });
}

export function useCurrentEmployee(options?: { enabled?: boolean }) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const userId = auth.user?.id ?? '';
  const email = auth.user?.email?.trim().toLowerCase() ?? '';

  return useQuery({
    queryKey: ['employees', businessId, 'current', userId, email],
    queryFn: async (): Promise<Employee | null> => {
      try {
        const searched = await employees.list(businessId, {
          search: email || undefined,
          page: 1,
          limit: CURRENT_EMPLOYEE_LIMIT,
        });
        const searchedMatch = await scanEmployeePages(
          businessId,
          searched,
          userId,
          email
        );
        if (searchedMatch) return searchedMatch;

        if (email) {
          const broad = await employees.list(businessId, {
            page: 1,
            limit: CURRENT_EMPLOYEE_LIMIT,
          });
          return scanEmployeePages(businessId, broad, userId, email);
        }

        return null;
      } catch (error) {
        if (error instanceof HttpError && (error.status === 403 || error.status === 404)) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!businessId && auth.isPinVerified && !!email && (options?.enabled ?? true),
  });
}

export function useOnlineEmployees() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['employees', businessId, 'online'],
    queryFn: () => employees.online(businessId),
    enabled: !!businessId && auth.isPinVerified,
    staleTime: 0,
    refetchInterval: 15_000,
  });
}

export function useEmployeeClockHistory(employeeId: string, query: EmployeeClockHistoryQuery = {}) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['employee-clock-history', businessId, employeeId, query],
    queryFn: () => employees.getClockHistory(businessId, employeeId, query),
    enabled: !!businessId && auth.isPinVerified && !!employeeId,
  });
}

export function useEmployeeClockStatus(employeeId: string) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['employee-clock-status', businessId, employeeId],
    queryFn: () => clock.status(businessId, employeeId),
    enabled: !!businessId && auth.isPinVerified && !!employeeId,
    staleTime: 0,
    refetchInterval: 15_000,
  });
}
