'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Check,
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  Delete,
  Globe2,
  BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateAccount, useSetPin } from '@/hooks/mutations/use-onboarding';
import {
  LAUNCH_COUNTRIES,
  onboarding,
  type LaunchCountry,
} from '@/lib/api-client';
import { pathForOnboardingStep, pendingPin } from '@/lib/onboarding-route';
import { HttpError, getApiErrorMessage } from '@/common/network/http-client';
import servixLogo from '@/assets/servix-logo.png';
// Light mode disabled — app is dark-only.
// import ThemeToggle from '@/components/ThemeToggle';
import OtpVerify from '@/components/OtpVerify';
import PhoneInput, {
  emptyPhone,
  getDefaultCountry,
  phoneError as getPhoneError,
} from '@/components/PhoneInput';
import type { PhoneValue } from '@/components/PhoneInput';

// ─── Constants ────────────────────────────────────────────────────────────────

const ONBOARDING_KEY = 'servixos-onboarding';
const REG_NUMBER_PATTERN = /^[A-Za-z0-9-]{1,30}$/;

const COUNTRY_LABELS: Record<LaunchCountry, { name: string; flag: string }> = {
  NG: { name: 'Nigeria', flag: '🇳🇬' },
  GB: { name: 'United Kingdom', flag: '🇬🇧' },
  US: { name: 'United States', flag: '🇺🇸' },
  CA: { name: 'Canada', flag: '🇨🇦' },
};

// The whole journey, so users see where account creation sits.
const PHASES = ['Your Account', 'AI Business Setup', 'Free Trial'];

type SignupStage = 'form' | 'verifyEmail' | 'pin' | 'resuming';

// ─── Persistence helpers ──────────────────────────────────────────────────────

// Only needed before email verification; after that the session + status endpoint resume.
interface SavedProgress {
  email: string;
  firstName: string;
  lastName: string;
}

const saveProgress = (data: SavedProgress) => {
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(data));
  } catch {}
};

const readProgress = (): SavedProgress | null => {
  try {
    return JSON.parse(localStorage.getItem(ONBOARDING_KEY) ?? 'null') as SavedProgress | null;
  } catch {
    return null;
  }
};

const clearProgress = () => {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch {}
};

const isLaunchCountry = (code: string): code is LaunchCountry =>
  (LAUNCH_COUNTRIES as readonly string[]).includes(code);

const normalizeRegNumber = (value: string) => value.replace(/\s+/g, '');

const shuffleArray = (arr: number[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─── Component ────────────────────────────────────────────────────────────────

const Signup = () => {
  const router = useRouter();
  const { setSession, auth: authState, isHydrated } = useAuth();
  const [stage, setStage] = useState<SignupStage>('resuming');

  const createAccountMutation = useCreateAccount();
  const setPinMutation = useSetPin();

  // Registration
  const [reg, setReg] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessRegistrationNumber: '',
  });
  const [country, setCountry] = useState<LaunchCountry>('US');
  const [phone, setPhone] = useState<PhoneValue>(() => emptyPhone('US'));
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  // PIN
  const [pin, setPin] = useState<string[]>([]);
  const [confirmPin, setConfirmPin] = useState<string[]>([]);
  const [pinPhase, setPinPhase] = useState<'create' | 'confirm'>('create');
  const [pinError, setPinError] = useState('');
  const [shuffledNumbers] = useState(() => shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));

  const gridNumbers = useMemo(() => {
    const top9 = shuffledNumbers.filter((n) => n !== 0);
    return [top9.slice(0, 3), top9.slice(3, 6), top9.slice(6, 9)];
  }, [shuffledNumbers]);

  const pinLoading = setPinMutation.isPending;
  const currentPin = pinPhase === 'create' ? pin : confirmPin;
  const isRegistrationInfoFilled =
    Boolean(reg.firstName.trim()) &&
    Boolean(reg.lastName.trim()) &&
    Boolean(reg.email.trim()) &&
    Boolean(phone.nationalNumber.trim()) &&
    Boolean(reg.password.trim()) &&
    Boolean(reg.confirmPassword.trim());

  // ─── Resume ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const detected = getDefaultCountry();
    const initial: LaunchCountry = isLaunchCountry(detected) ? detected : 'US';
    setCountry(initial);
    setPhone((p) => ({ ...p, country: initial }));
  }, []);

  // Runs once auth has hydrated: a signed-in owner resumes from the status endpoint,
  // anyone else from the locally saved pre-verification progress.
  useEffect(() => {
    if (!isHydrated || stage !== 'resuming') return;

    if (authState.isLoggedIn && authState.user?.businessId) {
      router.replace('/dashboard');
      return;
    }

    if (authState.isLoggedIn) {
      onboarding
        .status()
        .then((status) => {
          if (status.nextStep === 'set_pin') {
            setStage('pin');
            toast.info('Welcome back!', { description: 'Continue setting up your security PIN.' });
          } else {
            router.replace(pathForOnboardingStep(status.nextStep));
          }
        })
        .catch(() => setStage('form'));
      return;
    }

    const saved = readProgress();
    if (saved?.email) {
      setReg((r) => ({
        ...r,
        email: saved.email,
        firstName: saved.firstName ?? '',
        lastName: saved.lastName ?? '',
      }));
      setStage('verifyEmail');
      toast.info('Welcome back!', { description: 'Please verify your email to continue.' });
      return;
    }

    setStage('form');
  }, [isHydrated, stage, authState.isLoggedIn, authState.user?.businessId, router]);

  // ─── PIN ────────────────────────────────────────────────────────────────────

  const addDigit = useCallback(
    (digit: number) => {
      const setter = pinPhase === 'create' ? setPin : setConfirmPin;
      setter((prev) => {
        if (prev.length >= 4) return prev;
        setPinError('');
        return [...prev, digit.toString()];
      });
    },
    [pinPhase]
  );

  const removeDigit = useCallback(() => {
    const setter = pinPhase === 'create' ? setPin : setConfirmPin;
    setter((prev) => prev.slice(0, -1));
    setPinError('');
  }, [pinPhase]);

  useEffect(() => {
    if (stage !== 'pin') return;
    const handler = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) addDigit(parseInt(e.key));
      else if (e.key === 'Backspace') removeDigit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [stage, addDigit, removeDigit]);

  const resetPin = () => {
    setPin([]);
    setConfirmPin([]);
    setPinPhase('create');
  };

  // Auto-advance / submit PIN phases.
  // Every setTimeout returns a cleanup so React StrictMode's double-invocation
  // (and any other re-run) cancels the pending timer before scheduling a new one.
  useEffect(() => {
    if (pinLoading) return;

    if (pinPhase === 'create' && pin.length === 4) {
      const timer = setTimeout(() => setPinPhase('confirm'), 400);
      return () => clearTimeout(timer);
    }

    if (pinPhase === 'confirm' && confirmPin.length === 4) {
      if (pin.join('') !== confirmPin.join('')) {
        const timer = setTimeout(() => {
          setPinError('PINs do not match. Try again.');
          resetPin();
        }, 400);
        return () => clearTimeout(timer);
      }

      const pinValue = pin.join('');
      const timer = setTimeout(async () => {
        try {
          await setPinMutation.mutateAsync({ pin: pinValue, confirmPin: pinValue });
          // Held in memory so the session can be PIN-verified once the business is approved.
          pendingPin.set(pinValue);
          clearProgress();
          resetPin();
          toast.success('PIN created!', { description: "Now let's build your business together." });
          router.push('/onboarding');
        } catch (err) {
          resetPin();
          if (err instanceof HttpError && err.status === 409) {
            // A business already exists for this account.
            router.replace('/dashboard');
            return;
          }
          setPinError(getApiErrorMessage(err));
        }
      }, 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, confirmPin, pinPhase, pinLoading]);

  // ─── Registration ───────────────────────────────────────────────────────────

  const validateRegistration = () => {
    const errs: Record<string, string> = {};
    if (!reg.firstName.trim()) errs.firstName = 'First name is required';
    if (!reg.lastName.trim()) errs.lastName = 'Last name is required';
    if (!reg.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email)) errs.email = 'Invalid email';
    const phoneErr = getPhoneError(phone);
    if (phoneErr) errs.phone = phoneErr;
    if (!reg.password) errs.password = 'Password is required';
    else if (reg.password.length < 8) errs.password = 'Minimum 8 characters';
    else if (!/[A-Z]/.test(reg.password))
      errs.password = 'Must contain at least one uppercase letter';
    else if (!/\d/.test(reg.password)) errs.password = 'Must contain at least one number';
    if (reg.password !== reg.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    const regNumber = normalizeRegNumber(reg.businessRegistrationNumber);
    if (regNumber && !REG_NUMBER_PATTERN.test(regNumber))
      errs.businessRegistrationNumber = 'Use letters, numbers and hyphens only (max 30)';
    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCountryChange = (value: string) => {
    if (!isLaunchCountry(value)) return;
    setCountry(value);
    // Follow the business country until the user has started typing a number.
    if (!phone.nationalNumber) setPhone(emptyPhone(value));
  };

  const handleRegistrationNext = async () => {
    if (!validateRegistration()) return;

    const regNumber = normalizeRegNumber(reg.businessRegistrationNumber);
    try {
      await createAccountMutation.mutateAsync({
        firstName: reg.firstName.trim(),
        lastName: reg.lastName.trim(),
        email: reg.email.trim(),
        country,
        phone: phone.e164,
        password: reg.password,
        confirmPassword: reg.confirmPassword,
        ...(regNumber && { businessRegistrationNumber: regNumber }),
      });
      toast.success('Check your email for a verification code.');
      saveProgress({ email: reg.email.trim(), firstName: reg.firstName, lastName: reg.lastName });
      setStage('verifyEmail');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleEmailVerified = () => {
    toast.success('Email verified!', { description: 'Now set up your security PIN.' });
    setStage('pin');
  };

  // ─── Render helpers ─────────────────────────────────────────────────────────

  const renderRegistrationForm = () => (
    <motion.div
      key='form'
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className='space-y-4 sm:space-y-5'
    >
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div className='space-y-1.5'>
          <Label htmlFor='firstName' className='flex items-center gap-1.5 text-xs'>
            <User size={12} /> First Name
          </Label>
          <Input
            id='firstName'
            placeholder='John'
            value={reg.firstName}
            onChange={(e) => setReg((p) => ({ ...p, firstName: e.target.value }))}
            className={regErrors.firstName ? 'border-destructive' : ''}
          />
          {regErrors.firstName && (
            <p className='text-[10px] text-destructive'>{regErrors.firstName}</p>
          )}
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='lastName' className='flex items-center gap-1.5 text-xs'>
            <User size={12} /> Last Name
          </Label>
          <Input
            id='lastName'
            placeholder='Doe'
            value={reg.lastName}
            onChange={(e) => setReg((p) => ({ ...p, lastName: e.target.value }))}
            className={regErrors.lastName ? 'border-destructive' : ''}
          />
          {regErrors.lastName && (
            <p className='text-[10px] text-destructive'>{regErrors.lastName}</p>
          )}
        </div>
      </div>

      <div className='space-y-1.5'>
        <Label htmlFor='email' className='flex items-center gap-1.5 text-xs'>
          <Mail size={12} /> Email
        </Label>
        <Input
          id='email'
          type='email'
          placeholder='you@example.com'
          value={reg.email}
          onChange={(e) => setReg((p) => ({ ...p, email: e.target.value }))}
          className={regErrors.email ? 'border-destructive' : ''}
        />
        {regErrors.email && <p className='text-[10px] text-destructive'>{regErrors.email}</p>}
      </div>

      <div className='space-y-1.5'>
        <Label htmlFor='country' className='flex items-center gap-1.5 text-xs'>
          <Globe2 size={12} /> Country
        </Label>
        <Select value={country} onValueChange={handleCountryChange}>
          <SelectTrigger id='country'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LAUNCH_COUNTRIES.map((code) => (
              <SelectItem key={code} value={code}>
                <span className='mr-2'>{COUNTRY_LABELS[code].flag}</span>
                {COUNTRY_LABELS[code].name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-1.5'>
        <Label className='flex items-center gap-1.5 text-xs'>
          <Phone size={12} /> Phone Number
        </Label>
        <PhoneInput
          id='phone'
          value={phone}
          allowedCountries={LAUNCH_COUNTRIES}
          onChange={(v) => {
            setPhone(v);
            if (regErrors.phone) setRegErrors((e) => ({ ...e, phone: '' }));
          }}
          error={regErrors.phone}
        />
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div className='space-y-1.5'>
          <Label htmlFor='password' className='flex items-center gap-1.5 text-xs'>
            <Lock size={12} /> Password
          </Label>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              placeholder='••••••••'
              value={reg.password}
              onChange={(e) => setReg((p) => ({ ...p, password: e.target.value }))}
              className={regErrors.password ? 'border-destructive pr-9' : 'pr-9'}
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {regErrors.password && (
            <p className='text-[10px] text-destructive'>{regErrors.password}</p>
          )}
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='confirmPw' className='flex items-center gap-1.5 text-xs'>
            <Lock size={12} /> Confirm Password
          </Label>
          <div className='relative'>
            <Input
              id='confirmPw'
              type={showConfirm ? 'text' : 'password'}
              placeholder='••••••••'
              value={reg.confirmPassword}
              onChange={(e) => setReg((p) => ({ ...p, confirmPassword: e.target.value }))}
              className={regErrors.confirmPassword ? 'border-destructive pr-9' : 'pr-9'}
            />
            <button
              type='button'
              onClick={() => setShowConfirm(!showConfirm)}
              className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
            >
              {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {regErrors.confirmPassword && (
            <p className='text-[10px] text-destructive'>{regErrors.confirmPassword}</p>
          )}
        </div>
      </div>

      <div className='space-y-1.5 rounded-xl border border-dashed border-border p-3'>
        <Label htmlFor='regNumber' className='flex items-center gap-1.5 text-xs'>
          <BadgeCheck size={12} /> Business Registration Number
          <span className='font-normal text-muted-foreground'>(optional)</span>
        </Label>
        <Input
          id='regNumber'
          placeholder={country === 'NG' ? 'e.g. RC123456' : 'e.g. 12345678'}
          value={reg.businessRegistrationNumber}
          maxLength={40}
          onChange={(e) => {
            setReg((p) => ({ ...p, businessRegistrationNumber: e.target.value }));
            if (regErrors.businessRegistrationNumber)
              setRegErrors((er) => ({ ...er, businessRegistrationNumber: '' }));
          }}
          className={regErrors.businessRegistrationNumber ? 'border-destructive' : ''}
        />
        {regErrors.businessRegistrationNumber ? (
          <p className='text-[10px] text-destructive'>{regErrors.businessRegistrationNumber}</p>
        ) : (
          <p className='text-[10px] text-muted-foreground'>
            Already registered? We&apos;ll check it with{' '}
            {country === 'NG' ? 'the CAC' : 'the company registry'} in the background. It
            won&apos;t hold up your signup.
          </p>
        )}
      </div>

      <motion.div whileTap={{ scale: 0.97 }}>
        <Button
          onClick={handleRegistrationNext}
          className='gradient-bg w-full text-primary-foreground'
          size='lg'
          disabled={createAccountMutation.isPending || !isRegistrationInfoFilled}
        >
          {createAccountMutation.isPending ? (
            <Loader2 className='h-5 w-5 animate-spin' />
          ) : (
            <>
              <ArrowRight size={18} /> Continue
            </>
          )}
        </Button>
      </motion.div>

      <p className='text-center text-xs text-muted-foreground'>
        Already have an account?{' '}
        <Link href='/login' className='text-primary hover:underline font-medium'>
          Sign in
        </Link>
      </p>
    </motion.div>
  );

  const renderEmailVerify = () => (
    <OtpVerify
      key='verify'
      email={reg.email}
      onVerify={async (otp) => {
        // Verifying signs the user in with an onboarding session (cookies set on web).
        const session = await onboarding.verifyEmail({ email: reg.email, otp });
        setSession(session);
        clearProgress();
      }}
      onVerified={handleEmailVerified}
      onResend={async () => {
        await onboarding.resendOtp(reg.email);
        toast.success('New code sent!', { description: 'Check your email.' });
      }}
      onBack={() => {
        clearProgress();
        setStage('form');
      }}
      title='Verify Your Email'
    />
  );

  const keyClass =
    'flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-background text-lg font-bold text-foreground shadow-sm transition-all hover:bg-muted hover:border-primary/50 active:bg-primary/10 disabled:opacity-40';

  const renderPinEntry = () => (
    <motion.div
      key='pin'
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className='space-y-6'
    >
      <div className='text-center space-y-2'>
        <ShieldCheck className='h-10 w-10 text-primary mx-auto' />
        <h2 className='text-xl font-bold font-display'>
          {pinPhase === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
        </h2>
        <p className='text-sm text-muted-foreground'>
          {pinPhase === 'create' ? 'Set a 4-digit security PIN' : 'Re-enter your PIN to confirm'}
        </p>
      </div>

      <div className='flex justify-center gap-4'>
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className={`h-4 w-4 rounded-full border-2 transition-all ${
              currentPin.length > i
                ? 'border-primary bg-primary scale-110'
                : 'border-muted-foreground/30'
            }`}
            animate={currentPin.length > i ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.2 }}
          />
        ))}
      </div>

      {pinError && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='text-center text-sm font-semibold text-orange-500'
        >
          {pinError}
        </motion.p>
      )}

      {pinLoading && (
        <div className='flex justify-center'>
          <Loader2 className='h-6 w-6 animate-spin text-primary' />
        </div>
      )}

      <div className='space-y-2'>
        {gridNumbers.map((row, rowIdx) => (
          <div key={rowIdx} className='flex justify-center gap-2'>
            {row.map((num) => (
              <motion.button
                key={num}
                type='button'
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => addDigit(num)}
                disabled={currentPin.length >= 4 || pinLoading}
                className={keyClass}
              >
                {num}
              </motion.button>
            ))}
          </div>
        ))}
        <div className='flex justify-center gap-2'>
          <div className='h-14 w-14' />
          <motion.button
            type='button'
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => addDigit(0)}
            disabled={currentPin.length >= 4 || pinLoading}
            className={keyClass}
          >
            0
          </motion.button>
          <motion.button
            type='button'
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={removeDigit}
            disabled={currentPin.length === 0 || pinLoading}
            className='flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground shadow-sm transition-all hover:bg-destructive/10 hover:text-destructive disabled:opacity-40'
          >
            <Delete size={20} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  // ─── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div className='relative flex min-h-dvh items-center justify-center overflow-x-hidden overflow-y-auto bg-background px-3 py-2 sm:min-h-screen sm:px-4 sm:py-8'>
      {/* <ThemeToggle /> */}

      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className='pointer-events-none absolute rounded-full opacity-15 blur-3xl'
          style={{
            width: `${180 + i * 60}px`,
            height: `${180 + i * 60}px`,
            background:
              i % 3 === 0
                ? 'hsl(217, 91%, 60%)'
                : i % 3 === 1
                  ? 'hsl(270, 70%, 60%)'
                  : 'hsl(174, 72%, 50%)',
          }}
          animate={{
            x: [0, 50 * (i % 2 === 0 ? 1 : -1), 0],
            y: [0, 30 * (i % 2 === 0 ? -1 : 1), 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 6 + i * 1.5, repeat: Infinity, ease: 'easeInOut' }}
          initial={{ x: (i - 2.5) * 150, y: (i - 2.5) * 80 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className='relative z-10 w-full max-w-lg'
      >
        <div className='mb-4 flex items-center justify-center gap-1.5 sm:mb-6 sm:gap-2'>
          {PHASES.map((label, i) => (
            <div key={label} className='flex items-center gap-1.5 sm:gap-2'>
              <div className='flex items-center gap-1.5'>
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold sm:h-8 sm:w-8 sm:text-xs ${
                    i === 0
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`hidden text-xs sm:inline ${
                    i === 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < PHASES.length - 1 && <div className='h-0.5 w-5 rounded bg-border sm:w-8' />}
            </div>
          ))}
        </div>

        <div className='max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-2xl border border-border bg-card/80 p-3 shadow-lg backdrop-blur-xl sm:max-h-[82dvh] sm:p-6'>
          <motion.div
            className='mb-5 flex flex-col items-center gap-2'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <div className='relative'>
              <Image src={servixLogo} alt='Servix OS' width={48} height={48} className='h-12 w-12' />
              <motion.div
                className='absolute -right-1 -top-1'
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className='h-4 w-4 text-accent' />
              </motion.div>
            </div>
            {stage === 'form' && (
              <>
                <h1 className='font-display text-xl font-bold'>Create your account</h1>
                <p className='text-xs text-muted-foreground text-center'>
                  Next, our AI will help you shape and launch your business.
                </p>
              </>
            )}
          </motion.div>

          <AnimatePresence mode='wait'>
            {stage === 'resuming' ? (
              <div key='resuming' className='flex justify-center py-10'>
                <Loader2 className='h-6 w-6 animate-spin text-primary' />
              </div>
            ) : stage === 'pin' ? (
              renderPinEntry()
            ) : stage === 'verifyEmail' ? (
              renderEmailVerify()
            ) : (
              renderRegistrationForm()
            )}
          </AnimatePresence>
        </div>

        {stage === 'pin' && (
          <p className='mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground'>
            <Check className='h-3.5 w-3.5 text-emerald-500' /> Email verified
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default Signup;
