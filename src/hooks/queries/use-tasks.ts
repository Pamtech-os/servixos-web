'use client';

import { useQuery } from '@tanstack/react-query';
import { tasks, type TasksQuery, type TaskActivitiesQuery } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export function useTasks(query: TasksQuery = {}) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['tasks', businessId, query],
    queryFn: () => tasks.list(businessId, query),
    enabled: !!businessId && auth.isPinVerified,
  });
}

export function useTask(id: string) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['tasks', businessId, id],
    queryFn: () => tasks.get(businessId, id),
    enabled: !!businessId && auth.isPinVerified && !!id,
  });
}

export function useTaskActivities(id: string, query: TaskActivitiesQuery = {}) {
  const { auth } = useAuth();
  const businessId = auth.user?.businessId ?? '';

  return useQuery({
    queryKey: ['task-activities', businessId, id, query],
    queryFn: () => tasks.getActivities(businessId, id, query),
    enabled: !!businessId && auth.isPinVerified && !!id,
  });
}
