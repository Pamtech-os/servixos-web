import { useState, useEffect, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Coffee, LogOut as LogOutIcon, Circle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClock } from '@/contexts/ClockContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const allOnlineTeam = [
  { name: 'Alice Morgan', initials: 'AM' },
  { name: 'David Kim', initials: 'DK' },
  { name: 'Priya Patel', initials: 'PP' },
  { name: 'James Cole', initials: 'JC' },
  { name: 'Sophia Lee', initials: 'SL' },
  { name: 'Marcus Johnson', initials: 'MJ' },
  { name: 'Emily Chen', initials: 'EC' },
  { name: 'Tyler Brown', initials: 'TB' },
];

const MAX_VISIBLE_AVATARS = 5;

const OnlineTeamSection = memo(() => {
  const visibleTeam = allOnlineTeam.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = allOnlineTeam.length - MAX_VISIBLE_AVATARS;

  return (
    <div className='flex items-center gap-2'>
      <div className='hidden items-center gap-1 text-xs text-muted-foreground lg:flex'>
        <Circle size={8} className='fill-emerald-500 text-emerald-500' />
        <span>{allOnlineTeam.length} Online</span>
      </div>
      <div className='flex -space-x-2'>
        {visibleTeam.map((member) => (
          <Tooltip key={member.name}>
            <TooltipTrigger asChild>
              <Avatar className='h-8 w-8 border-2 border-card cursor-pointer'>
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
              <button className='flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer'>
                +{overflowCount}
              </button>
            </PopoverTrigger>
            <PopoverContent className='w-64 p-0' align='end'>
              <div className='px-3 py-2 border-b border-border'>
                <p className='text-xs font-semibold flex items-center gap-1.5'>
                  <Users size={12} /> All Online ({allOnlineTeam.length})
                </p>
              </div>
              <div className='max-h-[240px] overflow-y-auto'>
                <div className='p-2 space-y-1'>
                  {allOnlineTeam.map((member) => (
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
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
});
OnlineTeamSection.displayName = 'OnlineTeamSection';

const AppHeader = () => {
  const { status, clockIn, clockOut, startBreak, endBreak, clockedInAt } = useClock();
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

  return (
    <header className='sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-border bg-card/95 px-3 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3 md:px-6'>
      {/* Left: Clock Controls */}
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
              >
                <Clock size={14} />
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
                >
                  <Coffee size={14} />
                  <span className='hidden sm:inline'>Take Break</span>
                </Button>
              ) : (
                <Button
                  size='sm'
                  variant='outline'
                  aria-label='End break'
                  className='gap-1.5 whitespace-nowrap border-amber-500/50 px-2 text-amber-600 sm:px-3'
                  onClick={endBreak}
                >
                  <Coffee size={14} />
                  <span className='hidden sm:inline'>End Break</span>
                </Button>
              )}
              <Button
                size='sm'
                variant='outline'
                aria-label='Clock out'
                className='gap-1.5 whitespace-nowrap border-destructive/50 px-2 text-destructive hover:bg-destructive/10 sm:px-3'
                onClick={clockOut}
              >
                <LogOutIcon size={14} />
                <span className='hidden sm:inline'>Clock Out</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        {elapsed && (
          <span className='hidden sm:inline-block text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md'>
            {elapsed}
          </span>
        )}
      </div>

      {/* Center: Online Team */}
      <div className='hidden lg:block'>
        <OnlineTeamSection />
      </div>

      {/* Right: Business Avatar */}
      <div className='ml-2 flex shrink-0 items-center gap-2 sm:gap-3'>
        <div className='hidden sm:block text-right'>
          <p className='text-sm font-semibold'>Business Owner</p>
          <p className='text-xs text-muted-foreground'>
            {status === 'clocked_in' && 'Clocked In'}
            {status === 'on_break' && 'On Break'}
            {status === 'clocked_out' && 'Clocked Out'}
          </p>
        </div>
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-primary-foreground'>
          BO
        </div>
      </div>
    </header>
  );
};

export default memo(AppHeader);
