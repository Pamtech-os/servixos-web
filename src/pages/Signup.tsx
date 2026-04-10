import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import servixLogo from '@/assets/servix-logo.png';
import ThemeToggle from '@/components/ThemeToggle';
import { toast } from 'sonner';

const STEPS = ['Registration', 'Business Setup', 'Website Builder'];

const businessCategories = [
  { id: 'cleaning', label: 'Cleaning Services', icon: '🧹' },
  { id: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { id: 'electrical', label: 'Electrical', icon: '⚡' },
  { id: 'hvac', label: 'HVAC', icon: '❄️' },
  { id: 'landscaping', label: 'Landscaping', icon: '🌿' },
  { id: 'painting', label: 'Painting', icon: '🎨' },
  { id: 'carpentry', label: 'Carpentry', icon: '🪚' },
  { id: 'general', label: 'General Contractor', icon: '🏗️' },
];

const colorSchemes = [
  { id: 'blue', label: 'Ocean Blue', primary: '#3B82F6', secondary: '#8B5CF6' },
  { id: 'green', label: 'Forest Green', primary: '#10B981', secondary: '#059669' },
  { id: 'purple', label: 'Royal Purple', primary: '#8B5CF6', secondary: '#EC4899' },
  { id: 'orange', label: 'Sunset Orange', primary: '#F59E0B', secondary: '#EF4444' },
  { id: 'teal', label: 'Teal Breeze', primary: '#14B8A6', secondary: '#3B82F6' },
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

const Signup = () => {
  const navigate = useNavigate();
  const { login, verifyPin } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1: Registration
  const [reg, setReg] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  // PIN entry within registration
  const [showPinStep, setShowPinStep] = useState(false);
  const [pin, setPin] = useState<string[]>([]);
  const [confirmPin, setConfirmPin] = useState<string[]>([]);
  const [pinPhase, setPinPhase] = useState<'create' | 'confirm'>('create');
  const [pinError, setPinError] = useState('');
  const [shuffledNumbers] = useState(() => shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));

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

  // Step 3: Website Builder
  const [websiteGenerating, setWebsiteGenerating] = useState(false);
  const [websiteGenerated, setWebsiteGenerated] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteProgress, setWebsiteProgress] = useState(0);
  const [websiteStage, setWebsiteStage] = useState('');
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);

  // PIN keyboard support
  const currentPin = pinPhase === 'create' ? pin : confirmPin;
  const setCurrentPin = pinPhase === 'create' ? setPin : setConfirmPin;

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
    if (!showPinStep) return;
    const handler = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) addDigit(parseInt(e.key));
      else if (e.key === 'Backspace') removeDigit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showPinStep, addDigit, removeDigit]);

  // Auto-advance PIN
  useEffect(() => {
    if (pinPhase === 'create' && pin.length === 4) {
      setTimeout(() => setPinPhase('confirm'), 400);
    }
    if (pinPhase === 'confirm' && confirmPin.length === 4) {
      setTimeout(() => {
        if (pin.join('') !== confirmPin.join('')) {
          setPinError('PINs do not match. Try again.');
          setConfirmPin([]);
          setPinPhase('create');
          setPin([]);
        } else {
          toast.success('PIN created successfully!');
          setShowPinStep(false);
          setStep(1);
        }
      }, 400);
    }
  }, [pin, confirmPin, pinPhase]);

  const validateRegistration = () => {
    const errs: Record<string, string> = {};
    if (!reg.firstName.trim()) errs.firstName = 'First name is required';
    if (!reg.lastName.trim()) errs.lastName = 'Last name is required';
    if (!reg.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email)) errs.email = 'Invalid email';
    if (!reg.phone) errs.phone = 'Phone is required';
    else if (!/^\+?[\d\s()-]{7,15}$/.test(reg.phone)) errs.phone = 'Invalid phone number';
    if (!reg.password) errs.password = 'Password is required';
    else if (reg.password.length < 8) errs.password = 'Minimum 8 characters';
    if (reg.password !== reg.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegistrationNext = async () => {
    if (!validateRegistration()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    toast.success('Account created!', { description: 'Now set up your security PIN.' });
    login(reg.email);
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

    setAiGenerating(true);
    setAiProgress(0);
    const stages = [
      'Analyzing business category...',
      'Setting up brand identity...',
      'Configuring services...',
      'Creating business profile...',
      'Finalizing setup...',
    ];
    for (let i = 0; i < stages.length; i++) {
      setAiStage(stages[i]);
      setAiProgress(((i + 1) / stages.length) * 100);
      await new Promise((r) => setTimeout(r, 1200));
    }
    setAiGenerating(false);
    toast.success('Business created!', { description: 'Your business profile is ready.' });
    setStep(2);
  };

  const handleGenerateWebsite = async () => {
    setShowWebsiteModal(true);
    setWebsiteGenerating(true);
    setWebsiteProgress(0);
    const stages = [
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
    for (let i = 0; i < stages.length; i++) {
      setWebsiteStage(stages[i]);
      setWebsiteProgress(((i + 1) / stages.length) * 100);
      await new Promise((r) => setTimeout(r, 1500));
    }
    const subdomain = bizName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const url = `${subdomain || 'mybusiness'}.servixos.com`;
    setWebsiteUrl(url);
    setWebsiteGenerating(false);
    setWebsiteGenerated(true);
    setShowWebsiteModal(false);
    toast.success('Website generated!', { description: `Live at ${url}` });
  };

  const handleFinish = () => {
    verifyPin();
    navigate('/dashboard');
  };

  const handleSkipWebsite = () => {
    verifyPin();
    navigate('/dashboard');
  };

  const renderRegistrationForm = () => (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className='space-y-5'
    >
      <div className='grid grid-cols-2 gap-3'>
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
        <Label htmlFor='phone' className='flex items-center gap-1.5 text-xs'>
          <Phone size={12} /> Phone Number
        </Label>
        <Input
          id='phone'
          type='tel'
          placeholder='+1 (555) 000-0000'
          value={reg.phone}
          onChange={(e) => setReg((p) => ({ ...p, phone: e.target.value }))}
          className={regErrors.phone ? 'border-destructive' : ''}
        />
        {regErrors.phone && <p className='text-[10px] text-destructive'>{regErrors.phone}</p>}
      </div>

      <div className='grid grid-cols-2 gap-3'>
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
            <Lock size={12} /> Confirm
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

      <motion.div whileTap={{ scale: 0.97 }}>
        <Button
          onClick={handleRegistrationNext}
          className='gradient-bg w-full text-primary-foreground'
          size='lg'
          disabled={loading}
        >
          {loading ? (
            <Loader2 className='h-5 w-5 animate-spin' />
          ) : (
            <>
              <ArrowRight size={18} /> Continue
            </>
          )}
        </Button>
      </motion.div>

      <div className='relative'>
        <Separator />
        <span className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground'>
          or sign up with
        </span>
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <Button
          variant='outline'
          className='gap-2'
          onClick={() => toast.info('Google signup coming soon')}
        >
          <svg className='h-4 w-4' viewBox='0 0 24 24'>
            <path
              d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z'
              fill='#4285F4'
            />
            <path
              d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              fill='#34A853'
            />
            <path
              d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              fill='#FBBC05'
            />
            <path
              d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              fill='#EA4335'
            />
          </svg>
          Google
        </Button>
        <Button
          variant='outline'
          className='gap-2'
          onClick={() => toast.info('Apple signup coming soon')}
        >
          <svg className='h-4 w-4' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z' />
          </svg>
          Apple
        </Button>
      </div>

      <p className='text-center text-xs text-muted-foreground'>
        Already have an account?{' '}
        <Link to='/login' className='text-primary hover:underline font-medium'>
          Sign in
        </Link>
      </p>
    </motion.div>
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
                disabled={currentPin.length >= 4}
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
            disabled={currentPin.length >= 4}
            className='flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-background text-lg font-bold text-foreground shadow-sm transition-all hover:bg-muted hover:border-primary/50 active:bg-primary/10 disabled:opacity-40'
          >
            0
          </motion.button>
          <motion.button
            type='button'
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={removeDigit}
            disabled={currentPin.length === 0}
            className='flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground shadow-sm transition-all hover:bg-destructive/10 hover:text-destructive disabled:opacity-40'
          >
            <Delete size={20} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  const [categorySearch, setCategorySearch] = useState('');
  const filteredCategories = businessCategories.filter((c) =>
    c.label.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const selectedCategoryLabel = businessCategories.find((c) => c.id === bizCategory)?.label || '';

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
            <h3 className='text-lg font-bold font-display'>AI Generating Your Business</h3>
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
          {/* Business Category - Searchable Dropdown */}
          <div className='space-y-2 relative'>
            <Label className='text-xs font-semibold flex items-center gap-1.5'>
              <Building2 size={12} /> Business Category
            </Label>
            <div className='relative'>
              <Input
                placeholder='Search category...'
                value={categoryDropdownOpen ? categorySearch : selectedCategoryLabel}
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
                  {filteredCategories.length === 0 ? (
                    <p className='px-3 py-2 text-xs text-muted-foreground'>No categories found</p>
                  ) : (
                    filteredCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type='button'
                        onClick={() => {
                          setBizCategory(cat.id);
                          setCategorySearch('');
                          setCategoryDropdownOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-muted ${
                          bizCategory === cat.id ? 'bg-primary/10 text-primary' : ''
                        }`}
                      >
                        <span className='text-base'>{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </div>
            {categoryDropdownOpen && (
              <div className='fixed inset-0 z-40' onClick={() => setCategoryDropdownOpen(false)} />
            )}
          </div>

          {/* Business Name & Description */}
          <div className='space-y-1.5'>
            <Label className='text-xs'>Business Name</Label>
            <Input
              placeholder='e.g. Omega Services'
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
            />
          </div>
          <div className='space-y-1.5'>
            <Label className='text-xs'>Description (optional)</Label>
            <Textarea
              placeholder='What does your business do?'
              value={bizDescription}
              onChange={(e) => setBizDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Brand Identity */}
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

          {/* Services */}
          <div className='space-y-2'>
            <Label className='text-xs font-semibold flex items-center gap-1.5'>
              <Wrench size={12} /> Services
            </Label>
            <div className='flex gap-2'>
              <Input
                placeholder='Add a service...'
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
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
            >
              <Rocket size={18} /> Generate My Business
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
          Generate a professional website with AI. Includes a bookings page for client requests.
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
              <p className='font-mono text-sm font-bold text-primary'>{websiteUrl}</p>
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <Button
              variant='outline'
              className='gap-1.5'
              onClick={() => toast.info('Preview opening...')}
            >
              <Eye size={16} /> Live Preview
            </Button>
            <Button className='gradient-bg text-primary-foreground gap-1.5' onClick={handleFinish}>
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

      {/* Non-closable generating modal */}
      <Dialog open={showWebsiteModal} onOpenChange={() => {}}>
        <DialogContent
          className='sm:max-w-md'
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
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
              <h3 className='text-lg font-bold font-display'>AI is Building Your Website</h3>
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

  return (
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8'>
      <ThemeToggle />

      {/* Animated background */}
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

      {/* Sparkle particles */}
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
          transition={{ duration: 3 + i * 0.3, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
          style={{ left: `${8 + i * 9}%`, bottom: '0%' }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className='relative z-10 w-full max-w-lg'
      >
        {/* Step indicator */}
        {!showPinStep && (
          <div className='mb-6 flex items-center justify-center gap-2'>
            {STEPS.map((s, i) => (
              <div key={s} className='flex items-center gap-2'>
                <motion.div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
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
                    className={`h-0.5 w-8 rounded transition-colors ${
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
            {/* Logo + title without container for step 2 */}
            <motion.div
              className='mb-5 flex flex-col items-center gap-2'
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <div className='relative'>
                <img src={servixLogo} alt='Servix OS' className='h-12 w-12' />
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
            <AnimatePresence mode='wait'>{renderBusinessOnboarding()}</AnimatePresence>
          </>
        ) : (
          <div className='rounded-2xl border border-border bg-card/80 p-6 shadow-lg backdrop-blur-xl max-h-[80vh] overflow-hidden'>
            {/* Logo */}
            <motion.div
              className='mb-5 flex flex-col items-center gap-2'
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <div className='relative'>
                <img src={servixLogo} alt='Servix OS' className='h-12 w-12' />
                <motion.div
                  className='absolute -right-1 -top-1'
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className='h-4 w-4 text-accent' />
                </motion.div>
              </div>
              {!showPinStep && (
                <>
                  <h1 className='font-display text-xl font-bold'>{STEPS[step]}</h1>
                  <p className='text-xs text-muted-foreground text-center'>
                    {step === 0 && 'Create your Servix OS account'}
                    {step === 2 && 'Generate a professional website'}
                  </p>
                </>
              )}
            </motion.div>

            <AnimatePresence mode='wait'>
              {showPinStep
                ? renderPinEntry()
                : step === 0
                ? renderRegistrationForm()
                : renderWebsiteBuilder()}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Signup;
