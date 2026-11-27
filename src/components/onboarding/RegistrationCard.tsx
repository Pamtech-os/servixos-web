'use client';

import { useState } from 'react';
import { BadgeCheck, Clock, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSubmitRegistration } from '@/hooks/mutations/use-onboarding';
import type { LaunchCountry, OnboardingStatus } from '@/lib/api-client';
import { getApiErrorMessage } from '@/common/network/http-client';

const REG_NUMBER_PATTERN = /^[A-Za-z0-9-]{1,30}$/;

const REGISTRY_NAMES: Partial<Record<LaunchCountry, string>> = {
  NG: 'the CAC',
  GH: "Ghana's business registry",
  CA: 'the Canadian business registry',
};

interface RegistrationCardProps {
  country: LaunchCountry;
  registration: OnboardingStatus['businessRegistration'];
}

const RegistrationCard = ({ country, registration }: RegistrationCardProps) => {
  const submit = useSubmitRegistration();
  const [value, setValue] = useState(registration?.number ?? '');
  const [error, setError] = useState('');
  const registry = REGISTRY_NAMES[country] ?? 'the business registry';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const number = value.replace(/\s+/g, '');
    if (!REG_NUMBER_PATTERN.test(number)) {
      setError('Use letters, numbers and hyphens only (max 30 characters).');
      return;
    }
    setError('');
    submit.mutate(number, { onError: (err) => setError(getApiErrorMessage(err)) });
  };

  const status = registration?.status;

  if (status === 'verified') {
    return (
      <div className='flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4'>
        <BadgeCheck className='mt-0.5 h-5 w-5 shrink-0 text-emerald-500' />
        <div className='text-sm'>
          <p className='font-semibold'>{registration?.registeredName ?? 'Registration verified'}</p>
          <p className='text-xs text-muted-foreground'>
            {registration?.number} is registered with {registry}.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className='flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4'>
        <Loader2 className='mt-0.5 h-5 w-5 shrink-0 animate-spin text-primary' />
        <div className='text-sm'>
          <p className='font-semibold'>Verifying {registration?.number}…</p>
          <p className='text-xs text-muted-foreground'>
            We&apos;re checking with {registry}. This usually takes a few seconds.
          </p>
        </div>
      </div>
    );
  }

  // Final: each business gets one billed lookup, so there is no retry.
  if (status === 'not_found') {
    return (
      <div className='flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4'>
        <ShieldAlert className='mt-0.5 h-5 w-5 shrink-0 text-amber-500' />
        <div className='text-sm'>
          <p className='font-semibold'>We couldn&apos;t find this number</p>
          <p className='text-xs text-muted-foreground'>
            {registry} has no match for {registration?.number}. You can still finish setting up your
            business.
          </p>
        </div>
      </div>
    );
  }

  const isRetry = status === 'unavailable';

  return (
    <form onSubmit={handleSubmit} className='space-y-2 rounded-2xl border border-dashed border-border p-4'>
      <Label htmlFor='registrationNumber' className='flex items-center gap-1.5 text-sm font-semibold'>
        {isRetry ? <Clock className='h-4 w-4' /> : <BadgeCheck className='h-4 w-4' />}
        {isRetry ? 'The registry didn’t respond' : 'Business registration number'}
        {!isRetry && <span className='text-xs font-normal text-muted-foreground'>(optional)</span>}
      </Label>
      <p className='text-xs text-muted-foreground'>
        {isRetry
          ? `We couldn't reach ${registry} to check ${registration?.number}. Try again.`
          : `Already registered? We'll verify it with ${registry} in the background. We can only check once, so double-check the number.`}
      </p>
      <div className='flex gap-2'>
        <Input
          id='registrationNumber'
          value={value}
          maxLength={40}
          placeholder={country === 'NG' ? 'e.g. RC123456' : 'Your registration number'}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError('');
          }}
          className={error ? 'border-destructive' : ''}
          disabled={submit.isPending}
        />
        <Button type='submit' className='shrink-0' disabled={!value.trim() || submit.isPending}>
          {submit.isPending ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            isRetry && <RefreshCw className='h-4 w-4' />
          )}
          {isRetry ? 'Try again' : 'Verify'}
        </Button>
      </div>
      {error && <p className='text-xs text-destructive'>{error}</p>}
    </form>
  );
};

export default RegistrationCard;
