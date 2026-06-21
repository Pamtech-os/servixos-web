'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  tasks,
  type Task,
  type TaskSubtask,
  type TaskActivity,
  type TaskComment,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '@/lib/api-client';
import type { PaginationMeta } from '@/lib/pagination';
import { useBusinessAuth } from '@/hooks/use-business-auth';

type TaskListCache = { data: Task[]; meta: PaginationMeta };
type ActivityListCache = { data: TaskActivity[]; meta: PaginationMeta };

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
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasks.create(businessId, input),
    onSuccess: () => {
      invalidateTaskQueries(queryClient, businessId);
    },
  });
}

export function useUpdateTask() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      tasks.update(businessId, id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', businessId] });

      const previousQueries = queryClient.getQueriesData<TaskListCache>({
        queryKey: ['tasks', businessId],
      });

      queryClient.setQueriesData<TaskListCache>(
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
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasks.delete(businessId, id),
    onSuccess: () => {
      invalidateTaskQueries(queryClient, businessId);
    },
  });
}

export function useAddComment() {
  const { auth, businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      tasks.addComment(businessId, id, content),
    onMutate: async ({ id, content }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', businessId] });
      await queryClient.cancelQueries({ queryKey: ['task-activities', businessId, id] });

      const previousTasks = queryClient.getQueriesData<TaskListCache>({
        queryKey: ['tasks', businessId],
      });
      const previousActivities = queryClient.getQueriesData<ActivityListCache>({
        queryKey: ['task-activities', businessId, id],
      });

      const actorName = auth.user
        ? `${auth.user.firstName} ${auth.user.lastName}`.trim()
        : 'You';
      const now = new Date().toISOString();
      const tempId = `optimistic-${Date.now()}`;

      const optimisticComment: TaskComment = {
        _id: tempId,
        authorId: auth.user?.id ?? '',
        authorName: actorName,
        content,
        createdAt: now,
      };

      const optimisticActivity: TaskActivity = {
        _id: tempId,
        businessId,
        taskId: id,
        actorId: auth.user?.id ?? '',
        actorName,
        type: 'comment_added',
        description: `${actorName} added a comment`,
        metadata: { content },
        createdAt: now,
        updatedAt: now,
      };

      // Update task comment count
      queryClient.setQueriesData<TaskListCache>(
        { queryKey: ['tasks', businessId] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((t) =>
              t._id === id ? { ...t, comments: [...t.comments, optimisticComment] } : t
            ),
          };
        }
      );

      // Prepend to activity feed (newest first)
      queryClient.setQueriesData<ActivityListCache>(
        { queryKey: ['task-activities', businessId, id] },
        (old) => {
          if (!old) return old;
          return { ...old, data: [optimisticActivity, ...old.data] };
        }
      );

      return { previousTasks, previousActivities };
    },
    onError: (_, __, ctx) => {
      ctx?.previousTasks.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      ctx?.previousActivities.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: (_, __, { id }) => {
      invalidateTaskQueries(queryClient, businessId, id);
    },
  });
}

export function useAddSubtask() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      tasks.addSubtask(businessId, id, title),
    onMutate: async ({ id, title }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', businessId] });

      const previousQueries = queryClient.getQueriesData<TaskListCache>({
        queryKey: ['tasks', businessId],
      });

      const optimisticSubtask: TaskSubtask = {
        _id: `optimistic-${Date.now()}`,
        title,
        completed: false,
      };

      queryClient.setQueriesData<TaskListCache>(
        { queryKey: ['tasks', businessId] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((t) =>
              t._id === id ? { ...t, subtasks: [...t.subtasks, optimisticSubtask] } : t
            ),
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

export function useToggleSubtask() {
  const { businessId } = useBusinessAuth();
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
    onMutate: async ({ id, subtaskId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', businessId] });

      const previousQueries = queryClient.getQueriesData<TaskListCache>({
        queryKey: ['tasks', businessId],
      });

      queryClient.setQueriesData<TaskListCache>(
        { queryKey: ['tasks', businessId] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((t) =>
              t._id === id
                ? {
                    ...t,
                    subtasks: t.subtasks.map((st) =>
                      st._id === subtaskId ? { ...st, completed } : st
                    ),
                  }
                : t
            ),
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
