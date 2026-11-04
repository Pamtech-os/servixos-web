'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  Globe,
  Lightbulb,
  Loader2,
  Sparkles,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useImportWebsite, useSetStartingPoint } from '@/hooks/mutations/use-onboarding';
import type {
  OnboardingSession,
  StartingPointInput,
  WebsiteImportFailureCode,
  WebsiteImportMissing,
} from '@/lib/api-client';
import { getApiErrorMessage } from '@/common/network/http-client';

interface Option {
  id: string;
  label: string;
  icon: typeof Compass;
  input: StartingPointInput;
  /** Opening chat message; omitted for the website path, which imports first. */
  message?: string;
}

const OPTIONS: Option[] = [
  {
    id: 'website',
    label: 'Yes, I have a business website',
    icon: Globe,
    input: { startingPoint: 'existing_business', hasWebsite: true },
  },
  {
    id: 'existing',
    label: 'No, I run a business and need a website',
    icon: Building2,
    input: { startingPoint: 'existing_business', hasWebsite: false },
    message: 'I already run a business and want to bring it online with ServixOS.',
  },
  {
    id: 'idea',
    label: 'No, I have a business idea',
    icon: Lightbulb,
    input: { startingPoint: 'has_idea', hasWebsite: false },
    message: 'I have a business idea I want to turn into a real business.',
  },
  {
    id: 'exploring',
    label: 'I’m still exploring my business idea',
    icon: Compass,
    input: { startingPoint: 'no_idea', hasWebsite: false },
    message: "I want to start a business but I don't have an idea yet. Can you help me find one?",
  },
];

const EXISTING_BUSINESS_MESSAGE = OPTIONS[1].message!;

const FAILURE_MESSAGES: Record<WebsiteImportFailureCode, string> = {
  site_unreachable: 'We couldn’t open your website. Check the address, or tell the assistant about your business.',
  no_business_content:
    'We couldn’t find information about your business on that site. Tell the assistant about it instead.',
  ai_unavailable: 'Reading your website isn’t available right now. Try again shortly.',
  ai_declined: 'We couldn’t read that website. Tell the assistant about your business instead.',
};

const MISSING_LABELS: Record<WebsiteImportMissing, string> = {
  business_name: 'business name',
  description: 'description',
  industry: 'industry',
  services: 'services',
  pricing: 'pricing',
  target_customers: 'target customers',
  value_proposition: 'what makes you different',
  service_areas: 'areas you serve',
  contact: 'contact details',
};

const Intro = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className='space-y-3 text-center'>
    <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15'>
      <Sparkles className='h-6 w-6 text-primary' />
    </div>
    <div className='space-y-1'>
      <h2 className='font-display text-lg font-semibold'>{title}</h2>
      <p className='text-sm text-muted-foreground'>{children}</p>
    </div>
  </div>
);

interface SetupOpeningProps {
  firstName?: string;
  session: OnboardingSession | undefined;
  onSend: (message: string) => void;
}

/**
 * The chat's empty state: asks whether the owner already has a website, and for those
 * who do, reads it to draft the profile before the conversation starts.
 */
const SetupOpening = ({ firstName, session, onSend }: SetupOpeningProps) => {
  const setStartingPoint = useSetStartingPoint();
  const importWebsite = useImportWebsite();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const websiteImport = session?.websiteImport;
  const wantsImport = session?.startingPoint === 'existing_business' && session.hasWebsite === true;

  const choose = (option: Option) => {
    setError('');
    setStartingPoint.mutate(option.input, {
      onSuccess: () => option.message && onSend(option.message),
      onError: (err) => setError(getApiErrorMessage(err)),
    });
  };

  const submitUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError('');
    importWebsite.mutate(url.trim(), { onError: (err) => setError(getApiErrorMessage(err)) });
  };

  const errorText = error && <p className='text-center text-xs text-destructive'>{error}</p>;

  if (!wantsImport) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className='mx-auto flex max-w-md flex-col gap-4 py-8'
      >
        <Intro title={`Hi${firstName ? ` ${firstName}` : ''}, let’s build your business`}>
          Do you already have a business website? I&apos;ll draft your concept, brand and services
          as we go, and you approve each part.
        </Intro>
        <div className='grid gap-2'>
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const isPicked =
              setStartingPoint.isPending && setStartingPoint.variables === option.input;
            return (
              <button
                key={option.id}
                type='button'
                onClick={() => choose(option)}
                disabled={setStartingPoint.isPending}
                className='flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60'
              >
                {isPicked ? (
                  <Loader2 className='h-4 w-4 shrink-0 animate-spin text-primary' />
                ) : (
                  <Icon className='h-4 w-4 shrink-0 text-primary' />
                )}
                {option.label}
              </button>
            );
          })}
        </div>
        {errorText}
      </motion.div>
    );
  }

  if (websiteImport?.status === 'pending') {
    return (
      <div className='mx-auto flex max-w-md flex-col items-center gap-3 py-12 text-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <h2 className='font-display text-lg font-semibold'>Reading your website…</h2>
        <p className='text-sm text-muted-foreground'>
          We&apos;re reading {websiteImport.domain} and drafting your profile. This usually takes under a
          minute.
        </p>
      </div>
    );
  }

  if (websiteImport?.status === 'ready' || websiteImport?.status === 'partial') {
    const missing = websiteImport.missing.map((m) => MISSING_LABELS[m] ?? m);
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className='mx-auto flex max-w-md flex-col items-center gap-4 py-8 text-center'
      >
        <CheckCircle2 className='h-10 w-10 text-emerald-500' />
        <div className='space-y-1'>
          <h2 className='font-display text-lg font-semibold'>We read {websiteImport.domain}</h2>
          <p className='text-sm text-muted-foreground'>
            Your profile has been drafted from your website. Check it in the Profile panel: fields
            marked &ldquo;Please check&rdquo; are our best guess.
          </p>
          {missing.length > 0 && (
            <p className='text-sm text-muted-foreground'>
              We still need your {missing.join(', ')}. The assistant will ask about these.
            </p>
          )}
        </div>
        <Button
          onClick={() => onSend(`I've connected my website, ${websiteImport.domain}.`)}
          className='gradient-bg gap-1.5 text-primary-foreground'
        >
          Continue with the assistant <ArrowRight className='h-4 w-4' />
        </Button>
      </motion.div>
    );
  }

  // No import yet, or the last one failed.
  const failure =
    websiteImport?.status === 'failed'
      ? FAILURE_MESSAGES[websiteImport.failureCode ?? 'site_unreachable']
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className='mx-auto flex max-w-md flex-col gap-4 py-8'
    >
      <Intro title='Connect your website'>
        We&apos;ll read your public site and draft your profile from it. We never change or host
        your website.
      </Intro>
      {failure && (
        <p className='rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400'>
          {failure}
        </p>
      )}
      <form onSubmit={submitUrl} className='flex gap-2'>
        <Input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError('');
          }}
          placeholder='www.yourbusiness.com'
          inputMode='url'
          autoComplete='url'
          aria-label='Website address'
          disabled={importWebsite.isPending}
        />
        <Button type='submit' className='shrink-0' disabled={!url.trim() || importWebsite.isPending}>
          {importWebsite.isPending && <Loader2 className='h-4 w-4 animate-spin' />}
          Read my site
        </Button>
      </form>
      {errorText}
      <button
        type='button'
        onClick={() => onSend(EXISTING_BUSINESS_MESSAGE)}
        className='mx-auto flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
      >
        <Store className='h-3.5 w-3.5' /> Tell the assistant about my business instead
      </button>
    </motion.div>
  );
};

export default SetupOpening;
