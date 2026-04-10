import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import servixLogo from '@/assets/servix-logo.png';
import ThemeToggle from '@/components/ThemeToggle';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const validate = () => {
    const errs: typeof errors = {};
    if (!email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    login(email);
    setLoading(false);
    navigate('/pin');
  };

  return (
    <div className='relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4'>
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
        <div className='rounded-2xl border border-border bg-card/80 p-8 shadow-lg backdrop-blur-xl'>
          <motion.div
            className='mb-6 flex flex-col items-center gap-3'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <div className='relative'>
              <img src={servixLogo} alt='Servix OS' className='h-14 w-14' />
              <motion.div
                className='absolute -right-1 -top-1'
                animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className='h-5 w-5 text-accent' />
              </motion.div>
            </div>
            <h1 className='font-display text-2xl font-bold'>Welcome Back</h1>
            <p className='text-sm text-muted-foreground'>Sign in to your Servix OS account</p>
          </motion.div>

          <form onSubmit={handleSubmit} className='space-y-5'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='you@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className='text-xs text-destructive'>{errors.email}</p>}
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
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className='text-xs text-destructive'>{errors.password}</p>}
            </div>

            <div className='flex justify-end'>
              <Link to='/forgot-password' className='text-sm text-primary hover:underline'>
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
                  <div className='relative flex items-center justify-center h-6 w-6'>
                    {/* Outer ring */}
                    <motion.div
                      className='absolute inset-0 rounded-full border-2 border-primary-foreground/20'
                      style={{ borderTopColor: 'hsl(var(--primary-foreground))' }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* Middle ring - counter rotate */}
                    <motion.div
                      className='absolute inset-[3px] rounded-full border-2 border-transparent'
                      style={{
                        borderBottomColor: 'hsl(var(--primary-foreground))',
                        borderLeftColor: 'hsl(var(--primary-foreground))',
                      }}
                      animate={{ rotate: -360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    />
                    {/* Inner pulsing dot */}
                    <motion.div
                      className='h-1.5 w-1.5 rounded-full bg-primary-foreground'
                      animate={{ scale: [1, 1.8, 1], opacity: [1, 0.4, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                ) : (
                  <>
                    <LogIn size={18} /> Sign In
                  </>
                )}
              </Button>
            </motion.div>

            <p className='text-center text-xs text-muted-foreground mt-4'>
              Don't have an account?{' '}
              <Link to='/signup' className='text-primary hover:underline font-medium'>
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
