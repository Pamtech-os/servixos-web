'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useCreateJob } from '@/hooks/mutations/use-jobs';
import type { Client } from '@/lib/api-client';

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientList: Client[];
}

export default function CreateJobDialog({ open, onOpenChange, clientList }: CreateJobDialogProps) {
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formDate, setFormDate] = useState<Date>(new Date());
  const [formPrice, setFormPrice] = useState(0);
  const [formLocation, setFormLocation] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const createJob = useCreateJob();

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormClientId('');
    setFormDate(new Date());
    setFormPrice(0);
    setFormLocation('');
    setFormNotes('');
  };

  const handleCreate = () => {
    if (!formTitle.trim() || !formClientId) {
      toast.error('Validation Error', { description: 'Title and client are required.' });
      return;
    }
    createJob.mutate(
      {
        clientId: formClientId,
        title: formTitle,
        description: formDescription || undefined,
        scheduledDate: formDate.toISOString(),
        location: formLocation || undefined,
        price: formPrice || undefined,
        notes: formNotes || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Job created', { description: `"${formTitle}" added successfully.` });
          onOpenChange(false);
          resetForm();
        },
        onError: (err) => {
          toast.error('Failed to create job', { description: getApiErrorMessage(err) });
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
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>Fill in the details to create a new job</DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <div className='space-y-1.5'>
            <Label>Title</Label>
            <Input
              placeholder='Job title'
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
          </div>
          <div className='space-y-1.5'>
            <Label>Client</Label>
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
          <div className='space-y-1.5'>
            <Label>Description</Label>
            <Textarea
              placeholder='Job description (optional)'
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label>Scheduled Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formDate && 'text-muted-foreground',
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
                    onSelect={(d) => d && setFormDate(d)}
                    initialFocus
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className='space-y-1.5'>
              <Label>Price ($)</Label>
              <PriceInput value={formPrice} onChange={setFormPrice} placeholder='0' />
            </div>
          </div>
          <div className='space-y-1.5'>
            <Label>Location</Label>
            <Input
              placeholder='Job location (optional)'
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
            />
          </div>
          <div className='space-y-1.5'>
            <Label>Notes</Label>
            <Textarea
              placeholder='Additional notes (optional)'
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={createJob.isPending}>
            {createJob.isPending && <Loader2 size={14} className='mr-2 animate-spin' />}
            Create Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
