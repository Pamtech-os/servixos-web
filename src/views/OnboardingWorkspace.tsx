'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  Check,
  Clock,
  Globe,
  LayoutList,
  Loader2,
  LogOut,
  MessageSquare,
  Rocket,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import OnboardingChat from '@/components/onboarding/OnboardingChat';
import ProfilePanel, { SECTION_LABELS } from '@/components/onboarding/ProfilePanel';
import WebsitePreviewPanel from '@/components/onboarding/WebsitePreviewPanel';
import { useAuth } from '@/contexts/AuthContext';
import {
  ONBOARDING_PREVIEW_KEY,
  ONBOARDING_SESSION_KEY,
  ONBOARDING_STATUS_KEY,
  useOnboardingSession,
  useOnboardingStatus,
  useWebsitePreview,
} from '@/hooks/queries/use-onboarding';
import { useBusinessCategories } from '@/hooks/queries/use-business-categories';
import { useApproveSetup } from '@/hooks/mutations/use-onboarding';
import { useOnboardingChat } from '@/hooks/use-onboarding-chat';
import {
  REQUIRED_SECTIONS,
  auth as authApi,
  type OnboardingStatus,
  type ProfileSectionKey,
  type StartingPoint,
} from '@/lib/api-client';
import { pathForOnboardingStep, pendingPin } from '@/lib/onboarding-route';
import {
  HttpError,
  getApiErrorCode,
  getApiErrorDetails,
  getApiErrorMessage,
} from '@/common/network/http-client';
import { cn } from '@/lib/utils';
import servixLogo from '@/assets/servix-logo.png';

type MobileTab = 'chat' | 'profile' | 'website';
type SideTab = 'profile' | 'website';

const JOURNEYS: Record<StartingPoint, ProfileSectionKey[]> = {
  no_idea: ['person', 'opportunities', 'concept', 'brand', 'services'],
  has_idea: ['concept', 'brand', 'services'],
  existing_business: ['existingBusiness', 'concept', 'brand', 'services'],
};

const JOURNEY_LABELS: Record<StartingPoint, string> = {
  no_idea: 'Finding your idea',
  has_idea: 'Shaping your idea',
  existing_business: 'Bringing your business online',
};

const RegistrationBadge = ({ registration }: { registration: OnboardingStatus['businessRegistration'] }) => {
  if (!registration) return null;
  const { status, number, registeredName } = registration;
  const config = {
    verified: {
      icon: BadgeCheck,
      text: registeredName ? `Verified: ${registeredName}` : `${number} verified`,
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
    },
    pending: {
      icon: Clock,
      text: `Checking ${number}…`,
      className: 'border-border bg-muted text-muted-foreground',
    },
    not_found: {
      icon: ShieldAlert,
      text: `${number} not found in the registry`,
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
    },
    // The registry couldn't be reached: treat as unverified, not as an error.
    unavailable: {
      icon: Clock,
      text: `${number} not verified yet`,
      className: 'border-border bg-muted text-muted-foreground',
    },
  }[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs md:inline-flex',
        config.className
      )}
    >
      <Icon className='h-3.5 w-3.5' />
      {config.text}
    </span>
  );
};

const OnboardingWorkspace = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { auth, isHydrated, setSession, completeVerification, logout } = useAuth();

  const isOnboardingSession = isHydrated && auth.isLoggedIn && !auth.user?.businessId;
  const statusQuery = useOnboardingStatus({ refetchWhilePending: true });
  const canUseWorkspace = isOnboardingSession && statusQuery.data?.nextStep === 'business_discovery';
  const sessionQuery = useOnboardingSession(canUseWorkspace);
  const previewQuery = useWebsitePreview(canUseWorkspace);
  const chat = useOnboardingChat();
  const approveMutation = useApproveSetup();
  const { data: categories = [] } = useBusinessCategories();

  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');
  const [sideTab, setSideTab] = useState<SideTab>('profile');
  const [highlighted, setHighlighted] = useState<ReadonlySet<ProfileSectionKey>>(new Set());
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [category, setCategory] = useState('');

  // Guard: only an onboarding session at the discovery step belongs here.
  useEffect(() => {
    if (!isHydrated) return;
    if (!auth.isLoggedIn) {
      router.replace('/login');
      return;
    }
    if (auth.user?.businessId) {
      router.replace(auth.isPinVerified ? '/dashboard' : '/pin');
      return;
    }
    const nextStep = statusQuery.data?.nextStep;
    if (nextStep && nextStep !== 'business_discovery') {
      router.replace(pathForOnboardingStep(nextStep));
    }
  }, [isHydrated, auth.isLoggedIn, auth.user?.businessId, auth.isPinVerified, statusQuery.data?.nextStep, router]);

  const session = sessionQuery.data;
  const profile = useMemo(() => session?.profile ?? {}, [session?.profile]);
  const missingRequired = REQUIRED_SECTIONS.filter((key) => profile[key]?.status !== 'approved');
  const canLaunch = missingRequired.length === 0;
  const canGeneratePreview = Boolean(profile.concept && profile.brand);

  // Clear a highlight as soon as that section gets approved.
  useEffect(() => {
    setHighlighted((prev) => {
      const next = new Set([...prev].filter((key) => profile[key]?.status !== 'approved'));
      return next.size === prev.size ? prev : next;
    });
  }, [profile]);

  const journey = session?.startingPoint ? JOURNEYS[session.startingPoint] : null;

  const focusSections = (sections: ProfileSectionKey[]) => {
    setHighlighted(new Set(sections));
    setSideTab('profile');
    setMobileTab('profile');
    requestAnimationFrame(() =>
      document
        .getElementById(`profile-section-${sections[0]}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    );
  };

  const finishOnboarding = async () => {
    queryClient.removeQueries({ queryKey: [ONBOARDING_SESSION_KEY] });
    queryClient.removeQueries({ queryKey: [ONBOARDING_PREVIEW_KEY] });
    queryClient.removeQueries({ queryKey: [ONBOARDING_STATUS_KEY] });

    // Verify the PIN chosen at signup silently; otherwise ask for it.
    const pin = pendingPin.take();
    if (pin) {
      try {
        await authApi.verifyPin(pin);
        completeVerification();
        router.replace('/dashboard');
        return;
      } catch {
        // fall through to manual PIN entry
      }
    }
    router.replace('/pin');
  };

  const handleLaunch = async (businessCategory?: string) => {
    if (!canLaunch) {
      focusSections(missingRequired);
      return;
    }
    try {
      const newSession = await approveMutation.mutateAsync({
        businessCategory,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setCategoryPickerOpen(false);
      setSession(newSession);
      toast.success('Welcome to your Online Office!', { description: 'Your business is set up.' });
      await finishOnboarding();
    } catch (err) {
      if (getApiErrorCode(err) === 'SETUP_NOT_APPROVED') {
        const missing =
          getApiErrorDetails<{ missingSections?: ProfileSectionKey[] }>(err)?.missingSections ??
          missingRequired;
        toast.error('Almost there', {
          description: `Please approve: ${missing.map((k) => SECTION_LABELS[k]).join(', ')}.`,
        });
        focusSections(missing);
        return;
      }
      if (err instanceof HttpError && err.status === 409) {
        // The business already exists; a fresh sign-in returns the full session.
        toast.info('Your business is already set up', { description: 'Please sign in again.' });
        logout();
        router.replace('/login');
        return;
      }
      const message = getApiErrorMessage(err);
      if (err instanceof HttpError && err.status === 400 && /categor/i.test(message)) {
        setCategoryPickerOpen(true);
        return;
      }
      if (err instanceof HttpError && err.status === 400 && /\bpin\b/i.test(message)) {
        toast.error('Set your security PIN first');
        router.replace('/signup');
        return;
      }
      toast.error(message);
    }
  };

  if (!canUseWorkspace || sessionQuery.isLoading) {
    return (
      <div className='flex min-h-dvh items-center justify-center bg-background'>
        {sessionQuery.isError ? (
          <div className='space-y-3 text-center'>
            <p className='text-sm text-muted-foreground'>{getApiErrorMessage(sessionQuery.error)}</p>
            <Button variant='outline' onClick={() => void sessionQuery.refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <Loader2 className='h-6 w-6 animate-spin text-primary' />
        )}
      </div>
    );
  }

  const profilePanel = <ProfilePanel profile={profile} highlighted={highlighted} />;
  const websitePanel = (
    <WebsitePreviewPanel
      preview={previewQuery.data}
      isLoading={previewQuery.isLoading}
      canGenerate={canGeneratePreview}
    />
  );
  const chatPanel = (
    <OnboardingChat
      firstName={auth.user?.firstName}
      messages={session?.messages ?? []}
      streamingText={chat.streamingText}
      isStreaming={chat.isStreaming}
      error={chat.error}
      onSend={(message) => void chat.send(message)}
      onStop={chat.stop}
    />
  );

  const tabButton = (active: boolean) =>
    cn(
      'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
      active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
    );

  return (
    <div className='flex h-dvh flex-col bg-background'>
      {/* Header */}
      <header className='flex items-center gap-3 border-b border-border px-4 py-3'>
        <Image src={servixLogo} alt='Servix OS' width={32} height={32} className='h-8 w-8' />
        <div className='min-w-0 flex-1'>
          <p className='truncate font-display text-sm font-semibold sm:text-base'>
            AI Business Setup
          </p>
          <p className='truncate text-xs text-muted-foreground'>
            {session?.startingPoint ? JOURNEY_LABELS[session.startingPoint] : 'Step 2 of 3'}
          </p>
        </div>

        {journey && (
          <ol className='hidden items-center gap-1 xl:flex'>
            {journey.map((key, i) => {
              const status = profile[key]?.status;
              return (
                <li key={key} className='flex items-center gap-1'>
                  <span
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]',
                      status === 'approved'
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : status
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {status === 'approved' && <Check className='h-3 w-3' />}
                    {SECTION_LABELS[key]}
                  </span>
                  {i < journey.length - 1 && <span className='h-px w-2 bg-border' />}
                </li>
              );
            })}
          </ol>
        )}

        <RegistrationBadge registration={statusQuery.data?.businessRegistration ?? null} />

        <Button
          onClick={() => void handleLaunch()}
          disabled={approveMutation.isPending}
          className={cn('shrink-0', canLaunch && 'gradient-bg text-primary-foreground')}
          variant={canLaunch ? 'default' : 'outline'}
          title={canLaunch ? undefined : 'Approve your concept, brand and services first'}
        >
          {approveMutation.isPending ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Rocket className='h-4 w-4' />
          )}
          <span className='hidden sm:inline'>Launch my business</span>
          <span className='sm:hidden'>Launch</span>
        </Button>
        <Button variant='ghost' size='icon' onClick={logout} aria-label='Sign out'>
          <LogOut className='h-4 w-4' />
        </Button>
      </header>

      {/* Mobile tabs */}
      <div className='flex gap-1 border-b border-border bg-muted/40 p-1 lg:hidden'>
        <button type='button' className={tabButton(mobileTab === 'chat')} onClick={() => setMobileTab('chat')}>
          <MessageSquare className='h-3.5 w-3.5' /> Chat
        </button>
        <button type='button' className={tabButton(mobileTab === 'profile')} onClick={() => setMobileTab('profile')}>
          <LayoutList className='h-3.5 w-3.5' /> Profile
          {missingRequired.length > 0 && (
            <span className='rounded-full bg-amber-500/20 px-1.5 text-[10px] text-amber-500'>
              {missingRequired.length}
            </span>
          )}
        </button>
        <button type='button' className={tabButton(mobileTab === 'website')} onClick={() => setMobileTab('website')}>
          <Globe className='h-3.5 w-3.5' /> Website
        </button>
      </div>

      <div className='grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]'>
        <section
          className={cn(
            'min-h-0 border-border lg:flex lg:flex-col lg:border-r',
            mobileTab === 'chat' ? 'flex flex-col' : 'hidden'
          )}
        >
          {chatPanel}
        </section>

        <section
          className={cn('min-h-0 flex-col lg:flex', mobileTab === 'chat' ? 'hidden' : 'flex')}
        >
          <div className='hidden gap-1 border-b border-border bg-muted/40 p-1 lg:flex'>
            <button type='button' className={tabButton(sideTab === 'profile')} onClick={() => setSideTab('profile')}>
              <LayoutList className='h-3.5 w-3.5' /> Business profile
              {missingRequired.length > 0 && (
                <span className='rounded-full bg-amber-500/20 px-1.5 text-[10px] text-amber-500'>
                  {missingRequired.length} to approve
                </span>
              )}
            </button>
            <button type='button' className={tabButton(sideTab === 'website')} onClick={() => setSideTab('website')}>
              <Globe className='h-3.5 w-3.5' /> Website preview
            </button>
          </div>
          <div className='min-h-0 flex-1 overflow-y-auto p-4'>
            {/* Desktop follows sideTab, mobile follows mobileTab. */}
            <div className='hidden lg:block'>{sideTab === 'profile' ? profilePanel : websitePanel}</div>
            <div className='lg:hidden'>{mobileTab === 'website' ? websitePanel : profilePanel}</div>
          </div>
        </section>
      </div>

      <Dialog open={categoryPickerOpen} onOpenChange={setCategoryPickerOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogTitle>Pick your business category</DialogTitle>
          <DialogDescription>
            We couldn&apos;t match your business to a category automatically.
          </DialogDescription>
          <div className='space-y-2'>
            <Label htmlFor='business-category'>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id='business-category'>
                <SelectValue placeholder='Select a category' />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => void handleLaunch(category)}
            disabled={!category || approveMutation.isPending}
            className='gradient-bg text-primary-foreground'
          >
            {approveMutation.isPending && <Loader2 className='h-4 w-4 animate-spin' />}
            Launch my business
          </Button>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default OnboardingWorkspace;
