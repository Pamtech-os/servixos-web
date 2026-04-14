import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronLeft, ChevronRight, X, Target, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmModal from '@/components/ConfirmModal';
import { useUiActions, useUiState } from '@/common/state/ui-context';
import { toast } from 'sonner';

const HINT_STORAGE_KEY = 'ai_suggestions_hint_seen';

interface Suggestion {
  id: string;
  text: string;
  tag: string;
  tagColor: string;
  icon: typeof Zap;
}

const initialSuggestions: Suggestion[] = [
  {
    id: 's1',
    text: 'Schedule follow-ups with 3 idle clients to boost retention',
    tag: 'Quick Win',
    tagColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    icon: Target,
  },
  {
    id: 's2',
    text: "Review this week's completed jobs and update statuses",
    tag: 'Suggested',
    tagColor: 'bg-muted text-muted-foreground border-border',
    icon: Sparkles,
  },
  {
    id: 's3',
    text: 'Set revenue targets for next month based on current trends',
    tag: 'High Impact',
    tagColor: 'bg-primary/10 text-primary border-primary/30',
    icon: TrendingUp,
  },
  {
    id: 's4',
    text: 'Send payment reminders for 4 unpaid invoices totaling $11,600',
    tag: 'Quick Win',
    tagColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    icon: Zap,
  },
  {
    id: 's5',
    text: 'Optimize service pricing — a 10% increase could add $1,240/month',
    tag: 'High Impact',
    tagColor: 'bg-primary/10 text-primary border-primary/30',
    icon: TrendingUp,
  },
];

const AISuggestionsPanel = () => {
  const { isAiSuggestionsOpen: isOpen } = useUiState();
  const { setAiSuggestionsOpen } = useUiActions();
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);
  const [confirmAction, setConfirmAction] = useState<{ id: string } | null>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(HINT_STORAGE_KEY)) return;
    const show = setTimeout(() => setShowHint(true), 1500);
    return () => clearTimeout(show);
  }, []);

  const dismissHint = () => {
    setShowHint(false);
    localStorage.setItem(HINT_STORAGE_KEY, 'true');
  };

  const handleDismiss = (id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    toast.info('Suggestion dismissed.');
  };

  const handleApply = () => {
    if (!confirmAction) return;
    setSuggestions((prev) => prev.filter((s) => s.id !== confirmAction.id));
    toast.success('Suggestion applied successfully!');
    setConfirmAction(null);
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
                  {suggestions.length > 0 && (
                    <span className='flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
                      {suggestions.length}
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
                <AnimatePresence>
                  {suggestions.map((suggestion) => (
                    <motion.div
                      key={suggestion.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                      transition={{ type: 'spring', damping: 20 }}
                      className='space-y-3 rounded-xl border border-border bg-background p-3 md:p-4'
                    >
                      <div className='flex items-start gap-3'>
                        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                          <suggestion.icon size={16} className='text-primary' />
                        </div>
                        <p className='text-sm leading-relaxed'>{suggestion.text}</p>
                      </div>
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${suggestion.tagColor}`}
                        >
                          {suggestion.tag}
                        </span>
                        <div className='flex items-center gap-1.5'>
                          <button
                            onClick={() => handleDismiss(suggestion.id)}
                            className='rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors'
                          >
                            <X size={14} />
                          </button>
                          <Button
                            size='sm'
                            className='h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 text-primary-foreground text-xs px-3'
                            onClick={() => setConfirmAction({ id: suggestion.id })}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {suggestions.length === 0 && (
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <Sparkles size={32} className='mb-3 text-muted-foreground/50' />
                    <p className='text-sm text-muted-foreground'>All caught up!</p>
                    <p className='text-xs text-muted-foreground/70'>
                      New suggestions will appear here.
                    </p>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <ConfirmModal
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title='Apply this suggestion?'
        description="This will automate the action based on AI recommendations. Choose 'Confirm' to apply or 'Cancel' to handle it manually."
        confirmLabel='Apply Automatically'
        cancelLabel="I'll Do It Manually"
        variant='default'
        onConfirm={handleApply}
      />
    </>
  );
};

export default AISuggestionsPanel;
