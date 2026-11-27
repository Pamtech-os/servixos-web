'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  DollarSign,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  CalendarIcon,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PriceInput } from '@/components/ui/price-input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import PaginationControls from '@/components/ui/pagination-controls';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from '@/components/ui/sonner';
import { usePayments } from '@/hooks/queries/use-payments';
import { useClients } from '@/hooks/queries/use-clients';
import { useInvoices } from '@/hooks/queries/use-invoices';
import { useCreatePayment, useDeletePayment } from '@/hooks/mutations/use-payments';
import { getApiErrorMessage } from '@/common/network/http-client';
import type { Payment, PaymentMode } from '@/lib/api-client';
import { useMoney } from '@/hooks/use-money';

const ITEMS_PER_PAGE = 20;

const paymentModeLabels: Record<PaymentMode, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  credit_card: 'Credit Card',
  cheque: 'Cheque',
  mobile_money: 'Mobile Money',
};

const Payments = () => {
  const money = useMoney();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);

  const query = {
    search: search || undefined,
    page,
    limit: ITEMS_PER_PAGE,
  };

  const { data, isLoading } = usePayments(query);
  const { data: clientsData } = useClients({ limit: 50 });
  const { data: invoicesData } = useInvoices({ limit: 50, status: 'pending' });

  const createPayment = useCreatePayment();
  const deletePayment = useDeletePayment();

  const paymentList = data?.data ?? [];
  const meta = data?.meta;
  const statistics = data?.statistics;
  const clientList = clientsData?.data ?? [];
  const invoiceList = invoicesData?.data ?? [];

  // Create form state
  const [formClientId, setFormClientId] = useState('');
  const [formInvoiceId, setFormInvoiceId] = useState('');
  const [formDate, setFormDate] = useState<Date | undefined>(undefined);
  const [formMode, setFormMode] = useState<PaymentMode>('bank_transfer');
  const [formAmount, setFormAmount] = useState(0);
  const [formNotes, setFormNotes] = useState('');

  const resetForm = () => {
    setFormClientId('');
    setFormInvoiceId('');
    setFormDate(undefined);
    setFormMode('bank_transfer');
    setFormAmount(0);
    setFormNotes('');
  };

  const handleRecord = () => {
    if (!formDate || !formAmount) {
      toast.error('Missing fields', { description: 'Please fill in date and amount.' });
      return;
    }
    const amount = formAmount;
    if (amount < 0.01) {
      toast.error('Invalid amount', { description: 'Amount must be at least 0.01.' });
      return;
    }

    createPayment.mutate(
      {
        clientId: formClientId || undefined,
        invoiceId: formInvoiceId || undefined,
        paymentDate: format(formDate, 'yyyy-MM-dd'),
        paymentMode: formMode,
        amount,
        notes: formNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Payment recorded', {
            description: `${money.format(amount)} has been recorded.`,
          });
          setDialogOpen(false);
          resetForm();
        },
        onError: (err) => {
          toast.error('Failed to record payment', { description: getApiErrorMessage(err) });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deletePayment.mutate(deleteTarget._id, {
      onSuccess: () => {
        toast.success('Payment deleted');
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error('Failed to delete payment', { description: getApiErrorMessage(err) });
        setDeleteTarget(null);
      },
    });
  };

  const summaryCards = [
    {
      label: 'Total Income',
      value: statistics?.totalIncome ?? 0,
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10',
      currency: true,
    },
    {
      label: 'Received',
      value: statistics?.received ?? 0,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10',
      currency: true,
    },
    {
      label: 'Pending',
      value: statistics?.pending ?? 0,
      icon: AlertTriangle,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-500/10',
      currency: true,
    },
    {
      label: 'Overdue',
      value: statistics?.overdue ?? 0,
      icon: AlertTriangle,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-500/10',
      currency: true,
    },
    {
      label: 'Outstanding',
      value: statistics?.outstanding ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10',
      currency: true,
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='font-display text-2xl font-bold md:text-3xl'>Payments</h1>
          <p className='text-sm text-muted-foreground'>Track income and outstanding payments</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          className='gradient-bg text-primary-foreground'
        >
          <Plus size={16} className='mr-1' /> Record Payment
        </Button>
      </div>

      {/* Summary cards */}
      <div className='grid gap-4 sm:grid-cols-3'>
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className='flex items-center gap-3 p-4'>
                <div className={`rounded-lg ${card.bg} p-2.5`}>
                  <card.icon size={20} className={card.color} />
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>{card.label}</p>
                  {isLoading ? (
                    <Skeleton className='mt-1 h-5 w-20' />
                  ) : (
                    <p className='text-lg font-bold'>
                      {card.currency
                        ? money.format(card.value)
                        : card.value.toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <CardTitle className='text-base'>Payment History</CardTitle>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <div className='relative w-full sm:w-56'>
                <Search
                  size={16}
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
                />
                <Input
                  placeholder='Search payments...'
                  className='pl-9'
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-3'>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : paymentList.length === 0 ? (
            <p className='py-8 text-center text-sm text-muted-foreground'>No payments found.</p>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentList.map((p) => {
                      const client = clientList.find((c) => c._id === p.clientId);
                      const invoice = p.invoiceId
                        ? invoiceList.find((inv) => inv._id === p.invoiceId?.invoiceNumber)
                        : null;
                      return (
                        <TableRow key={p._id}>
                          <TableCell className='font-medium'>{client?.name ?? '—'}</TableCell>
                          <TableCell>
                            {invoice?.invoiceNumber ??
                              (p.invoiceId ? p.invoiceId.invoiceNumber : '—')}
                          </TableCell>
                          <TableCell>{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                          <TableCell>{paymentModeLabels[p.paymentMode]}</TableCell>
                          <TableCell className='text-right font-medium'>
                            {money.format(p.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant='outline' className='text-muted-foreground'>
                              Recorded
                            </Badge>
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='flex items-center justify-end gap-1'>
                              <Button
                                variant='ghost'
                                size='icon'
                                aria-label='Delete payment'
                                className='h-8 w-8 text-destructive hover:text-destructive'
                                onClick={() => setDeleteTarget(p)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {meta && (
                <PaginationControls
                  meta={meta}
                  onPageChange={setPage}
                  className='mt-4 flex items-center justify-between'
                  controlsClassName='flex gap-1'
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title='Delete Payment'
        description='Payments can’t be edited. Delete this payment to reverse it on its invoice, then record it again with the correct details.'
        confirmLabel='Delete'
        onConfirm={handleDelete}
        variant='destructive'
      />

      {/* Record Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a new payment received from a client.</DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label>
                Client <span className='text-muted-foreground'>(optional)</span>
              </Label>
              <Select value={formClientId} onValueChange={setFormClientId}>
                <SelectTrigger>
                  <SelectValue placeholder='Select a client' />
                </SelectTrigger>
                <SelectContent>
                  {clientList.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name} — {c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>
                Invoice <span className='text-muted-foreground'>(optional)</span>
              </Label>
              <Select value={formInvoiceId} onValueChange={setFormInvoiceId}>
                <SelectTrigger>
                  <SelectValue placeholder='Link to invoice' />
                </SelectTrigger>
                <SelectContent>
                  {invoiceList.map((inv) => (
                    <SelectItem key={inv._id} value={inv._id}>
                      {inv.invoiceNumber} — {money.format(inv.totalAmount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Payment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {formDate ? format(formDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={formDate}
                      onSelect={setFormDate}
                      initialFocus
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='pay-amount'>Amount ($)</Label>
                <PriceInput
                  id='pay-amount'
                  value={formAmount}
                  onChange={setFormAmount}
                  placeholder='0.00'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Payment Mode</Label>
              <Select value={formMode} onValueChange={(v) => setFormMode(v as PaymentMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(paymentModeLabels) as [PaymentMode, string][]).map(
                    ([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>
                Notes <span className='text-muted-foreground'>(optional)</span>
              </Label>
              <Textarea
                placeholder='e.g. Paid via GTBank'
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecord}
              disabled={createPayment.isPending}
              className='gradient-bg text-primary-foreground'
            >
              {createPayment.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Payments;
