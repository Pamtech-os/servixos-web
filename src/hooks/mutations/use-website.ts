'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  website,
  type WebsiteBookingForm,
  type WebsiteConfig,
  type SaveDesignInput,
  type SaveDesignResult,
  type SaveContentInput,
  type UploadLogoResult,
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

  return useMutation<SaveDesignResult, Error, SaveDesignInput>({
    mutationFn: (input) => website.saveDesign(businessId, input),
    onSuccess: (data) => {
      queryClient.setQueryData<WebsiteConfig>([WEBSITE_CONFIG_KEY, businessId], (prev) =>
        prev
          ? { ...prev, colorPrimary: data.colorPrimary, colorSecondary: data.colorSecondary, font: data.font }
          : prev,
      );
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

export function useUploadLogoMutation() {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation<UploadLogoResult, Error, File>({
    mutationFn: (file: File) => website.uploadLogo(businessId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [WEBSITE_CONFIG_KEY, businessId] });
    },
  });
}
