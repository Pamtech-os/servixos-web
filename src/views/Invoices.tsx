'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Plus,
  Search,
  FileText,
  Trash2,
  CalendarIcon,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from '@/components/ui/sonner';
import { format, parse } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import PaginationControls from '@/components/ui/pagination-controls';
import { PriceInput } from '@/components/ui/price-input';
import { cn } from '@/lib/utils';
import { useInvoices } from '@/hooks/queries/use-invoices';
import { useClients } from '@/hooks/queries/use-clients';
import { useCreateInvoice, useDeleteInvoice, useSendInvoice, useGetInvoicePdf } from '@/hooks/mutations/use-invoices';
import { getApiErrorMessage } from '@/common/network/http-client';
import type { Invoice, InvoiceClient, InvoiceLineItem, InvoiceStatus } from '@/lib/api-client';

function getClientName(clientId: Invoice['clientId']): string {
  if (typeof clientId === 'object' && clientId !== null) return (clientId as InvoiceClient).name;
  return '—';
}

const ITEMS_PER_PAGE = 20;

const emptyLineItem = (): InvoiceLineItem => ({
  description: '',
  quantity: 1,
  unitPrice: 0,
});

const statusColor = (s: InvoiceStatus) => {
  switch (s) {
    case 'paid':
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
    case 'partial':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  }
};

const Invoices = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [sendTarget, setSendTarget] = useState<Invoice | null>(null);

  const query = {
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit: ITEMS_PER_PAGE,
  };

  const { data, isLoading } = useInvoices(query);
  const { data: clientsData } = useClients({ limit: 50 });

  const createInvoice = useCreateInvoice();
  const deleteInvoice = useDeleteInvoice();
  const sendInvoice = useSendInvoice();
  const getPdf = useGetInvoicePdf();

  const invoiceList = data?.data ?? [];
  const meta = data?.meta;
  const statistics = data?.statistics;
  const clientList = clientsData?.data ?? [];

  // Create form state
  const [selectedClientId, setSelectedClientId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([emptyLineItem()]);

  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const updateLineItem = (idx: number, field: keyof InvoiceLineItem, value: string | number) => {
    setLineItems((prev) => prev.map((li, i) => (i === idx ? { ...li, [field]: value } : li)));
  };

  const resetForm = () => {
    setSelectedClientId('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setTaxRate(0);
    setLineItems([emptyLineItem()]);
  };

  const handleCreate = () => {
    if (!selectedClientId) {
      toast.error('Validation Error', { description: 'Please select a client.' });
      return;
    }
    if (lineItems.some((li) => !li.description || li.quantity < 1 || li.unitPrice < 0)) {
      toast.error('Validation Error', { description: 'Please fill in all line items correctly.' });
      return;
    }

    createInvoice.mutate(
      {
        clientId: selectedClientId,
        invoiceDate,
        dueDate: dueDate || undefined,
        lineItems,
        taxRate: taxRate || undefined,
      },
      {
        onSuccess: (inv) => {
          toast.success('Invoice created', { description: `${inv.invoiceNumber} has been created.` });
          setCreateOpen(false);
          resetForm();
        },
        onError: (err) => {
          toast.error('Failed to create invoice', { description: getApiErrorMessage(err) });
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteInvoice.mutate(deleteTarget._id, {
      onSuccess: () => {
        toast.success('Invoice deleted', { description: `${deleteTarget.invoiceNumber} has been removed.` });
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error('Failed to delete invoice', { description: getApiErrorMessage(err) });
        setDeleteTarget(null);
      },
    });
  };

  const handleSend = () => {
    if (!sendTarget) return;
    sendInvoice.mutate(sendTarget._id, {
      onSuccess: () => {
        toast.success('Invoice sent', { description: `${sendTarget.invoiceNumber} has been emailed to the client.` });
        setSendTarget(null);
      },
      onError: (err) => {
        toast.error('Failed to send invoice', { description: getApiErrorMessage(err) });
        setSendTarget(null);
      },
    });
  };

  const handleDownloadPdf = (inv: Invoice) => {
    getPdf.mutate(inv._id, {
      onSuccess: ({ pdfUrl }) => {
        window.open(pdfUrl, '_blank');
      },
      onError: (err) => {
        toast.error('Failed to get PDF', { description: getApiErrorMessage(err) });
      },
    });
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Invoices</h1>
          <p className='text-sm text-muted-foreground'>Manage and track all invoices</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className='gap-2'>
          <Plus size={16} /> New Invoice
        </Button>
      </div>

      {/* Summary cards */}
      <div className='grid gap-4 sm:grid-cols-2'>
        {isLoading ? (
          <>
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className='h-24 rounded-xl' />
            ))}
          </>
        ) : (
          <>
            {[
              {
                label: 'Total Collected',
                value: statistics?.totalCollected ?? 0,
                icon: CheckCircle2,
                color: 'text-green-500',
              },
              {
                label: 'Outstanding',
                value: statistics?.outstanding ?? 0,
                icon: Clock,
                color: 'text-yellow-500',
              },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className='card-shadow'>
                  <CardHeader className='flex flex-row items-center justify-between pb-2'>
                    <CardTitle className='text-sm font-medium text-muted-foreground'>
                      {card.label}
                    </CardTitle>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>
                      ${card.value.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Filters */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <div className='relative max-w-sm flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search invoices...'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className='pl-9'
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as InvoiceStatus | 'all');
            setPage(1);
          }}
        >
          <SelectTrigger className='w-36'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All statuses</SelectItem>
            <SelectItem value='pending'>Pending</SelectItem>
            <SelectItem value='partial'>Partial</SelectItem>
            <SelectItem value='paid'>Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className='space-y-3'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='h-12 rounded-lg' />
          ))}
        </div>
      ) : (
        <Card className='card-shadow overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className='py-10 text-center text-muted-foreground'>
                    <FileText className='mx-auto mb-2 h-8 w-8 opacity-40' />
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                invoiceList.map((inv, i) => (
                    <motion.tr
                      key={inv._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className='border-b transition-colors hover:bg-muted/50'
                    >
                      <TableCell className='font-medium'>{inv.invoiceNumber}</TableCell>
                      <TableCell>{getClientName(inv.clientId)}</TableCell>
                      <TableCell>${inv.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>${inv.amountPaid.toLocaleString()}</TableCell>
                      <TableCell>
                        {format(new Date(inv.invoiceDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {inv.dueDate ? format(new Date(inv.dueDate), 'MMM d, yyyy') : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline' className={statusColor(inv.status)}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => handleDownloadPdf(inv)}
                            title='Download PDF'
                          >
                            <FileText size={15} />
                          </Button>
                          {!inv.sentAt && inv.status !== 'paid' && (
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => setSendTarget(inv)}
                              title='Send to client'
                            >
                              <Send size={15} />
                            </Button>
                          )}
                          {inv.status === 'pending' && (
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => setDeleteTarget(inv)}
                              className='text-destructive hover:text-destructive'
                              title='Delete'
                            >
                              <Trash2 size={15} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
              )}
            </TableBody>
          </Table>

          {meta && (
            <PaginationControls
              meta={meta}
              onPageChange={setPage}
              className='flex items-center justify-between border-t px-4 py-3'
              controlsClassName='flex gap-1'
            />
          )}
        </Card>
      )}

      {/* Delete modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title='Delete Invoice'
        description={`Are you sure you want to delete ${deleteTarget?.invoiceNumber}? This action cannot be undone.`}
        confirmLabel='Delete'
        onConfirm={handleDelete}
        variant='destructive'
      />

      {/* Send modal */}
      <ConfirmModal
        open={!!sendTarget}
        onOpenChange={(open) => { if (!open) setSendTarget(null); }}
        title='Send Invoice'
        description={`Send ${sendTarget?.invoiceNumber} to the client via email?`}
        confirmLabel='Send'
        onConfirm={handleSend}
      />

      {/* Create Invoice Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>

          <div className='space-y-6 py-2'>
            {/* Client */}
            <div>
              <h3 className='mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
                Invoice Info
              </h3>
              <div className='space-y-1.5'>
                <Label>Select Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder='Choose a client' />
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
            </div>

            <Separator />

            {/* Dates */}
            <div>
              <h3 className='mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
                Dates
              </h3>
              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='space-y-1.5'>
                  <Label>Invoice Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className={cn('w-full justify-start text-left font-normal', !invoiceDate && 'text-muted-foreground')}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {invoiceDate
                          ? format(parse(invoiceDate, 'yyyy-MM-dd', new Date()), 'PPP')
                          : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={invoiceDate ? parse(invoiceDate, 'yyyy-MM-dd', new Date()) : undefined}
                        onSelect={(d) => d && setInvoiceDate(format(d, 'yyyy-MM-dd'))}
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className='space-y-1.5'>
                  <Label>Due Date <span className='text-muted-foreground'>(optional)</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className={cn('w-full justify-start text-left font-normal', !dueDate && 'text-muted-foreground')}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {dueDate
                          ? format(parse(dueDate, 'yyyy-MM-dd', new Date()), 'PPP')
                          : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={dueDate ? parse(dueDate, 'yyyy-MM-dd', new Date()) : undefined}
                        onSelect={(d) => d && setDueDate(format(d, 'yyyy-MM-dd'))}
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <Separator />

            {/* Line items */}
            <div>
              <h3 className='mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
                Items
              </h3>
              <div className='space-y-3'>
                {lineItems.map((li, idx) => (
                  <div key={idx} className='grid grid-cols-[1fr_80px_100px_40px] items-end gap-2'>
                    <div className='space-y-1.5'>
                      {idx === 0 && <Label>Description</Label>}
                      <Input
                        placeholder='Service description'
                        value={li.description}
                        onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                      />
                    </div>
                    <div className='space-y-1.5'>
                      {idx === 0 && <Label>Qty</Label>}
                      <Input
                        type='number'
                        min={1}
                        value={li.quantity}
                        onChange={(e) => updateLineItem(idx, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className='space-y-1.5'>
                      {idx === 0 && <Label>Unit Price</Label>}
                      <PriceInput
                        value={li.unitPrice}
                        onChange={(val) => updateLineItem(idx, 'unitPrice', val)}
                        placeholder='0'
                      />
                    </div>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='text-destructive'
                      disabled={lineItems.length === 1}
                      onClick={() => setLineItems((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setLineItems((prev) => [...prev, emptyLineItem()])}
                >
                  <Plus size={14} className='mr-1' /> Add Item
                </Button>
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div className='flex items-center justify-between text-sm'>
                <div className='flex items-center gap-2'>
                  <span className='text-muted-foreground'>Tax (%)</span>
                  <PriceInput
                    value={taxRate}
                    onChange={setTaxRate}
                    placeholder='0'
                    className='h-8 w-20'
                  />
                </div>
                <span>${taxAmount.toLocaleString()}</span>
              </div>
              <Separator />
              <div className='flex justify-between text-base font-bold'>
                <span>Total</span>
                <span>${total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setCreateOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createInvoice.isPending}>
              {createInvoice.isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
