'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Pencil,
  CalendarIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { mockPayments, mockInvoices, type Payment } from '@/lib/mock-data';
import { toast } from '@/components/ui/sonner';
import { getPaginationRange, paginateArray } from '@/lib/pagination';

const ITEMS_PER_PAGE = 6;

const paymentModeLabels: Record<Payment['paymentMode'], string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  credit_card: 'Credit Card',
  cheque: 'Cheque',
  mobile_money: 'Mobile Money',
};

const statusColor = (s: Payment['status']) => {
  switch (s) {
    case 'completed':
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
    case 'partial':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
  }
};

const Payments = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Form state
  const [formBusinessName, setFormBusinessName] = useState('');
  const [formDate, setFormDate] = useState<Date | undefined>(undefined);
  const [formMode, setFormMode] = useState<Payment['paymentMode']>('bank_transfer');
  const [formAmount, setFormAmount] = useState('');
  const [formStatus, setFormStatus] = useState<Payment['status']>('completed');

  // Edit form state
  const [editFormMode, setEditFormMode] = useState<Payment['paymentMode']>('bank_transfer');
  const [editFormAmount, setEditFormAmount] = useState('');
  const [editFormStatus, setEditFormStatus] = useState<Payment['status']>('completed');
  const [editFormDate, setEditFormDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPayments(mockPayments);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Summary calculations
  const summary = useMemo(() => {
    const received = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    const pending = mockInvoices
      .filter((inv) => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.price, 0);
    const overdue = mockInvoices
      .filter((inv) => inv.status === 'partial')
      .reduce((sum, inv) => sum + inv.price, 0);
    const totalIncome = received;
    const totalOutstanding = pending + overdue;
    return { received, pending, overdue, totalIncome, totalOutstanding };
  }, [payments]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter(
      (p) =>
        p.businessName.toLowerCase().includes(q) ||
        paymentModeLabels[p.paymentMode].toLowerCase().includes(q)
    );
  }, [payments, search]);

  const pagination = useMemo(
    () => paginateArray(filtered, page, ITEMS_PER_PAGE),
    [filtered, page]
  );
  const { data: paginated, meta: paginationMeta } = pagination;
  const paginationRange = useMemo(
    () => getPaginationRange(paginationMeta),
    [paginationMeta]
  );

  useEffect(() => {
    if (page !== paginationMeta.page) {
      setPage(paginationMeta.page);
    }
  }, [page, paginationMeta.page]);

  const resetForm = () => {
    setFormBusinessName('');
    setFormDate(undefined);
    setFormMode('bank_transfer');
    setFormAmount('');
    setFormStatus('completed');
  };

  const openEditDialog = (payment: Payment) => {
    setEditPayment(payment);
    setEditFormMode(payment.paymentMode);
    setEditFormAmount(String(payment.amount));
    setEditFormStatus(payment.status);
    setEditFormDate(new Date(payment.paymentDate));
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!editPayment || !editFormAmount) return;
    setPayments((prev) =>
      prev.map((p) =>
        p.id === editPayment.id
          ? {
              ...p,
              paymentMode: editFormMode,
              amount: parseFloat(editFormAmount),
              status: editFormStatus,
              paymentDate: editFormDate ? format(editFormDate, 'yyyy-MM-dd') : p.paymentDate,
            }
          : p
      )
    );
    setEditDialogOpen(false);
    setEditPayment(null);
    toast.success('Payment updated', {
      description: `Payment for ${editPayment.businessName} has been updated.`,
    });
  };

  const handleRecord = () => {
    if (!formBusinessName.trim() || !formDate || !formAmount) {
      toast.error('Missing fields', { description: 'Please fill in all required fields.' });
      return;
    }
    const newPayment: Payment = {
      id: `p-${Date.now()}`,
      businessName: formBusinessName.trim(),
      paymentDate: format(formDate, 'yyyy-MM-dd'),
      paymentMode: formMode,
      amount: parseFloat(formAmount),
      status: formStatus,
    };
    setPayments((prev) => [newPayment, ...prev]);
    setDialogOpen(false);
    resetForm();
    toast.success('Payment recorded', {
      description: `$${parseFloat(formAmount).toLocaleString()} from ${formBusinessName}`,
    });
  };

  const summaryCards = [
    {
      label: 'Received',
      value: summary.received,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Pending',
      value: summary.pending,
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
    {
      label: 'Overdue',
      value: summary.overdue,
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10',
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

      {/* Income / Outstanding summary */}
      <div className='grid grid-cols-2 gap-4'>
        <Card>
          <CardContent className='flex items-center gap-3 p-4'>
            <div className='rounded-lg bg-green-500/10 p-2.5'>
              <DollarSign size={20} className='text-green-600 dark:text-green-400' />
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Total Income</p>
              {loading ? (
                <Skeleton className='mt-1 h-5 w-20' />
              ) : (
                <p className='text-lg font-bold'>${summary.totalIncome.toLocaleString()}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex items-center gap-3 p-4'>
            <div className='rounded-lg bg-red-500/10 p-2.5'>
              <AlertTriangle size={20} className='text-red-600 dark:text-red-400' />
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Outstanding</p>
              {loading ? (
                <Skeleton className='mt-1 h-5 w-20' />
              ) : (
                <p className='text-lg font-bold'>${summary.totalOutstanding.toLocaleString()}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment status cards */}
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
                  {loading ? (
                    <Skeleton className='mt-1 h-5 w-16' />
                  ) : (
                    <p className='text-lg font-bold'>${card.value.toLocaleString()}</p>
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
            <div className='relative w-full sm:w-64'>
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
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='space-y-3'>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className='py-8 text-center text-sm text-muted-foreground'>No payments found.</p>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead className='text-right'>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className='font-medium'>{p.businessName}</TableCell>
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
                          {p.status !== 'completed' && (
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8'
                              onClick={() => openEditDialog(p)}
                            >
                              <Pencil size={14} />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <PaginationControls
                meta={paginationMeta}
                onPageChange={setPage}
                hideWhenSinglePage={false}
                className='mt-4 flex items-center justify-between'
                labelClassName='text-xs text-muted-foreground'
                label={`Showing ${paginationRange.from}–${paginationRange.to} of ${paginationMeta.total}`}
                controlsClassName='flex gap-1'
                buttonClassName='h-8 w-8'
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a new payment received from a client.</DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label htmlFor='pay-business'>Business / Client Name</Label>
              <Input
                id='pay-business'
                placeholder='e.g. Sarah Johnson'
                value={formBusinessName}
                onChange={(e) => setFormBusinessName(e.target.value)}
              />
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
                  placeholder='0.00'
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Payment Mode</Label>
                <Select
                  value={formMode}
                  onValueChange={(v) => setFormMode(v as Payment['paymentMode'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='cash'>Cash</SelectItem>
                    <SelectItem value='bank_transfer'>Bank Transfer</SelectItem>
                    <SelectItem value='credit_card'>Credit Card</SelectItem>
                    <SelectItem value='cheque'>Cheque</SelectItem>
                    <SelectItem value='mobile_money'>Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Status</Label>
                <Select
                  value={formStatus}
                  onValueChange={(v) => setFormStatus(v as Payment['status'])}
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
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecord} className='gradient-bg text-primary-foreground'>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>
              Update payment details for {editPayment?.businessName}.
            </DialogDescription>
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
                  onValueChange={(v) => setEditFormMode(v as Payment['paymentMode'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='cash'>Cash</SelectItem>
                    <SelectItem value='bank_transfer'>Bank Transfer</SelectItem>
                    <SelectItem value='credit_card'>Credit Card</SelectItem>
                    <SelectItem value='cheque'>Cheque</SelectItem>
                    <SelectItem value='mobile_money'>Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Amount ($)</Label>
                <Input
                  type='number'
                  min='0'
                  value={editFormAmount}
                  onChange={(e) => setEditFormAmount(e.target.value)}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Status</Label>
              <Select
                value={editFormStatus}
                onValueChange={(v) => setEditFormStatus(v as Payment['status'])}
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
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} className='gradient-bg text-primary-foreground'>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;
