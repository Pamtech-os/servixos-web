'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Plus,
  Search,
  Trash2,
  Eye,
  Play,
  FileText,
  MapPin,
  Clock,
  DollarSign,
  CalendarDays,
  StickyNote,
  Sparkles,
  Send,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PriceInput } from '@/components/ui/price-input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import PaginationControls from '@/components/ui/pagination-controls';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from '@/components/ui/sonner';
import { getApiErrorMessage } from '@/common/network/http-client';
import { useJobs } from '@/hooks/queries/use-jobs';
import { useClients } from '@/hooks/queries/use-clients';
import {
  useCreateJob,
  useDeleteJob,
  useBulkDeleteJobs,
  useStartJob,
  useCompleteJob,
} from '@/hooks/mutations/use-jobs';
import {
  useCreateContract,
  useSendContract,
  useGetContractPdf,
} from '@/hooks/mutations/use-contracts';
import type { Job, JobStatus, Contract } from '@/lib/api-client';

const ITEMS_PER_PAGE = 8;

const statusColor = (s: JobStatus) => {
  switch (s) {
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
    case 'in_progress':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'completed':
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
    case 'cancelled':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
  }
};

const statusLabel = (s: JobStatus) => {
  switch (s) {
    case 'pending':
      return 'Pending';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
  }
};

const Jobs = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [viewJob, setViewJob] = useState<Job | null>(null);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Contract state (tracked per session since there's no GET contract endpoint)
  const [contractsByJobId, setContractsByJobId] = useState<Record<string, Contract>>({});
  const [sentJobIds, setSentJobIds] = useState<Set<string>>(new Set());
  const [contractReviewOpen, setContractReviewOpen] = useState(false);

  // Create form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formDate, setFormDate] = useState<Date>(new Date());
  const [formPrice, setFormPrice] = useState(0);
  const [formLocation, setFormLocation] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const jobsQuery = useJobs({
    search: search || undefined,
    clientId: clientFilter !== 'all' ? clientFilter : undefined,
    status: statusFilter !== 'all' ? (statusFilter as JobStatus) : undefined,
    page,
    limit: ITEMS_PER_PAGE,
  });

  const clientsQuery = useClients({ limit: 50 });

  const createJob = useCreateJob();
  const deleteJob = useDeleteJob();
  const bulkDeleteJobs = useBulkDeleteJobs();
  const startJob = useStartJob();
  const completeJob = useCompleteJob();
  const createContract = useCreateContract();
  const sendContract = useSendContract();
  const getPdf = useGetContractPdf();

  const jobList = jobsQuery.data?.data ?? [];
  const paginationMeta = jobsQuery.data?.meta;
  const clientList = useMemo(() => clientsQuery.data?.data ?? [], [clientsQuery.data?.data]);

  const clientMap = useMemo(
    () => Object.fromEntries(clientList.map((c) => [c._id, c.name])),
    [clientList],
  );

  const clientEmailMap = useMemo(
    () => Object.fromEntries(clientList.map((c) => [c._id, c.email])),
    [clientList],
  );

  const selectedJobsCount = selectedJobIds.length;
  const allVisibleSelected =
    jobList.length > 0 && jobList.every((job) => selectedJobIds.includes(job._id));
  const someVisibleSelected =
    jobList.some((job) => selectedJobIds.includes(job._id)) && !allVisibleSelected;

  const handleToggleJobSelection = (jobId: string, checked: boolean) => {
    setSelectedJobIds((prev) =>
      checked ? (prev.includes(jobId) ? prev : [...prev, jobId]) : prev.filter((id) => id !== jobId),
    );
  };

  const handleToggleVisibleSelection = (checked: boolean) => {
    const visibleIds = jobList.map((job) => job._id);
    setSelectedJobIds((prev) =>
      checked
        ? Array.from(new Set([...prev, ...visibleIds]))
        : prev.filter((id) => !visibleIds.includes(id)),
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteJob.mutate(deleteTarget._id, {
      onSuccess: () => {
        toast.success('Job deleted', { description: `"${deleteTarget.title}" has been removed.` });
        setSelectedJobIds((prev) => prev.filter((id) => id !== deleteTarget._id));
        if (viewJob?._id === deleteTarget._id) setViewJob(null);
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error('Failed to delete', { description: getApiErrorMessage(err) });
      },
    });
  };

  const handleBulkDelete = () => {
    bulkDeleteJobs.mutate(selectedJobIds, {
      onSuccess: (result) => {
        toast.success('Jobs deleted', {
          description: `${result.deletedCount} job${result.deletedCount !== 1 ? 's' : ''} removed.`,
        });
        if (viewJob && selectedJobIds.includes(viewJob._id)) setViewJob(null);
        setSelectedJobIds([]);
        setBulkDeleteOpen(false);
      },
      onError: (err) => {
        toast.error('Failed to delete', { description: getApiErrorMessage(err) });
      },
    });
  };

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
          setCreateOpen(false);
          resetForm();
        },
        onError: (err) => {
          toast.error('Failed to create job', { description: getApiErrorMessage(err) });
        },
      },
    );
  };

  const handleStartJob = (job: Job) => {
    startJob.mutate(job._id, {
      onSuccess: (updated) => {
        toast.success('Job started', { description: `"${job.title}" is now in progress.` });
        setViewJob(updated);
      },
      onError: (err) => {
        toast.error('Failed to start job', { description: getApiErrorMessage(err) });
      },
    });
  };

  const handleCompleteJob = (job: Job) => {
    completeJob.mutate(job._id, {
      onSuccess: (updated) => {
        toast.success('Job completed', { description: `"${job.title}" marked as completed.` });
        setViewJob(updated);
      },
      onError: (err) => {
        toast.error('Failed to complete job', { description: getApiErrorMessage(err) });
      },
    });
  };

  const handleGenerateContract = () => {
    if (!viewJob) return;
    createContract.mutate(
      {
        clientId: viewJob.clientId,
        jobId: viewJob._id,
        name: viewJob.title,
        amount: viewJob.price ?? 0,
      },
      {
        onSuccess: (contract) => {
          setContractsByJobId((prev) => ({ ...prev, [viewJob._id]: contract }));
          setContractReviewOpen(true);
        },
        onError: (err) => {
          toast.error('Failed to create contract', { description: getApiErrorMessage(err) });
        },
      },
    );
  };

  const handleGetPdf = () => {
    if (!currentContract) return;
    getPdf.mutate(currentContract._id, {
      onSuccess: ({ url }) => {
        window.open(url, '_blank', 'noreferrer');
      },
      onError: (err) => {
        toast.error('Failed to generate PDF', { description: getApiErrorMessage(err) });
      },
    });
  };

  const handleSendContract = () => {
    if (!viewJob || !currentContract) return;
    const clientEmail = clientEmailMap[viewJob.clientId] ?? '';
    sendContract.mutate(
      { id: currentContract._id, clientEmail },
      {
        onSuccess: () => {
          setSentJobIds((prev) => new Set([...prev, viewJob._id]));
          setContractReviewOpen(false);
          toast.success('Contract sent', {
            description: 'Contract has been sent to the client for review.',
          });
        },
        onError: (err) => {
          toast.error('Failed to send contract', { description: getApiErrorMessage(err) });
        },
      },
    );
  };

  const currentContract = viewJob ? contractsByJobId[viewJob._id] : null;
  const contractSent = viewJob ? sentJobIds.has(viewJob._id) : false;

  return (
    <div className='space-y-4 sm:space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-xl font-bold tracking-tight sm:text-2xl'>Jobs</h1>
          <p className='text-sm text-muted-foreground'>Manage and track all jobs</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className='w-full gap-2 sm:w-auto'>
          <Plus size={16} /> New Job
        </Button>
      </div>

      {/* Filters */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <div className='relative w-full flex-1 sm:max-w-sm'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search jobs...'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className='pl-9'
          />
        </div>
        <Select
          value={clientFilter}
          onValueChange={(v) => {
            setClientFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className='w-full sm:w-[180px]'>
            <SelectValue placeholder='All Clients' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Clients</SelectItem>
            {clientList.map((c) => (
              <SelectItem key={c._id} value={c._id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className='w-full sm:w-[160px]'>
            <SelectValue placeholder='All Statuses' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Statuses</SelectItem>
            <SelectItem value='pending'>Pending</SelectItem>
            <SelectItem value='in_progress'>In Progress</SelectItem>
            <SelectItem value='completed'>Completed</SelectItem>
            <SelectItem value='cancelled'>Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedJobsCount > 0 && (
        <Card className='card-shadow p-3'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-sm font-medium'>
              {selectedJobsCount} job{selectedJobsCount > 1 ? 's' : ''} selected
            </p>
            <Button variant='destructive' onClick={() => setBulkDeleteOpen(true)}>
              Delete Selected
            </Button>
          </div>
        </Card>
      )}

      {/* Table */}
      {jobsQuery.isLoading ? (
        <div className='space-y-3'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='h-12 rounded-lg' />
          ))}
        </div>
      ) : (
        <>
          <div className='space-y-3 md:hidden'>
            {jobList.length === 0 ? (
              <Card className='card-shadow p-6 text-center text-sm text-muted-foreground'>
                <Briefcase className='mx-auto mb-2 h-8 w-8 opacity-40' />
                No jobs found.
              </Card>
            ) : (
              jobList.map((job, i) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className='card-shadow p-3'>
                    <div className='space-y-2'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex items-start gap-2'>
                          <Checkbox
                            checked={selectedJobIds.includes(job._id)}
                            onCheckedChange={(checked) =>
                              handleToggleJobSelection(job._id, checked === true)
                            }
                            aria-label={`Select ${job.title}`}
                          />
                          <p className='text-sm font-medium leading-tight'>{job.title}</p>
                        </div>
                        <Badge variant='outline' className={statusColor(job.status)}>
                          {statusLabel(job.status)}
                        </Badge>
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        {clientMap[job.clientId] ?? 'Unknown'}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {format(new Date(job.scheduledDate), 'PP')}
                      </p>
                      <div className='flex justify-end gap-1 pt-1'>
                        <Button variant='ghost' size='icon' onClick={() => setViewJob(job)}>
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => setDeleteTarget(job)}
                          className='text-destructive hover:text-destructive'
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          <Card className='card-shadow hidden overflow-hidden md:block'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-10'>
                    <Checkbox
                      checked={
                        allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false
                      }
                      onCheckedChange={(checked) =>
                        handleToggleVisibleSelection(checked === true)
                      }
                      aria-label='Select visible jobs'
                    />
                  </TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='py-10 text-center text-muted-foreground'>
                      <Briefcase className='mx-auto mb-2 h-8 w-8 opacity-40' /> No jobs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobList.map((job, i) => (
                    <motion.tr
                      key={job._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className='border-b transition-colors hover:bg-muted/50'
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedJobIds.includes(job._id)}
                          onCheckedChange={(checked) =>
                            handleToggleJobSelection(job._id, checked === true)
                          }
                          aria-label={`Select ${job.title}`}
                        />
                      </TableCell>
                      <TableCell className='font-medium'>{job.title}</TableCell>
                      <TableCell>{clientMap[job.clientId] ?? 'Unknown'}</TableCell>
                      <TableCell>{format(new Date(job.scheduledDate), 'PP')}</TableCell>
                      <TableCell>
                        <Badge variant='outline' className={statusColor(job.status)}>
                          {statusLabel(job.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-1'>
                          <Button variant='ghost' size='icon' onClick={() => setViewJob(job)}>
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => setDeleteTarget(job)}
                            className='text-destructive hover:text-destructive'
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
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

      {/* Delete modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title='Delete Job'
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel='Delete'
        onConfirm={handleDelete}
        variant='destructive'
      />

      <ConfirmModal
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title='Delete Selected Jobs'
        description={`Are you sure you want to delete ${selectedJobsCount} selected job${selectedJobsCount > 1 ? 's' : ''}? This action cannot be undone.`}
        confirmLabel='Delete Selected'
        onConfirm={handleBulkDelete}
        variant='destructive'
      />

      {/* View Job Detail Dialog */}
      <Dialog
        open={!!viewJob}
        onOpenChange={(open) => {
          if (!open) setViewJob(null);
        }}
      >
        <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Job Details</DialogTitle>
            <DialogDescription>View job information and take actions</DialogDescription>
          </DialogHeader>
          {viewJob && (
            <div className='space-y-4 py-2'>
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>{viewJob.title}</h3>
                <Badge variant='outline' className={statusColor(viewJob.status)}>
                  {statusLabel(viewJob.status)}
                </Badge>
              </div>
              <Separator />
              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='flex items-center gap-2 text-sm'>
                  <Briefcase size={14} className='text-muted-foreground' />
                  <span className='text-muted-foreground'>Client:</span>
                  <span className='font-medium'>{clientMap[viewJob.clientId] ?? 'Unknown'}</span>
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <CalendarDays size={14} className='text-muted-foreground' />
                  <span className='text-muted-foreground'>Date:</span>
                  <span className='font-medium'>
                    {format(new Date(viewJob.scheduledDate), 'PP')}
                  </span>
                </div>
                <div className='flex items-center gap-2 text-sm'>
                  <Clock size={14} className='text-muted-foreground' />
                  <span className='text-muted-foreground'>Time:</span>
                  <span className='font-medium'>
                    {format(new Date(viewJob.scheduledDate), 'p')}
                  </span>
                </div>
                {viewJob.price != null && (
                  <div className='flex items-center gap-2 text-sm'>
                    <DollarSign size={14} className='text-muted-foreground' />
                    <span className='text-muted-foreground'>Price:</span>
                    <span className='font-medium'>${viewJob.price.toLocaleString()}</span>
                  </div>
                )}
                {viewJob.location && (
                  <div className='flex items-center gap-2 text-sm sm:col-span-2'>
                    <MapPin size={14} className='text-muted-foreground' />
                    <span className='text-muted-foreground'>Location:</span>
                    <span className='font-medium'>{viewJob.location}</span>
                  </div>
                )}
              </div>
              {viewJob.description && (
                <>
                  <Separator />
                  <div className='space-y-1'>
                    <p className='text-sm text-muted-foreground'>Description</p>
                    <p className='text-sm'>{viewJob.description}</p>
                  </div>
                </>
              )}
              {viewJob.notes && (
                <>
                  <Separator />
                  <div className='space-y-1'>
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <StickyNote size={14} /> Notes
                    </div>
                    <p className='text-sm'>{viewJob.notes}</p>
                  </div>
                </>
              )}
              <Separator />
              <div className='flex flex-wrap gap-2'>
                {viewJob.status === 'pending' && (
                  <Button
                    onClick={() => handleStartJob(viewJob)}
                    className='gap-2'
                    disabled={startJob.isPending}
                  >
                    {startJob.isPending ? (
                      <Loader2 size={14} className='animate-spin' />
                    ) : (
                      <Play size={14} />
                    )}{' '}
                    Start Job
                  </Button>
                )}
                {viewJob.status === 'in_progress' && (
                  <Button
                    onClick={() => handleCompleteJob(viewJob)}
                    className='gap-2'
                    disabled={completeJob.isPending}
                  >
                    {completeJob.isPending ? (
                      <Loader2 size={14} className='animate-spin' />
                    ) : (
                      <Briefcase size={14} />
                    )}{' '}
                    Mark Complete
                  </Button>
                )}
                {/* Contract button */}
                {!contractSent ? (
                  <Button
                    onClick={
                      currentContract
                        ? () => setContractReviewOpen(true)
                        : handleGenerateContract
                    }
                    variant='outline'
                    className='gap-2'
                    disabled={createContract.isPending}
                  >
                    {createContract.isPending ? (
                      <>
                        <Loader2 size={14} className='animate-spin' /> Creating...
                      </>
                    ) : currentContract ? (
                      <>
                        <Send size={14} /> Send Contract
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} /> Generate Contract
                      </>
                    )}
                  </Button>
                ) : (
                  <Badge
                    variant='outline'
                    className='gap-1.5 border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-600'
                  >
                    <FileText size={14} /> Contract Sent
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contract Review Dialog */}
      <Dialog
        open={contractReviewOpen}
        onOpenChange={() => {
          /* non-closable via overlay */
        }}
      >
        <DialogContent
          className='sm:max-w-lg'
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FileText size={18} className='text-primary' /> Contract Ready
            </DialogTitle>
            <DialogDescription>
              Review the generated contract before sending it to the client.
            </DialogDescription>
          </DialogHeader>
          {currentContract && (
            <div className='space-y-3 py-2'>
              <p className='text-sm font-medium'>{currentContract.title}</p>
              {currentContract.pdfUrl ? (
                <a
                  href={currentContract.pdfUrl}
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
                  )}{' '}
                  Get PDF
                </Button>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setContractReviewOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={handleSendContract}
              className='gap-2'
              disabled={sendContract.isPending || !currentContract}
            >
              {sendContract.isPending ? (
                <Loader2 size={14} className='animate-spin' />
              ) : (
                <Send size={14} />
              )}{' '}
              Send to Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Job Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
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
                <PriceInput
                  value={formPrice}
                  onChange={setFormPrice}
                  placeholder='0'
                />
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
                setCreateOpen(false);
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
    </div>
  );
};

export default Jobs;
