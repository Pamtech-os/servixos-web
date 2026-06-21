'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  settings,
  type UpdateBusinessProfileInput,
  type UpdatePasswordInput,
  type NotificationPreferences,
} from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';
import {
  SETTINGS_PROFILE_KEY,
  SETTINGS_NOTIFICATIONS_KEY,
} from '@/hooks/queries/use-settings';

export function useUpdateBusinessProfileMutation() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateBusinessProfileInput) =>
      settings.updateProfile(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SETTINGS_PROFILE_KEY, businessId] });
    },
  });
}

export function useUpdateNotificationsMutation() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<NotificationPreferences>) =>
      settings.updateNotifications(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SETTINGS_NOTIFICATIONS_KEY, businessId] });
    },
  });
}

export function useUpdatePasswordMutation() {
  const { businessId } = useBusinessAuth();

  return useMutation({
    mutationFn: (input: UpdatePasswordInput) => settings.updatePassword(businessId, input),
  });
}

export function useDeleteAccountMutation() {
  const { businessId } = useBusinessAuth();

  return useMutation({
    mutationFn: () => settings.deleteAccount(businessId),
  });
}
