'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, KeyRound, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { getApiErrorMessage } from '@/common/network/http-client';
import { useCompleteSetup } from '@/hooks/mutations/use-auth';
import { useAuth } from '@/contexts/AuthContext';
import servixLogo from '@/assets/servix-logo.png';
import ThemeToggle from '@/components/ThemeToggle';

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
const PIN_RULE = /^\d{4}$/;

const CompleteSetup = () => {
  const router = useRouter();
  const { auth, isHydrated, completeSetup: completeSetupAuth, logout } = useAuth();
  const completeSetupMutation = useCompleteSetup();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isHydrated) return;

    if (!auth.isLoggedIn) {
      router.replace('/login');
      return;
    }

    if (!auth.user?.mustChangePassword) {
      router.replace(auth.isPinVerified ? '/dashboard' : '/pin');
    }
  }, [auth.isLoggedIn, auth.isPinVerified, auth.user?.mustChangePassword, isHydrated, router]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!newPassword) {
      nextErrors.newPassword = 'New password is required';
    } else if (!PASSWORD_RULE.test(newPassword)) {
      nextErrors.newPassword = 'Must be 8+ chars with at least 1 uppercase and 1 number';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your new password';
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    if (!pin) {
      nextErrors.pin = 'PIN is required';
    } else if (!PIN_RULE.test(pin)) {
      nextErrors.pin = 'PIN must be exactly 4 digits';
    }

    if (!confirmPin) {
      nextErrors.confirmPin = 'Please confirm your PIN';
    } else if (confirmPin !== pin) {
      nextErrors.confirmPin = 'PINs do not match';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const token = auth.accessToken;
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const setupToken = await completeSetupMutation.mutateAsync({
        token,
        input: {
          newPassword,
          confirmPassword,
          pin,
          confirmPin,
        },
      });

      completeSetupAuth(setupToken);
      toast.success('Setup completed', {
        description: 'Your password and PIN were updated successfully.',
      });
      router.replace('/pin');
    } catch (err) {
      toast.error('Unable to complete setup', {
        description: getApiErrorMessage(err),
      });
    }
  };

  const loading = completeSetupMutation.isPending;

  if (!isHydrated || !auth.isLoggedIn || !auth.user?.mustChangePassword) {
    return null;
  }

  return (
    <div className='relative flex min-h-dvh items-center justify-center overflow-x-hidden overflow-y-auto bg-background px-3 py-2 sm:min-h-screen sm:px-4 sm:py-8'>
      <ThemeToggle />

      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className='pointer-events-none absolute rounded-full opacity-15 blur-3xl'
          style={{
            width: `${170 + i * 70}px`,
            height: `${170 + i * 70}px`,
            background:
              i % 2 === 0 ? 'hsl(217, 91%, 60%)' : 'hsl(174, 72%, 50%)',
          }}
          animate={{
            x: [0, 45 * (i % 2 === 0 ? 1 : -1), 0],
            y: [0, 35 * (i % 2 === 0 ? -1 : 1), 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 5 + i * 1.5, repeat: Infinity, ease: 'easeInOut' }}
          initial={{ x: (i - 1.5) * 170, y: (i - 1.5) * 90 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
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
              <Image src={servixLogo} alt='Servix OS' width={52} height={52} className='h-12 w-12 sm:h-13 sm:w-13' />
              <motion.div
                className='absolute -right-1 -top-1'
                animate={{ rotate: [0, 20, -20, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className='h-4 w-4 text-accent' />
              </motion.div>
            </div>
            <ShieldCheck className='h-8 w-8 text-primary' />
            <h1 className='font-display text-xl font-bold'>Complete Your Setup</h1>
            <p className='text-center text-sm text-muted-foreground'>
              Update your temporary password and set your 4-digit PIN before accessing the app.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className='space-y-4 sm:space-y-5'>
            <div className='space-y-2'>
              <Label htmlFor='new-password'>New Password</Label>
              <div className='relative'>
                <Input
                  id='new-password'
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={errors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
                  placeholder='Enter new password'
                  disabled={loading}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword((v) => !v)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className='text-xs text-destructive'>{errors.newPassword}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirm-password'>Confirm New Password</Label>
              <div className='relative'>
                <Input
                  id='confirm-password'
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                  placeholder='Confirm new password'
                  disabled={loading}
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className='text-xs text-destructive'>{errors.confirmPassword}</p>
              )}
            </div>

            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='pin'>4-Digit PIN</Label>
                <Input
                  id='pin'
                  type='password'
                  inputMode='numeric'
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className={errors.pin ? 'border-destructive' : ''}
                  placeholder='1234'
                  disabled={loading}
                />
                {errors.pin && <p className='text-xs text-destructive'>{errors.pin}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirm-pin'>Confirm PIN</Label>
                <Input
                  id='confirm-pin'
                  type='password'
                  inputMode='numeric'
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) =>
                    setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                  }
                  className={errors.confirmPin ? 'border-destructive' : ''}
                  placeholder='1234'
                  disabled={loading}
                />
                {errors.confirmPin && (
                  <p className='text-xs text-destructive'>{errors.confirmPin}</p>
                )}
              </div>
            </div>

            <p className='rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground'>
              Password must be at least 8 characters and include 1 uppercase letter and 1 number.
              PIN must be exactly 4 digits.
            </p>

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
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <>
                  <KeyRound size={16} /> Complete Setup
                </>
              )}
            </Button>

            <div className='flex items-center justify-center gap-4 pt-1'>
              <button
                type='button'
                onClick={logout}
                disabled={loading}
                className='text-sm text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-40'
              >
                Sign out
              </button>
              <Link
                href='/login'
                className='text-sm text-muted-foreground transition-colors hover:text-foreground'
              >
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CompleteSetup;
