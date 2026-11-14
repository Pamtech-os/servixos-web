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
  type PhotoSlot,
  type WebsitePhotosData,
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
          ? {
              ...prev,
              colorPrimary: data.colorPrimary,
              colorSecondary: data.colorSecondary,
              font: data.font,
              template: data.template ?? prev.template,
            }
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

// ─── Photos ───────────────────────────────────────────────────────────────────

/** Every photo endpoint returns the full photos + images, so the cache updates without a refetch. */
function usePhotoMutation<TInput>(request: (businessId: string, input: TInput) => Promise<WebsitePhotosData>) {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation<WebsitePhotosData, Error, TInput>({
    mutationFn: (input) => request(businessId, input),
    onSuccess: ({ photos, images }) => {
      queryClient.setQueryData<WebsiteConfig>([WEBSITE_CONFIG_KEY, businessId], (prev) =>
        prev ? { ...prev, photos, images } : prev,
      );
    },
  });
}

export const useSetSlotPhotoMutation = () =>
  usePhotoMutation<{ slot: PhotoSlot; file: File; alt?: string }>((id, { slot, file, alt }) =>
    website.photos.setSlot(id, slot, file, alt),
  );

export const useRemoveSlotPhotoMutation = () =>
  usePhotoMutation<PhotoSlot>((id, slot) => website.photos.removeSlot(id, slot));

export const useSetServicePhotoMutation = () =>
  usePhotoMutation<{ serviceName: string; file: File; alt?: string }>((id, { serviceName, file, alt }) =>
    website.photos.setService(id, serviceName, file, alt),
  );

export const useRemoveServicePhotoMutation = () =>
  usePhotoMutation<string>((id, serviceName) => website.photos.removeService(id, serviceName));

export const useAddGalleryPhotoMutation = () =>
  usePhotoMutation<{ file: File; alt?: string; caption?: string }>((id, { file, ...opts }) =>
    website.photos.addToGallery(id, file, opts),
  );

export const useReorderGalleryMutation = () =>
  usePhotoMutation<string[]>((id, photoIds) => website.photos.reorderGallery(id, photoIds));

export const useRemoveGalleryPhotoMutation = () =>
  usePhotoMutation<string>((id, photoId) => website.photos.removeFromGallery(id, photoId));
