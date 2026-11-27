'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  onboarding,
  onboardingWorkspace,
  type ApproveSetupInput,
  type CreateAccountInput,
  type OnboardingProfile,
  type OnboardingSession,
  type OnboardingStatus,
  type ProfileSectionKey,
  type ProfileSectionMap,
  type SetPinInput,
  type StartingPointInput,
  type VerifyEmailInput,
  type WebsitePreview,
} from '@/lib/api-client';
import {
  ONBOARDING_PREVIEW_KEY,
  ONBOARDING_SESSION_KEY,
  ONBOARDING_STATUS_KEY,
} from '@/hooks/queries/use-onboarding';
import { HttpError } from '@/common/network/http-client';

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

export function useSetStartingPoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StartingPointInput) => onboardingWorkspace.setStartingPoint(input),
    onSuccess: (session) => queryClient.setQueryData<OnboardingSession>([ONBOARDING_SESSION_KEY], session),
  });
}

export function useImportWebsite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (url: string) => onboardingWorkspace.importWebsite(url),
    // Seeding `pending` starts the session poll straight away.
    onSuccess: (websiteImport) =>
      queryClient.setQueryData<OnboardingSession>([ONBOARDING_SESSION_KEY], (prev) =>
        prev ? { ...prev, hasWebsite: true, websiteImport } : prev
      ),
    onError: (err) => {
      // 409: an import is already running, so resume polling it.
      if (err instanceof HttpError && err.status === 409) {
        void queryClient.invalidateQueries({ queryKey: [ONBOARDING_SESSION_KEY] });
      }
    },
  });
}

export function useSubmitRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (registrationNumber: string) => onboardingWorkspace.submitRegistration(registrationNumber),
    // Seeding `pending` starts the status poll straight away.
    onSuccess: ({ number, status }) =>
      queryClient.setQueriesData<OnboardingStatus>({ queryKey: [ONBOARDING_STATUS_KEY] }, (prev) =>
        prev ? { ...prev, businessRegistration: { number, status, registeredName: null } } : prev
      ),
    onError: (err) => {
      // Already submitted elsewhere: pull the real state instead of showing the form.
      if (err instanceof HttpError && err.status === 409) {
        void queryClient.invalidateQueries({ queryKey: [ONBOARDING_STATUS_KEY] });
      }
    },
  });
}

export function useApproveSetup() {
  return useMutation({
    mutationFn: (input: ApproveSetupInput) => onboardingWorkspace.approve(input),
  });
}
