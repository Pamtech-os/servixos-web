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
  Receipt,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogDescription,
} from '@/components/ui/dialog';
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
  useDeleteJob,
  useBulkDeleteJobs,
  useStartJob,
  useCompleteJob,
} from '@/hooks/mutations/use-jobs';
import { useCreateContract } from '@/hooks/mutations/use-contracts';
import { useContractByJob } from '@/hooks/queries/use-contracts';
import { useCreateInvoice } from '@/hooks/mutations/use-invoices';
import CreateJobDialog from '@/components/jobs/CreateJobDialog';
import DepositDialog from '@/components/jobs/DepositDialog';
import ContractReviewDialog from '@/components/jobs/ContractReviewDialog';
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
  const [contractReviewOpen, setContractReviewOpen] = useState(false);
  const [activeContractForReview, setActiveContractForReview] = useState<Contract | null>(null);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);

  const jobsQuery = useJobs({
    search: search || undefined,
    clientId: clientFilter !== 'all' ? clientFilter : undefined,
    status: statusFilter !== 'all' ? (statusFilter as JobStatus) : undefined,
    page,
    limit: ITEMS_PER_PAGE,
  });

  const clientsQuery = useClients({ limit: 50 });

  const deleteJob = useDeleteJob();
  const bulkDeleteJobs = useBulkDeleteJobs();
  const startJob = useStartJob();
  const completeJob = useCompleteJob();
  const createContract = useCreateContract();
  const jobContractQuery = useContractByJob(viewJob?._id, viewJob?.clientId);
  const jobContract = jobContractQuery.data ?? null;
  const createInvoice = useCreateInvoice();

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

  const contractSigned = jobContract?.status === 'signed';
  const contractSent = jobContract?.status === 'sent';
  const contractIsDraft = jobContract?.status === 'draft';
  const hasContract = !!jobContract;

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
          setActiveContractForReview(contract);
          setContractReviewOpen(true);
        },
        onError: (err) => {
          toast.error('Failed to create contract', { description: getApiErrorMessage(err) });
        },
      },
    );
  };

  const handleCreateInvoice = () => {
    if (!viewJob) return;
    createInvoice.mutate(
      {
        clientId: viewJob.clientId,
        jobId: viewJob._id,
        invoiceDate: new Date().toISOString(),
        lineItems: [
          {
            description: viewJob.title,
            quantity: 1,
            unitPrice: viewJob.price ?? 0,
          },
        ],
      },
      {
        onSuccess: () => {
          toast.success('Invoice created', {
            description: `Invoice for "${viewJob.title}" created successfully.`,
          });
        },
        onError: (err) => {
          toast.error('Failed to create invoice', { description: getApiErrorMessage(err) });
        },
      },
    );
  };

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
                {!hasContract && (
                  <Button
                    onClick={handleGenerateContract}
                    className='gap-2'
                    disabled={createContract.isPending}
                  >
                    {createContract.isPending ? (
                      <Loader2 size={14} className='animate-spin' />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    {createContract.isPending ? 'Generating…' : 'Generate Contract'}
                  </Button>
                )}

                {contractIsDraft && (
                  <Button
                    variant='outline'
                    className='gap-2'
                    onClick={() => {
                      setActiveContractForReview(jobContract);
                      setContractReviewOpen(true);
                    }}
                  >
                    <FileText size={14} /> Review &amp; Send Contract
                  </Button>
                )}

                {contractSent && (
                  <Badge
                    variant='outline'
                    className='gap-1.5 border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-amber-600 dark:text-amber-400'
                  >
                    <Send size={14} /> Contract Sent – Awaiting Signature
                  </Badge>
                )}

                {contractSigned && (
                  <Badge
                    variant='outline'
                    className='gap-1.5 border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-600 dark:text-emerald-400'
                  >
                    <FileText size={14} /> Contract Signed
                  </Badge>
                )}

                {contractSigned && viewJob.status === 'pending' && (
                  <Button
                    onClick={() => handleStartJob(viewJob)}
                    className='gap-2'
                    disabled={startJob.isPending}
                  >
                    {startJob.isPending ? (
                      <Loader2 size={14} className='animate-spin' />
                    ) : (
                      <Play size={14} />
                    )}
                    Start Job
                  </Button>
                )}
                {contractSigned && viewJob.status === 'in_progress' && (
                  <Button
                    onClick={() => handleCompleteJob(viewJob)}
                    className='gap-2'
                    disabled={completeJob.isPending}
                  >
                    {completeJob.isPending ? (
                      <Loader2 size={14} className='animate-spin' />
                    ) : (
                      <Briefcase size={14} />
                    )}
                    Mark Complete
                  </Button>
                )}

                {contractSigned && (
                  <Button
                    variant='outline'
                    onClick={handleCreateInvoice}
                    className='gap-2'
                    disabled={createInvoice.isPending}
                  >
                    {createInvoice.isPending ? (
                      <Loader2 size={14} className='animate-spin' />
                    ) : (
                      <Receipt size={14} />
                    )}
                    Create Invoice
                  </Button>
                )}

                {contractSigned && (
                  <Button
                    variant='outline'
                    onClick={() => setDepositDialogOpen(true)}
                    className='gap-2'
                  >
                    <DollarSign size={14} />
                    Record Deposit
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ContractReviewDialog
        open={contractReviewOpen}
        onOpenChange={(open) => {
          setContractReviewOpen(open);
          if (!open) setActiveContractForReview(null);
        }}
        contract={activeContractForReview}
        clientEmail={viewJob ? (clientEmailMap[viewJob.clientId] ?? '') : ''}
        onSent={() => {
          setActiveContractForReview(null);
          void jobContractQuery.refetch();
        }}
      />

      <DepositDialog
        open={depositDialogOpen}
        onOpenChange={setDepositDialogOpen}
        job={viewJob}
      />

      <CreateJobDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clientList={clientList}
      />
    </div>
  );
};

export default Jobs;
