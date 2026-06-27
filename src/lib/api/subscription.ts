import { protectedGet, protectedRequest, publicGet } from './core';
import type { PaginationMeta } from '@/lib/pagination';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubscriptionStatus = 'trialing' | 'active' | 'grace_period' | 'locked' | 'canceled';
export type BillingInterval = 'monthly' | 'yearly';

export interface SubscriptionPlanLimits {
  maxClients: number;
  maxJobsPerMonth: number;
  maxInvoicesPerMonth: number;
  maxEmployees: number;
  maxAiSuggestions: number;
  activityLogDays: number;
}

export interface SubscriptionPlan {
  slug: string;
  name: string;
  description: string;
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
  features: string[];
  limits: SubscriptionPlanLimits;
  isPopular: boolean;
  displayOrder: number;
}

export interface BusinessSubscription {
  plan: string;
  status: SubscriptionStatus;
  features: string[];
  billingInterval: BillingInterval;
  hasPaymentMethod: boolean;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  gracePeriodEndsAt: string | null;
  pendingAmountDue: number | null;
  pendingCurrency: string | null;
  pendingStripeInvoiceId: string | null;
}

export interface BusinessProfile {
  id: string;
  name: string;
  subdomain: string;
  email: string;
  subscription: BusinessSubscription;
}

export interface SubscribeInput {
  plan: string;
  billingInterval: BillingInterval;
  paymentMethodId?: string;
}

export interface UpgradePlanInput {
  plan: string;
  billingInterval: BillingInterval;
}

export interface SetupIntentData {
  clientSecret: string;
}

export interface PayNowData {
  clientSecret: string;
  invoiceId: string;
  amountDue: number;
  currency: string;
}

export type SubscriptionTransactionType =
  | 'trial_start'
  | 'subscription_created'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'plan_upgraded'
  | 'canceled'
  | 'account_locked'
  | 'account_restored';

export type SubscriptionTransactionStatus = 'pending' | 'success' | 'failed';

export interface SubscriptionTransaction {
  _id: string;
  type: SubscriptionTransactionType;
  status: SubscriptionTransactionStatus;
  plan: string;
  billingInterval: BillingInterval;
  amountUsd: number;
  currency: string;
  stripeInvoiceId: string;
  createdAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const subscription = {
  plans: () => publicGet<SubscriptionPlan[]>('/subscription/plans'),

  me: async (businessId: string): Promise<BusinessProfile> => {
    const envelope = await protectedGet<BusinessProfile>('/me', businessId);
    return envelope.data;
  },

  setupIntent: (businessId: string): Promise<SetupIntentData> =>
    protectedRequest<SetupIntentData>('POST', '/subscription/setup-intent', businessId),

  subscribe: (businessId: string, input: SubscribeInput): Promise<{ trialEndsAt: string }> =>
    protectedRequest<{ trialEndsAt: string }>('POST', '/subscription/subscribe', businessId, input),

  upgrade: (businessId: string, input: UpgradePlanInput): Promise<null> =>
    protectedRequest<null>('POST', '/subscription/upgrade', businessId, input),

  cancel: (businessId: string): Promise<null> =>
    protectedRequest<null>('POST', '/subscription/cancel', businessId),

  payNow: (businessId: string): Promise<PayNowData> =>
    protectedRequest<PayNowData>('POST', '/subscription/pay-now', businessId),

  transactions: async (
    businessId: string,
    query: { page?: number; limit?: number } = {}
  ): Promise<{ data: SubscriptionTransaction[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams();
    if (query.page != null) params.set('page', String(query.page));
    if (query.limit != null) params.set('limit', String(query.limit));
    const qs = params.toString();
    const path = `/subscription/transactions${qs ? `?${qs}` : ''}`;
    const envelope = await protectedGet<SubscriptionTransaction[]>(path, businessId);
    return { data: envelope.data, meta: envelope.meta! };
  },
};
