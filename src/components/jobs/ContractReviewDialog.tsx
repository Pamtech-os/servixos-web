'use client';

import { ExternalLink, FileText, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/sonner';
import { getApiErrorMessage } from '@/common/network/http-client';
import { useGetContractPdf } from '@/hooks/mutations/use-contracts';
import { useContract } from '@/hooks/queries/use-contracts';

interface ContractReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Loaded with GET /contracts/:id, which carries the rendered html and pdfUrl. */
  contractId: string | null;
  onSend: () => void;
  isSending: boolean;
  sendLabel?: string;
}

/**
 * Shows a drafted contract before it goes to the client. Sending is up to the caller: the
 * jobs page uses the job's send route, the AI panel applies its "Review and send" card.
 */
export default function ContractReviewDialog({
  open,
  onOpenChange,
  contractId,
  onSend,
  isSending,
  sendLabel = 'Send to client',
}: ContractReviewDialogProps) {
  const contractQuery = useContract(open ? (contractId ?? '') : '');
  const contract = contractQuery.data ?? null;
  const getPdf = useGetContractPdf();
  const canSend = contract?.status === 'draft';

  const handleGetPdf = () => {
    if (!contract) return;
    getPdf.mutate(contract._id, {
      onSuccess: ({ url }) => {
        window.open(url, '_blank', 'noreferrer');
      },
      onError: (err) => {
        toast.error('Failed to generate PDF', { description: getApiErrorMessage(err) });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSending && onOpenChange(next)}>
      <DialogContent
        className='flex max-h-[90dvh] flex-col sm:max-w-2xl'
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FileText size={18} className='text-primary' /> Contract ready
          </DialogTitle>
          <DialogDescription>
            Review the contract before sending it to the client for signing.
          </DialogDescription>
        </DialogHeader>

        {contractQuery.isLoading && (
          <div className='space-y-3 py-2'>
            <Skeleton className='h-4 w-1/2' />
            <Skeleton className='h-56 w-full rounded-lg' />
          </div>
        )}

        {contractQuery.isError && (
          <p className='py-6 text-center text-sm text-muted-foreground'>
            {getApiErrorMessage(contractQuery.error, 'This contract could not be loaded.')}
          </p>
        )}

        {contract && (
          <div className='flex-1 space-y-3 overflow-y-auto py-2'>
            <p className='text-sm font-medium'>{contract.title}</p>
            {contract.html ? (
              // The contract html is styled for a white page (it's what the PDF renders), so it
              // goes in a sandboxed iframe: the app's dark theme can't fade its text and its
              // styles can't leak into the app. sandbox='' also blocks any scripts in it.
              <iframe
                title={contract.title}
                sandbox=''
                srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#fff;color:#111;color-scheme:light;font:14px/1.6 system-ui,sans-serif}body{padding:20px}</style></head><body>${contract.html}</body></html>`}
                className='h-[55dvh] w-full rounded-lg border bg-white'
              />
            ) : contract.pdfUrl ? (
              <a
                href={contract.pdfUrl}
                target='_blank'
                rel='noreferrer'
                className='flex items-center gap-2 text-sm text-primary hover:underline'
              >
                <ExternalLink size={14} /> Open PDF
              </a>
            ) : (
              <Button
                variant='outline'
                size='sm'
                className='gap-2'
                onClick={handleGetPdf}
                disabled={getPdf.isPending}
              >
                {getPdf.isPending ? (
                  <Loader2 size={14} className='animate-spin' />
                ) : (
                  <ExternalLink size={14} />
                )}
                Get PDF
              </Button>
            )}
            {!canSend && (
              <p className='text-xs text-muted-foreground'>
                This contract is {contract.status}, so it can’t be sent again.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isSending}>
            Close
          </Button>
          <Button onClick={onSend} className='gap-2' disabled={isSending || !canSend}>
            {isSending ? <Loader2 size={14} className='animate-spin' /> : <Send size={14} />}
            {isSending ? 'Sending…' : sendLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
