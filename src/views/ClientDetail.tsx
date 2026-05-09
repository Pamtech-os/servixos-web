'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  Mail,
  Phone,
  FileText,
  Briefcase,
  ScrollText,
  Send,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClient } from '@/hooks/queries/use-clients';
import { useJobs } from '@/hooks/queries/use-jobs';
import { useExportClient } from '@/hooks/mutations/use-clients';
import { mockInvoices, mockFiles, mockContracts, mockMessages } from '@/lib/mock-data';
import { toast } from '@/components/ui/sonner';
import { getApiErrorMessage } from '@/common/network/http-client';
import ChatUI, { type ChatMessage } from '@/components/ChatUI';
import { format } from 'date-fns';
import type { JobStatus } from '@/lib/api-client';

const statusColors: Record<string, string> = {
  paid: 'bg-green-500/10 text-green-600 dark:text-green-400',
  pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  partial: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  in_progress: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  completed: 'bg-green-500/10 text-green-600 dark:text-green-400',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
  signed: 'bg-green-500/10 text-green-600 dark:text-green-400',
};

const jobStatusLabel = (s: JobStatus) => {
  switch (s) {
    case 'pending': return 'Pending';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
  }
};

const formatStatus = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const ClientDetail = () => {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === 'string' ? params.id : '';
  const router = useRouter();

  const { data: client, isLoading: clientLoading } = useClient(id);
  const { data: jobsData, isLoading: jobsLoading } = useJobs({ clientId: id, limit: 50 });
  const exportClient = useExportClient();

  const jobList = jobsData?.data ?? [];

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const clientMessages = mockMessages.filter((m) => m.clientId === id);
    return [...clientMessages].reverse().map((msg) => {
      const isBusinessSender = /servix|team|business|support/i.test(msg.sender);
      return {
        id: `chat-${msg.id}`,
        sender: isBusinessSender ? 'business' : ('client' as const),
        senderName: msg.sender,
        content: msg.content,
        timestamp: msg.timeSent,
      };
    });
  });

  const invoices = mockInvoices.filter((inv) => inv.clientId === id);
  const files = mockFiles.filter((f) => f.clientId === id);
  const contracts = mockContracts.filter((c) => c.clientId === id);

  const handleSendMessage = (content: string) => {
    const text = content.trim();
    if (!text) return;
    setChatMessages((prev) => [
      ...prev,
      {
        id: `chat-${Date.now()}`,
        sender: 'business',
        senderName: 'Servix Team',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleExport = () => {
    exportClient.mutate(id, {
      onSuccess: ({ exportUrl }) => {
        window.open(exportUrl, '_blank', 'noreferrer');
        toast.success('Export ready', { description: 'Client data has been exported.' });
      },
      onError: (err) => {
        toast.error('Export failed', { description: getApiErrorMessage(err) });
      },
    });
  };

  if (!client && !clientLoading) {
    return (
      <div className='flex flex-col items-center justify-center py-20'>
        <p className='text-muted-foreground'>Client not found.</p>
        <button
          onClick={() => router.push('/clients')}
          className='mt-4 text-sm text-primary hover:underline'
        >
          Back to Clients
        </button>
      </div>
    );
  }

  const quickStats = [
    {
      title: 'Jobs',
      value: jobsLoading ? '...' : String(jobsData?.meta.total ?? jobList.length),
      icon: Briefcase,
      iconGradient: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
    },
    {
      title: 'Invoices',
      value: String(invoices.length),
      icon: FileText,
      iconGradient: 'linear-gradient(135deg, rgb(16 185 129), rgb(5 150 105))',
    },
    {
      title: 'Contracts',
      value: String(contracts.length),
      icon: ScrollText,
      iconGradient: 'linear-gradient(135deg, rgb(245 158 11), rgb(217 119 6))',
    },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <button
          onClick={() => router.push('/clients')}
          className='flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground'
        >
          <ArrowLeft size={16} /> Back to Clients
        </button>
        <div className='flex items-center gap-2'>
          <Button
            size='sm'
            variant='outline'
            className='gap-1.5'
            onClick={handleExport}
            disabled={exportClient.isPending}
          >
            {exportClient.isPending ? (
              <Loader2 size={14} className='animate-spin' />
            ) : (
              <ExternalLink size={14} />
            )}{' '}
            Export Data
          </Button>
          <Button
            size='sm'
            className='gap-1.5'
            onClick={() => toast.info('Send invoice feature coming soon!')}
          >
            <Send size={14} /> Send Invoice
          </Button>
        </div>
      </div>

      {/* Client Info Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className='p-6'>
            {clientLoading ? (
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
                <Skeleton className='h-16 w-16 rounded-full' />
                <div className='space-y-2'>
                  <Skeleton className='h-6 w-48' />
                  <Skeleton className='h-4 w-64' />
                  <Skeleton className='h-4 w-40' />
                </div>
              </div>
            ) : (
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
                <div className='flex items-center gap-4'>
                  <div className='gradient-bg flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-primary-foreground'>
                    {client!.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <h1 className='font-display text-xl font-bold'>{client!.name}</h1>
                    <div className='mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground'>
                      <span className='flex items-center gap-1'>
                        <Mail size={14} /> {client!.email}
                      </span>
                      {client!.phone && (
                        <span className='flex items-center gap-1'>
                          <Phone size={14} /> {client!.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stat Cards */}
      <div className='grid grid-cols-3 gap-4'>
        {quickStats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            {clientLoading ? (
              <Card>
                <CardContent className='p-4'>
                  <Skeleton className='mb-2 h-4 w-16' />
                  <Skeleton className='h-6 w-12' />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className='relative p-4'>
                  <div
                    className='absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground shadow-sm'
                    style={{ background: stat.iconGradient }}
                  >
                    <stat.icon size={16} />
                  </div>
                  <p className='text-xs font-medium text-muted-foreground'>{stat.title}</p>
                  <p className='mt-1 font-display text-lg font-bold'>{stat.value}</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue='jobs'>
          <TabsList className='w-full flex-wrap justify-start'>
            <TabsTrigger value='jobs'>Jobs</TabsTrigger>
            <TabsTrigger value='invoices'>Invoices</TabsTrigger>
            <TabsTrigger value='files'>Files</TabsTrigger>
            <TabsTrigger value='contracts'>Contracts</TabsTrigger>
            <TabsTrigger value='messages'>Messages</TabsTrigger>
          </TabsList>

          {/* Jobs */}
          <TabsContent value='jobs'>
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className='space-y-3'>
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className='h-12 w-full' />
                    ))}
                  </div>
                ) : jobList.length === 0 ? (
                  <p className='py-4 text-center text-sm text-muted-foreground'>No jobs found.</p>
                ) : (
                  <div className='space-y-3'>
                    {jobList.map((job) => (
                      <div
                        key={job._id}
                        className='flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between'
                      >
                        <div>
                          <p className='font-medium'>{job.title}</p>
                          <p className='text-sm text-muted-foreground'>
                            {format(new Date(job.scheduledDate), 'PP')}
                          </p>
                        </div>
                        <span
                          className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[job.status]}`}
                        >
                          {jobStatusLabel(job.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices */}
          <TabsContent value='invoices'>
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className='py-4 text-center text-sm text-muted-foreground'>
                    No invoices found.
                  </p>
                ) : (
                  <div className='space-y-3'>
                    {invoices.map((inv) => (
                      <div
                        key={inv.id}
                        className='flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between'
                      >
                        <div>
                          <p className='font-medium'>{inv.invoiceNumber}</p>
                          <p className='text-sm text-muted-foreground'>{inv.date}</p>
                        </div>
                        <div className='flex items-center gap-3'>
                          <span className='font-display font-semibold'>
                            ${inv.price.toLocaleString()}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[inv.status]}`}
                          >
                            {formatStatus(inv.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files */}
          <TabsContent value='files'>
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Files</CardTitle>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <p className='py-4 text-center text-sm text-muted-foreground'>No files found.</p>
                ) : (
                  <div className='space-y-3'>
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className='flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between'
                      >
                        <div>
                          <p className='font-medium'>
                            {file.filename}.{file.format}
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            {file.filesize} · {file.dateSent}
                          </p>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Badge variant='outline' className='uppercase'>
                            {file.format}
                          </Badge>
                          <button className='rounded-lg p-2 text-primary transition-colors hover:bg-primary/10'>
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contracts */}
          <TabsContent value='contracts'>
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                {contracts.length === 0 ? (
                  <p className='py-4 text-center text-sm text-muted-foreground'>
                    No contracts found.
                  </p>
                ) : (
                  <div className='space-y-3'>
                    {contracts.map((contract) => (
                      <div
                        key={contract.id}
                        className='flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between'
                      >
                        <div>
                          <p className='font-medium'>{contract.name}</p>
                          <p className='text-sm text-muted-foreground'>{contract.date}</p>
                        </div>
                        <div className='flex items-center gap-3'>
                          <span className='font-display font-semibold'>
                            ${contract.amount.toLocaleString()}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[contract.status]}`}
                          >
                            {formatStatus(contract.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages */}
          <TabsContent value='messages' className='mt-1'>
            <Card>
              <CardContent className='p-0'>
                <div className='h-[400px] px-4 pb-4 pt-2 sm:h-[440px] sm:px-6 sm:pb-6 sm:pt-3'>
                  <ChatUI
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                    clientName={client?.name ?? 'Client'}
                    className='h-full border-border/70'
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default ClientDetail;
