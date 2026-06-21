'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { jobs, type CreateJobInput, type UpdateJobInput, type Job } from '@/lib/api-client';
import type { PaginationMeta } from '@/lib/pagination';
import { useBusinessAuth } from '@/hooks/use-business-auth';

type JobsPage = { data: Job[]; meta: PaginationMeta };

export function useCreateJob() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateJobInput) => jobs.create(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs', businessId] });
    },
  });
}

export function useUpdateJob() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateJobInput }) =>
      jobs.update(businessId, id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs', businessId] });
    },
  });
}

export function useStartJob() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobs.start(businessId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs', businessId] });
    },
  });
}

export function useCompleteJob() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobs.complete(businessId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jobs', businessId] });
    },
  });
}

export function useDeleteJob() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => jobs.delete(businessId, id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueriesData<JobsPage>(
        { queryKey: ['jobs', businessId] },
        (old) => {
          if (!old) return old;
          return {
            data: old.data.filter((j) => j._id !== deletedId),
            meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: ['jobs', businessId] });
    },
  });
}

export function useBulkDeleteJobs() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => jobs.bulkDelete(businessId, ids),
    onSuccess: (_, ids) => {
      const idSet = new Set(ids);
      queryClient.setQueriesData<JobsPage>(
        { queryKey: ['jobs', businessId] },
        (old) => {
          if (!old) return old;
          return {
            data: old.data.filter((j) => !idSet.has(j._id)),
            meta: { ...old.meta, total: Math.max(0, old.meta.total - ids.length) },
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: ['jobs', businessId] });
    },
  });
}

