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
import { toast } from '@/components/ui/sonner';
import { getApiErrorMessage } from '@/common/network/http-client';
import { useSendContract, useGetContractPdf } from '@/hooks/mutations/use-contracts';
import type { Contract } from '@/lib/api-client';

interface ContractReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  clientEmail: string;
  onSent: () => void;
}

export default function ContractReviewDialog({
  open,
  onOpenChange,
  contract,
  clientEmail,
  onSent,
}: ContractReviewDialogProps) {
  const sendContract = useSendContract();
  const getPdf = useGetContractPdf();

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

  const handleSendContract = () => {
    if (!contract) return;
    sendContract.mutate(
      { id: contract._id, clientEmail },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSent();
          toast.success('Contract sent', {
            description: 'Contract has been sent to the client for signing.',
          });
        },
        onError: (err) => {
          toast.error('Failed to send contract', { description: getApiErrorMessage(err) });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='flex max-h-[90dvh] flex-col sm:max-w-2xl'
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FileText size={18} className='text-primary' /> Contract Ready
          </DialogTitle>
          <DialogDescription>
            Review the contract before sending it to the client for signing.
          </DialogDescription>
        </DialogHeader>
        {contract && (
          <div className='flex-1 space-y-3 overflow-y-auto py-2'>
            <p className='text-sm font-medium'>{contract.title}</p>
            {contract.html ? (
              <div
                className='max-h-72 overflow-y-auto rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed'
                dangerouslySetInnerHTML={{ __html: contract.html }}
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
          </div>
        )}
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={handleSendContract}
            className='gap-2'
            disabled={sendContract.isPending || !contract}
          >
            {sendContract.isPending ? (
              <Loader2 size={14} className='animate-spin' />
            ) : (
              <Send size={14} />
            )}
            Send to Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
