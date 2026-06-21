'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { files } from '@/lib/api-client';
import { useBusinessAuth } from '@/hooks/use-business-auth';

export function useUploadClientFile(clientId: string) {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const uploaded = await files.upload(businessId, file);
      return files.attachToClient(businessId, clientId, {
        url: uploaded.url,
        publicId: uploaded.publicId,
        filename: uploaded.filename,
        mimeType: uploaded.mimeType,
        filesizeBytes: uploaded.filesizeBytes,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['client-files', businessId, clientId] });
    },
  });
}

export function useDeleteClientFile(clientId: string) {
  const { businessId } = useBusinessAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => files.delete(businessId, fileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['client-files', businessId, clientId] });
    },
  });
}
