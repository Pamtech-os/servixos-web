import { HttpError, RequestTimeoutError } from '@/common/network/http-client';
import {
  BASE_URL,
  buildCanonicalString,
  buildPathWithQuery,
  getClientToken,
  hmacSha256Hex,
  protectedGet,
  protectedRequest,
} from './core';

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
  testimonialPlaceholder: { quote: string; author: string };
  contact: { callToAction: string };
}

export interface WebsiteConfig {
  isPublished: boolean;
  subdomain: string;
  colorPrimary: string;
  colorSecondary: string;
  font: string;
  logoUrl?: string;
  aiContent?: WebsiteAiContent;
  bookingForm?: WebsiteBookingForm;
}

export interface SaveDesignInput {
  colorPrimary?: string;
  colorSecondary?: string;
  font?: string;
}

export interface SaveContentInput {
  hero?: { headline: string; subheadline: string; ctaText: string };
  about?: { title: string; body: string };
  services?: Array<{ name: string; description: string }>;
  contact?: { callToAction: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function protectedMultipartPatch<T>(
  path: string,
  businessId: string,
  formData: FormData
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const { token: clientToken } = await getClientToken();
  const timestamp = Date.now().toString();
  const canonical = buildCanonicalString('PATCH', buildPathWithQuery(url), timestamp, '');
  const signature = await hmacSha256Hex(canonical, clientToken);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(url, {
      method: 'PATCH',
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

  saveDesign: (businessId: string, input: SaveDesignInput): Promise<null> =>
    protectedRequest<null>('PATCH', '/website/design', businessId, input),

  saveContent: (businessId: string, input: SaveContentInput): Promise<null> =>
    protectedRequest<null>('PATCH', '/website/content', businessId, input),

  uploadLogo: (businessId: string, file: File): Promise<UploadLogoResult> => {
    const form = new FormData();
    form.append('file', file);
    return protectedMultipartPatch<UploadLogoResult>('/website/logo', businessId, form);
  },
};
