'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ClipboardCopy,
  ListChecks,
  Loader2,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { getApiErrorMessage, HttpError } from '@/common/network/http-client';
import { useAiGuidance } from '@/hooks/queries/use-ai-guidance';
import {
  useCreateGuidanceTask,
  useRegenerateGuidancePlan,
  useUpdateGuidanceStep,
} from '@/hooks/mutations/use-ai-guidance';
import type { GuidanceAction, GuidanceStep } from '@/lib/api-client';

/** Where each step's call to action leads; `send_message` opens the draft instead. */
const ACTION_LINKS: Partial<Record<GuidanceAction, { href: string; label: string }>> = {
  publish_website: { href: '/my-website', label: 'Open website' },
  view_requests: { href: '/requests', label: 'View inquiries' },
  add_client: { href: '/clients', label: 'Add contacts' },
  update_services: { href: '/my-website', label: 'Edit services' },
};

const COST_LABELS: Record<NonNullable<GuidanceStep['cost']>, string> = {
  free: 'Free',
  low: 'Low cost',
  paid: 'Paid',
};

const StepActions = ({
  step,
  onOpenMessage,
}: {
  step: GuidanceStep;
  onOpenMessage: (step: GuidanceStep) => void;
}) => {
  const updateStep = useUpdateGuidanceStep();
  const createTask = useCreateGuidanceTask();
  const link = ACTION_LINKS[step.action];
  const isPlanStep = step.source === 'plan';
  const isDone = step.status === 'done';

  const toggleDone = () =>
    updateStep.mutate(
      { stepId: step.id, status: isDone ? 'todo' : 'done' },
      {
        onSuccess: () => toast.success(isDone ? 'Step reopened' : 'Nice work, step done!'),
        onError: (err) => toast.error('Could not update the step', { description: getApiErrorMessage(err) }),
      }
    );

  const addTask = () =>
    createTask.mutate(step.id, {
      onSuccess: () =>
        toast.success('Added to your tasks', {
          description: 'Find it under Teams → Tasks.',
        }),
      onError: (err) => toast.error('Could not add the task', { description: getApiErrorMessage(err) }),
    });

  return (
    <div className='flex flex-wrap items-center gap-2'>
      {step.draftMessage && (
        <Button size='sm' className='h-8 gap-1.5' onClick={() => onOpenMessage(step)}>
          <MessageSquareText size={14} /> Draft message
        </Button>
      )}
      {link && (
        <Button asChild size='sm' variant={step.draftMessage ? 'outline' : 'default'} className='h-8 gap-1.5'>
          <Link href={link.href}>
            {link.label} <ArrowRight size={14} />
          </Link>
        </Button>
      )}
      {isPlanStep && !isDone && (
        <Button
          size='sm'
          variant='outline'
          className='h-8 gap-1.5'
          onClick={addTask}
          disabled={!!step.taskId || createTask.isPending}
        >
          <ListChecks size={14} /> {step.taskId ? 'In your tasks' : 'Add to tasks'}
        </Button>
      )}
      {isPlanStep && (
        <Button
          size='sm'
          variant='ghost'
          className='h-8 gap-1.5 text-muted-foreground'
          onClick={toggleDone}
          disabled={updateStep.isPending}
        >
          {isDone ? <RotateCcw size={14} /> : <Check size={14} />}
          {isDone ? 'Reopen' : 'Mark done'}
        </Button>
      )}
    </div>
  );
};

const StepRow = ({
  step,
  index,
  onOpenMessage,
  showHowTo,
}: {
  step: GuidanceStep;
  index: number;
  onOpenMessage: (step: GuidanceStep) => void;
  showHowTo?: boolean;
}) => {
  const isDone = step.status === 'done';
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className='flex gap-3 rounded-xl border border-border/60 bg-background/60 p-4'
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isDone ? 'bg-emerald-500/15 text-emerald-600' : 'bg-primary/10 text-primary'
        }`}
      >
        {isDone ? <Check size={14} /> : index + 1}
      </span>
      <div className='min-w-0 flex-1 space-y-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className={`text-sm font-semibold ${isDone ? 'text-muted-foreground line-through' : ''}`}>{step.title}</p>
          {step.cost && (
            <Badge variant='outline' className='h-5 px-2 text-[10px] font-medium'>
              {COST_LABELS[step.cost]}
            </Badge>
          )}
        </div>
        <p className='text-xs leading-relaxed text-muted-foreground'>
          <span className='font-medium text-foreground/80'>Why: </span>
          {step.why}
        </p>
        {showHowTo && step.howTo.length > 0 && (
          <ul className='list-disc space-y-1 pl-4 text-xs text-muted-foreground'>
            {step.howTo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        <StepActions step={step} onOpenMessage={onOpenMessage} />
      </div>
    </motion.li>
  );
};

const MessageDialog = ({ step, onClose }: { step: GuidanceStep | null; onClose: () => void }) => {
  const [text, setText] = useState('');
  const [lastStepId, setLastStepId] = useState<string | null>(null);
  // Reset the editable draft whenever a different step's message is opened
  if (step && step.id !== lastStepId) {
    setLastStepId(step.id);
    setText(step.draftMessage ?? '');
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Message copied', { description: 'Paste it into WhatsApp, SMS or email.' });
    } catch {
      toast.error('Could not copy. Select the text and copy it manually.');
    }
  };

  return (
    <Dialog open={!!step} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{step?.title}</DialogTitle>
          <DialogDescription>
            Review and personalise this message, then copy it and send it to the people you have in mind.
          </DialogDescription>
        </DialogHeader>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} className='text-sm' />
        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => void copy()} className='gap-1.5' disabled={!text.trim()}>
            <ClipboardCopy size={14} /> Copy message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * "Your next steps" on the dashboard: the business's stage, the most useful
 * actions right now, and the full AI customer acquisition plan.
 */
const AIGuidanceCard = () => {
  const { data, isLoading, isError } = useAiGuidance();
  const regenerate = useRegenerateGuidancePlan();
  const [planOpen, setPlanOpen] = useState(false);
  const [messageStep, setMessageStep] = useState<GuidanceStep | null>(null);

  if (isError) return null;
  if (isLoading || !data) return <Skeleton className='h-56 rounded-2xl' />;

  const plan = data.plan;
  const isGenerating = plan?.status === 'generating';
  const doneCount = plan?.steps.filter((s) => s.status === 'done').length ?? 0;

  const handleRegenerate = () =>
    regenerate.mutate(undefined, {
      onSuccess: () => toast.info('Rewriting your plan', { description: 'It will be ready in a minute or two.' }),
      onError: (err) => {
        if (err instanceof HttpError && err.status === 429) {
          toast.error('Plan rewrites are limited', { description: 'Please try again later.' });
        } else {
          toast.error(getApiErrorMessage(err));
        }
      },
    });

  return (
    <>
      <Card className='relative overflow-hidden border-primary/20'>
        <div
          className='pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-20 blur-3xl'
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))' }}
          aria-hidden='true'
        />
        <CardContent className='relative space-y-5 p-5 sm:p-6'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
            <div className='space-y-1.5'>
              <div className='flex items-center gap-2'>
                <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground'>
                  <Sparkles size={16} />
                </span>
                <h2 className='font-display text-lg font-bold'>Your next steps</h2>
                <Badge variant='secondary' className='hidden sm:inline-flex'>
                  {data.stageTitle}
                </Badge>
              </div>
              <p className='max-w-2xl text-sm text-muted-foreground'>{data.stageMessage}</p>
            </div>
            {plan && (plan.steps.length > 0 || isGenerating) && (
              <Button variant='outline' size='sm' className='shrink-0 gap-1.5' onClick={() => setPlanOpen(true)}>
                <ListChecks size={14} />
                {plan.steps.length > 0 ? `Full plan (${doneCount}/${plan.steps.length} done)` : 'Full plan'}
              </Button>
            )}
          </div>

          {data.nextSteps.length > 0 ? (
            <ol className='space-y-3'>
              {data.nextSteps.map((step, i) => (
                <StepRow key={step.id} step={step} index={i} onOpenMessage={setMessageStep} />
              ))}
            </ol>
          ) : (
            !isGenerating && (
              <p className='rounded-xl border border-dashed p-4 text-sm text-muted-foreground'>
                You&apos;ve worked through your plan. Rewrite it for fresh ideas based on where your business is now.
              </p>
            )
          )}

          {isGenerating && (
            <p className='flex items-center gap-2 text-xs text-muted-foreground'>
              <Loader2 size={14} className='animate-spin' />
              Your AI guide is writing a customer plan for your business. This takes a minute or two.
            </p>
          )}
          {plan?.status === 'failed' && (
            <div className='flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
              We couldn&apos;t write your customer plan just now.
              <Button size='sm' variant='outline' className='h-7 gap-1.5' onClick={handleRegenerate} disabled={regenerate.isPending}>
                <RefreshCw size={12} /> Try again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Your customer plan</DialogTitle>
            <DialogDescription>
              {plan?.summary ?? 'A step-by-step plan to win customers, written for your business.'}
            </DialogDescription>
          </DialogHeader>
          {plan && plan.steps.length > 0 ? (
            <ol className='space-y-3'>
              {plan.steps.map((step, i) => (
                <StepRow key={step.id} step={step} index={i} onOpenMessage={setMessageStep} showHowTo />
              ))}
            </ol>
          ) : (
            <Skeleton className='h-40 rounded-xl' />
          )}
          <div className='flex items-center justify-between gap-3 border-t pt-4'>
            <p className='text-[11px] text-muted-foreground'>
              Suggestions are a starting point. You decide what to do and what to charge.
            </p>
            <Button
              variant='outline'
              size='sm'
              className='shrink-0 gap-1.5'
              onClick={handleRegenerate}
              disabled={isGenerating || regenerate.isPending}
            >
              <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} /> Rewrite plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MessageDialog step={messageStep} onClose={() => setMessageStep(null)} />
    </>
  );
};

export default AIGuidanceCard;
