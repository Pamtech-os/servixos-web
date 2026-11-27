'use client';

import { format } from 'date-fns';
import { Check, Circle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useJobWorkflow } from '@/hooks/queries/use-jobs';
import { useMoney } from '@/hooks/use-money';
import { cn } from '@/lib/utils';
import type { JobWorkflowStage, JobWorkflowStepKey } from '@/lib/api-client';

const STEP_LABELS: Record<JobWorkflowStepKey, string> = {
  contract_generated: 'Contract drafted',
  contract_sent: 'Contract sent',
  contract_signed: 'Contract signed',
  invoice_sent: 'Invoice sent',
  deposit_paid: 'Deposit paid',
  job_started: 'Job started',
  client_notified: 'Client notified',
  job_completed: 'Job completed',
};

type Waiting = 'business' | 'client' | null;

const STAGES: Record<JobWorkflowStage, { label: string; waiting: Waiting }> = {
  needs_contract: { label: 'Needs a contract', waiting: 'business' },
  contract_draft: { label: 'Contract drafted, not sent', waiting: 'business' },
  awaiting_signature: { label: 'Waiting for the client to sign', waiting: 'client' },
  needs_invoice: { label: 'Signed. Invoice not sent yet', waiting: 'business' },
  awaiting_payment: { label: 'Waiting for the deposit', waiting: 'client' },
  ready_to_start: { label: 'Deposit received. Ready to start', waiting: 'business' },
  notify_start: { label: 'Started. Let the client know', waiting: 'business' },
  in_progress: { label: 'In progress', waiting: null },
  completed: { label: 'Completed', waiting: null },
  cancelled: { label: 'Cancelled', waiting: null },
  price_required: { label: 'Signed, but the job has no price to invoice', waiting: 'business' },
};

const WAITING_BADGE: Record<Exclude<Waiting, null>, { label: string; className: string }> = {
  business: {
    label: 'Your move',
    className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  client: {
    label: 'Waiting on client',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
};

/** Where one job is in the booking pipeline: its stage plus the ordered checklist. */
export default function JobWorkflowTracker({ jobId }: { jobId: string }) {
  const money = useMoney();
  const { data, isLoading, isError } = useJobWorkflow(jobId);

  if (isLoading) {
    return (
      <div className='space-y-2'>
        <Skeleton className='h-4 w-40' />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-5 w-full' />
        ))}
      </div>
    );
  }

  if (isError || !data) return null;

  const stage = STAGES[data.stage] ?? { label: data.stage, waiting: null };
  const badge = stage.waiting ? WAITING_BADGE[stage.waiting] : null;
  // The first unfinished step is the one the job is on now.
  const currentIndex = data.steps.findIndex((step) => !step.done);

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <p className='text-sm font-medium'>{stage.label}</p>
        {badge && (
          <span
            className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium', badge.className)}
          >
            {badge.label}
          </span>
        )}
      </div>

      <ol className='space-y-0'>
        {data.steps.map((step, i) => {
          const isCurrent = i === currentIndex && data.stage !== 'cancelled';
          const isLast = i === data.steps.length - 1;
          return (
            <li key={step.key} className='relative flex gap-3 pb-3 last:pb-0'>
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-[9px] top-5 h-[calc(100%-1rem)] w-px',
                    step.done ? 'bg-emerald-500/50' : 'bg-border'
                  )}
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border',
                  step.done
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : isCurrent
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground'
                )}
              >
                {step.done ? (
                  <Check size={11} strokeWidth={3} />
                ) : (
                  <Circle size={6} className={isCurrent ? 'fill-current' : ''} />
                )}
              </span>
              <div className='flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-2'>
                <span
                  className={cn(
                    'text-sm',
                    step.done ? 'text-foreground' : isCurrent ? 'font-medium' : 'text-muted-foreground'
                  )}
                >
                  {STEP_LABELS[step.key] ?? step.key}
                  <span className='sr-only'>
                    {step.done ? ' (done)' : isCurrent ? ' (current step)' : ' (not started)'}
                  </span>
                </span>
                {step.at && (
                  <span className='text-[11px] text-muted-foreground'>
                    {format(new Date(step.at), 'PP, p')}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {data.depositRequired != null && data.depositRequired > 0 && (
        <p className='text-xs text-muted-foreground'>
          Deposit: {money.format(data.paidTotal)} of {money.format(data.depositRequired)} received
          {data.price != null && <> · Job price {money.format(data.price)}</>}
        </p>
      )}
    </div>
  );
}
