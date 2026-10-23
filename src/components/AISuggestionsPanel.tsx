import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronLeft, ChevronRight, X, CircleCheck, Clock } from 'lucide-react';
import ReviewSuggestionDialog, {
  CATEGORY_PILL_CLASS,
  GRADIENT_BUTTON_CLASS,
  SUGGESTION_CATEGORY_LABELS,
} from '@/components/ReviewSuggestionDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useUiActions, useUiState } from '@/common/state/ui-context';
import { toast } from '@/components/ui/sonner';
import { getApiErrorMessage, HttpError } from '@/common/network/http-client';
import { useAiSuggestions, useTrackedSuggestions } from '@/hooks/queries/use-ai-suggestions';
import { useApplySuggestion, useDismissSuggestion } from '@/hooks/mutations/use-ai-suggestions';
import type { Suggestion, TrackedSuggestion } from '@/lib/api-client';

const HINT_STORAGE_KEY = 'ai_suggestions_hint_seen';

const executedTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const TrackedSuggestionCard = ({ entry }: { entry: TrackedSuggestion }) => {
  const isPending = entry.outcome === null;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20 }}
      className='space-y-3 rounded-2xl border border-border bg-background p-4'
    >
      <div className='flex items-center justify-between gap-2'>
        <span className={CATEGORY_PILL_CLASS}>{SUGGESTION_CATEGORY_LABELS[entry.category]}</span>
        {isPending ? (
          <span className='inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400'>
            <Clock size={12} />
            Pending
          </span>
        ) : (
          <span className='inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-500 dark:text-blue-400'>
            <CircleCheck size={12} />
            Tracked
          </span>
        )}
      </div>
      <div className='space-y-1.5'>
        <h3 className='font-display text-[15px] font-semibold leading-snug'>{entry.title}</h3>
        <p className='text-[13px] leading-relaxed text-muted-foreground'>
          {isPending
            ? 'Waiting for a result. The outcome is tracked automatically.'
            : `The outcome is tracked automatically: ${entry.outcome}`}
        </p>
        <p className='text-[11px] text-muted-foreground'>
          {entry.executeLabel} · {executedTimeFormatter.format(new Date(entry.executedAt))}
        </p>
      </div>
      <div
        className={`flex h-10 w-full cursor-default items-center justify-center gap-1.5 text-sm font-medium opacity-60 ${GRADIENT_BUTTON_CLASS} hover:opacity-60`}
      >
        {isPending ? <Clock size={16} /> : <CircleCheck size={16} />}
        {isPending ? 'Tracking result' : 'Result tracked'}
      </div>
    </motion.div>
  );
};

const SuggestionSkeleton = () => (
  <div className='space-y-3 rounded-2xl border border-border bg-background p-4'>
    <Skeleton className='h-5 w-24 rounded-full' />
    <div className='space-y-2'>
      <Skeleton className='h-4 w-4/5' />
      <Skeleton className='h-3 w-full' />
      <Skeleton className='h-3 w-2/3' />
    </div>
    <Skeleton className='h-10 w-full rounded-full' />
  </div>
);

const AISuggestionsPanel = () => {
  const { isAiSuggestionsOpen: isOpen } = useUiState();
  const { setAiSuggestionsOpen } = useUiActions();
  const { data, isLoading, isError } = useAiSuggestions();
  const { data: trackedData } = useTrackedSuggestions(isOpen);
  const applySuggestion = useApplySuggestion();
  const dismissSuggestion = useDismissSuggestion();
  const [reviewing, setReviewing] = useState<Suggestion | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const suggestions = data?.suggestions ?? [];
  const count = data?.count ?? suggestions.length;
  const tracked = trackedData?.tracked ?? [];
  const isMutating = applySuggestion.isPending || dismissSuggestion.isPending;

  useEffect(() => {
    if (localStorage.getItem(HINT_STORAGE_KEY)) return;
    const show = setTimeout(() => setShowHint(true), 1500);
    return () => clearTimeout(show);
  }, []);

  const dismissHint = () => {
    setShowHint(false);
    localStorage.setItem(HINT_STORAGE_KEY, 'true');
  };

  const openReview = (suggestion: Suggestion) => {
    setDraftError(null);
    setReviewing(suggestion);
  };

  const handleDismiss = (id: string) => {
    dismissSuggestion.mutate(id, {
      onSuccess: () => toast.info('Suggestion dismissed.'),
      onError: (err) => {
        if (err instanceof HttpError && err.status === 404) {
          toast.info('This suggestion is no longer available.');
          return;
        }
        toast.error('Failed to dismiss suggestion', { description: getApiErrorMessage(err) });
      },
    });
  };

  const handleExecute = (suggestion: Suggestion, draftValue: string | undefined) => {
    setDraftError(null);
    applySuggestion.mutate(
      { suggestion, draftValue },
      {
        onSuccess: () => {
          setReviewing(null);
          toast.success(suggestion.review.successMessage, {
            description: 'The outcome will be tracked automatically.',
          });
        },
        onError: (err) => {
          if (err instanceof HttpError && err.status === 404) {
            setReviewing(null);
            toast.info('This suggestion is no longer available.');
            return;
          }
          // Validation errors on the draft are shown inline; the dialog keeps the user's edits.
          if (err instanceof HttpError && err.status === 400 && suggestion.review.draft) {
            setDraftError(getApiErrorMessage(err));
            return;
          }
          toast.error('Failed to execute suggestion', { description: getApiErrorMessage(err) });
        },
      }
    );
  };

  return (
    <>
      {/* Toggle Button — fixed on the right edge */}
      {!isOpen && (
        <button
          onClick={() => {
            setAiSuggestionsOpen(true);
            dismissHint();
          }}
          className='fixed right-0 top-1/2 z-50 hidden -translate-y-1/2 rounded-l-xl border border-r-0 border-border bg-card p-2.5 shadow-lg transition-all hover:bg-muted md:flex'
        >
          <div className='flex flex-col items-center gap-1'>
            <Sparkles size={18} className='text-primary' />
            <ChevronLeft size={14} className='text-muted-foreground' />
          </div>
        </button>
      )}

      {/* One-time onboarding hint for new users */}
      <AnimatePresence>
        {showHint && !isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className='fixed right-14 top-1/2 z-50 hidden -translate-y-1/2 md:block'
          >
            <div className='relative w-52 rounded-xl border border-border bg-card p-3 shadow-xl'>
              {/* Arrow pointing right toward the toggle button */}
              <div className='absolute -right-[7px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-border bg-card' />
              <div className='flex items-center gap-1.5'>
                <Sparkles size={13} className='shrink-0 text-primary' />
                <p className='text-xs font-semibold'>AI Suggestions</p>
              </div>
              <p className='mt-1.5 text-[11px] leading-relaxed text-muted-foreground'>
                Click the tab on the right to view AI suggestions for your business.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type='button'
              aria-label='Close AI suggestions panel'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAiSuggestionsOpen(false)}
              className='fixed inset-0 z-30 hidden bg-background/35 backdrop-blur-[1px] md:block xl:hidden'
            />
            <motion.aside
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className='fixed right-0 top-0 z-40 hidden h-screen w-[88vw] max-w-[360px] flex-col border-l border-border bg-card shadow-2xl md:flex md:w-[360px] md:max-w-none lg:w-[380px] xl:w-[400px] 2xl:w-[420px]'
            >
              {/* Header */}
              <div className='flex items-center justify-between border-b border-border px-3 py-3 md:px-4 md:py-4'>
                <div className='flex items-center gap-2'>
                  <Sparkles size={18} className='text-primary' />
                  <span className='font-display text-sm font-bold'>AI Suggestions</span>
                  {count > 0 && (
                    <span className='flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
                      {count}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setAiSuggestionsOpen(false)}
                  className='rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors'
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Suggestions list */}
              <div className='flex-1 space-y-3 overflow-y-auto p-3 md:p-4'>
                {isLoading && (
                  <div className='space-y-3'>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <SuggestionSkeleton key={i} />
                    ))}
                  </div>
                )}

                {isError && (
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <Sparkles
                      size={32}
                      className='mb-3 text-muted-foreground dark:text-muted-foreground/70'
                    />
                    <p className='text-sm text-muted-foreground'>
                      Unable to load suggestions. Please try again.
                    </p>
                  </div>
                )}

                <AnimatePresence>
                  {suggestions.map((suggestion) => (
                    <motion.div
                      key={suggestion.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                      transition={{ type: 'spring', damping: 20 }}
                      className='space-y-3 rounded-2xl border border-border bg-background p-4'
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <span className={CATEGORY_PILL_CLASS}>
                          {SUGGESTION_CATEGORY_LABELS[suggestion.category]}
                        </span>
                        <button
                          onClick={() => handleDismiss(suggestion.id)}
                          disabled={isMutating}
                          aria-label='Dismiss suggestion'
                          className='-mr-1 -mt-1 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50'
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className='space-y-1.5'>
                        <h3 className='font-display text-[15px] font-semibold leading-snug'>
                          {suggestion.title}
                        </h3>
                        <p className='text-[13px] leading-relaxed text-muted-foreground'>
                          {suggestion.description}
                        </p>
                      </div>
                      <p className='text-[13px] leading-relaxed'>
                        <span className='text-muted-foreground'>Recommended: </span>
                        {suggestion.recommendation}
                      </p>
                      <button
                        onClick={() => openReview(suggestion)}
                        disabled={isMutating}
                        className={`h-10 w-full text-sm font-medium ${GRADIENT_BUTTON_CLASS}`}
                      >
                        Review &amp; Execute
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {tracked.length > 0 && (
                  <div className='space-y-3 pt-2'>
                    <div className='flex items-center gap-2 px-1'>
                      <CircleCheck size={14} className='text-blue-500 dark:text-blue-400' />
                      <span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                        Tracked
                      </span>
                      <span className='text-xs text-muted-foreground'>({tracked.length})</span>
                    </div>
                    {tracked.map((entry) => (
                      <TrackedSuggestionCard key={entry.id} entry={entry} />
                    ))}
                  </div>
                )}

                {!isLoading && !isError && suggestions.length === 0 && tracked.length === 0 && (
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <Sparkles
                      size={32}
                      className='mb-3 text-muted-foreground dark:text-muted-foreground/70'
                    />
                    <p className='text-sm text-muted-foreground'>All caught up!</p>
                    <p className='text-xs text-muted-foreground dark:text-muted-foreground/80'>
                      New suggestions will appear here.
                    </p>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <ReviewSuggestionDialog
        suggestion={reviewing}
        isExecuting={applySuggestion.isPending}
        draftError={draftError}
        onDraftChange={() => setDraftError(null)}
        onOpenChange={(open) => !open && setReviewing(null)}
        onExecute={handleExecute}
      />
    </>
  );
};

export default AISuggestionsPanel;
