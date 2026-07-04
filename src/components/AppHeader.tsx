'use client';

import { useState, useEffect, memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock,
  Coffee,
  LogOut as LogOutIcon,
  Circle,
  Users,
  Loader2,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClock } from '@/contexts/ClockContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineEmployees } from '@/hooks/queries/use-employees';

type OnlineTeamMember = {
  name: string;
  initials: string;
};

const MAX_VISIBLE_AVATARS = 5;

function toInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function toTitleCase(value: string): string {
  if (!value) return 'User';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

const OnlineTeamSection = memo(
  ({ members, isLoading }: { members: OnlineTeamMember[]; isLoading: boolean }) => {
    const visibleTeam = members.slice(0, MAX_VISIBLE_AVATARS);
    const overflowCount = Math.max(0, members.length - MAX_VISIBLE_AVATARS);

    return (
      <div className='flex items-center gap-2'>
        <div className='flex -space-x-2'>
          {visibleTeam.map((member) => (
            <Tooltip key={member.name}>
              <TooltipTrigger asChild>
                <Avatar className='h-8 w-8 cursor-pointer border-2 border-card'>
                  <AvatarFallback className='bg-muted text-[10px] font-medium'>
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side='bottom'>
                <div className='flex items-center gap-1.5'>
                  <Circle size={6} className='fill-emerald-500 text-emerald-500' />
                  {member.name}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          {overflowCount > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary'>
                  +{overflowCount}
                </button>
              </PopoverTrigger>
              <PopoverContent className='w-64 p-0' align='end'>
                <div className='border-b border-border px-3 py-2'>
                  <p className='flex items-center gap-1.5 text-xs font-semibold'>
                    <Users size={12} /> All Online ({members.length})
                  </p>
                </div>
                <div className='max-h-[240px] overflow-y-auto'>
                  <div className='space-y-1 p-2'>
                    {members.map((member) => (
                      <div
                        key={member.name}
                        className='flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50'
                      >
                        <Avatar className='h-6 w-6'>
                          <AvatarFallback className='bg-muted text-[9px] font-medium'>
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className='text-xs'>{member.name}</span>
                        <Circle size={6} className='ml-auto fill-emerald-500 text-emerald-500' />
                      </div>
                    ))}
                    {members.length === 0 && !isLoading && (
                      <p className='px-2 py-4 text-center text-xs text-muted-foreground'>
                        No one is currently clocked in.
                      </p>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    );
  }
);
OnlineTeamSection.displayName = 'OnlineTeamSection';

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
};

// TODO: replace with a real-time notifications query once the API endpoint exists.
const DUMMY_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'New booking request',
    description: 'Jane Doe booked a haircut for 3:00 PM today.',
    time: '5m ago',
    read: false,
  },
  {
    id: '2',
    title: 'Payment received',
    description: '$45.00 payment confirmed for invoice #1042.',
    time: '1h ago',
    read: false,
  },
  {
    id: '3',
    title: 'Shift reminder',
    description: 'Your shift starts in 30 minutes.',
    time: '2h ago',
    read: true,
  },
];

const NotificationBell = memo(() => {
  const notifications = DUMMY_NOTIFICATIONS;
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label='Notifications'
          className='relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-0.5 -right-0.5 h-4 min-w-4 items-center justify-center rounded-full p-0 px-1 text-[10px] leading-none'
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className='w-72 p-0' align='end'>
        <div className='border-b border-border px-3 py-2'>
          <p className='flex items-center gap-1.5 text-xs font-semibold'>
            <Bell size={12} /> Notifications
          </p>
        </div>
        <div className='max-h-[280px] overflow-y-auto'>
          <div className='space-y-1 p-2'>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className='flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50'
              >
                {!notification.read && (
                  <Circle size={6} className='mt-1.5 shrink-0 fill-primary text-primary' />
                )}
                <div className={notification.read ? 'ml-3.5' : ''}>
                  <p className='text-xs font-medium'>{notification.title}</p>
                  <p className='text-xs text-muted-foreground'>{notification.description}</p>
                  <p className='mt-0.5 text-[10px] text-muted-foreground'>{notification.time}</p>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className='px-2 py-4 text-center text-xs text-muted-foreground'>
                No notifications yet.
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
NotificationBell.displayName = 'NotificationBell';

const AppHeader = () => {
  const {
    status,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    clockedInAt,
    isActionPending,
    trackingMode,
    employeeMappingState,
  } = useClock();
  const { auth } = useAuth();
  const onlineEmployeesQuery = useOnlineEmployees();

  const user = auth.user;
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Business Owner';
  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : 'BO';
  const userRoleLabel = auth.userRole ? toTitleCase(auth.userRole) : 'User';
  const clockStatusLabel =
    status === 'clocked_in' ? 'Clocked In' : status === 'on_break' ? 'On Break' : 'Clocked Out';
  const clockSyncLabel =
    trackingMode === 'api'
      ? 'Employee linked'
      : employeeMappingState === 'loading'
      ? 'Checking employee link...'
      : 'Employee not linked';
  console.warn(clockSyncLabel);

  const onlineTeamMembers = useMemo(() => {
    const employees = Array.isArray(onlineEmployeesQuery.data) ? onlineEmployeesQuery.data : [];

    return employees.map((employee) => ({
      name: employee.fullName,
      initials: toInitials(employee.fullName),
    }));
  }, [onlineEmployeesQuery.data]);

  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (status === 'clocked_out' || !clockedInAt) {
      setElapsed('');
      return;
    }

    const tick = () => {
      const diff = Date.now() - clockedInAt.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
          .toString()
          .padStart(2, '0')}`
      );
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status, clockedInAt]);

  const controlsDisabled = isActionPending;

  return (
    <header className='sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-border bg-card/95 px-3 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3 md:px-6'>
      <div className='flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2'>
        <AnimatePresence mode='wait'>
          {status === 'clocked_out' ? (
            <motion.div
              key='clock-in'
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button
                size='sm'
                aria-label='Clock in'
                className='gap-1.5 whitespace-nowrap bg-emerald-600 px-2 text-primary-foreground hover:bg-emerald-700 sm:px-3'
                onClick={clockIn}
                disabled={controlsDisabled}
              >
                {isActionPending ? (
                  <Loader2 size={14} className='animate-spin' />
                ) : (
                  <Clock size={14} />
                )}
                <span className='hidden sm:inline'>Clock In</span>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key='clock-actions'
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className='flex items-center gap-2'
            >
              {status === 'clocked_in' ? (
                <Button
                  size='sm'
                  variant='outline'
                  aria-label='Take break'
                  className='gap-1.5 whitespace-nowrap px-2 sm:px-3'
                  onClick={startBreak}
                  disabled={controlsDisabled}
                >
                  {isActionPending ? (
                    <Loader2 size={14} className='animate-spin' />
                  ) : (
                    <Coffee size={14} />
                  )}
                  <span className='hidden sm:inline'>Take Break</span>
                </Button>
              ) : (
                <Button
                  size='sm'
                  variant='outline'
                  aria-label='End break'
                  className='gap-1.5 whitespace-nowrap border-amber-500/50 px-2 text-amber-600 sm:px-3'
                  onClick={endBreak}
                  disabled={controlsDisabled}
                >
                  {isActionPending ? (
                    <Loader2 size={14} className='animate-spin' />
                  ) : (
                    <Coffee size={14} />
                  )}
                  <span className='hidden sm:inline'>End Break</span>
                </Button>
              )}
              <Button
                size='sm'
                variant='outline'
                aria-label='Clock out'
                className='gap-1.5 whitespace-nowrap border-destructive/50 px-2 text-destructive hover:bg-destructive/10 sm:px-3'
                onClick={clockOut}
                disabled={controlsDisabled}
              >
                {isActionPending ? (
                  <Loader2 size={14} className='animate-spin' />
                ) : (
                  <LogOutIcon size={14} />
                )}
                <span className='hidden sm:inline'>Clock Out</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        {elapsed && (
          <span className='hidden rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground sm:inline-block'>
            {elapsed}
          </span>
        )}
      </div>

      <div className='hidden lg:block'>
        <OnlineTeamSection members={onlineTeamMembers} isLoading={onlineEmployeesQuery.isLoading} />
      </div>

      <div className='ml-2 flex shrink-0 items-center gap-2 sm:gap-3'>
        <NotificationBell />
        <div className='hidden text-right sm:block'>
          <p className='text-sm font-semibold'>{displayName}</p>
          <p className='text-xs text-muted-foreground'>
            {userRoleLabel} ({clockStatusLabel})
          </p>
        </div>
        <div className='gradient-bg flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-primary-foreground'>
          {initials}
        </div>
      </div>
    </header>
  );
};

export default memo(AppHeader);
