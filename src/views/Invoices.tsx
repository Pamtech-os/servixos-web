'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Clock,
  Plus,
  Search,
  FileText,
  Trash2,
  CalendarIcon,
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
import { mockInvoices, mockClients, type Invoice } from '@/lib/mock-data';
import { toast } from '@/components/ui/sonner';
import { format, parse } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import PaginationControls from '@/components/ui/pagination-controls';
import { cn } from '@/lib/utils';
import { paginateArray } from '@/lib/pagination';

const ITEMS_PER_PAGE = 6;

interface InvoiceLineItem {
  description: string;
  quantity: number;
  price: number;
}

const emptyLineItem = (): InvoiceLineItem => ({
  description: '',
  quantity: 1,
  price: 0,
});

const statusColor = (s: Invoice['status']) => {
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
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  // Create form state
  const [businessName, setBusinessName] = useState('Servix OS');
  const [businessContact, setBusinessContact] = useState('hello@servix.com');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([emptyLineItem()]);

  useEffect(() => {
    const t = setTimeout(() => {
      setInvoices(mockInvoices);
      setLoading(false);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const collected = useMemo(
    () => invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.price, 0),
    [invoices]
  );
  const outstanding = useMemo(
    () => invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.price, 0),
    [invoices]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter((inv) => {
      const client = mockClients.find((c) => c.id === inv.clientId);
      return (
        inv.invoiceNumber.toLowerCase().includes(q) || client?.fullName.toLowerCase().includes(q)
      );
    });
  }, [invoices, search]);

  const pagination = useMemo(
    () => paginateArray(filtered, page, ITEMS_PER_PAGE),
    [filtered, page]
  );
  const { data: paginated, meta: paginationMeta } = pagination;

  useEffect(() => {
    if (page !== paginationMeta.page) {
      setPage(paginationMeta.page);
    }
  }, [page, paginationMeta.page]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    setInvoices((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    toast.success('Invoice deleted', {
      description: `${deleteTarget.invoiceNumber} has been removed.`,
    });
    setDeleteTarget(null);
  };

  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.price, 0);
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
    if (
      !selectedClientId ||
      lineItems.some((li) => !li.description || li.quantity <= 0 || li.price <= 0)
    ) {
      toast.error('Validation Error', {
        description: 'Please fill in all fields correctly.',
      });
      return;
    }
    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      clientId: selectedClientId,
      invoiceNumber: `INV-${String(invoices.length + 1).padStart(3, '0')}`,
      price: total,
      date: invoiceDate,
      status: 'pending',
    };
    setInvoices((prev) => [newInv, ...prev]);
    toast.success('Invoice created', {
      description: `${newInv.invoiceNumber} for $${total.toLocaleString()}`,
    });
    setCreateOpen(false);
    resetForm();
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
        {loading ? (
          <>
            <Skeleton className='h-28 rounded-xl' />
            <Skeleton className='h-28 rounded-xl' />
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card className='card-shadow'>
                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    Total Collected
                  </CardTitle>
                  <DollarSign className='h-5 w-5 text-green-500' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>${collected.toLocaleString()}</div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className='card-shadow'>
                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                  <CardTitle className='text-sm font-medium text-muted-foreground'>
                    Outstanding
                  </CardTitle>
                  <Clock className='h-5 w-5 text-yellow-500' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>${outstanding.toLocaleString()}</div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Search */}
      <div className='relative max-w-sm'>
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

      {/* Table */}
      {loading ? (
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
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='py-10 text-center text-muted-foreground'>
                    <FileText className='mx-auto mb-2 h-8 w-8 opacity-40' />
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((inv, i) => {
                  const client = mockClients.find((c) => c.id === inv.clientId);
                  return (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className='border-b transition-colors hover:bg-muted/50'
                    >
                      <TableCell className='font-medium'>{inv.invoiceNumber}</TableCell>
                      <TableCell>{client?.fullName ?? 'Unknown'}</TableCell>
                      <TableCell>${inv.price.toLocaleString()}</TableCell>
                      <TableCell>{inv.date}</TableCell>
                      <TableCell>
                        <Badge variant='outline' className={statusColor(inv.status)}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => setDeleteTarget(inv)}
                          className='text-destructive hover:text-destructive'
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <PaginationControls
            meta={paginationMeta}
            onPageChange={setPage}
            className='flex items-center justify-between border-t px-4 py-3'
            controlsClassName='flex gap-1'
          />
        </Card>
      )}

      {/* Delete modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title='Delete Invoice'
        description={`Are you sure you want to delete ${deleteTarget?.invoiceNumber}? This action cannot be undone.`}
        confirmLabel='Delete'
        onConfirm={handleDelete}
        variant='destructive'
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
            {/* Business info */}
            <div>
              <h3 className='mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider'>
                Your Business
              </h3>
              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='space-y-1.5'>
                  <Label>Business Name</Label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                </div>
                <div className='space-y-1.5'>
                  <Label>Contact Info</Label>
                  <Input
                    value={businessContact}
                    onChange={(e) => setBusinessContact(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Client info */}
            <div>
              <h3 className='mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider'>
                Client
              </h3>
              <div className='space-y-1.5'>
                <Label>Select Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder='Choose a client' />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName} — {c.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div>
              <h3 className='mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider'>
                Invoice Details
              </h3>
              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='space-y-1.5'>
                  <Label>Invoice Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !invoiceDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {invoiceDate ? (
                          format(parse(invoiceDate, 'yyyy-MM-dd', new Date()), 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={
                          invoiceDate ? parse(invoiceDate, 'yyyy-MM-dd', new Date()) : undefined
                        }
                        onSelect={(d) => d && setInvoiceDate(format(d, 'yyyy-MM-dd'))}
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className='space-y-1.5'>
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !dueDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {dueDate ? (
                          format(parse(dueDate, 'yyyy-MM-dd', new Date()), 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
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
              <h3 className='mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider'>
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
                      {idx === 0 && <Label>Price</Label>}
                      <Input
                        type='number'
                        min={0}
                        value={li.price}
                        onChange={(e) => updateLineItem(idx, 'price', Number(e.target.value))}
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
                  <Input
                    type='number'
                    min={0}
                    max={100}
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className='w-20 h-8'
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
            <Button onClick={handleCreate}>Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
