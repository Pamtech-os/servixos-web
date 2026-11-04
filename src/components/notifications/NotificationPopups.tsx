'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CalendarDays, PartyPopper, Sparkles, Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotificationsSocket } from '@/hooks/use-notifications-socket';
import { useMarkNotificationRead } from '@/hooks/mutations/use-notifications';
import { playNotificationSound, unlockAudio } from '@/lib/notification-sound';
import { openServiceRequest } from '@/lib/open-request';
import type { NotificationView } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const MAX_VISIBLE = 3;
const BOOKING_TIMEOUT_MS = 20_000;
const GENERIC_TIMEOUT_MS = 8_000;

const CONFETTI_COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
// Fixed spread so every burst looks the same and renders are pure.
const CONFETTI = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const distance = 70 + (i % 4) * 22;
  return {
    id: i,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance - 20,
    rotate: (i * 47) % 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    round: i % 3 === 0,
  };
});

// The booking day is a calendar date stored at UTC midnight; format it in UTC to keep the day.
const bookingDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

const ConfettiBurst = () => (
  <div className='pointer-events-none absolute left-10 top-10' aria-hidden='true'>
    {CONFETTI.map((p) => (
      <motion.span
        key={p.id}
        className={cn('absolute h-2 w-1.5', p.round && 'h-2 w-2 rounded-full')}
        style={{ background: p.color }}
        initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
        animate={{ x: p.x, y: [p.y, p.y + 60], opacity: [1, 1, 0], scale: 1, rotate: p.rotate + 360 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
    ))}
  </div>
);

interface PopupProps {
  notification: NotificationView;
  onView: (notification: NotificationView) => void;
  onClose: (id: string) => void;
}

/** Counts down to auto-close, pausing while hovered so the owner can read it. */
function useAutoClose(id: string, timeoutMs: number, onClose: (id: string) => void) {
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(timeoutMs);

  useEffect(() => {
    if (paused) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => onClose(id), remainingRef.current);
    return () => {
      clearTimeout(timer);
      remainingRef.current -= Date.now() - startedAt;
    };
  }, [paused, id, onClose]);

  return { paused, setPaused };
}

const BookingPopup = ({ notification, onView, onClose }: PopupProps) => {
  const { paused, setPaused } = useAutoClose(notification.id, BOOKING_TIMEOUT_MS, onClose);
  const { service, requestedDate } = notification.data;

  return (
    <div
      className='relative'
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <ConfettiBurst />
      {/* Spinning conic border behind the card. */}
      <div className='relative overflow-hidden rounded-2xl p-[2px] shadow-2xl shadow-primary/30'>
        <motion.div
          className='absolute inset-[-100%]'
          style={{
            background:
              'conic-gradient(from 0deg, #f43f5e, #f59e0b, #10b981, #3b82f6, #8b5cf6, #ec4899, #f43f5e)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        <div className='relative rounded-[14px] bg-card p-4'>
          <button
            type='button'
            onClick={() => onClose(notification.id)}
            aria-label='Close'
            className='absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          >
            <X size={14} />
          </button>

          <div className='flex items-start gap-3'>
            <div className='relative shrink-0'>
              {/* Pulsing rings around the icon. */}
              {[0, 0.6].map((delay) => (
                <motion.span
                  key={delay}
                  className='absolute inset-0 rounded-full bg-primary/40'
                  animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay, ease: 'easeOut' }}
                />
              ))}
              <motion.div
                className='relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground'
                animate={{ rotate: [0, -18, 16, -12, 8, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.6 }}
              >
                <PartyPopper size={20} />
              </motion.div>
            </div>

            <div className='min-w-0 flex-1 pr-5'>
              <p className='flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-primary'>
                <Sparkles size={12} /> From your website
              </p>
              <p className='font-display text-base font-bold leading-snug'>{notification.title}</p>
              <p className='mt-0.5 text-sm text-muted-foreground'>{notification.body}</p>
              {(service || requestedDate) && (
                <div className='mt-2 flex flex-wrap gap-1.5'>
                  {service && (
                    <span className='rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary'>
                      {service}
                    </span>
                  )}
                  {requestedDate && (
                    <span className='inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium'>
                      <CalendarDays size={11} />
                      {bookingDateFormatter.format(new Date(requestedDate))}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className='mt-3 flex gap-2'>
            {notification.data.requestId && (
              <Button
                size='sm'
                className='flex-1 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90'
                onClick={() => onView(notification)}
              >
                View request
              </Button>
            )}
            <Button size='sm' variant='outline' onClick={() => onClose(notification.id)}>
              Later
            </Button>
          </div>

          {/* Time left before it closes on its own. */}
          <div
            className='absolute bottom-0 left-0 h-0.5 w-full origin-left animate-shrink-x bg-gradient-to-r from-primary to-secondary'
            style={{
              animationDuration: `${BOOKING_TIMEOUT_MS}ms`,
              animationPlayState: paused ? 'paused' : 'running',
            }}
          />
        </div>
      </div>
    </div>
  );
};

const GenericPopup = ({ notification, onView, onClose }: PopupProps) => {
  const { setPaused } = useAutoClose(notification.id, GENERIC_TIMEOUT_MS, onClose);

  return (
    <div
      className='relative flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-xl'
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
        <Bell size={16} />
      </span>
      <div className='min-w-0 flex-1 pr-5'>
        <p className='text-sm font-semibold'>{notification.title}</p>
        <p className='text-sm text-muted-foreground'>{notification.body}</p>
        {notification.data?.requestId && (
          <button
            type='button'
            onClick={() => onView(notification)}
            className='mt-1 text-xs font-medium text-primary hover:underline'
          >
            View request
          </button>
        )}
      </div>
      <button
        type='button'
        onClick={() => onClose(notification.id)}
        aria-label='Close'
        className='absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground'
      >
        <X size={14} />
      </button>
    </div>
  );
};

/**
 * Live notification pop-ups. Listens on the /chat socket, plays the sound for the type the
 * moment a pop-up appears, and opens the related request from "View request".
 */
const NotificationPopups = () => {
  const router = useRouter();
  const markRead = useMarkNotificationRead();
  const [popups, setPopups] = useState<NotificationView[]>([]);

  // Pop-ups whose sound the browser blocked; they offer "Tap to hear".
  const [silenced, setSilenced] = useState<ReadonlySet<string>>(new Set());

  // Audio is locked until a click or key press, and browsers can suspend it again later
  // (Safari does when the tab is backgrounded), so every interaction re-checks it. Cheap
  // when already running.
  useEffect(() => {
    const unlock = () => void unlockAudio();
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
    return () => {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
  }, []);

  useNotificationsSocket((notification) => {
    setPopups((prev) => [notification, ...prev].slice(0, MAX_VISIBLE));
    // The pop-up shows whatever happens to the sound.
    void playNotificationSound(notification.type).then((result) => {
      if (result === 'blocked') setSilenced((prev) => new Set(prev).add(notification.id));
    });
  });

  const unsilence = (id: string) =>
    setSilenced((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  /** Runs inside the click, so the browser lets the sound through. */
  const playNow = (notification: NotificationView) => {
    void unlockAudio().then(() => playNotificationSound(notification.type));
    unsilence(notification.id);
  };

  const close = useCallback((id: string) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
    setSilenced((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const view = (notification: NotificationView) => {
    close(notification.id);
    markRead.mutate(notification.id);
    if (notification.data?.requestId) openServiceRequest(router, notification.data.requestId);
  };

  return (
    <div
      className='pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6 sm:top-20 sm:w-[380px]'
      aria-live='assertive'
    >
      <AnimatePresence initial={false}>
        {popups.map((notification) => (
          <motion.div
            key={notification.id}
            layout
            className='pointer-events-auto w-full'
            initial={{ opacity: 0, x: 120, scale: 0.6, rotate: 6 }}
            animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, x: 120, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          >
            {notification.type === 'new_booking' ? (
              <BookingPopup notification={notification} onView={view} onClose={close} />
            ) : (
              <GenericPopup notification={notification} onView={view} onClose={close} />
            )}
            {silenced.has(notification.id) && (
              <button
                type='button'
                onClick={() => playNow(notification)}
                className='mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 backdrop-blur transition-colors hover:bg-amber-500/20 dark:text-amber-300'
              >
                <Volume2 size={13} /> Your browser blocked the sound. Tap to hear it
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationPopups;
