'use client';

import { useState, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage } from '@/common/network/http-client';

interface OtpVerifyProps {
  email: string;
  /** Called with the verified OTP code on success. */
  onVerified: (otp: string) => void;
  onBack?: () => void;
  title?: string;
  description?: string;
  /**
   * If provided, called with the entered code before `onVerified`.
   * Should throw an Error (with a user-facing message) on failure.
   * If omitted, the OTP is accepted locally without a server round-trip.
   */
  onVerify?: (otp: string) => Promise<void>;
  /** If provided, called when the user clicks "Resend Code". */
  onResend?: () => Promise<void>;
}

const OtpVerify = ({
  email,
  onVerified,
  onBack,
  title = 'Verify Your Email',
  description,
  onVerify,
  onResend,
}: OtpVerifyProps) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const canSubmit = otp.every((d) => d.length === 1);

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

  const handleResend = async () => {
    if (!canResend || loading) return;
    setLoading(true);
    try {
      if (onResend) await onResend();
      setCountdown(120);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
    } catch (err) {
      setOtpError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (code: string) => {
    if (loading) return;
    if (code.length !== 6) {
      setOtpError('Please enter all 6 digits');
      return;
    }
    setLoading(true);
    try {
      if (onVerify) await onVerify(code);
      onVerified(code);
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setOtpError(msg);
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-field-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setOtpError('');
    if (index === 5 && value && next.every((d) => d !== '')) {
      void verifyCode(next.join(''));
    }
    if (value && index < 5) document.getElementById(`otp-field-${index + 1}`)?.focus();
  };

  const handleKeyDown = (index: number, e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-field-${index - 1}`)?.focus();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className='space-y-5'
    >
      <div className='space-y-2 text-center'>
        <KeyRound className='mx-auto h-10 w-10 text-primary' />
        <h2 className='font-display text-xl font-bold'>{title}</h2>
        <p className='text-sm text-muted-foreground'>
          {description ?? `Enter the 6-digit code sent to ${email}`}
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void verifyCode(otp.join(''));
        }}
        className='space-y-5'
      >
        <div className='flex justify-center gap-2'>
          {otp.map((digit, i) => (
            <motion.input
              key={i}
              id={`otp-field-${i}`}
              type='text'
              inputMode='numeric'
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
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
            onClick={handleResend}
            disabled={!canResend || loading}
            className={`font-medium ${
              canResend
                ? 'text-primary hover:underline'
                : 'cursor-not-allowed text-muted-foreground/70 dark:text-muted-foreground/60'
            }`}
          >
            Resend Code
          </button>
        </div>

        <Button
          type='submit'
          className='gradient-bg w-full text-primary-foreground'
          size='lg'
          disabled={loading || !canSubmit}
        >
          {loading ? (
            <motion.div
              className='h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent'
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            'Verify Code'
          )}
        </Button>
      </form>

      {onBack && (
        <button
          type='button'
          onClick={onBack}
          className='flex w-full items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft size={14} /> Back
        </button>
      )}
    </motion.div>
  );
};

export default OtpVerify;
