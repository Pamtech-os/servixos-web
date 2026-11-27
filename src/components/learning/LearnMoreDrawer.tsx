'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Check,
  Eye,
  GraduationCap,
  HelpCircle,
  Loader2,
  RotateCcw,
  Send,
  Wand2,
} from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { GRADIENT_BUTTON_CLASS } from '@/components/ReviewSuggestionDialog';
import { PRINCIPLE_BOX_CLASS } from '@/components/learning/SuggestionEducationSection';
import { useUiActions, useUiState, type LearnThreadRequest } from '@/common/state/ui-context';
import { useConceptFeedback, useLearn } from '@/hooks/mutations/use-learning';
import { getApiErrorMessage, HttpError } from '@/common/network/http-client';
import { LEARN_QUESTION_MAX_LENGTH, type LearnAnswer, type LearnSubject } from '@/lib/api-client';

const RETRY_DIFFERENT_WAY = 'Can you explain it a different way?';

type Feedback = 'understood' | 'unclear';

interface Turn {
  id: number;
  question?: string;
  answer?: LearnAnswer;
  error?: { message: string; retryable: boolean };
  feedback?: Feedback;
}

function toSubject(thread: LearnThreadRequest): LearnSubject {
  return thread.suggestionId ? { suggestionId: thread.suggestionId } : { concept: thread.concept! };
}

const LearnThread = ({ thread }: { thread: LearnThreadRequest }) => {
  const { closeLearn, setReviewSuggestionId } = useUiActions();
  const learn = useLearn();
  const feedback = useConceptFeedback();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const startedRef = useRef(false);
  const nextIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPending = learn.isPending;

  const ask = (question?: string, replaceTurnId?: number) => {
    if (learn.isPending) return;
    const id = replaceTurnId ?? nextIdRef.current++;
    setTurns((prev) =>
      replaceTurnId === undefined
        ? [...prev, { id, question }]
        : prev.map((t) => (t.id === id ? { id, question } : t))
    );
    learn.mutate(
      { ...toSubject(thread), question },
      {
        onSuccess: (answer) =>
          setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, answer } : t))),
        onError: (err) => {
          const notFound = err instanceof HttpError && err.status === 404;
          const isBadRequest = err instanceof HttpError && err.status === 400;
          if (isBadRequest) console.error('Learn More request rejected', err);
          setTurns((prev) =>
            prev.map((t) =>
              t.id === id
                ? {
                    ...t,
                    error: {
                      message:
                        notFound || isBadRequest
                          ? getApiErrorMessage(err)
                          : 'Unable to explain this right now. Please try again.',
                      retryable: !notFound,
                    },
                  }
                : t
            )
          );
        },
      }
    );
  };

  // The drawer only opens from a tap, so the first explanation is requested once per thread.
  // The ref guard keeps Strict Mode's double effect from recording two explanations.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    ask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, isPending]);

  const sendFeedback = (turn: Turn, value: Feedback) => {
    if (!turn.answer || turn.feedback) return;
    setTurns((prev) => prev.map((t) => (t.id === turn.id ? { ...t, feedback: value } : t)));
    feedback.mutate(
      { concept: turn.answer.concept.key, understood: value === 'understood' },
      {
        onError: (err) => {
          setTurns((prev) => prev.map((t) => (t.id === turn.id ? { ...t, feedback: undefined } : t)));
          toast.error('Couldn’t save that', { description: getApiErrorMessage(err) });
        },
      }
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || isPending) return;
    setInput('');
    ask(question);
  };

  const helpMeDoThis = (suggestionId: string) => {
    closeLearn();
    setReviewSuggestionId(suggestionId);
  };

  const firstAnswer = turns.find((t) => t.answer)?.answer;
  let latestAnswerTurnId: number | undefined;
  for (let i = turns.length - 1; i >= 0; i--) {
    if (turns[i].answer) {
      latestAnswerTurnId = turns[i].id;
      break;
    }
  }

  return (
    <>
      <SheetHeader className='space-y-2 border-b border-border px-5 pb-4 pt-5 text-left'>
        {firstAnswer && (
          <span className='inline-flex w-fit items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400'>
            <GraduationCap size={12} aria-hidden />
            {firstAnswer.concept.name}
          </span>
        )}
        <SheetTitle className='pr-6 font-display text-lg leading-snug'>
          {firstAnswer?.title ?? 'Learn more'}
        </SheetTitle>
        <SheetDescription className='sr-only'>
          An explanation of the business concept behind this recommendation, using your own data.
        </SheetDescription>
      </SheetHeader>

      <div ref={scrollRef} aria-live='polite' className='flex-1 space-y-5 overflow-y-auto px-5 py-4'>
        {turns.map((turn) => (
          <div key={turn.id} className='space-y-3'>
            {turn.question && (
              <div className='flex justify-end'>
                <p className='max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-primary-foreground'>
                  {turn.question}
                </p>
              </div>
            )}

            {turn.error && (
              <div className='flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'>
                <AlertCircle size={16} className='mt-0.5 shrink-0' />
                <div className='flex-1 space-y-2'>
                  <p>{turn.error.message}</p>
                  {turn.error.retryable && (
                    <Button
                      size='sm'
                      variant='outline'
                      className='h-7 gap-1 rounded-full text-xs'
                      disabled={isPending}
                      onClick={() => ask(turn.question, turn.id)}
                    >
                      <RotateCcw size={12} /> Try again
                    </Button>
                  )}
                </div>
              </div>
            )}

            {turn.answer && (
              <AnswerBlock
                answer={turn.answer}
                isLatest={turn.id === latestAnswerTurnId}
                feedbackGiven={turn.feedback}
                isPending={isPending}
                onFeedback={(value) => sendFeedback(turn, value)}
                onFollowUp={(q) => ask(q)}
                onHelpMeDoThis={helpMeDoThis}
              />
            )}
          </div>
        ))}

        {isPending && (
          <div className='flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground'>
            <Loader2 size={14} className='animate-spin' />
            Thinking about your business…
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className='flex items-center gap-2 border-t border-border p-4'>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Ask a follow-up question…'
          maxLength={LEARN_QUESTION_MAX_LENGTH}
          disabled={isPending}
          aria-label='Follow-up question'
          className='flex-1'
        />
        <Button
          type='submit'
          size='icon'
          disabled={!input.trim() || isPending}
          aria-label='Send question'
          className='gradient-bg h-10 w-10 shrink-0 rounded-full text-primary-foreground'
        >
          <Send size={16} />
        </Button>
      </form>
    </>
  );
};

interface AnswerBlockProps {
  answer: LearnAnswer;
  isLatest: boolean;
  feedbackGiven?: Feedback;
  isPending: boolean;
  onFeedback: (value: Feedback) => void;
  onFollowUp: (question: string) => void;
  onHelpMeDoThis: (suggestionId: string) => void;
}

const AnswerBlock = ({
  answer,
  isLatest,
  feedbackGiven,
  isPending,
  onFeedback,
  onFollowUp,
  onHelpMeDoThis,
}: AnswerBlockProps) => (
  <div className='space-y-3'>
    <p className='whitespace-pre-line text-sm leading-relaxed'>{answer.answer}</p>

    <div className={PRINCIPLE_BOX_CLASS}>
      <p className='mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>
        Established principle
      </p>
      <p>{answer.principle}</p>
    </div>

    <div className='rounded-xl border border-border bg-background px-3 py-2 text-[12px] leading-relaxed'>
      <p className='mb-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>
        <Eye size={11} aria-hidden /> Watch for this yourself
      </p>
      <p>{answer.watchFor}</p>
    </div>

    <div className='flex flex-wrap items-center gap-2'>
      {feedbackGiven === 'understood' ? (
        <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
          <Check size={12} /> Thanks
        </span>
      ) : feedbackGiven === 'unclear' ? (
        <Button
          size='sm'
          variant='outline'
          className='h-7 gap-1 rounded-full text-xs'
          disabled={isPending}
          onClick={() => onFollowUp(RETRY_DIFFERENT_WAY)}
        >
          <HelpCircle size={12} /> Explain it a different way
        </Button>
      ) : (
        <>
          <Button
            size='sm'
            variant='outline'
            className='h-7 gap-1 rounded-full text-xs'
            onClick={() => onFeedback('understood')}
          >
            <Check size={12} /> Got it
          </Button>
          <Button
            size='sm'
            variant='outline'
            className='h-7 gap-1 rounded-full text-xs'
            onClick={() => onFeedback('unclear')}
          >
            <HelpCircle size={12} /> Still unclear
          </Button>
        </>
      )}
    </div>

    {isLatest && answer.followUps.length > 0 && (
      <div className='flex flex-wrap gap-1.5'>
        {answer.followUps.map((q) => (
          <button
            key={q}
            type='button'
            disabled={isPending}
            onClick={() => onFollowUp(q)}
            className='rounded-full border border-border bg-muted/50 px-3 py-1 text-left text-xs transition-colors hover:bg-muted disabled:opacity-50'
          >
            {q}
          </button>
        ))}
      </div>
    )}

    {isLatest && answer.suggestion?.canExecute && (
      <button
        type='button'
        onClick={() => onHelpMeDoThis(answer.suggestion!.id)}
        className={`flex h-10 w-full items-center justify-center gap-1.5 text-sm font-medium ${GRADIENT_BUTTON_CLASS}`}
      >
        <Wand2 size={14} />
        Help me do this: {answer.suggestion.executeLabel}
      </button>
    )}
  </div>
);

const LearnMoreDrawer = () => {
  const { learnThread } = useUiState();
  const { closeLearn } = useUiActions();

  return (
    <Sheet open={!!learnThread} onOpenChange={(open) => !open && closeLearn()}>
      <SheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-md'>
        {learnThread && <LearnThread key={learnThread.id} thread={learnThread} />}
      </SheetContent>
    </Sheet>
  );
};

export default LearnMoreDrawer;
