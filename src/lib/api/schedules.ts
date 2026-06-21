import { protectedGet, protectedRequest } from './core';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShiftEmployee {
  _id: string;
  fullName: string;
}

export interface Shift {
  _id: string;
  businessId: string;
  employeeId: string | ShiftEmployee;
  shiftDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
  weekStartDate: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SchedulesQuery {
  weekStartDate?: string;
  employeeId?: string;
}

export interface CreateShiftInput {
  employeeId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface UpdateShiftInput {
  employeeId?: string;
  shiftDate?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const schedules = {
  list: async (
    businessId: string,
    query: SchedulesQuery = {}
  ): Promise<{ data: Shift[]; weekStartDate: string }> => {
    const params = new URLSearchParams();
    if (query.weekStartDate) params.set('weekStartDate', query.weekStartDate);
    if (query.employeeId) params.set('employeeId', query.employeeId);

    const qs = params.toString();
    const path = `/schedules${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<Shift[]>(path, businessId);
    return {
      data: envelope.data,
      weekStartDate: envelope.weekStartDate ?? query.weekStartDate ?? '',
    };
  },

  create: (businessId: string, input: CreateShiftInput): Promise<Shift> =>
    protectedRequest<Shift>('POST', '/schedules', businessId, input),

  update: (businessId: string, id: string, input: UpdateShiftInput): Promise<Shift> =>
    protectedRequest<Shift>('PATCH', `/schedules/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/schedules/${id}`, businessId),
};
