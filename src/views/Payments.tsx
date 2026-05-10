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
  Pencil,
  CalendarIcon,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
} from '@/hooks/mutations/use-payments';
import { getApiErrorMessage } from '@/common/network/http-client';
import type { Payment, PaymentMode, PaymentStatus, UpdatePaymentInput } from '@/lib/api-client';

const ITEMS_PER_PAGE = 20;

const paymentModeLabels: Record<PaymentMode, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  credit_card: 'Credit Card',
  cheque: 'Cheque',
  mobile_money: 'Mobile Money',
};

const statusColor = (s: PaymentStatus) => {
  switch (s) {
    case 'completed':
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
    case 'partial':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
  }
};

const Payments = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);

  const query = {
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit: ITEMS_PER_PAGE,
  };

  const { data, isLoading } = usePayments(query);
  const { data: clientsData } = useClients({ limit: 50 });
  const { data: invoicesData } = useInvoices({ limit: 50, status: 'pending' });

  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
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
  const [formAmount, setFormAmount] = useState('');
  const [formStatus, setFormStatus] = useState<PaymentStatus>('completed');
  const [formNotes, setFormNotes] = useState('');

  // Edit form state
  const [editFormMode, setEditFormMode] = useState<PaymentMode>('bank_transfer');
  const [editFormAmount, setEditFormAmount] = useState('');
  const [editFormStatus, setEditFormStatus] = useState<PaymentStatus>('completed');
  const [editFormDate, setEditFormDate] = useState<Date | undefined>(undefined);
  const [editFormNotes, setEditFormNotes] = useState('');

  const resetForm = () => {
    setFormClientId('');
    setFormInvoiceId('');
    setFormDate(undefined);
    setFormMode('bank_transfer');
    setFormAmount('');
    setFormStatus('completed');
    setFormNotes('');
  };

  const openEditDialog = (payment: Payment) => {
    setEditPayment(payment);
    setEditFormMode(payment.paymentMode);
    setEditFormAmount(String(payment.amount));
    setEditFormStatus(payment.status);
    setEditFormDate(new Date(payment.paymentDate));
    setEditFormNotes(payment.notes ?? '');
    setEditDialogOpen(true);
  };

  const handleRecord = () => {
    if (!formDate || !formAmount) {
      toast.error('Missing fields', { description: 'Please fill in date and amount.' });
      return;
    }
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount < 0.01) {
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
        status: formStatus,
        notes: formNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Payment recorded', {
            description: `$${amount.toLocaleString()} has been recorded.`,
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

  const handleEditSave = () => {
    if (!editPayment || !editFormAmount) return;
    const amount = parseFloat(editFormAmount);
    if (isNaN(amount) || amount < 0.01) {
      toast.error('Invalid amount', { description: 'Amount must be at least 0.01.' });
      return;
    }

    const input: UpdatePaymentInput = {
      paymentMode: editFormMode,
      amount,
      status: editFormStatus,
      paymentDate: editFormDate ? format(editFormDate, 'yyyy-MM-dd') : undefined,
      notes: editFormNotes.trim() || undefined,
    };

    updatePayment.mutate(
      { id: editPayment._id, input },
      {
        onSuccess: () => {
          toast.success('Payment updated');
          setEditDialogOpen(false);
          setEditPayment(null);
        },
        onError: (err) => {
          toast.error('Failed to update payment', { description: getApiErrorMessage(err) });
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
                        ? `$${card.value.toLocaleString()}`
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
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v as PaymentStatus | 'all');
                  setPage(1);
                }}
              >
                <SelectTrigger className='w-36'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All statuses</SelectItem>
                  <SelectItem value='completed'>Completed</SelectItem>
                  <SelectItem value='partial'>Partial</SelectItem>
                </SelectContent>
              </Select>
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
                            ${p.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant='outline' className={statusColor(p.status)}>
                              {p.status === 'completed' ? 'Completed' : 'Partial'}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='flex items-center justify-end gap-1'>
                              {p.status !== 'completed' && (
                                <>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='h-8 w-8'
                                    onClick={() => openEditDialog(p)}
                                  >
                                    <Pencil size={14} />
                                  </Button>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='h-8 w-8 text-destructive hover:text-destructive'
                                    onClick={() => setDeleteTarget(p)}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </>
                              )}
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
        description='Are you sure you want to delete this payment? This will reverse the corresponding invoice amount.'
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
                      {c.name}
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
                      {inv.invoiceNumber} — ${inv.totalAmount.toLocaleString()}
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
                <Input
                  id='pay-amount'
                  type='number'
                  min='0'
                  step='0.01'
                  placeholder='0.00'
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
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
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as PaymentStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='completed'>Completed</SelectItem>
                    <SelectItem value='partial'>Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

      {/* Edit Payment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>Update payment details.</DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label>Payment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !editFormDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {editFormDate ? format(editFormDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={editFormDate}
                    onSelect={setEditFormDate}
                    initialFocus
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Payment Mode</Label>
                <Select
                  value={editFormMode}
                  onValueChange={(v) => setEditFormMode(v as PaymentMode)}
                >
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
                <Label>Amount ($)</Label>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={editFormAmount}
                  onChange={(e) => setEditFormAmount(e.target.value)}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Status</Label>
              <Select
                value={editFormStatus}
                onValueChange={(v) => setEditFormStatus(v as PaymentStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='completed'>Completed</SelectItem>
                  <SelectItem value='partial'>Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>
                Notes <span className='text-muted-foreground'>(optional)</span>
              </Label>
              <Textarea
                value={editFormNotes}
                onChange={(e) => setEditFormNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={updatePayment.isPending}
              className='gradient-bg text-primary-foreground'
            >
              {updatePayment.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;
