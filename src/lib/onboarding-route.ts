import type { OnboardingNextStep } from '@/lib/api-client';

export function pathForOnboardingStep(nextStep: OnboardingNextStep): string {
  switch (nextStep) {
    case 'verify_email':
    case 'set_pin':
      return '/signup';
    case 'business_discovery':
      return '/onboarding';
    default:
      // payment_method is a blocking step rendered inside the dashboard shell.
      return '/dashboard';
  }
}

// The PIN chosen during signup, held in memory only (never persisted) so the session
// can be PIN-verified silently once the business is approved. A page reload drops it
// and the user simply enters the PIN on /pin instead.
let _pendingPin: string | null = null;

export const pendingPin = {
  set(pin: string) {
    _pendingPin = pin;
  },
  take(): string | null {
    const pin = _pendingPin;
    _pendingPin = null;
    return pin;
  },
};
