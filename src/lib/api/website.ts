import { protectedGet, protectedRequest } from './core';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WebsiteGenerateResult {
  subdomain: string;
  url: string;
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
};
