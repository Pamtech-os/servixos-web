import { protectedGet, protectedRequest } from './core';
import type { PaginationMeta } from '@/lib/pagination';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmployeeClockStatus = 'clocked_in' | 'clocked_out' | 'on_break';

export interface Employee {
  _id: string;
  businessId: string;
  userId?: string;
  roleId: string;
  fullName: string;
  email: string;
  phone?: string;
  weeklyHoursTarget: number;
  dateJoined?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeesQuery {
  search?: string;
  roleId?: string;
  page?: number;
  limit?: number;
}

export interface CreateEmployeeInput {
  fullName: string;
  email: string;
  phone?: string;
  roleId: string;
  weeklyHoursTarget: number;
  dateJoined?: string;
}

export interface UpdateEmployeeInput {
  fullName?: string;
  email?: string;
  phone?: string;
  roleId?: string;
  weeklyHoursTarget?: number;
  dateJoined?: string;
}

export interface OnlineEmployee {
  _id: string;
  fullName: string;
  email: string;
  clockStatus: EmployeeClockStatus;
}

export interface ClockRecord {
  _id: string;
  businessId: string;
  employeeId: string;
  clockInAt: string;
  clockOutAt?: string | null;
  breakMinutes: number;
  breakStartedAt?: string | null;
  status: EmployeeClockStatus;
  totalHours?: number;
  timezone: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EmployeeClockHistoryQuery {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ClockStatusData {
  status: EmployeeClockStatus;
  clockInAt?: string | null;
  breakMinutes: number;
  currentRecord?: ClockRecord | null;
}

// ─── Employees API ────────────────────────────────────────────────────────────

export const employees = {
  list: async (
    businessId: string,
    query: EmployeesQuery = {}
  ): Promise<{ data: Employee[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.roleId) params.set('roleId', query.roleId);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/staff${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Employee[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },

  online: async (businessId: string): Promise<OnlineEmployee[]> => {
    const envelope = await protectedGet<OnlineEmployee[]>('/staff/online', businessId);
    return Array.isArray(envelope.data) ? envelope.data : [];
  },

  get: async (businessId: string, id: string): Promise<Employee> => {
    const envelope = await protectedGet<Employee>(`/staff/${id}`, businessId);
    return envelope.data;
  },

  create: (businessId: string, input: CreateEmployeeInput): Promise<Employee> =>
    protectedRequest<Employee>('POST', '/staff', businessId, input),

  update: (businessId: string, id: string, input: UpdateEmployeeInput): Promise<Employee> =>
    protectedRequest<Employee>('PATCH', `/staff/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/staff/${id}`, businessId),

  getClockHistory: async (
    businessId: string,
    id: string,
    query: EmployeeClockHistoryQuery = {}
  ): Promise<{ data: ClockRecord[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.startDate) params.set('startDate', query.startDate);
    if (query.endDate) params.set('endDate', query.endDate);
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));

    const qs = params.toString();
    const path = `/staff/${id}/clock-history${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<ClockRecord[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },
};

// ─── Clock API ────────────────────────────────────────────────────────────────

export const clock = {
  in: (businessId: string, employeeId: string): Promise<ClockRecord> =>
    protectedRequest<ClockRecord>('POST', '/clock/in', businessId, { employeeId }),

  out: (businessId: string, employeeId: string): Promise<ClockRecord> =>
    protectedRequest<ClockRecord>('POST', '/clock/out', businessId, { employeeId }),

  startBreak: (businessId: string, employeeId: string): Promise<ClockRecord> =>
    protectedRequest<ClockRecord>('POST', '/clock/break/start', businessId, { employeeId }),

  endBreak: (
    businessId: string,
    employeeId: string,
    breakDurationMinutes: number
  ): Promise<ClockRecord> =>
    protectedRequest<ClockRecord>('POST', '/clock/break/end', businessId, {
      employeeId,
      breakDurationMinutes,
    }),

  status: async (businessId: string, employeeId: string): Promise<ClockStatusData> => {
    const envelope = await protectedGet<ClockStatusData>(
      `/clock/status/${employeeId}`,
      businessId
    );
    return envelope.data;
  },
};
