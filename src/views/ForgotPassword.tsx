'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Sparkles, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useForgotPassword, useResetPassword } from '@/hooks/mutations/use-auth';
import servixLogo from '@/assets/servix-logo.png';
import ThemeToggle from '@/components/ThemeToggle';
import OtpVerify from '@/components/OtpVerify';

const ForgotPassword = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  // The OTP is captured at step 2 and sent with the new password at step 3.
  const [capturedOtp, setCapturedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const router = useRouter();

  const forgotPasswordMutation = useForgotPassword();
  const resetPasswordMutation = useResetPassword();

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

    try {
      await forgotPasswordMutation.mutateAsync(email);
      // API always returns 200 regardless of whether email exists (OWASP enumeration prevention).
      setStep('otp');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      toast.error('Failed to send code', { description: message });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof passwordErrors = {};
    if (!newPassword) errs.newPassword = 'Password is required';
    else if (newPassword.length < 8) errs.newPassword = 'Minimum 8 characters';
    else if (!/[A-Z]/.test(newPassword)) errs.newPassword = 'Must contain at least one uppercase letter';
    else if (!/\d/.test(newPassword)) errs.newPassword = 'Must contain at least one number';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setPasswordErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      await resetPasswordMutation.mutateAsync({ otp: capturedOtp, newPassword });
      toast.success('Password reset!', {
        description: 'You can now sign in with your new password.',
      });
      router.push('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password.';
      // If the OTP was invalid/expired, send the user back to re-enter it.
      const isOtpError =
        message.toLowerCase().includes('otp') ||
        message.toLowerCase().includes('invalid') ||
        message.toLowerCase().includes('expired');
      if (isOtpError) {
        toast.error('Code invalid or expired', {
          description: 'Please request a new code.',
        });
        setCapturedOtp('');
        setStep('otp');
      } else {
        toast.error('Reset failed', { description: message });
      }
    }
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
            transition={{ duration: 5 + i * 1.5, repeat: Infinity, ease: 'easeInOut' }}
            initial={{ x: (i - 2) * 140, y: (i - 2) * 90 }}
          />
        ))}
      </>
    ),
    []
  );

  const sendingOtp = forgotPasswordMutation.isPending;
  const resettingPassword = resetPasswordMutation.isPending;

  return (
    <div className='relative flex min-h-dvh items-center justify-center overflow-x-hidden overflow-y-auto bg-background px-3 py-2 sm:min-h-screen sm:px-4 sm:py-8'>
      <ThemeToggle />
      <Orbs />

      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`sp-${i}`}
          className='pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-secondary'
          animate={{ y: [0, -250], opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.6 }}
          style={{ left: `${15 + i * 9}%`, bottom: '5%' }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className='relative z-10 w-full max-w-md'
      >
        <div className='max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-2xl border border-border bg-card/80 p-3 shadow-lg backdrop-blur-xl sm:max-h-none sm:overflow-visible sm:p-8'>
          <motion.div
            className='mb-6 flex flex-col items-center gap-3'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <div className='relative'>
              <Image src={servixLogo} alt='Servix OS' width={48} height={48} className='h-12 w-12' />
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
                  disabled={sendingOtp}
                />
                {emailError && <p className='text-xs text-destructive'>{emailError}</p>}
              </div>
              <Button
                type='submit'
                className='gradient-bg w-full text-primary-foreground'
                size='lg'
                disabled={sendingOtp}
              >
                {sendingOtp ? (
                  <motion.div
                    className='h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent'
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  'Send Verification Code'
                )}
              </Button>
              <Link
                href='/login'
                className='flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground'
              >
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </form>
          )}

          {step === 'otp' && (
            <OtpVerify
              email={email}
              // Capture the OTP locally — it will be sent with the new password at step 3.
              onVerified={(otp) => {
                setCapturedOtp(otp);
                setStep('reset');
              }}
              onBack={() => setStep('email')}
              title='Verify Code'
            />
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className='space-y-5'>
              <div className='space-y-2'>
                <Label htmlFor='new-password'>New Password</Label>
                <div className='relative'>
                  <Input
                    id='new-password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='••••••••'
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={passwordErrors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
                    disabled={resettingPassword}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className='text-xs text-destructive'>{passwordErrors.newPassword}</p>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='confirm-password'>Confirm Password</Label>
                <div className='relative'>
                  <Input
                    id='confirm-password'
                    type={showConfirm ? 'text' : 'password'}
                    placeholder='••••••••'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={passwordErrors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                    disabled={resettingPassword}
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirm(!showConfirm)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className='text-xs text-destructive'>{passwordErrors.confirmPassword}</p>
                )}
              </div>
              <Button
                type='submit'
                className='gradient-bg w-full text-primary-foreground'
                size='lg'
                disabled={resettingPassword}
              >
                {resettingPassword ? (
                  <motion.div
                    className='h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent'
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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
