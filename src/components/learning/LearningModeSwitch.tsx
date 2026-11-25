'use client';

import { useRef, type KeyboardEvent } from 'react';
import { toast } from '@/components/ui/sonner';
import { getApiErrorMessage } from '@/common/network/http-client';
import { cn } from '@/lib/utils';
import { useLearningPreferences } from '@/hooks/queries/use-learning';
import { useUpdateLearningPreferences } from '@/hooks/mutations/use-learning';
import type { LearningMode } from '@/lib/api-client';

export const LEARNING_MODES: { value: LearningMode; label: string; helper: string }[] = [
  {
    value: 'teach_me',
    label: 'Teach me',
    helper: 'Explains concepts and decisions in detail while helping.',
  },
  {
    value: 'guide_me',
    label: 'Guide me',
    helper: 'Explains the important decisions along the way.',
  },
  {
    value: 'do_it_for_me',
    label: 'Do it for me',
    helper: 'Gets it done, with short notes on what matters.',
  },
];

const DEFAULT_MODE: LearningMode = 'guide_me';

interface LearningModeSwitchProps {
  className?: string;
  /** Shows the selected mode's helper text under the switch. */
  showHelper?: boolean;
}

const LearningModeSwitch = ({ className, showHelper = false }: LearningModeSwitchProps) => {
  const { data } = useLearningPreferences();
  const update = useUpdateLearningPreferences();
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const current = data?.mode ?? DEFAULT_MODE;
  const selected = LEARNING_MODES.find((m) => m.value === current) ?? LEARNING_MODES[1];

  const select = (mode: LearningMode) => {
    if (mode === current) return;
    update.mutate(
      { mode },
      {
        onError: (err) =>
          toast.error('Couldn’t change how the AI explains things', {
            description: getApiErrorMessage(err),
          }),
      }
    );
  };

  // Radio-group keyboard pattern: arrows move and select.
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + LEARNING_MODES.length) % LEARNING_MODES.length;
    buttonsRef.current[next]?.focus();
    select(LEARNING_MODES[next].value);
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <div
        role='radiogroup'
        aria-label='How the AI explains things'
        className='inline-flex rounded-full border border-border bg-muted/60 p-0.5'
      >
        {LEARNING_MODES.map((mode, i) => {
          const isActive = mode.value === current;
          return (
            <button
              key={mode.value}
              ref={(el) => {
                buttonsRef.current[i] = el;
              }}
              type='button'
              role='radio'
              aria-checked={isActive}
              tabIndex={isActive ? 0 : -1}
              title={mode.helper}
              onClick={() => select(mode.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
      {showHelper && <p className='text-xs text-muted-foreground'>{selected.helper}</p>}
    </div>
  );
};

export default LearningModeSwitch;
