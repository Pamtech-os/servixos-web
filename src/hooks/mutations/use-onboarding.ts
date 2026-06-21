'use client';

import { useMutation } from '@tanstack/react-query';
import {
  onboarding,
  website,
  type CreateAccountInput,
  type CreateBusinessInput,
  type SetPinInput,
  type VerifyEmailInput,
} from '@/lib/api-client';

export function useCreateAccount() {
  return useMutation({
    mutationFn: (input: CreateAccountInput) => onboarding.createAccount(input),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (input: VerifyEmailInput) => onboarding.verifyEmail(input),
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (email: string) => onboarding.resendOtp(email),
  });
}

export function useSetPin() {
  return useMutation({
    mutationFn: (input: SetPinInput) => onboarding.setPin(input),
  });
}

export function useCreateBusiness() {
  return useMutation({
    mutationFn: (input: CreateBusinessInput) => onboarding.createBusiness(input),
  });
}

export function useGenerateWebsite() {
  return useMutation({
    mutationFn: (businessId: string) => website.generate(businessId),
  });
}
