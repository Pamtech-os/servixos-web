'use client';

import { useQuery } from '@tanstack/react-query';
import { settings } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export const SETTINGS_PROFILE_KEY = 'settings-profile';
export const SETTINGS_NOTIFICATIONS_KEY = 'settings-notifications';

export function useBusinessProfileSettings() {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: [SETTINGS_PROFILE_KEY, businessId],
    queryFn: () => settings.getProfile(businessId),
    enabled: isReady,
    staleTime: 5 * 60_000,
  });
}

export function useNotificationPreferences() {
  const { businessId, isReady } = useBusinessAuth();

  return useQuery({
    queryKey: [SETTINGS_NOTIFICATIONS_KEY, businessId],
    queryFn: () => settings.getNotifications(businessId),
    enabled: isReady,
    staleTime: 5 * 60_000,
  });
}
