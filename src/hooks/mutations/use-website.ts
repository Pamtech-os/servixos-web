'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  website,
  type WebsiteBookingForm,
  type SaveDesignInput,
  type SaveContentInput,
} from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';
import { WEBSITE_CONFIG_KEY } from '@/hooks/queries/use-website';

export function useSaveBookingFormMutation() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: WebsiteBookingForm) => website.saveBookingForm(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [WEBSITE_CONFIG_KEY, businessId] });
    },
  });
}

export function useSaveDesignMutation() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveDesignInput) => website.saveDesign(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [WEBSITE_CONFIG_KEY, businessId] });
    },
  });
}

export function useSaveContentMutation() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveContentInput) => website.saveContent(businessId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [WEBSITE_CONFIG_KEY, businessId] });
    },
  });
}

export function usePublishWebsiteMutation() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => website.generate(businessId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [WEBSITE_CONFIG_KEY, businessId] });
    },
  });
}
