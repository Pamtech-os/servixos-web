'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/common/network/http-client';
import { useAuth } from '@/contexts/AuthContext';
import { useLogin } from '@/hooks/mutations/use-auth';
import servixLogo from '@/assets/servix-logo.png';
import ThemeToggle from '@/components/ThemeToggle';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const router = useRouter();
  const { setSession } = useAuth();
  const loginMutation = useLogin();

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format';
    if (!password) errs.password = 'Password is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const session = await loginMutation.mutateAsync({ email, password });
      setSession(session);
      router.push('/pin');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const loading = loginMutation.isPending;

  return (
    <div className='relative flex min-h-dvh items-center justify-center overflow-x-hidden overflow-y-auto bg-background px-3 py-2 sm:min-h-screen sm:px-4 sm:py-8'>
      <ThemeToggle />
      {/* Animated background orbs */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className='pointer-events-none absolute rounded-full opacity-20 blur-3xl'
          style={{
            width: `${200 + i * 80}px`,
            height: `${200 + i * 80}px`,
            background: i % 2 === 0 ? 'hsl(217, 91%, 60%)' : 'hsl(270, 70%, 60%)',
          }}
          animate={{
            x: [0, 60 * (i % 2 === 0 ? 1 : -1), 0],
            y: [0, 40 * (i % 2 === 0 ? -1 : 1), 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
          initial={{ x: (i - 2) * 150, y: (i - 2) * 100 }}
        />
      ))}

      {/* Sparkle particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`spark-${i}`}
          className='pointer-events-none absolute h-1 w-1 rounded-full bg-primary'
          animate={{
            y: [0, -300],
            x: [0, (i % 2 === 0 ? 1 : -1) * (20 + i * 10)],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 3 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeOut',
          }}
          style={{
            left: `${10 + i * 7}%`,
            bottom: '0%',
          }}
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
            className='mb-4 flex flex-col items-center gap-2.5 sm:mb-6 sm:gap-3'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <div className='relative'>
              <Image
                src={servixLogo}
                alt='Servix OS'
                width={56}
                height={56}
                className='h-12 w-12 sm:h-14 sm:w-14'
              />
              <motion.div
                className='absolute -right-1 -top-1'
                animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className='h-4 w-4 text-accent sm:h-5 sm:w-5' />
              </motion.div>
            </div>
            <h1 className='font-display text-xl font-bold sm:text-2xl'>Welcome Back</h1>
            <p className='text-center text-xs text-muted-foreground sm:text-sm'>
              Sign in to your Servix OS account
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className='space-y-4 sm:space-y-5'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='you@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldErrors.email ? 'border-destructive' : ''}
                disabled={loading}
              />
              {fieldErrors.email && <p className='text-xs text-destructive'>{fieldErrors.email}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={fieldErrors.password ? 'border-destructive pr-10' : 'pr-10'}
                  disabled={loading}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && <p className='text-xs text-destructive'>{fieldErrors.password}</p>}
            </div>

            <div className='flex justify-end'>
              <Link href='/forgot-password' className='text-xs text-primary hover:underline sm:text-sm'>
                Forgot password?
              </Link>
            </div>

            <motion.div whileTap={{ scale: 0.97 }}>
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
                    <LogIn size={18} /> Sign In
                  </>
                )}
              </Button>
            </motion.div>

            <p className='mt-3 text-center text-xs text-muted-foreground sm:mt-4'>
              Do not have an account?{' '}
              <Link href='/signup' className='text-primary hover:underline font-medium'>
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
