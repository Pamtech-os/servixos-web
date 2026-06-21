'use client';

import { useMutation } from '@tanstack/react-query';
import {
  auth,
  type LoginInput,
  type ResetPasswordInput,
  type CompleteSetupInput,
} from '@/lib/api-client';

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) => auth.login(input),
  });
}

export function useVerifyPin() {
  return useMutation({
    mutationFn: ({ pin }: { pin: string }) => auth.verifyPin(pin),
  });
}

export function useCompleteSetup() {
  return useMutation({
    mutationFn: ({ input }: { input: CompleteSetupInput }) => auth.completeSetup(input),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => auth.forgotPassword(email),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => auth.resetPassword(input),
  });
}
