'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { schedules, type CreateShiftInput, type UpdateShiftInput } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

function invalidateScheduleQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  businessId: string
) {
  void queryClient.invalidateQueries({ queryKey: ['schedules', businessId] });
}

export function useCreateShift() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateShiftInput) => schedules.create(businessId, input),
    onSuccess: () => {
      invalidateScheduleQueries(queryClient, businessId);
    },
  });
}

export function useUpdateShift() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateShiftInput }) =>
      schedules.update(businessId, id, input),
    onSuccess: () => {
      invalidateScheduleQueries(queryClient, businessId);
    },
  });
}

export function useDeleteShift() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => schedules.delete(businessId, id),
    onSuccess: () => {
      invalidateScheduleQueries(queryClient, businessId);
    },
  });
}
