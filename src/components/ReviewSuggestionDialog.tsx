import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  SUGGESTION_CATEGORY_LABELS,
  type ReviewableSuggestion,
} from '@/lib/ai-suggestions';

export const GRADIENT_BUTTON_CLASS =
  'rounded-full bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60';

export const CATEGORY_PILL_CLASS =
  'inline-flex rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-600 dark:text-violet-400';

interface ReviewSuggestionDialogProps {
  suggestion: ReviewableSuggestion | null;
  isExecuting?: boolean;
  onOpenChange: (open: boolean) => void;
  onExecute: (suggestion: ReviewableSuggestion, draftValue: string | undefined) => void;
}

const ReviewSuggestionDialog = ({
  suggestion,
  isExecuting = false,
  onOpenChange,
  onExecute,
}: ReviewSuggestionDialogProps) => {
  const [draftValue, setDraftValue] = useState('');

  useEffect(() => {
    setDraftValue(suggestion?.review.draft?.value ?? '');
  }, [suggestion]);

  const draft = suggestion?.review.draft;
  const isDraftEmpty = !!draft && draftValue.trim().length === 0;

  return (
    <Dialog open={!!suggestion} onOpenChange={(open) => !isExecuting && onOpenChange(open)}>
      <DialogContent className='max-h-[90vh] max-w-lg overflow-y-auto sm:rounded-2xl'>
        {suggestion && (
          <>
            <DialogHeader className='space-y-2 text-left'>
              <span className={`${CATEGORY_PILL_CLASS} w-fit`}>
                {SUGGESTION_CATEGORY_LABELS[suggestion.category]}
              </span>
              <DialogTitle className='font-display text-lg leading-snug'>
                {suggestion.title}
              </DialogTitle>
              <DialogDescription className='leading-relaxed'>
                {suggestion.description}
              </DialogDescription>
            </DialogHeader>

            <div className='rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm'>
              <div className='mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary'>
                <Sparkles size={13} />
                Recommended
              </div>
              <p>{suggestion.recommendation}</p>
            </div>

            <div className='space-y-2'>
              <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                {suggestion.review.heading}
              </p>
              <dl className='divide-y divide-border rounded-xl border border-border'>
                {suggestion.review.details.map((detail) => (
                  <div
                    key={detail.label}
                    className='flex items-center justify-between gap-4 px-3 py-2 text-sm'
                  >
                    <dt className='text-muted-foreground'>{detail.label}</dt>
                    <dd className='text-right font-medium'>{detail.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {draft && (
              <div className='space-y-2'>
                <Label htmlFor='suggestion-draft'>{draft.label}</Label>
                {draft.multiline ? (
                  <Textarea
                    id='suggestion-draft'
                    rows={6}
                    value={draftValue}
                    onChange={(e) => setDraftValue(e.target.value)}
                    disabled={isExecuting}
                  />
                ) : (
                  <Input
                    id='suggestion-draft'
                    value={draftValue}
                    onChange={(e) => setDraftValue(e.target.value)}
                    disabled={isExecuting}
                  />
                )}
                <p className='text-[11px] text-muted-foreground'>
                  Edit before executing — nothing happens until you confirm.
                </p>
              </div>
            )}

            <DialogFooter className='gap-2 sm:gap-0'>
              <Button
                variant='outline'
                className='rounded-full'
                onClick={() => onOpenChange(false)}
                disabled={isExecuting}
              >
                Cancel
              </Button>
              <Button
                className={GRADIENT_BUTTON_CLASS}
                onClick={() => onExecute(suggestion, draft ? draftValue : undefined)}
                disabled={isExecuting || isDraftEmpty}
              >
                {isExecuting && <Loader2 size={14} className='mr-1.5 animate-spin' />}
                {suggestion.review.executeLabel}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReviewSuggestionDialog;
