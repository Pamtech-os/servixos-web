import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Sparkles, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import servixLogo from '@/assets/servix-logo.png';
import ThemeToggle from '@/components/ThemeToggle';

const ForgotPassword = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Invalid email format');
      return;
    }
    setEmailError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setStep('otp');
    setCountdown(120);
    setCanResend(false);
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setCountdown(120);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError('');
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setOtpError('Please enter all 6 digits');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setStep('reset');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof passwordErrors = {};
    if (!newPassword) errs.newPassword = 'Password is required';
    else if (newPassword.length < 6) errs.newPassword = 'Password must be at least 6 characters';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setPasswordErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    navigate('/login');
  };

  const Orbs = useCallback(
    () => (
      <>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className='pointer-events-none absolute rounded-full opacity-15 blur-3xl'
            style={{
              width: `${160 + i * 70}px`,
              height: `${160 + i * 70}px`,
              background:
                i % 3 === 0
                  ? 'hsl(0, 84%, 60%)'
                  : i % 3 === 1
                  ? 'hsl(270, 70%, 60%)'
                  : 'hsl(217, 91%, 60%)',
            }}
            animate={{
              x: [0, 40 * (i % 2 === 0 ? 1 : -1), 0],
              y: [0, 30 * (i % 2 === 0 ? -1 : 1), 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 5 + i * 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            initial={{ x: (i - 2) * 140, y: (i - 2) * 90 }}
          />
        ))}
      </>
    ),
    []
  );

  return (
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4'>
      <ThemeToggle />
      <Orbs />

      {/* Sparkle particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`sp-${i}`}
          className='pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-secondary'
          animate={{
            y: [0, -250],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.6,
          }}
          style={{ left: `${15 + i * 9}%`, bottom: '5%' }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className='relative z-10 w-full max-w-md'
      >
        <div className='rounded-2xl border border-border bg-card/80 p-8 shadow-lg backdrop-blur-xl'>
          <motion.div
            className='mb-6 flex flex-col items-center gap-3'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <div className='relative'>
              <img src={servixLogo} alt='Servix OS' className='h-12 w-12' />
              <motion.div
                className='absolute -right-1 -top-1'
                animate={{ rotate: [0, 20, -20, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className='h-4 w-4 text-accent' />
              </motion.div>
            </div>

            {step === 'email' && (
              <>
                <Mail className='h-8 w-8 text-primary' />
                <h1 className='font-display text-xl font-bold'>Forgot Password</h1>
                <p className='text-center text-sm text-muted-foreground'>
                  Enter your email to receive a verification code
                </p>
              </>
            )}
            {step === 'otp' && (
              <>
                <KeyRound className='h-8 w-8 text-primary' />
                <h1 className='font-display text-xl font-bold'>Verify Code</h1>
                <p className='text-center text-sm text-muted-foreground'>
                  Enter the 6-digit code sent to {email}
                </p>
              </>
            )}
            {step === 'reset' && (
              <>
                <KeyRound className='h-8 w-8 text-primary' />
                <h1 className='font-display text-xl font-bold'>Reset Password</h1>
                <p className='text-center text-sm text-muted-foreground'>
                  Create a new password for your account
                </p>
              </>
            )}
          </motion.div>

          {step === 'email' && (
            <form onSubmit={handleSendOtp} className='space-y-5'>
              <div className='space-y-2'>
                <Label htmlFor='reset-email'>Email</Label>
                <Input
                  id='reset-email'
                  type='email'
                  placeholder='you@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={emailError ? 'border-destructive' : ''}
                />
                {emailError && <p className='text-xs text-destructive'>{emailError}</p>}
              </div>
              <Button
                type='submit'
                className='gradient-bg w-full text-primary-foreground'
                size='lg'
                disabled={loading}
              >
                {loading ? (
                  <motion.div
                    className='h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent'
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                ) : (
                  'Send Verification Code'
                )}
              </Button>
              <Link
                to='/login'
                className='flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground'
              >
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className='space-y-5'>
              <div className='flex justify-center gap-2'>
                {otp.map((digit, i) => (
                  <motion.input
                    key={i}
                    id={`otp-${i}`}
                    type='text'
                    inputMode='numeric'
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className='h-12 w-12 rounded-xl border border-input bg-background text-center text-xl font-bold text-foreground shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-ring'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  />
                ))}
              </div>
              {otpError && <p className='text-center text-xs text-destructive'>{otpError}</p>}

              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>
                  {countdown > 0 ? `Expires in ${formatTime(countdown)}` : 'Code expired'}
                </span>
                <button
                  type='button'
                  onClick={handleResendOtp}
                  disabled={!canResend || loading}
                  className={`font-medium ${
                    canResend
                      ? 'text-primary hover:underline'
                      : 'text-muted-foreground/50 cursor-not-allowed'
                  }`}
                >
                  Resend Code
                </button>
              </div>

              <Button
                type='submit'
                className='gradient-bg w-full text-primary-foreground'
                size='lg'
                disabled={loading}
              >
                {loading ? (
                  <motion.div
                    className='h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent'
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                ) : (
                  'Verify Code'
                )}
              </Button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className='space-y-5'>
              <div className='space-y-2'>
                <Label htmlFor='new-password'>New Password</Label>
                <Input
                  id='new-password'
                  type='password'
                  placeholder='••••••••'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={passwordErrors.newPassword ? 'border-destructive' : ''}
                />
                {passwordErrors.newPassword && (
                  <p className='text-xs text-destructive'>{passwordErrors.newPassword}</p>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='confirm-password'>Confirm Password</Label>
                <Input
                  id='confirm-password'
                  type='password'
                  placeholder='••••••••'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={passwordErrors.confirmPassword ? 'border-destructive' : ''}
                />
                {passwordErrors.confirmPassword && (
                  <p className='text-xs text-destructive'>{passwordErrors.confirmPassword}</p>
                )}
              </div>
              <Button
                type='submit'
                className='gradient-bg w-full text-primary-foreground'
                size='lg'
                disabled={loading}
              >
                {loading ? (
                  <motion.div
                    className='h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent'
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
