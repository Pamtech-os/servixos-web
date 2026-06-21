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
  ArrowLeft,
  Check,
  Building2,
  Palette,
  Wrench,
  Globe,
  Rocket,
  SkipForward,
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  Delete,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCreateAccount,
  useCreateBusiness,
  useGenerateWebsite,
} from '@/hooks/mutations/use-onboarding';
import { useBusinessCategories } from '@/hooks/queries/use-business-categories';
import dynamic from 'next/dynamic';
import { onboarding, auth as authApi, subscription } from '@/lib/api-client';

const OnboardingCardStep = dynamic(() => import('@/components/OnboardingCardStep'), {
  ssr: false,
});
import { getApiErrorMessage } from '@/common/network/http-client';
import servixLogo from '@/assets/servix-logo.png';
import ThemeToggle from '@/components/ThemeToggle';
import OtpVerify from '@/components/OtpVerify';
import PhoneInput, {
  emptyPhone,
  getDefaultCountry,
  phoneError as getPhoneError,
} from '@/components/PhoneInput';
import type { PhoneValue } from '@/components/PhoneInput';

// ─── Constants ────────────────────────────────────────────────────────────────

const ONBOARDING_KEY = 'servixos-onboarding';
const MAX_BUSINESS_NAME_LENGTH = 30;
const MAX_BUSINESS_DESCRIPTION_LENGTH = 300;

const FONT_NAME_MAP: Record<string, string> = {
  modern: 'Inter',
  classic: 'Georgia',
  playful: 'Nunito',
  bold: 'Montserrat',
};

// ─── Persistence helpers ──────────────────────────────────────────────────────

interface SavedProgress {
  step: number;
  subStep: 'emailVerify' | 'pin' | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneCountry: string;
  bizName: string;
  websiteGenerated: boolean;
  websiteUrl: string;
}

const saveProgress = (data: Partial<SavedProgress>) => {
  try {
    const current = JSON.parse(
      localStorage.getItem(ONBOARDING_KEY) ?? '{}',
    ) as Partial<SavedProgress>;
    localStorage.setItem(
      ONBOARDING_KEY,
      JSON.stringify({ ...current, ...data }),
    );
  } catch {}
};

const clearProgress = () => localStorage.removeItem(ONBOARDING_KEY);

// ─── Static data ──────────────────────────────────────────────────────────────

const STEPS = ['Registration', 'Business Setup', 'Payment Setup', 'Website Builder'];

const colorSchemes = [
  { id: 'blue', label: 'Ocean Blue', primary: '#3B82F6', secondary: '#8B5CF6' },
  {
    id: 'green',
    label: 'Forest Green',
    primary: '#10B981',
    secondary: '#059669',
  },
  {
    id: 'purple',
    label: 'Royal Purple',
    primary: '#8B5CF6',
    secondary: '#EC4899',
  },
  {
    id: 'orange',
    label: 'Sunset Orange',
    primary: '#F59E0B',
    secondary: '#EF4444',
  },
  {
    id: 'teal',
    label: 'Teal Breeze',
    primary: '#14B8A6',
    secondary: '#3B82F6',
  },
  { id: 'pink', label: 'Pink Glow', primary: '#EC4899', secondary: '#8B5CF6' },
];

const fontOptions = [
  { id: 'modern', label: 'Modern', family: 'Inter, sans-serif' },
  { id: 'classic', label: 'Classic', family: 'Georgia, serif' },
  { id: 'playful', label: 'Playful', family: 'Nunito, sans-serif' },
  { id: 'bold', label: 'Bold', family: 'Montserrat, sans-serif' },
];

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
  const { setSession, completeVerification, auth: authState } = useAuth();
  const [step, setStep] = useState(0);

  // Queries
  const { data: apiCategories = [], isLoading: categoriesLoading } =
    useBusinessCategories();

  // Mutations
  const createAccountMutation = useCreateAccount();
  const createBusinessMutation = useCreateBusiness();
  const generateWebsiteMutation = useGenerateWebsite();

  // Step 1: Registration
  const [reg, setReg] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [phone, setPhone] = useState<PhoneValue>(() => emptyPhone('US'));
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  // Email OTP verification after registration
  const [showEmailVerify, setShowEmailVerify] = useState(false);

  // PIN entry within registration
  const [showPinStep, setShowPinStep] = useState(false);
  const [pin, setPin] = useState<string[]>([]);
  const [confirmPin, setConfirmPin] = useState<string[]>([]);
  const [pinPhase, setPinPhase] = useState<'create' | 'confirm'>('create');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  // Held temporarily so we can call verify-pin silently after business creation.
  const [savedPin, setSavedPin] = useState('');
  const [shuffledNumbers] = useState(() =>
    shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
  );

  const gridNumbers = useMemo(() => {
    const top9 = shuffledNumbers.filter((n) => n !== 0);
    const rows = [top9.slice(0, 3), top9.slice(3, 6), top9.slice(6, 9)];
    return { rows, zero: 0 };
  }, [shuffledNumbers]);

  // Step 2: Business Onboarding
  const [bizCategory, setBizCategory] = useState('');
  const [bizName, setBizName] = useState('');
  const [bizDescription, setBizDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [selectedFont, setSelectedFont] = useState('modern');
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStage, setAiStage] = useState('');

  // Step 2: Card collection
  const [cardClientSecret, setCardClientSecret] = useState('');
  const [cardFetching, setCardFetching] = useState(false);
  const [cardError, setCardError] = useState('');

  // Step 3: Website Builder
  const [websiteGenerating, setWebsiteGenerating] = useState(false);
  const [websiteGenerated, setWebsiteGenerated] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteProgress, setWebsiteProgress] = useState(0);
  const [websiteStage, setWebsiteStage] = useState('');
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);

  const currentPin = pinPhase === 'create' ? pin : confirmPin;
  const isRegistrationInfoFilled =
    Boolean(reg.firstName.trim()) &&
    Boolean(reg.lastName.trim()) &&
    Boolean(reg.email.trim()) &&
    Boolean(phone.nationalNumber.trim()) &&
    Boolean(reg.password.trim()) &&
    Boolean(reg.confirmPassword.trim());

  const addDigit = useCallback(
    (digit: number) => {
      const setter = pinPhase === 'create' ? setPin : setConfirmPin;
      setter((prev) => {
        if (prev.length >= 4) return prev;
        setPinError('');
        return [...prev, digit.toString()];
      });
    },
    [pinPhase],
  );

  const removeDigit = useCallback(() => {
    const setter = pinPhase === 'create' ? setPin : setConfirmPin;
    setter((prev) => prev.slice(0, -1));
    setPinError('');
  }, [pinPhase]);

  useEffect(() => {
    setPhone((p) => ({ ...p, country: getDefaultCountry() }));
  }, []);

  useEffect(() => {
    if (!showPinStep) return;
    const handler = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) addDigit(parseInt(e.key));
      else if (e.key === 'Backspace') removeDigit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showPinStep, addDigit, removeDigit]);

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
          setConfirmPin([]);
          setPinPhase('create');
          setPin([]);
        }, 400);
        return () => clearTimeout(timer);
      }

      const pinValue = pin.join('');
      const timer = setTimeout(async () => {
        setPinLoading(true);
        try {
          await onboarding.setPin({
            email: reg.email,
            pin: pinValue,
            confirmPin: pinValue,
          });
          setSavedPin(pinValue);
          toast.success('PIN created successfully!');
          saveProgress({ subStep: null, step: 1 });
          // Clear pin state before pinLoading→false so the effect cannot re-trigger.
          setPin([]);
          setConfirmPin([]);
          setPinPhase('create');
          setShowPinStep(false);
          setStep(1);
        } catch (err) {
          setPinError(getApiErrorMessage(err));
          setConfirmPin([]);
          setPinPhase('create');
          setPin([]);
        } finally {
          setPinLoading(false);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, confirmPin, pinPhase, pinLoading]);

  // Re-fetch setup intent when restored to card step (e.g. after page refresh)
  useEffect(() => {
    if (step !== 2 || cardClientSecret || cardFetching) return;
    const businessId = authState.user?.businessId;
    if (!businessId) return;

    setCardFetching(true);
    setCardError('');
    subscription.setupIntent(businessId)
      .then((data) => setCardClientSecret(data.clientSecret))
      .catch((err) => setCardError(getApiErrorMessage(err)))
      .finally(() => setCardFetching(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, authState.user?.businessId]);

  // Restore onboarding progress on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(ONBOARDING_KEY) ?? 'null',
      ) as SavedProgress | null;
      if (!saved?.email) return;

      setReg((r) => ({
        ...r,
        email: saved.email,
        firstName: saved.firstName ?? '',
        lastName: saved.lastName ?? '',
      }));
      if (saved.phone || saved.phoneCountry) {
        setPhone((p) => ({
          ...p,
          country: (saved.phoneCountry as PhoneValue['country']) ?? p.country,
          nationalNumber: saved.phone ?? '',
          isValid: false,
          e164: saved.phone ?? '',
        }));
      }
      if (saved.bizName) {
        setBizName(saved.bizName.slice(0, MAX_BUSINESS_NAME_LENGTH));
      }
      if (saved.websiteGenerated) {
        setWebsiteGenerated(true);
        setWebsiteUrl(saved.websiteUrl ?? '');
      }
      if (saved.subStep === 'emailVerify') {
        setShowEmailVerify(true);
        toast.info('Welcome back!', {
          description: 'Please verify your email to continue.',
        });
      } else if (saved.subStep === 'pin') {
        setShowPinStep(true);
        toast.info('Welcome back!', {
          description: 'Continue setting up your security PIN.',
        });
      } else if (saved.step >= 1) {
        setStep(saved.step);
        toast.info('Welcome back!', {
          description: 'Continuing your business setup.',
        });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const validateRegistration = () => {
    const errs: Record<string, string> = {};
    if (!reg.firstName.trim()) errs.firstName = 'First name is required';
    if (!reg.lastName.trim()) errs.lastName = 'Last name is required';
    if (!reg.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email))
      errs.email = 'Invalid email';
    const phoneErr = getPhoneError(phone);
    if (phoneErr) errs.phone = phoneErr;
    if (!reg.password) errs.password = 'Password is required';
    else if (reg.password.length < 8) errs.password = 'Minimum 8 characters';
    else if (!/[A-Z]/.test(reg.password))
      errs.password = 'Must contain at least one uppercase letter';
    else if (!/\d/.test(reg.password))
      errs.password = 'Must contain at least one number';
    if (reg.password !== reg.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegistrationNext = async () => {
    if (!validateRegistration()) return;

    try {
      await createAccountMutation.mutateAsync({
        firstName: reg.firstName.trim(),
        lastName: reg.lastName.trim(),
        email: reg.email,
        phone: phone.e164,
        password: reg.password,
        confirmPassword: reg.confirmPassword,
      });
      toast.success('Check your email for a verification code.');
      saveProgress({
        step: 0,
        subStep: 'emailVerify',
        email: reg.email,
        firstName: reg.firstName,
        lastName: reg.lastName,
        phone: phone.e164,
        phoneCountry: phone.country,
      });
      setShowEmailVerify(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleEmailVerified = () => {
    saveProgress({ subStep: 'pin' });
    toast.success('Email verified!', {
      description: 'Now set up your security PIN.',
    });
    setShowEmailVerify(false);
    setShowPinStep(true);
  };

  const handleAddService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService('');
    }
  };

  const handleBusinessNext = async () => {
    if (!bizCategory) {
      toast.error('Please select a business category');
      return;
    }
    if (!bizName.trim()) {
      toast.error('Please enter your business name');
      return;
    }
    if (!bizDescription.trim()) {
      toast.error('Please enter a business description');
      return;
    }
    if (bizName.length > MAX_BUSINESS_NAME_LENGTH) {
      toast.error(
        `Business name cannot exceed ${MAX_BUSINESS_NAME_LENGTH} characters`,
      );
      return;
    }
    if (bizDescription.length > MAX_BUSINESS_DESCRIPTION_LENGTH) {
      toast.error(
        `Business description cannot exceed ${MAX_BUSINESS_DESCRIPTION_LENGTH} characters`,
      );
      return;
    }

    const colorScheme =
      colorSchemes.find((c) => c.id === selectedColor) ?? colorSchemes[0];
    const fontName = FONT_NAME_MAP[selectedFont] ?? 'Inter';
    const timezone =
      typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'UTC';

    setAiGenerating(true);
    setAiProgress(0);

    const aiStages = [
      'Analyzing business category...',
      'Setting up brand identity...',
      'Configuring services...',
      'Creating business profile...',
      'Finalizing setup...',
    ];
    let stageIdx = 0;
    const stageInterval = setInterval(() => {
      if (stageIdx < aiStages.length) {
        setAiStage(aiStages[stageIdx]);
        setAiProgress(((stageIdx + 1) / aiStages.length) * 100);
        stageIdx++;
      }
    }, 800);

    try {
      const session = await createBusinessMutation.mutateAsync({
        email: reg.email,
        businessName: bizName.trim(),
        businessCategory: bizCategory,
        businessDescription: bizDescription.trim(),
        colorPrimary: colorScheme.primary,
        colorSecondary: colorScheme.secondary,
        font: fontName,
        services,
        timezone,
      });

      // Silently verify PIN so the session has isPinVerified: true.
      if (savedPin) {
        await authApi.verifyPin(savedPin);
        setSession(session);
        completeVerification();
        setSavedPin(''); // clear from memory
      } else {
        // Restoration path: user came back without a cached PIN.
        setSession(session);
        clearProgress();
        router.push('/pin');
        return;
      }

      const setupData = await subscription.setupIntent(session.user.businessId);
      setCardClientSecret(setupData.clientSecret);

      clearInterval(stageInterval);
      setAiProgress(100);
      toast.success('Business created successfully!');
      saveProgress({ step: 2, bizName });
      setStep(2);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      clearInterval(stageInterval);
      setAiGenerating(false);
    }
  };

  const handleGenerateWebsite = async () => {
    const businessId = authState.user?.businessId;
    if (!businessId) {
      toast.error('Business not found. Please refresh and try again.');
      return;
    }

    setShowWebsiteModal(true);
    setWebsiteGenerating(true);
    setWebsiteProgress(0);

    const wsStages = [
      'Designing homepage layout...',
      'Adding service sections...',
      'Creating booking page...',
      'Applying brand colors & fonts...',
      'Optimizing for mobile...',
      'Adding animations & effects...',
      'Generating content with AI...',
      'Setting up booking form...',
      'Finalizing & deploying...',
    ];
    let stageIdx = 0;
    const stageInterval = setInterval(() => {
      if (stageIdx < wsStages.length) {
        setWebsiteStage(wsStages[stageIdx]);
        setWebsiteProgress(((stageIdx + 1) / wsStages.length) * 100);
        stageIdx++;
      }
    }, 1200);

    try {
      const result = await generateWebsiteMutation.mutateAsync(businessId);
      const url = result.url.startsWith('https://')
        ? result.url
        : `https://${result.url}`;

      clearInterval(stageInterval);
      setWebsiteProgress(100);
      setWebsiteUrl(url);
      setWebsiteGenerating(false);
      setWebsiteGenerated(true);
      setShowWebsiteModal(false);
      saveProgress({ websiteGenerated: true, websiteUrl: url });
      toast.success(`Website live at ${result.subdomain}.servixos.com`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      clearInterval(stageInterval);
      setWebsiteGenerating(false);
      setShowWebsiteModal(false);
    }
  };

  const handleFinish = () => {
    clearProgress();
    router.push('/dashboard');
  };

  const handleSkipWebsite = () => {
    clearProgress();
    router.push('/dashboard');
  };

  // ─── Render helpers ──────────────────────────────────────────────────────────

  const [categorySearch, setCategorySearch] = useState('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const filteredCategories = apiCategories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase()),
  );
  const selectedCategoryLabel =
    apiCategories.find((c) => c._id === bizCategory)?.name ?? '';
  const isBusinessInfoComplete =
    Boolean(bizCategory) &&
    Boolean(bizName.trim()) &&
    Boolean(bizDescription.trim());

  const renderRegistrationForm = () => (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className='space-y-4 sm:space-y-5'
    >
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div className='space-y-1.5'>
          <Label
            htmlFor='firstName'
            className='flex items-center gap-1.5 text-xs'
          >
            <User size={12} /> First Name
          </Label>
          <Input
            id='firstName'
            placeholder='John'
            value={reg.firstName}
            onChange={(e) =>
              setReg((p) => ({ ...p, firstName: e.target.value }))
            }
            className={regErrors.firstName ? 'border-destructive' : ''}
          />
          {regErrors.firstName && (
            <p className='text-[10px] text-destructive'>
              {regErrors.firstName}
            </p>
          )}
        </div>
        <div className='space-y-1.5'>
          <Label
            htmlFor='lastName'
            className='flex items-center gap-1.5 text-xs'
          >
            <User size={12} /> Last Name
          </Label>
          <Input
            id='lastName'
            placeholder='Doe'
            value={reg.lastName}
            onChange={(e) =>
              setReg((p) => ({ ...p, lastName: e.target.value }))
            }
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
        {regErrors.email && (
          <p className='text-[10px] text-destructive'>{regErrors.email}</p>
        )}
      </div>

      <div className='space-y-1.5'>
        <Label className='flex items-center gap-1.5 text-xs'>
          <Phone size={12} /> Phone Number
        </Label>
        <PhoneInput
          id='phone'
          value={phone}
          onChange={(v) => {
            setPhone(v);
            if (regErrors.phone) setRegErrors((e) => ({ ...e, phone: '' }));
          }}
          error={regErrors.phone}
        />
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div className='space-y-1.5'>
          <Label
            htmlFor='password'
            className='flex items-center gap-1.5 text-xs'
          >
            <Lock size={12} /> Password
          </Label>
          <div className='relative'>
            <Input
              id='password'
              type={showPassword ? 'text' : 'password'}
              placeholder='••••••••'
              value={reg.password}
              onChange={(e) =>
                setReg((p) => ({ ...p, password: e.target.value }))
              }
              className={
                regErrors.password ? 'border-destructive pr-9' : 'pr-9'
              }
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
          <Label
            htmlFor='confirmPw'
            className='flex items-center gap-1.5 text-xs'
          >
            <Lock size={12} /> Confirm Password
          </Label>
          <div className='relative'>
            <Input
              id='confirmPw'
              type={showConfirm ? 'text' : 'password'}
              placeholder='••••••••'
              value={reg.confirmPassword}
              onChange={(e) =>
                setReg((p) => ({ ...p, confirmPassword: e.target.value }))
              }
              className={
                regErrors.confirmPassword ? 'border-destructive pr-9' : 'pr-9'
              }
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
            <p className='text-[10px] text-destructive'>
              {regErrors.confirmPassword}
            </p>
          )}
        </div>
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
        <Link
          href='/login'
          className='text-primary hover:underline font-medium'
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );

  const renderEmailVerify = () => (
    <OtpVerify
      email={reg.email}
      onVerify={async (otp) => {
        await onboarding.verifyEmail({ email: reg.email, otp });
      }}
      onVerified={handleEmailVerified}
      onResend={async () => {
        await onboarding.resendOtp(reg.email);
        toast.success('New code sent!', { description: 'Check your email.' });
      }}
      title='Verify Your Email'
    />
  );

  const renderPinEntry = () => (
    <motion.div
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
          {pinPhase === 'create'
            ? 'Set a 4-digit security PIN'
            : 'Re-enter your PIN to confirm'}
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
        {gridNumbers.rows.map((row, rowIdx) => (
          <div key={rowIdx} className='flex justify-center gap-2'>
            {row.map((num) => (
              <motion.button
                key={num}
                type='button'
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => addDigit(num)}
                disabled={currentPin.length >= 4 || pinLoading}
                className='flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-background text-lg font-bold text-foreground shadow-sm transition-all hover:bg-muted hover:border-primary/50 active:bg-primary/10 disabled:opacity-40'
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
            className='flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-background text-lg font-bold text-foreground shadow-sm transition-all hover:bg-muted hover:border-primary/50 active:bg-primary/10 disabled:opacity-40'
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

  const renderCardStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className='space-y-5'
    >
      {cardFetching ? (
        <div className='flex flex-col items-center gap-4 py-8'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
          <p className='text-sm text-muted-foreground'>Preparing your payment setup...</p>
        </div>
      ) : cardError ? (
        <div className='space-y-3'>
          <div className='rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
            {cardError}
          </div>
          <Button
            variant='outline'
            className='w-full'
            onClick={() => {
              setCardError('');
              setCardFetching(false);
            }}
          >
            Retry
          </Button>
        </div>
      ) : cardClientSecret ? (
        <OnboardingCardStep
          clientSecret={cardClientSecret}
          onSuccess={() => {
            saveProgress({ step: 3 });
            toast.success('Card saved! Your subscription is secured.');
            setStep(3);
          }}
        />
      ) : null}
    </motion.div>
  );

  const renderBusinessOnboarding = () => (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className='space-y-5'
    >
      {!aiGenerating && (
        <button
          onClick={() => setStep(0)}
          className='flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
        >
          <ArrowLeft size={16} /> Back
        </button>
      )}
      {aiGenerating ? (
        <div className='flex flex-col items-center gap-6 py-8'>
          <motion.div
            className='relative'
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <div className='h-24 w-24 rounded-full border-4 border-primary/20' />
            <motion.div
              className='absolute inset-0 h-24 w-24 rounded-full border-4 border-primary border-t-transparent'
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <Rocket className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-primary' />
          </motion.div>
          <div className='text-center space-y-2'>
            <h3 className='text-lg font-bold font-display'>
              Setting Up Your Business
            </h3>
            <motion.p
              key={aiStage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className='text-sm text-muted-foreground'
            >
              {aiStage}
            </motion.p>
          </div>
          <div className='w-full max-w-xs'>
            <div className='h-2 rounded-full bg-muted overflow-hidden'>
              <motion.div
                className='h-full rounded-full bg-gradient-to-r from-primary to-secondary'
                initial={{ width: '0%' }}
                animate={{ width: `${aiProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className='text-xs text-muted-foreground text-center mt-2'>
              {Math.round(aiProgress)}%
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Business Category — searchable dropdown */}
          <div className='space-y-2 relative'>
            <Label className='text-xs font-semibold flex items-center gap-1.5'>
              <Building2 size={12} /> Business Category
              <span className='text-destructive'>*</span>
            </Label>
            <div className='relative'>
              <Input
                placeholder='Search category...'
                value={
                  categoryDropdownOpen ? categorySearch : selectedCategoryLabel
                }
                required
                aria-required='true'
                onChange={(e) => {
                  setCategorySearch(e.target.value);
                  setCategoryDropdownOpen(true);
                }}
                onFocus={() => setCategoryDropdownOpen(true)}
                className='w-full'
              />
              {categoryDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg max-h-48 overflow-y-auto'
                >
                  {categoriesLoading ? (
                    <p className='px-3 py-2 text-xs text-muted-foreground'>
                      Loading categories...
                    </p>
                  ) : filteredCategories.length === 0 ? (
                    <p className='px-3 py-2 text-xs text-muted-foreground'>
                      No categories found
                    </p>
                  ) : (
                    filteredCategories.map((cat) => (
                      <button
                        key={cat._id}
                        type='button'
                        onClick={() => {
                          setBizCategory(cat._id);
                          setCategorySearch('');
                          setCategoryDropdownOpen(false);
                        }}
                        className={`flex w-full items-center px-3 py-2 text-xs font-medium transition-colors hover:bg-muted ${
                          bizCategory === cat._id
                            ? 'bg-primary/10 text-primary'
                            : ''
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </div>
            {categoryDropdownOpen && (
              <div
                className='fixed inset-0 z-40'
                onClick={() => setCategoryDropdownOpen(false)}
              />
            )}
          </div>

          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs'>
                Business Name <span className='text-destructive'>*</span>
              </Label>
              <p
                className={`text-[10px] ${
                  bizName.length >= MAX_BUSINESS_NAME_LENGTH
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                {bizName.length}/{MAX_BUSINESS_NAME_LENGTH}
              </p>
            </div>
            <Input
              placeholder='e.g. Omega Services'
              value={bizName}
              required
              maxLength={MAX_BUSINESS_NAME_LENGTH}
              onChange={(e) =>
                setBizName(e.target.value.slice(0, MAX_BUSINESS_NAME_LENGTH))
              }
            />
          </div>
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <Label className='text-xs'>
                Business Description <span className='text-destructive'>*</span>
              </Label>
              <p
                className={`text-[10px] ${
                  bizDescription.length >= MAX_BUSINESS_DESCRIPTION_LENGTH
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                {bizDescription.length}/{MAX_BUSINESS_DESCRIPTION_LENGTH}
              </p>
            </div>
            <Textarea
              placeholder='What does your business do?'
              value={bizDescription}
              required
              maxLength={MAX_BUSINESS_DESCRIPTION_LENGTH}
              onChange={(e) =>
                setBizDescription(
                  e.target.value.slice(0, MAX_BUSINESS_DESCRIPTION_LENGTH),
                )
              }
              rows={2}
            />
          </div>

          <div className='space-y-2'>
            <Label className='text-xs font-semibold flex items-center gap-1.5'>
              <Palette size={12} /> Color Scheme
            </Label>
            <div className='flex flex-wrap gap-2'>
              {colorSchemes.map((cs) => (
                <motion.button
                  key={cs.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedColor(cs.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
                    selectedColor === cs.id
                      ? 'border-primary shadow-md'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div
                    className='h-3 w-3 rounded-full'
                    style={{
                      background: `linear-gradient(135deg, ${cs.primary}, ${cs.secondary})`,
                    }}
                  />
                  {cs.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div className='space-y-2'>
            <Label className='text-xs font-semibold'>Typography</Label>
            <div className='flex flex-wrap gap-2'>
              {fontOptions.map((f) => (
                <motion.button
                  key={f.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedFont(f.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedFont === f.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/30'
                  }`}
                  style={{ fontFamily: f.family }}
                >
                  {f.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div className='space-y-2'>
            <Label className='text-xs font-semibold flex items-center gap-1.5'>
              <Wrench size={12} /> Services
            </Label>
            <div className='flex gap-2'>
              <Input
                placeholder='Add a service...'
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), handleAddService())
                }
                className='flex-1'
              />
              <Button size='sm' variant='outline' onClick={handleAddService}>
                Add
              </Button>
            </div>
            {services.length > 0 && (
              <div className='flex flex-wrap gap-1.5'>
                {services.map((s) => (
                  <Badge
                    key={s}
                    variant='secondary'
                    className='gap-1 cursor-pointer'
                    onClick={() => setServices(services.filter((x) => x !== s))}
                  >
                    {s} <span className='text-destructive'>×</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleBusinessNext}
              className='gradient-bg w-full text-primary-foreground'
              size='lg'
              disabled={
                createBusinessMutation.isPending || !isBusinessInfoComplete
              }
            >
              {createBusinessMutation.isPending ? (
                <Loader2 className='h-5 w-5 animate-spin' />
              ) : (
                <>
                  <Rocket size={18} /> Generate My Business
                </>
              )}
            </Button>
          </motion.div>
        </>
      )}
    </motion.div>
  );

  const renderWebsiteBuilder = () => (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className='space-y-5'
    >
      <div className='text-center space-y-2'>
        <Globe className='h-12 w-12 text-primary mx-auto' />
        <h2 className='text-xl font-bold font-display'>AI Website Builder</h2>
        <p className='text-sm text-muted-foreground'>
          Generate a professional website with AI. Includes a bookings page for
          client requests.
        </p>
      </div>

      {websiteGenerated ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className='space-y-4'
        >
          <div className='rounded-xl border border-primary/30 bg-primary/5 p-4 text-center space-y-3'>
            <Check className='h-10 w-10 text-emerald-500 mx-auto' />
            <h3 className='font-bold font-display'>Website is Live!</h3>
            <p className='text-sm text-muted-foreground'>
              Your website has been generated and deployed.
            </p>
            <div className='rounded-lg bg-muted px-4 py-2'>
              <p className='text-xs text-muted-foreground'>Website URL</p>
              <p className='font-mono text-sm font-bold text-primary'>
                {websiteUrl}
              </p>
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <Button
              variant='outline'
              className='gap-1.5'
              onClick={() => window.open(websiteUrl, '_blank')}
            >
              <Eye size={16} /> Live Preview
            </Button>
            <Button
              className='gradient-bg text-primary-foreground gap-1.5'
              onClick={handleFinish}
            >
              <ArrowRight size={16} /> Go to Dashboard
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className='space-y-4'>
          <div className='rounded-xl border border-border bg-muted/30 p-4 space-y-3'>
            <p className='text-xs font-semibold'>What AI will generate:</p>
            <ul className='space-y-1.5 text-xs text-muted-foreground'>
              {[
                'Professional homepage with animations',
                'Services showcase',
                'About & contact sections',
                'Client booking page',
                'Mobile-responsive design',
                'Custom colors & typography',
              ].map((item) => (
                <li key={item} className='flex items-center gap-2'>
                  <Check size={12} className='text-emerald-500' /> {item}
                </li>
              ))}
            </ul>
          </div>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleGenerateWebsite}
              className='gradient-bg w-full text-primary-foreground'
              size='lg'
              disabled={websiteGenerating}
            >
              <Sparkles size={18} /> Generate Website with AI
            </Button>
          </motion.div>
          <Button
            variant='ghost'
            className='w-full gap-1.5 text-muted-foreground'
            onClick={handleSkipWebsite}
          >
            <SkipForward size={16} /> Skip for now
          </Button>
        </div>
      )}

      {/* Non-closable generation modal */}
      <Dialog open={showWebsiteModal} onOpenChange={() => {}}>
        <DialogContent
          className='sm:max-w-md'
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogTitle className='sr-only'>
            Website Generation Progress
          </DialogTitle>
          <div className='flex flex-col items-center gap-6 py-6'>
            <motion.div
              className='relative'
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <div className='h-20 w-20 rounded-full border-4 border-primary/20' />
              <motion.div
                className='absolute inset-0 h-20 w-20 rounded-full border-4 border-primary border-t-transparent'
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <Globe className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary' />
            </motion.div>
            <div className='text-center space-y-2'>
              <h3 className='text-lg font-bold font-display'>
                AI is Building Your Website
              </h3>
              <p className='text-sm text-muted-foreground'>
                Please wait while we generate your website...
              </p>
              <motion.p
                key={websiteStage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='text-xs text-primary font-medium'
              >
                {websiteStage}
              </motion.p>
            </div>
            <div className='w-full max-w-xs'>
              <div className='h-2 rounded-full bg-muted overflow-hidden'>
                <motion.div
                  className='h-full rounded-full bg-gradient-to-r from-primary to-secondary'
                  initial={{ width: '0%' }}
                  animate={{ width: `${websiteProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className='text-xs text-muted-foreground text-center mt-2'>
                {Math.round(websiteProgress)}%
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );

  // ─── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div className='relative flex min-h-dvh items-center justify-center overflow-x-hidden overflow-y-auto bg-background px-3 py-2 sm:min-h-screen sm:px-4 sm:py-8'>
      <ThemeToggle />

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
          transition={{
            duration: 6 + i * 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          initial={{ x: (i - 2.5) * 150, y: (i - 2.5) * 80 }}
        />
      ))}

      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`sp-${i}`}
          className='pointer-events-none absolute h-1 w-1 rounded-full bg-primary'
          animate={{
            y: [0, -250],
            x: [0, (i % 2 === 0 ? 1 : -1) * (15 + i * 8)],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 3 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeOut',
          }}
          style={{ left: `${8 + i * 9}%`, bottom: '0%' }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className='relative z-10 w-full max-w-lg'
      >
        {!showPinStep && !showEmailVerify && (
          <div className='mb-4 flex items-center justify-center gap-1.5 sm:mb-6 sm:gap-2'>
            {STEPS.map((s, i) => (
              <div key={s} className='flex items-center gap-1.5 sm:gap-2'>
                <motion.div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all sm:h-8 sm:w-8 sm:text-xs ${
                    i < step
                      ? 'bg-emerald-500 text-primary-foreground'
                      : i === step
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'bg-muted text-muted-foreground'
                  }`}
                  animate={i === step ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </motion.div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-5 rounded transition-colors sm:w-8 ${
                      i < step ? 'bg-emerald-500' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {step === 1 && !aiGenerating ? (
          <>
            <motion.div
              className='mb-5 flex flex-col items-center gap-2'
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <div className='relative'>
                <Image
                  src={servixLogo}
                  alt='Servix OS'
                  width={48}
                  height={48}
                  className='h-12 w-12'
                />
                <motion.div
                  className='absolute -right-1 -top-1'
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className='h-4 w-4 text-accent' />
                </motion.div>
              </div>
              <h1 className='font-display text-xl font-bold'>{STEPS[step]}</h1>
              <p className='text-xs text-muted-foreground text-center'>
                Set up your business with AI assistance
              </p>
            </motion.div>
            <AnimatePresence mode='wait'>
              {renderBusinessOnboarding()}
            </AnimatePresence>
          </>
        ) : (
          <div className='max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-2xl border border-border bg-card/80 p-3 shadow-lg backdrop-blur-xl sm:max-h-[78dvh] sm:p-6'>
            <motion.div
              className='mb-5 flex flex-col items-center gap-2'
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <div className='relative'>
                <Image
                  src={servixLogo}
                  alt='Servix OS'
                  width={48}
                  height={48}
                  className='h-12 w-12'
                />
                <motion.div
                  className='absolute -right-1 -top-1'
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className='h-4 w-4 text-accent' />
                </motion.div>
              </div>
              {!showPinStep && !showEmailVerify && (
                <>
                  <h1 className='font-display text-xl font-bold'>
                    {STEPS[step]}
                  </h1>
                  <p className='text-xs text-muted-foreground text-center'>
                    {step === 0 && 'Create your Servix OS account'}
                    {step === 2 && 'Secure your plan before your trial ends'}
                    {step === 3 && 'Generate a professional website'}
                  </p>
                </>
              )}
            </motion.div>

            <AnimatePresence mode='wait'>
              {showPinStep
                ? renderPinEntry()
                : showEmailVerify
                  ? renderEmailVerify()
                  : step === 0
                    ? renderRegistrationForm()
                    : step === 2
                      ? renderCardStep()
                      : renderWebsiteBuilder()}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Signup;
