import { publicCall, publicGet, requestEnvelope, sessionGet, sessionRequest } from './core';

// ─── Shared types ─────────────────────────────────────────────────────────────

export type OnboardingStage =
  | 'registered'
  | 'email_verified'
  | 'pin_set'
  | 'business_created'
  | 'payment_method_added'
  | 'complete';

export interface SessionUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** null while the owner holds an onboarding session (no business yet). */
  businessId: string | null;
  mustChangePassword?: boolean;
  subdomain?: string;
  onboardingStage?: OnboardingStage;
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

export const LAUNCH_COUNTRIES = ['NG', 'GB', 'US', 'CA'] as const;
export type LaunchCountry = (typeof LAUNCH_COUNTRIES)[number];

export interface CreateAccountInput {
  firstName: string;
  lastName: string;
  email: string;
  country: LaunchCountry;
  phone: string;
  password: string;
  confirmPassword: string;
  businessRegistrationNumber?: string;
}

export interface VerifyEmailInput {
  email: string;
  otp: string;
}

export interface SetPinInput {
  pin: string;
  confirmPin: string;
}

export type OnboardingNextStep =
  | 'verify_email'
  | 'set_pin'
  | 'business_discovery'
  | 'payment_method'
  | 'dashboard';

export type BusinessRegistrationStatus = 'pending' | 'verified' | 'not_found' | 'unavailable';

export interface OnboardingStatus {
  stage: OnboardingStage;
  nextStep: OnboardingNextStep;
  firstName: string;
  email: string;
  country: LaunchCountry;
  hasPin: boolean;
  businessId: string | null;
  businessRegistration: {
    number: string;
    status: BusinessRegistrationStatus;
    registeredName: string | null;
  } | null;
}

export interface CreateBusinessInput {
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

  /** Signs the user in with an onboarding session (cookies set on web). */
  verifyEmail: (input: VerifyEmailInput) =>
    publicCall<SessionData>('/auth/onboarding/verify-email', input),

  resendOtp: (email: string) => publicCall<null>('/auth/onboarding/resend-otp', { email }),

  setPin: (input: SetPinInput) => sessionRequest<null>('POST', '/auth/onboarding/set-pin', input),

  status: () => sessionGet<OnboardingStatus>('/auth/onboarding/status'),

  /** Legacy form-based setup; the AI flow uses `onboardingWorkspace.approve` instead. */
  createBusiness: (input: CreateBusinessInput) =>
    sessionRequest<SessionData>('POST', '/auth/onboarding/business', input),
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
