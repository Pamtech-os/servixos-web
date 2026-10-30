import { HttpError, NetworkOfflineError } from '@/common/network/http-client';
import { BASE_URL, buildSignedHeaders, sessionGet, sessionRequest, withSessionRefresh } from './core';
import type { SessionData } from './auth';

// ─── Profile sections ─────────────────────────────────────────────────────────

export type StartingPoint = 'no_idea' | 'has_idea' | 'existing_business';

export interface SectionMeta {
  status: 'draft' | 'approved';
  updatedBy: 'ai' | 'user';
  updatedAt: string;
}

export interface PersonSection {
  interests: string[];
  skills: string[];
  experience?: string;
  goals: string[];
  weeklyHours?: number;
  budgetAmount?: number;
  preferredIndustries: string[];
  preferredBusinessModels: string[];
  concerns: string[];
}

export interface ExistingBusinessSection {
  description: string;
  customers?: string;
  currentServices: string[];
  currentPricing?: string;
  challenges: string[];
  growthGoals: string[];
}

export interface OpportunityItem {
  title: string;
  summary: string;
  whyItFits?: string;
  estimatedStartupCost?: string;
  risks: string[];
  tradeOffs: string[];
}

export interface OpportunitiesSection {
  items: OpportunityItem[];
  selectedIndex?: number;
}

export interface ConceptSection {
  summary: string;
  valueProposition: string;
  targetCustomers: string[];
  industry: string;
}

export interface BrandSection {
  name: string;
  tagline?: string;
  primaryColor: string;
  secondaryColor: string;
  font: string;
  tone?: string;
}

export type PriceUnit = 'fixed' | 'hourly' | 'per_visit' | 'monthly';

export interface ServiceItem {
  name: string;
  description?: string;
  /** Major units (e.g. 25.5 = £25.50). AI values are suggestions only. */
  price?: number;
  priceUnit?: PriceUnit;
}

export interface ServicesSection {
  currency: string;
  items: ServiceItem[];
}

export interface WorkflowsSection {
  items: Array<{ name: string; steps: string[] }>;
}

export interface PlanSection {
  goals: string[];
  actions: Array<{ title: string; why?: string; timeframe?: string }>;
}

export interface ProfileSectionMap {
  person: PersonSection;
  existingBusiness: ExistingBusinessSection;
  opportunities: OpportunitiesSection;
  concept: ConceptSection;
  brand: BrandSection;
  services: ServicesSection;
  workflows: WorkflowsSection;
  plan: PlanSection;
}

export type ProfileSectionKey = keyof ProfileSectionMap;

export type StoredSection<K extends ProfileSectionKey> = ProfileSectionMap[K] & SectionMeta;

export type OnboardingProfile = { [K in ProfileSectionKey]?: StoredSection<K> };

export const REQUIRED_SECTIONS = ['concept', 'brand', 'services'] as const satisfies readonly ProfileSectionKey[];

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface OnboardingSession {
  startingPoint: StartingPoint | null;
  profile: OnboardingProfile;
  messages: ChatMessage[];
}

// ─── Website preview ──────────────────────────────────────────────────────────

export interface WebsitePreview {
  business: {
    name: string;
    categoryName: string;
    description?: string;
    services: string[];
  };
  website: {
    colorPrimary: string;
    colorSecondary: string;
    font: string;
    aiContent?: {
      hero: { headline: string; subheadline: string; ctaText: string };
      about: { title: string; body: string };
      services: Array<{ name: string; description: string }>;
      testimonialPlaceholder: { quote: string; author: string; isPlaceholder?: boolean };
      contact: { callToAction: string };
    };
  };
  generatedAt: string | null;
}

export interface ApproveSetupInput {
  businessCategory?: string;
  timezone?: string;
}

// ─── Chat stream ──────────────────────────────────────────────────────────────

export type ChatStreamEvent =
  | { type: 'text'; delta: string }
  | { [K in ProfileSectionKey]: { type: 'section'; section: K; data: StoredSection<K> } }[ProfileSectionKey]
  | { type: 'starting_point'; startingPoint: StartingPoint }
  | { type: 'website'; preview: WebsitePreview }
  | { type: 'done' }
  | { type: 'error'; message: string };

const CHAT_PATH = '/onboarding/chat';

function toStreamEvent(eventType: string, raw: string): ChatStreamEvent | null {
  let data: Record<string, unknown>;
  try {
    data = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    return null;
  }
  switch (eventType) {
    case 'text':
      return { type: 'text', delta: String(data.delta ?? '') };
    case 'section':
      return { type: 'section', ...data } as ChatStreamEvent;
    case 'starting_point':
      return { type: 'starting_point', startingPoint: data.startingPoint as StartingPoint };
    case 'website':
      return { type: 'website', preview: data.preview as WebsitePreview };
    case 'done':
      return { type: 'done' };
    case 'error':
      return { type: 'error', message: String(data.message ?? 'Something went wrong.') };
    default:
      return null;
  }
}

/**
 * POSTs a chat message and yields Server-Sent Events as they arrive.
 * EventSource can't send a body or the HMAC headers, so this reads the fetch body stream.
 * Aborting `signal` closes the connection, which cancels the reply server-side.
 */
export async function* streamOnboardingChat(
  message: string,
  signal: AbortSignal
): AsyncGenerator<ChatStreamEvent> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new NetworkOfflineError();

  const body = { message };
  const response = await withSessionRefresh(async () => {
    const res = await fetch(`${BASE_URL}${CHAT_PATH}`, {
      method: 'POST',
      signal,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'x-channel': 'web',
        ...(await buildSignedHeaders('POST', CHAT_PATH, body)),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errBody = (await res.json().catch(() => undefined)) as
        | { message?: string }
        | undefined;
      throw new HttpError(res.status, res.statusText, errBody?.message, errBody);
    }
    return res;
  });

  if (!response.body) throw new Error('Streaming is not supported in this browser.');

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;

      // Events are separated by a blank line; keep any trailing partial event in the buffer.
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        let eventType = 'message';
        const dataLines: string[] = [];
        for (const line of block.split(/\r?\n/)) {
          if (line.startsWith('event:')) eventType = line.slice(6).trim();
          else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
        }
        const event = toStreamEvent(eventType, dataLines.join('\n'));
        if (event) yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const onboardingWorkspace = {
  /** Creates the workspace on first visit; returns saved progress afterwards. */
  session: () => sessionGet<OnboardingSession>('/onboarding/session'),

  updateSection: <K extends ProfileSectionKey>(section: K, data: ProfileSectionMap[K]) =>
    sessionRequest<StoredSection<K>>('PATCH', `/onboarding/profile/${section}`, data),

  approveSection: <K extends ProfileSectionKey>(section: K) =>
    sessionRequest<StoredSection<K>>('POST', `/onboarding/profile/${section}/approve`),

  preview: () => sessionGet<WebsitePreview>('/onboarding/preview/website'),

  regeneratePreview: (instructions?: string) =>
    sessionRequest<WebsitePreview>(
      'POST',
      '/onboarding/preview/website',
      instructions ? { instructions } : undefined,
      { timeoutMs: 60_000 }
    ),

  /** Turns the approved profile into a business and returns a full session. */
  approve: (input: ApproveSetupInput) =>
    sessionRequest<SessionData>('POST', '/onboarding/approve', input, { timeoutMs: 60_000 }),
};
