import { useState, useEffect, useCallback } from 'react';
import { X, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BANNER_STORAGE_KEY = 'business_created_at';
const BANNER_DISMISSED_KEY = 'business_banner_dismissed';
const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

const getOrSetCreatedAt = (): number => {
  const stored = localStorage.getItem(BANNER_STORAGE_KEY);
  if (stored) return parseInt(stored, 10);
  const now = Date.now();
  localStorage.setItem(BANNER_STORAGE_KEY, now.toString());
  return now;
};

const formatCountdown = (ms: number): string => {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
    .toString()
    .padStart(2, '0')}`;
};

const NewBusinessBanner = () => {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState('');

  const checkAndUpdate = useCallback(() => {
    if (localStorage.getItem(BANNER_DISMISSED_KEY) === 'true') return false;
    const createdAt = getOrSetCreatedAt();
    const remaining = FORTY_EIGHT_HOURS - (Date.now() - createdAt);
    if (remaining <= 0) {
      setVisible(false);
      return false;
    }
    setCountdown(formatCountdown(remaining));
    setVisible(true);
    return true;
  }, []);

  useEffect(() => {
    if (!checkAndUpdate()) return;
    const id = setInterval(() => {
      if (!checkAndUpdate()) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [checkAndUpdate]);

  const dismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className='relative flex flex-wrap items-start gap-2 border-b border-primary/20 bg-primary/5 px-3 py-2 text-xs sm:flex-nowrap sm:items-center sm:gap-3 sm:px-4 sm:py-2.5 sm:text-sm'>
      <Megaphone size={16} className='shrink-0 text-primary' />
      <p className='min-w-0 flex-1 text-foreground/80'>
        <span className='font-semibold text-foreground'>Welcome!</span> Start getting clients now —
        share your website on <span className='font-medium text-foreground'>Facebook</span>,{' '}
        <span className='font-medium text-foreground'>Instagram</span>,{' '}
        <span className='font-medium text-foreground'>WhatsApp</span>, and{' '}
        <span className='font-medium text-foreground'>LinkedIn</span> to attract your first
        bookings.
      </p>
      <span className='shrink-0 rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium text-primary'>
        {countdown}
      </span>
      <Button
        variant='ghost'
        size='sm'
        className='h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-foreground'
        onClick={dismiss}
      >
        <X size={14} />
      </Button>
    </div>
  );
};

export default NewBusinessBanner;
