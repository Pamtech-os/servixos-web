import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleSlash,
  Clock,
  FileText,
  GraduationCap,
  Loader2,
  Receipt,
  Sparkles,
  X,
} from 'lucide-react';
import ReviewSuggestionDialog, {
  GRADIENT_BUTTON_CLASS,
  SuggestionCategoryPill,
} from '@/components/ReviewSuggestionDialog';
import ContractReviewDialog from '@/components/jobs/ContractReviewDialog';
import DismissSuggestionDialog from '@/components/DismissSuggestionDialog';
import SuggestionEducationSection from '@/components/learning/SuggestionEducationSection';
import { Skeleton } from '@/components/ui/skeleton';
import { useUiActions, useUiState } from '@/common/state/ui-context';
import { toast } from '@/components/ui/sonner';
import { getApiErrorMessage, HttpError } from '@/common/network/http-client';
import { useAiSuggestions, useTrackedSuggestions } from '@/hooks/queries/use-ai-suggestions';
import { useApplySuggestion, useDismissSuggestion } from '@/hooks/mutations/use-ai-suggestions';
import { useSendJobContract } from '@/hooks/mutations/use-contracts';
import { useGetInvoicePdf } from '@/hooks/mutations/use-invoices';
import { useSuggestionExecution } from '@/hooks/use-suggestion-execution';
import { openJob } from '@/lib/open-job';
import type {
  DismissSuggestionInput,
  OutcomeStatus,
  Suggestion,
  SuggestionStatus,
  TrackedSuggestion,
} from '@/lib/api-client';

const HINT_STORAGE_KEY = 'ai_suggestions_hint_seen';

const executedTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const OPEN_STATUSES = new Set<SuggestionStatus>(['pending_review', 'executing', 'failed']);

const OWNER_ONLY_MESSAGE = 'Ask the business owner to do this.';

interface ContractReviewTarget {
  contractId: string;
  /** The "Review and send" card whose apply sends it; null falls back to the job's send route. */
  suggestionId: string | null;
  jobId: string | null;
}

interface ApplyOptions {
  successMessage?: string;
  hasDraft: boolean;
  close: () => void;
}

const REFERENCE_LINK_CLASS =
  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50';

const OUTCOME_BADGES: Record<Exclude<OutcomeStatus, 'pending'>, { label: string; className: string }> = {
  achieved: { label: 'Achieved', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  partial: { label: 'Partly achieved', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  not_achieved: { label: 'Not achieved', className: 'bg-muted text-muted-foreground' },
  not_applicable: { label: 'No longer applies', className: 'bg-muted text-muted-foreground' },
};

const TrackedSuggestionCard = ({ entry }: { entry: TrackedSuggestion }) => {
  // Older responses carry no outcomeStatus; fall back to whether an outcome exists.
  const outcomeStatus = entry.outcomeStatus ?? (entry.outcome === null ? 'pending' : 'achieved');
  const isPending = outcomeStatus === 'pending';
  const badge = isPending ? null : OUTCOME_BADGES[outcomeStatus];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20 }}
      className='space-y-3 rounded-2xl border border-border bg-background p-4'
    >
      <div className='flex items-center justify-between gap-2'>
        <SuggestionCategoryPill category={entry.category} />
        {isPending ? (
          <span className='inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400'>
            <Clock size={12} />
            Pending
          </span>
        ) : (
          badge && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badge.className}`}
            >
              {outcomeStatus === 'achieved' ? <CircleCheck size={12} /> : <CircleSlash size={12} />}
              {badge.label}
            </span>
          )
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
  const router = useRouter();
  const { isAiSuggestionsOpen: isOpen, reviewSuggestionId } = useUiState();
  const { setAiSuggestionsOpen, setReviewSuggestionId, openLearn } = useUiActions();
  const { data, isLoading, isError } = useAiSuggestions();
  const { data: trackedData } = useTrackedSuggestions(isOpen);
  const applySuggestion = useApplySuggestion();
  const dismissSuggestion = useDismissSuggestion();
  const sendJobContract = useSendJobContract();
  const getInvoicePdf = useGetInvoicePdf();
  const [reviewing, setReviewing] = useState<Suggestion | null>(null);
  const [contractReview, setContractReview] = useState<ContractReviewTarget | null>(null);
  const [dismissing, setDismissing] = useState<Suggestion | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  // Per-card open state once the user toggles; otherwise the server's defaultExpanded wins.
  // Lives here (not in the card) so it survives the panel closing and list refetches.
  const [educationToggles, setEducationToggles] = useState<Record<string, boolean>>({});

  const allSuggestions = useMemo(() => data?.suggestions ?? [], [data]);
  // Server order is priority order; dismissed/expired cards just disappear.
  const suggestions = allSuggestions.filter((s) => OPEN_STATUSES.has(s.status ?? 'pending_review'));
  const count = data?.count ?? suggestions.length;
  const tracked = trackedData?.tracked ?? [];
  const isMutating = applySuggestion.isPending || dismissSuggestion.isPending;

  useSuggestionExecution(allSuggestions, {
    onCompleted: (suggestion) =>
      toast.success(suggestion.review.successMessage, {
        description: 'The outcome will be tracked automatically.',
      }),
    onFailed: (suggestion, message) =>
      toast.error(suggestion.title, {
        description: message,
        action: { label: 'Retry', onClick: () => startCard({ ...suggestion, status: 'failed' }) },
      }),
    onExpired: () => toast.info('This suggestion is no longer needed.'),
  });

  /** Opens what the card's button leads to: the contract review, or the suggestion review. */
  const startCard = useCallback((suggestion: Suggestion) => {
    const { contractId, jobId } = suggestion.references ?? {};
    if (suggestion.action === 'review_contract' && contractId) {
      setContractReview({ contractId, suggestionId: suggestion.id, jobId });
      return;
    }
    setDraftError(null);
    setReviewing(suggestion);
  }, []);

  // Review requests from elsewhere (e.g. the priorities card) open the same dialog.
  useEffect(() => {
    if (!reviewSuggestionId || !data) return;
    setReviewSuggestionId(null);
    const target = data.suggestions.find((s) => s.id === reviewSuggestionId);
    if (target && OPEN_STATUSES.has(target.status ?? 'pending_review')) {
      if (target.status === 'executing') toast.info('This is being sent now.');
      else startCard(target);
    } else {
      toast.info('This suggestion is no longer available.');
    }
  }, [reviewSuggestionId, data, setReviewSuggestionId, startCard]);

  useEffect(() => {
    if (localStorage.getItem(HINT_STORAGE_KEY)) return;
    const show = setTimeout(() => setShowHint(true), 1500);
    return () => clearTimeout(show);
  }, []);

  const dismissHint = () => {
    setShowHint(false);
    localStorage.setItem(HINT_STORAGE_KEY, 'true');
  };

  const handleDismiss = (suggestion: Suggestion, input: DismissSuggestionInput) => {
    dismissSuggestion.mutate({ id: suggestion.id, input }, {
      onSuccess: () => {
        setDismissing(null);
        toast.info(input.reason === 'not_now' ? 'We’ll remind you in a few days.' : 'Suggestion dismissed.');
      },
      onError: (err) => {
        if (err instanceof HttpError && err.status === 404) {
          setDismissing(null);
          toast.info('This suggestion is no longer available.');
          return;
        }
        toast.error('Failed to dismiss suggestion', { description: getApiErrorMessage(err) });
      },
    });
  };

  const viewContract = (contractId: string, jobId: string | null) => {
    // Sending from here should still go through the job's "Review and send" card when it exists.
    const reviewCard = allSuggestions.find(
      (s) => s.action === 'review_contract' && s.references?.contractId === contractId
    );
    setContractReview({ contractId, suggestionId: reviewCard?.id ?? null, jobId });
  };

  const viewInvoice = (invoiceId: string) => {
    getInvoicePdf.mutate(invoiceId, {
      onSuccess: ({ pdfUrl }) => window.open(pdfUrl, '_blank', 'noreferrer'),
      onError: (err) =>
        toast.error('Couldn’t open the invoice', { description: getApiErrorMessage(err) }),
    });
  };

  const applyCard = (
    id: string,
    draftValue: string | undefined,
    { successMessage, hasDraft, close }: ApplyOptions
  ) => {
    setDraftError(null);
    applySuggestion.mutate(
      { id, draftValue },
      {
        onSuccess: (result) => {
          close();
          if (result.next?.type === 'review_contract') {
            toast.success(successMessage ?? 'Contract drafted', {
              description: 'Review it, then send it to the client for signing.',
            });
            setContractReview({
              contractId: result.next.contractId,
              suggestionId: result.next.suggestionId,
              jobId: result.next.jobId,
            });
            return;
          }
          // Emails report success only once the mail provider confirms (see the watcher).
          if (result.status === 'completed') {
            toast.success(successMessage ?? 'Done', {
              description: 'The outcome will be tracked automatically.',
            });
          }
        },
        onError: (err) => {
          if (err instanceof HttpError && err.status === 404) {
            close();
            toast.info('This step is already done or no longer needed.');
            return;
          }
          if (err instanceof HttpError && err.status === 403) {
            close();
            toast.error('You don’t have permission to do this', { description: OWNER_ONLY_MESSAGE });
            return;
          }
          if (err instanceof HttpError && err.status >= 500) {
            close();
            toast.error('That didn’t go through', { description: getApiErrorMessage(err) });
            return;
          }
          // Validation errors on the draft are shown inline; the dialog keeps the user's edits.
          if (err instanceof HttpError && err.status === 400 && hasDraft) {
            setDraftError(getApiErrorMessage(err));
            return;
          }
          toast.error('Failed to execute suggestion', { description: getApiErrorMessage(err) });
        },
      }
    );
  };

  const handleExecute = (suggestion: Suggestion, draftValue: string | undefined) =>
    applyCard(suggestion.id, draftValue, {
      successMessage: suggestion.review.successMessage,
      hasDraft: !!suggestion.review.draft,
      close: () => setReviewing(null),
    });

  const handleSendContract = () => {
    if (!contractReview) return;
    const { suggestionId, jobId } = contractReview;
    const close = () => setContractReview(null);

    if (suggestionId) {
      // Returns `executing`; the card shows "Sending…" and the watcher reports the result.
      applyCard(suggestionId, undefined, { hasDraft: false, close });
      return;
    }
    if (!jobId) return;
    // No "Review and send" card could be created, so send through the job instead.
    sendJobContract.mutate(jobId, {
      onSuccess: () => {
        close();
        toast.success('Contract on its way', {
          description: 'It’s marked sent once the email is delivered.',
        });
      },
      onError: (err) =>
        toast.error('Failed to send contract', { description: getApiErrorMessage(err) }),
    });
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
                  {suggestions.map((suggestion) => {
                    const isSending = suggestion.status === 'executing';
                    const isFailed = suggestion.status === 'failed';
                    const { jobId, contractId, invoiceId } = suggestion.references ?? {};
                    const primaryLabel = isSending
                      ? 'Sending…'
                      : isFailed
                        ? 'Retry'
                        : suggestion.category === 'job_workflow'
                          ? suggestion.review.executeLabel
                          : 'Help me do this';
                    return (
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
                        <div className='flex flex-wrap items-center gap-1.5'>
                          <SuggestionCategoryPill category={suggestion.category} />
                          {suggestion.priority === 'high' && (
                            <span className='inline-flex rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400'>
                              High priority
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setDismissing(suggestion)}
                          disabled={isMutating || isSending}
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
                      {suggestion.education && (
                        <SuggestionEducationSection
                          education={suggestion.education}
                          expanded={
                            educationToggles[suggestion.id] ?? suggestion.education.defaultExpanded
                          }
                          onToggle={() =>
                            setEducationToggles((prev) => ({
                              ...prev,
                              [suggestion.id]: !(
                                prev[suggestion.id] ?? suggestion.education?.defaultExpanded
                              ),
                            }))
                          }
                        />
                      )}
                      {(jobId || invoiceId || (contractId && suggestion.action !== 'review_contract')) && (
                        <div className='-mx-1.5 flex flex-wrap gap-1'>
                          {jobId && (
                            <button
                              type='button'
                              onClick={() => openJob(router, jobId)}
                              className={REFERENCE_LINK_CLASS}
                            >
                              <Briefcase size={12} aria-hidden /> View job
                            </button>
                          )}
                          {contractId && suggestion.action !== 'review_contract' && (
                            <button
                              type='button'
                              onClick={() => viewContract(contractId, jobId ?? null)}
                              className={REFERENCE_LINK_CLASS}
                            >
                              <FileText size={12} aria-hidden /> View contract
                            </button>
                          )}
                          {invoiceId && (
                            <button
                              type='button'
                              onClick={() => viewInvoice(invoiceId)}
                              disabled={getInvoicePdf.isPending}
                              className={REFERENCE_LINK_CLASS}
                            >
                              <Receipt size={12} aria-hidden /> View invoice
                            </button>
                          )}
                        </div>
                      )}
                      {isFailed && suggestion.failure && (
                        <p className='flex gap-1.5 rounded-xl bg-destructive/10 px-3 py-2 text-[12px] leading-relaxed text-destructive'>
                          <AlertCircle size={14} className='mt-0.5 shrink-0' />
                          {suggestion.failure.message}
                        </p>
                      )}
                      <div className='flex gap-2'>
                        <button
                          type='button'
                          onClick={() => openLearn({ suggestionId: suggestion.id })}
                          className='flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border px-3.5 text-sm font-medium transition-colors hover:bg-muted'
                        >
                          <GraduationCap size={14} />
                          Learn more
                        </button>
                        <button
                          onClick={() => startCard(suggestion)}
                          disabled={isMutating || isSending}
                          className={`flex h-10 flex-1 items-center justify-center gap-1.5 text-sm font-medium ${GRADIENT_BUTTON_CLASS}`}
                        >
                          {isSending && <Loader2 size={14} className='animate-spin' />}
                          {primaryLabel}
                        </button>
                      </div>
                    </motion.div>
                    );
                  })}
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

      <ContractReviewDialog
        open={!!contractReview}
        onOpenChange={(open) => !open && setContractReview(null)}
        contractId={contractReview?.contractId ?? null}
        isSending={applySuggestion.isPending || sendJobContract.isPending}
        onSend={handleSendContract}
      />

      <DismissSuggestionDialog
        suggestion={dismissing}
        isDismissing={dismissSuggestion.isPending}
        onOpenChange={(open) => !open && setDismissing(null)}
        onDismiss={handleDismiss}
      />
    </>
  );
};

export default AISuggestionsPanel;
