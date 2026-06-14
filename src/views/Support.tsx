'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { LifeBuoy, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import PaginationControls from '@/components/ui/pagination-controls';
import { toast } from '@/components/ui/sonner';
import { useSupportTickets, useSupportTicket } from '@/hooks/queries/use-support-tickets';
import { useCreateSupportTicket } from '@/hooks/mutations/use-support-tickets';
import { getApiErrorMessage } from '@/common/network/http-client';
import { format } from 'date-fns';
import type {
  SupportTicket,
  TicketPriority,
  TicketCategory,
  CreateSupportTicketInput,
} from '@/lib/api-client';

const ITEMS_PER_PAGE = 15;

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  in_progress: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  resolved: 'bg-muted text-muted-foreground border-border',
  closed: 'bg-muted text-muted-foreground border-border',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

function TicketDetailDialog({
  ticketId,
  open,
  onOpenChange,
}: {
  ticketId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: ticket, isLoading } = useSupportTicket(ticketId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-full max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {isLoading ? <Skeleton className='h-5 w-40' /> : ticket?.ticketNumber}
          </DialogTitle>
          {!isLoading && ticket && (
            <DialogDescription className='text-sm text-muted-foreground'>
              {ticket.category} · Created {format(new Date(ticket.createdAt), 'PPP')}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className='space-y-3'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-16 w-full' />
          </div>
        ) : ticket ? (
          <div className='space-y-4'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge className={`whitespace-nowrap border text-xs font-medium ${STATUS_STYLES[ticket.status] ?? ''}`}>
                {STATUS_LABELS[ticket.status] ?? ticket.status}
              </Badge>
              <Badge
                className={`whitespace-nowrap border text-xs font-medium capitalize ${PRIORITY_STYLES[ticket.priority]}`}
              >
                {ticket.priority}
              </Badge>
            </div>
            <div>
              <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                Subject
              </p>
              <p className='mt-0.5 text-sm font-medium'>{ticket.subject}</p>
            </div>
            {ticket.description && (
              <div>
                <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  Description
                </p>
                <p className='mt-0.5 whitespace-pre-wrap text-sm'>{ticket.description}</p>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type FormValues = CreateSupportTicketInput;

function CreateTicketDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const createMutation = useCreateSupportTicket();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { subject: '', description: '', priority: 'medium', category: 'General' },
  });

  const priority = watch('priority');
  const category = watch('category');

  const onSubmit = async (data: FormValues) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Ticket submitted successfully');
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className='w-full max-w-lg'>
        <DialogHeader>
          <DialogTitle>New Support Ticket</DialogTitle>
          <DialogDescription>
            Describe your issue and our team will get back to you shortly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='subject'>Subject</Label>
            <Input
              id='subject'
              placeholder='Brief description of the issue'
              {...register('subject', {
                required: 'Subject is required',
                minLength: { value: 5, message: 'At least 5 characters' },
              })}
            />
            {errors.subject && (
              <p className='text-xs text-destructive'>{errors.subject.message}</p>
            )}
          </div>

          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setValue('priority', v as TicketPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='low'>Low</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='high'>High</SelectItem>
                  <SelectItem value='urgent'>Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setValue('category', v as TicketCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Technical'>Technical</SelectItem>
                  <SelectItem value='Account'>Account</SelectItem>
                  <SelectItem value='Billing'>Billing</SelectItem>
                  <SelectItem value='General'>General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              rows={4}
              placeholder='Provide as much detail as possible…'
              {...register('description', {
                required: 'Description is required',
                minLength: { value: 10, message: 'At least 10 characters' },
              })}
            />
            {errors.description && (
              <p className='text-xs text-destructive'>{errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Submitting…' : 'Submit Ticket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TicketRow({
  ticket,
  index,
  onClick,
}: {
  ticket: SupportTicket;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className='cursor-pointer border-b transition-colors hover:bg-muted/50'
      onClick={onClick}
    >
      <TableCell className='font-mono text-xs text-muted-foreground'>{ticket.ticketNumber}</TableCell>
      <TableCell className='max-w-xs'>
        <span className='line-clamp-1 text-sm font-medium'>{ticket.subject}</span>
      </TableCell>
      <TableCell>
        <Badge className={`whitespace-nowrap border text-xs font-medium ${STATUS_STYLES[ticket.status] ?? ''}`}>
          {STATUS_LABELS[ticket.status] ?? ticket.status}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          className={`whitespace-nowrap border text-xs font-medium capitalize ${PRIORITY_STYLES[ticket.priority]}`}
        >
          {ticket.priority}
        </Badge>
      </TableCell>
      <TableCell className='text-xs text-muted-foreground'>{ticket.category}</TableCell>
      <TableCell className='text-xs text-muted-foreground'>
        {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
      </TableCell>
    </motion.tr>
  );
}

function TicketCard({
  ticket,
  index,
  onClick,
}: {
  ticket: SupportTicket;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className='card-shadow cursor-pointer p-3 transition-colors hover:bg-muted/30' onClick={onClick}>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-1.5'>
              <span className='font-mono text-xs text-muted-foreground'>{ticket.ticketNumber}</span>
              <span className='text-xs text-muted-foreground'>·</span>
              <span className='text-xs text-muted-foreground'>{ticket.category}</span>
            </div>
            <p className='mt-0.5 line-clamp-1 text-sm font-medium'>{ticket.subject}</p>
            <p className='mt-0.5 text-xs text-muted-foreground'>
              {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
          <div className='flex flex-col items-end gap-1'>
            <Badge className={`whitespace-nowrap border text-xs font-medium ${STATUS_STYLES[ticket.status] ?? ''}`}>
              {STATUS_LABELS[ticket.status] ?? ticket.status}
            </Badge>
            <Badge
              className={`whitespace-nowrap border text-xs font-medium capitalize ${PRIORITY_STYLES[ticket.priority]}`}
            >
              {ticket.priority}
            </Badge>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

const Support = () => {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { data, isLoading } = useSupportTickets({ page, limit: ITEMS_PER_PAGE });

  const tickets = data?.data ?? [];
  const paginationMeta = data?.meta;

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <h1 className='text-xl font-bold tracking-tight sm:text-2xl'>Support</h1>
          <p className='text-sm text-muted-foreground'>Submit and track your support tickets</p>
        </div>
        <Button size='sm' onClick={() => setCreateOpen(true)}>
          <Plus size={16} className='mr-1.5' />
          New Ticket
        </Button>
      </div>

      {isLoading ? (
        <div className='space-y-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className='h-12 rounded-lg' />
          ))}
        </div>
      ) : (
        <>
          <div className='space-y-3 md:hidden'>
            {tickets.length === 0 ? (
              <Card className='card-shadow p-8 text-center'>
                <LifeBuoy className='mx-auto mb-2 h-8 w-8 opacity-40' />
                <p className='text-sm text-muted-foreground'>No tickets yet.</p>
                <Button size='sm' className='mt-3' onClick={() => setCreateOpen(true)}>
                  Submit your first ticket
                </Button>
              </Card>
            ) : (
              tickets.map((ticket, i) => (
                <TicketCard
                  key={ticket._id}
                  ticket={ticket}
                  index={i}
                  onClick={() => setSelectedTicketId(ticket._id)}
                />
              ))
            )}
          </div>

          <Card className='card-shadow hidden overflow-hidden md:block'>
            <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-24 whitespace-nowrap'>Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className='w-32 whitespace-nowrap'>Status</TableHead>
                  <TableHead className='w-24 whitespace-nowrap'>Priority</TableHead>
                  <TableHead className='w-28 whitespace-nowrap'>Category</TableHead>
                  <TableHead className='w-32 whitespace-nowrap'>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='py-12 text-center text-muted-foreground'>
                      <LifeBuoy className='mx-auto mb-2 h-8 w-8 opacity-40' />
                      No tickets yet. Submit one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket, i) => (
                    <TicketRow
                      key={ticket._id}
                      ticket={ticket}
                      index={i}
                      onClick={() => setSelectedTicketId(ticket._id)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </Card>

          {paginationMeta && (
            <PaginationControls
              meta={paginationMeta}
              onPageChange={setPage}
              className='flex items-center justify-between gap-2 border-t px-1 py-3 sm:px-2 md:rounded-b-lg md:border md:px-4'
              controlsClassName='flex gap-1'
            />
          )}
        </>
      )}

      <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} />

      {selectedTicketId && (
        <TicketDetailDialog
          ticketId={selectedTicketId}
          open={!!selectedTicketId}
          onOpenChange={(v) => {
            if (!v) setSelectedTicketId(null);
          }}
        />
      )}
    </div>
  );
};

export default Support;
