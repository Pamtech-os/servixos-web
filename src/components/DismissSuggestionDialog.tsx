import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { DismissReason, DismissSuggestionInput, Suggestion } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const MAX_NOTE_LENGTH = 500;

const REASONS: Array<{ value: DismissReason; label: string }> = [
  { value: 'already_handled', label: 'I’ve already dealt with this' },
  { value: 'not_now', label: 'Remind me later' },
  { value: 'not_relevant', label: 'Not relevant to my business' },
  { value: 'incorrect', label: 'The information is wrong' },
  { value: 'other', label: 'Other' },
];

// Only these reasons are read by a person, so only they ask for detail.
const NOTE_REASONS = new Set<DismissReason>(['incorrect', 'other']);

interface DismissSuggestionDialogProps {
  suggestion: Suggestion | null;
  isDismissing: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: (suggestion: Suggestion, input: DismissSuggestionInput) => void;
}

const DismissSuggestionDialog = ({
  suggestion,
  isDismissing,
  onOpenChange,
  onDismiss,
}: DismissSuggestionDialogProps) => {
  const [reason, setReason] = useState<DismissReason | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    setReason(null);
    setNote('');
  }, [suggestion]);

  const showNote = reason !== null && NOTE_REASONS.has(reason);

  const submit = () => {
    if (!suggestion) return;
    const trimmed = note.trim();
    onDismiss(suggestion, {
      ...(reason && { reason }),
      ...(showNote && trimmed && { note: trimmed }),
    });
  };

  return (
    <Dialog open={!!suggestion} onOpenChange={(open) => !isDismissing && onOpenChange(open)}>
      <DialogContent className='max-w-md sm:rounded-2xl'>
        <DialogHeader className='text-left'>
          <DialogTitle className='font-display text-lg'>Dismiss this suggestion?</DialogTitle>
          <DialogDescription>
            Telling us why helps the panel suggest things that matter to you.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-2' role='radiogroup' aria-label='Reason for dismissing'>
          {REASONS.map((r) => (
            <button
              key={r.value}
              type='button'
              role='radio'
              aria-checked={reason === r.value}
              onClick={() => setReason((cur) => (cur === r.value ? null : r.value))}
              disabled={isDismissing}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                reason === r.value
                  ? 'border-primary bg-primary/10 font-medium'
                  : 'border-border hover:bg-muted'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {showNote && (
          <div className='space-y-1'>
            <Textarea
              value={note}
              maxLength={MAX_NOTE_LENGTH}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                reason === 'incorrect' ? 'What’s wrong? e.g. Paid in cash on Monday' : 'Anything we should know? (optional)'
              }
              rows={3}
              disabled={isDismissing}
            />
            <p className='text-right text-[10px] text-muted-foreground'>
              {note.length}/{MAX_NOTE_LENGTH}
            </p>
          </div>
        )}

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant='ghost' onClick={() => onOpenChange(false)} disabled={isDismissing}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isDismissing}>
            {isDismissing && <Loader2 size={14} className='mr-1.5 animate-spin' />}
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DismissSuggestionDialog;
