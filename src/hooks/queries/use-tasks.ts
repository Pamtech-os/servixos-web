'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { tasks, type TasksQuery, type TaskActivitiesQuery } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useTasks(query: TasksQuery = {}) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['tasks', businessId, query],
    queryFn: () => tasks.list(businessId, query),
    enabled: isReady,
    placeholderData: keepPreviousData,
  });
}

export function useTask(id: string) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['tasks', businessId, id],
    queryFn: () => tasks.get(businessId, id),
    enabled: isReady && !!id,
  });
}

export function useTaskActivities(id: string, query: TaskActivitiesQuery = {}) {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: ['task-activities', businessId, id, query],
    queryFn: () => tasks.getActivities(businessId, id, query),
    enabled: isReady && !!id,
  });
}
