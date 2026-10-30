'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  onboarding,
  onboardingWorkspace,
  type ApproveSetupInput,
  type CreateAccountInput,
  type OnboardingProfile,
  type OnboardingSession,
  type ProfileSectionKey,
  type ProfileSectionMap,
  type SetPinInput,
  type VerifyEmailInput,
  type WebsitePreview,
} from '@/lib/api-client';
import { ONBOARDING_PREVIEW_KEY, ONBOARDING_SESSION_KEY } from '@/hooks/queries/use-onboarding';

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

function useWriteSection() {
  const queryClient = useQueryClient();
  return (section: ProfileSectionKey, data: OnboardingProfile[ProfileSectionKey]) => {
    queryClient.setQueryData<OnboardingSession>([ONBOARDING_SESSION_KEY], (prev) =>
      prev ? { ...prev, profile: { ...prev.profile, [section]: data } } : prev
    );
  };
}

export function useUpdateProfileSection() {
  const writeSection = useWriteSection();
  return useMutation({
    mutationFn: ({
      section,
      data,
    }: {
      section: ProfileSectionKey;
      data: ProfileSectionMap[ProfileSectionKey];
    }) => onboardingWorkspace.updateSection(section, data),
    onSuccess: (stored, { section }) => writeSection(section, stored),
  });
}

export function useApproveProfileSection() {
  const writeSection = useWriteSection();
  return useMutation({
    mutationFn: (section: ProfileSectionKey) => onboardingWorkspace.approveSection(section),
    onSuccess: (stored, section) => writeSection(section, stored),
  });
}

export function useRegeneratePreview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instructions?: string) => onboardingWorkspace.regeneratePreview(instructions),
    onSuccess: (preview) => queryClient.setQueryData<WebsitePreview>([ONBOARDING_PREVIEW_KEY], preview),
  });
}

export function useApproveSetup() {
  return useMutation({
    mutationFn: (input: ApproveSetupInput) => onboardingWorkspace.approve(input),
  });
}
