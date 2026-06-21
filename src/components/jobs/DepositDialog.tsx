'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PriceInput } from '@/components/ui/price-input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { getApiErrorMessage } from '@/common/network/http-client';
import { useCreatePayment } from '@/hooks/mutations/use-payments';
import type { Job, PaymentMode } from '@/lib/api-client';

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

export default function DepositDialog({ open, onOpenChange, job }: DepositDialogProps) {
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositMode, setDepositMode] = useState<PaymentMode>('bank_transfer');
  const [depositDate, setDepositDate] = useState<Date>(new Date());
  const [depositNotes, setDepositNotes] = useState('');

  const createPayment = useCreatePayment();

  const resetForm = () => {
    setDepositAmount(0);
    setDepositMode('bank_transfer');
    setDepositDate(new Date());
    setDepositNotes('');
  };

  const handleRecordDeposit = () => {
    if (!job) return;
    if (depositAmount < 0.01) {
      toast.error('Invalid amount', { description: 'Amount must be at least 0.01.' });
      return;
    }
    createPayment.mutate(
      {
        jobId: job._id,
        clientId: job.clientId,
        paymentDate: format(depositDate, 'yyyy-MM-dd'),
        paymentMode: depositMode,
        amount: depositAmount,
        notes: depositNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Deposit recorded', {
            description: `$${depositAmount.toLocaleString()} deposit recorded for "${job.title}".`,
          });
          onOpenChange(false);
          resetForm();
        },
        onError: (err) => {
          toast.error('Failed to record deposit', { description: getApiErrorMessage(err) });
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) resetForm();
      }}
    >
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Record Deposit</DialogTitle>
          <DialogDescription>
            Record a deposit payment for &quot;{job?.title}&quot;. This will count toward the 50%
            minimum required to start the job.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <div className='space-y-1.5'>
            <Label>Amount ($)</Label>
            <PriceInput value={depositAmount} onChange={setDepositAmount} placeholder='0' />
          </div>
          <div className='space-y-1.5'>
            <Label>Payment Method</Label>
            <Select value={depositMode} onValueChange={(v) => setDepositMode(v as PaymentMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='bank_transfer'>Bank Transfer</SelectItem>
                <SelectItem value='cash'>Cash</SelectItem>
                <SelectItem value='credit_card'>Credit Card</SelectItem>
                <SelectItem value='cheque'>Cheque</SelectItem>
                <SelectItem value='mobile_money'>Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1.5'>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline' className='w-full justify-start gap-2 font-normal'>
                  <CalendarIcon size={14} />
                  {format(depositDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={depositDate}
                  onSelect={(d) => d && setDepositDate(d)}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className='space-y-1.5'>
            <Label>Notes</Label>
            <Textarea
              placeholder='Optional notes'
              value={depositNotes}
              onChange={(e) => setDepositNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRecordDeposit} disabled={createPayment.isPending}>
            {createPayment.isPending && <Loader2 size={14} className='mr-2 animate-spin' />}
            Record Deposit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
