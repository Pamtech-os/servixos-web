'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  employees,
  clock,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
} from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

function invalidateEmployeeQueries(queryClient: ReturnType<typeof useQueryClient>, businessId: string) {
  void queryClient.invalidateQueries({ queryKey: ['employees', businessId] });
}

export function useCreateEmployee() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => employees.create(businessId, input),
    onSuccess: () => {
      invalidateEmployeeQueries(queryClient, businessId);
    },
  });
}

export function useUpdateEmployee() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEmployeeInput }) =>
      employees.update(businessId, id, input),
    onSuccess: (_, variables) => {
      invalidateEmployeeQueries(queryClient, businessId);
      void queryClient.invalidateQueries({
        queryKey: ['employees', businessId, variables.id],
      });
    },
  });
}

export function useDeleteEmployee() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employees.delete(businessId, id),
    onSuccess: (_, id) => {
      invalidateEmployeeQueries(queryClient, businessId);
      void queryClient.invalidateQueries({
        queryKey: ['employee-clock-history', businessId, id],
      });
      void queryClient.invalidateQueries({
        queryKey: ['employee-clock-status', businessId, id],
      });
    },
  });
}

export function useClockInEmployee() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: string) => clock.in(businessId, employeeId),
    onSuccess: (_, employeeId) => {
      invalidateEmployeeQueries(queryClient, businessId);
      void queryClient.invalidateQueries({
        queryKey: ['employee-clock-status', businessId, employeeId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['employee-clock-history', businessId, employeeId],
      });
    },
  });
}

export function useClockOutEmployee() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: string) => clock.out(businessId, employeeId),
    onSuccess: (_, employeeId) => {
      invalidateEmployeeQueries(queryClient, businessId);
      void queryClient.invalidateQueries({
        queryKey: ['employee-clock-status', businessId, employeeId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['employee-clock-history', businessId, employeeId],
      });
    },
  });
}

export function useStartBreakEmployee() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeId: string) => clock.startBreak(businessId, employeeId),
    onSuccess: (_, employeeId) => {
      void queryClient.invalidateQueries({
        queryKey: ['employee-clock-status', businessId, employeeId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['employee-clock-history', businessId, employeeId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['employees', businessId, 'online'],
      });
    },
  });
}

export function useEndBreakEmployee() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, breakDurationMinutes }: { employeeId: string; breakDurationMinutes: number }) =>
      clock.endBreak(businessId, employeeId, breakDurationMinutes),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['employee-clock-status', businessId, variables.employeeId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['employee-clock-history', businessId, variables.employeeId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['employees', businessId, 'online'],
      });
    },
  });
}
