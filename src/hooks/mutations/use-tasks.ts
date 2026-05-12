'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasks, type Task, type CreateTaskInput, type UpdateTaskInput } from '@/lib/api-client';
import type { PaginationMeta } from '@/lib/pagination';
import { useAuth } from '@/contexts/AuthContext';

function invalidateTaskQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  businessId: string,
  taskId?: string
) {
  void queryClient.invalidateQueries({ queryKey: ['tasks', businessId] });
  if (taskId) {
    void queryClient.invalidateQueries({ queryKey: ['task-activities', businessId, taskId] });
  }
}

export function useCreateTask() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasks.create(businessId, input),
    onSuccess: () => {
      invalidateTaskQueries(queryClient, businessId);
    },
  });
}

export function useUpdateTask() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      tasks.update(businessId, id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', businessId] });

      const previousQueries = queryClient.getQueriesData<{ data: Task[]; meta: PaginationMeta }>({
        queryKey: ['tasks', businessId],
      });

      queryClient.setQueriesData<{ data: Task[]; meta: PaginationMeta }>(
        { queryKey: ['tasks', businessId] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((t) => (t._id === id ? { ...t, ...input } : t)),
          };
        }
      );

      return { previousQueries };
    },
    onError: (_, __, ctx) => {
      ctx?.previousQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: (_, __, { id }) => {
      invalidateTaskQueries(queryClient, businessId, id);
    },
  });
}

export function useDeleteTask() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasks.delete(businessId, id),
    onSuccess: () => {
      invalidateTaskQueries(queryClient, businessId);
    },
  });
}

export function useAddComment() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      tasks.addComment(businessId, id, content),
    onSuccess: (_, { id }) => {
      invalidateTaskQueries(queryClient, businessId, id);
    },
  });
}

export function useAddSubtask() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      tasks.addSubtask(businessId, id, title),
    onSuccess: (_, { id }) => {
      invalidateTaskQueries(queryClient, businessId, id);
    },
  });
}

export function useToggleSubtask() {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      subtaskId,
      completed,
    }: {
      id: string;
      subtaskId: string;
      completed: boolean;
    }) => tasks.toggleSubtask(businessId, id, subtaskId, completed),
    onSuccess: (_, { id }) => {
      invalidateTaskQueries(queryClient, businessId, id);
    },
  });
}
