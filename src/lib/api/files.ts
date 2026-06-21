import { HttpError, RequestTimeoutError } from '@/common/network/http-client';
import { BASE_URL, buildCanonicalString, buildPathWithQuery, getClientToken, hmacSha256Hex, protectedGet, protectedRequest } from './core';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientFileFormat = 'pdf' | 'doc' | 'docx' | 'png' | 'jpg';

export interface ClientFile {
  _id: string;
  businessId: string;
  clientId: string;
  filename: string;
  url: string;
  format: ClientFileFormat;
  filesizeBytes: number;
  uploadedBy?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFileResult {
  url: string;
  publicId: string;
  filename: string;
  mimeType: string;
  filesizeBytes: number;
}

export interface AttachClientFileInput {
  url: string;
  publicId: string;
  filename: string;
  mimeType: string;
  filesizeBytes: number;
}

export interface UploadedMessageAttachment {
  attachmentUrl: string;
  publicId: string;
  mimeType: string;
  fileName: string;
  fileSize: number;
}

// ─── Multipart upload helper ──────────────────────────────────────────────────

async function protectedMultipartUpload<T>(
  path: string,
  businessId: string,
  formData: FormData
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const { token: clientToken } = await getClientToken();
  const timestamp = Date.now().toString();
  const canonical = buildCanonicalString('POST', buildPathWithQuery(url), timestamp, '');
  const signature = await hmacSha256Hex(canonical, clientToken);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      credentials: 'include',
      headers: {
        'x-business-id': businessId,
        'x-client-token': clientToken,
        'x-timestamp': timestamp,
        'x-signature': signature,
        'x-channel': 'web',
      },
    });

    if (!response.ok) {
      let apiMessage: string | undefined;
      try {
        const body = (await response.json()) as Record<string, unknown>;
        const msg = body.message;
        if (typeof msg === 'string' && msg.trim()) apiMessage = msg;
      } catch {}
      throw new HttpError(response.status, response.statusText, apiMessage);
    }

    const envelope = (await response.json()) as { data: T };
    return envelope.data;
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw new RequestTimeoutError();
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Files API ────────────────────────────────────────────────────────────────

export const files = {
  upload: (businessId: string, file: File): Promise<UploadedFileResult> => {
    const form = new FormData();
    form.append('file', file);
    return protectedMultipartUpload<UploadedFileResult>('/files/upload', businessId, form);
  },

  listByClient: async (businessId: string, clientId: string): Promise<ClientFile[]> => {
    const envelope = await protectedGet<ClientFile[]>(`/clients/${clientId}/files`, businessId);
    return envelope.data;
  },

  attachToClient: (
    businessId: string,
    clientId: string,
    input: AttachClientFileInput
  ): Promise<ClientFile> =>
    protectedRequest<ClientFile>('POST', `/clients/${clientId}/files`, businessId, input),

  get: async (businessId: string, fileId: string): Promise<{ url: string }> => {
    const envelope = await protectedGet<{ url: string }>(`/files/${fileId}`, businessId);
    return envelope.data;
  },

  delete: (businessId: string, fileId: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/files/${fileId}`, businessId),
};

// ─── Request message attachments API ─────────────────────────────────────────

export const requestMessages = {
  uploadAttachment: (businessId: string, file: File): Promise<UploadedMessageAttachment> => {
    const form = new FormData();
    form.append('file', file);
    return protectedMultipartUpload<UploadedMessageAttachment>(
      '/messages/upload-attachment',
      businessId,
      form
    );
  },
};
