import { publicCall, publicGet, requestEnvelope } from './core';

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  businessId: string;
  mustChangePassword?: boolean;
  subdomain?: string;
}

export interface SessionData {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

export interface BusinessCategory {
  _id: string;
  name: string;
  slug: string;
}

// ─── Onboarding input types ───────────────────────────────────────────────────

export interface CreateAccountInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailInput {
  email: string;
  otp: string;
}

export interface SetPinInput {
  email: string;
  pin: string;
  confirmPin: string;
}

export interface CreateBusinessInput {
  email: string;
  businessName: string;
  businessCategory: string;
  businessDescription: string;
  colorPrimary?: string;
  colorSecondary?: string;
  font?: string;
  services?: string[];
  timezone: string;
}

// ─── Auth input types ─────────────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export interface ResetPasswordInput {
  otp: string;
  newPassword: string;
}

export interface CompleteSetupInput {
  newPassword: string;
  confirmPassword: string;
  pin: string;
  confirmPin: string;
}

// ─── Onboarding API ───────────────────────────────────────────────────────────

export const onboarding = {
  createAccount: (input: CreateAccountInput) => publicCall<null>('/auth/onboarding/account', input),

  verifyEmail: (input: VerifyEmailInput) =>
    publicCall<null>('/auth/onboarding/verify-email', input),

  resendOtp: (email: string) => publicCall<null>('/auth/onboarding/resend-otp', { email }),

  setPin: (input: SetPinInput) => publicCall<null>('/auth/onboarding/set-pin', input),

  createBusiness: (input: CreateBusinessInput) =>
    publicCall<SessionData>('/auth/onboarding/business', input),
};

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const auth = {
  login: (input: LoginInput) => publicCall<SessionData>('/auth/login', input),

  verifyPin: async (pin: string): Promise<void> => {
    await requestEnvelope<{ accessToken: string }>({
      method: 'POST',
      path: '/auth/verify-pin',
      body: { pin },
      // access_token cookie is sent automatically; proxy makes this same-origin
    });
  },

  completeSetup: async (input: CompleteSetupInput): Promise<void> => {
    await requestEnvelope<{ accessToken: string }>({
      method: 'POST',
      path: '/auth/complete-setup',
      body: input,
      // access_token cookie is sent automatically; proxy makes this same-origin
    });
  },

  refresh: (): Promise<void> =>
    requestEnvelope<{ accessToken: string }>({
      method: 'POST',
      path: '/auth/refresh',
      body: {},
      // refresh_token cookie is sent and rotated automatically
    }).then(() => {}),

  logout: (): void => {
    void requestEnvelope<null>({
      method: 'POST',
      path: '/auth/logout',
      body: {},
      // refresh_token cookie is sent automatically; server clears both cookies
    }).catch(() => {});
  },

  forgotPassword: async (email: string): Promise<string> => {
    const envelope = await requestEnvelope<null>({
      method: 'POST',
      path: '/auth/forgot-password',
      body: { email },
    });
    return envelope.message;
  },

  resetPassword: (input: ResetPasswordInput) => publicCall<null>('/auth/reset-password', input),
};

// ─── Business Categories API ──────────────────────────────────────────────────

export const categories = {
  list: () => publicGet<BusinessCategory[]>('/business-categories'),
};
