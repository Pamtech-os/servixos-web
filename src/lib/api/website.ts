import { HttpError, RequestTimeoutError } from '@/common/network/http-client';
import type { SiteIllustrations, SiteProfile } from '@/lib/website/site-content';
import type { SiteTemplate } from '@/lib/website/site-templates';
import type { PhotoSlot, SiteImages, SitePhotos, WebsitePhotosData } from '@/lib/website/site-images';
import {
  BASE_URL,
  REAL_API_URL,
  buildCanonicalString,
  buildPathWithQuery,
  getClientToken,
  hmacSha256Hex,
  protectedGet,
  protectedRequest,
  withSessionRefresh,
} from './core';

export type {
  PhotoSlot,
  SiteGalleryImage,
  SiteGalleryPhoto,
  SiteImage,
  SiteImages,
  SitePhoto,
  SitePhotos,
  SiteServiceImage,
  SiteServicePhoto,
  WebsitePhotosData,
} from '@/lib/website/site-images';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WebsiteGenerateResult {
  subdomain: string;
  url: string;
}

export interface UploadLogoResult {
  logoUrl: string;
}

export type WebsiteBookingFieldKey =
  | 'clientName'
  | 'clientEmail'
  | 'clientPhone'
  | 'service'
  | 'requestedDate'
  | 'requestedEndDate'
  | 'message';

export interface WebsiteBookingField {
  key: WebsiteBookingFieldKey;
  label: string;
  placeholder?: string;
  required: boolean;
}

export interface WebsiteBookingForm {
  title: string;
  description?: string;
  fields: WebsiteBookingField[];
}

export interface WebsiteAiContent {
  hero: { headline: string; subheadline: string; ctaText: string };
  about: { title: string; body: string };
  services: Array<{ name: string; description: string }>;
  testimonialPlaceholder: { quote: string; author: string; isPlaceholder?: boolean };
  contact: { callToAction: string };
  illustrations?: SiteIllustrations;
}

export interface WebsiteConfig {
  isPublished: boolean;
  subdomain: string;
  colorPrimary: string;
  colorSecondary: string;
  font: string;
  /** Missing on API versions that predate templates; treated as classic. */
  template?: SiteTemplate;
  logoUrl?: string;
  aiContent?: WebsiteAiContent;
  bookingForm?: WebsiteBookingForm;
  /** Approved AI-setup details; absent for businesses not created through AI setup. */
  profile?: SiteProfile;
  /** The owner's uploads; drives the photo upload and remove controls. */
  photos?: SitePhotos;
  /** What each section renders, photo or illustration; drives the preview. */
  images?: SiteImages;
}

export interface SaveDesignInput {
  colorPrimary?: string;
  colorSecondary?: string;
  font?: string;
  template?: SiteTemplate;
}

export interface SaveDesignResult {
  colorPrimary: string;
  colorSecondary: string;
  font: string;
  template?: SiteTemplate;
}

export interface SaveContentInput {
  hero?: { headline: string; subheadline: string; ctaText: string };
  about?: { title: string; body: string };
  services?: Array<{ name: string; description: string }>;
  contact?: { callToAction: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type MultipartMethod = 'POST' | 'PUT' | 'PATCH';

/** Signed multipart request. The HMAC covers an empty body; the browser sets the multipart boundary. */
function protectedMultipart<T>(
  method: MultipartMethod,
  path: string,
  businessId: string,
  formData: FormData
): Promise<T> {
  return withSessionRefresh(async () => {
    const fetchUrl = `${BASE_URL}${path}`;
    const signUrl = `${REAL_API_URL}${path}`;
    const { token: clientToken } = await getClientToken();
    const timestamp = Date.now().toString();
    const canonical = buildCanonicalString(method, buildPathWithQuery(signUrl), timestamp, '');
    const signature = await hmacSha256Hex(canonical, clientToken);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch(fetchUrl, {
        method,
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
        if (!apiMessage && response.status === 413) apiMessage = 'File too large';
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
  });
}

function photoForm(file: File, fields: Record<string, string | undefined> = {}): FormData {
  const form = new FormData();
  form.append('file', file);
  for (const [key, value] of Object.entries(fields)) {
    const trimmed = value?.trim();
    if (trimmed) form.append(key, trimmed);
  }
  return form;
}

const PHOTOS_PATH = '/website/photos';
const servicePhotoPath = (serviceName: string) => `${PHOTOS_PATH}/services/${encodeURIComponent(serviceName)}`;

// ─── API ──────────────────────────────────────────────────────────────────────

export const website = {
  generate: (businessId: string) =>
    protectedRequest<WebsiteGenerateResult>('POST', '/website/generate', businessId),

  getConfig: async (businessId: string): Promise<WebsiteConfig> => {
    const envelope = await protectedGet<WebsiteConfig>('/website', businessId);
    return envelope.data;
  },

  saveBookingForm: (businessId: string, input: WebsiteBookingForm): Promise<null> =>
    protectedRequest<null>('PATCH', '/website/booking-form', businessId, input),

  saveDesign: (businessId: string, input: SaveDesignInput): Promise<SaveDesignResult> =>
    protectedRequest<SaveDesignResult>('PATCH', '/website/design', businessId, input),

  saveContent: (businessId: string, input: SaveContentInput): Promise<null> =>
    protectedRequest<null>('PATCH', '/website/content', businessId, input),

  uploadLogo: (businessId: string, file: File): Promise<UploadLogoResult> => {
    const form = new FormData();
    form.append('file', file);
    return protectedMultipart<UploadLogoResult>('PATCH', '/website/logo', businessId, form);
  },

  photos: {
    setSlot: (businessId: string, slot: PhotoSlot, file: File, alt?: string) =>
      protectedMultipart<WebsitePhotosData>('PUT', `${PHOTOS_PATH}/${slot}`, businessId, photoForm(file, { alt })),

    removeSlot: (businessId: string, slot: PhotoSlot) =>
      protectedRequest<WebsitePhotosData>('DELETE', `${PHOTOS_PATH}/${slot}`, businessId),

    setService: (businessId: string, serviceName: string, file: File, alt?: string) =>
      protectedMultipart<WebsitePhotosData>('PUT', servicePhotoPath(serviceName), businessId, photoForm(file, { alt })),

    removeService: (businessId: string, serviceName: string) =>
      protectedRequest<WebsitePhotosData>('DELETE', servicePhotoPath(serviceName), businessId),

    addToGallery: (businessId: string, file: File, opts: { alt?: string; caption?: string } = {}) =>
      protectedMultipart<WebsitePhotosData>('POST', `${PHOTOS_PATH}/gallery`, businessId, photoForm(file, opts)),

    reorderGallery: (businessId: string, photoIds: string[]) =>
      protectedRequest<WebsitePhotosData>('PATCH', `${PHOTOS_PATH}/gallery/order`, businessId, { photoIds }),

    removeFromGallery: (businessId: string, photoId: string) =>
      protectedRequest<WebsitePhotosData>('DELETE', `${PHOTOS_PATH}/gallery/${encodeURIComponent(photoId)}`, businessId),
  },
};
