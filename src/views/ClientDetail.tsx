'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  FileText,
  FolderOpen,
  ScrollText,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ChatUI, { type ChatMessage } from '@/components/ChatUI';
import {
  mockClients,
  mockInvoices,
  mockJobs,
  mockFiles,
  mockContracts,
  mockMessages,
} from '@/lib/mock-data';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  paid: 'bg-green-500/10 text-green-600 dark:text-green-400',
  pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  partial: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  in_progress: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  completed: 'bg-green-500/10 text-green-600 dark:text-green-400',
  signed: 'bg-green-500/10 text-green-600 dark:text-green-400',
};

const ClientDetail = () => {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === 'string' ? params.id : '';
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const client = mockClients.find((c) => c.id === id);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const clientMessages = mockMessages.filter((m) => m.clientId === id);
    const businessName = 'Servix Team';
    const convertedMessages: ChatMessage[] = [...clientMessages].reverse().map((msg) => {
      const isBusinessSender = /servix|team|business|support/i.test(msg.sender);
      return {
        id: `chat-${msg.id}`,
        sender: isBusinessSender ? 'business' : 'client',
        senderName: msg.sender,
        content: msg.content,
        timestamp: msg.timeSent,
      };
    });

    const hasClientMessage = convertedMessages.some((msg) => msg.sender === 'client');
    if (!hasClientMessage && client) {
      convertedMessages.unshift({
        id: `chat-${id}-client-intro`,
        sender: 'client',
        senderName: client.fullName,
        content: 'Hi Servix Team, I wanted to check in on the latest update for my project.',
        timestamp: 'Yesterday',
      });
    }

    if (convertedMessages.length === 0 && client) {
      convertedMessages.push({
        id: `chat-${id}-welcome`,
        sender: 'business',
        senderName: businessName,
        content: `Hello ${client.fullName.split(' ')[0]}, this is the start of your conversation history with ${businessName}.`,
        timestamp: 'Now',
      });
    }

    setChatMessages(convertedMessages);
  }, [client, id]);

  const handleSendMessage = (content: string) => {
    const text = content.trim();
    if (!text) return;

    const newMessage: ChatMessage = {
      id: `chat-${Date.now()}`,
      sender: 'business',
      senderName: 'Servix Team',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newMessage]);
  };

  if (!client && !loading) {
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

  const invoices = mockInvoices.filter((inv) => inv.clientId === id);
  const jobs = mockJobs.filter((j) => j.clientId === id);
  const files = mockFiles.filter((f) => f.clientId === id);
  const contracts = mockContracts.filter((c) => c.clientId === id);

  const formatStatus = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const totalSpent = client?.totalSpent || 0;
  const invoiceCount = invoices.length;
  const fileCount = files.length;
  const contractCount = contracts.length;

  const quickStats = [
    {
      title: 'Total Spent',
      value: `$${totalSpent.toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Invoices',
      value: invoiceCount.toString(),
      icon: FileText,
      gradient: 'from-primary to-secondary',
    },
    {
      title: 'Files',
      value: fileCount.toString(),
      icon: FolderOpen,
      gradient: 'from-violet-500 to-violet-600',
    },
    {
      title: 'Contracts',
      value: contractCount.toString(),
      icon: ScrollText,
      gradient: 'from-amber-500 to-amber-600',
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
        <Button
          size='sm'
          className='gap-1.5'
          onClick={() => toast.info('Send invoice feature coming soon!')}
        >
          <Send size={14} /> Send Invoice
        </Button>
      </div>

      {/* Client Info Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className='p-6'>
            {loading ? (
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
                  <div className='flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-lg font-bold text-primary-foreground'>
                    {client!.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <h1 className='font-display text-xl font-bold'>{client!.fullName}</h1>
                    <div className='mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground'>
                      <span className='flex items-center gap-1'>
                        <Mail size={14} /> {client!.email}
                      </span>
                      <span className='flex items-center gap-1'>
                        <Phone size={14} /> {client!.phone}
                      </span>
                      <span className='flex items-center gap-1'>
                        <MapPin size={14} /> {client!.jobLocation}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stat Cards */}
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
        {quickStats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            {loading ? (
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
                    className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${stat.gradient} text-primary-foreground`}
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
        <Tabs defaultValue='invoices'>
          <TabsList className='w-full flex-wrap justify-start'>
            <TabsTrigger value='invoices'>Invoices</TabsTrigger>
            <TabsTrigger value='jobs'>Jobs</TabsTrigger>
            <TabsTrigger value='files'>Files</TabsTrigger>
            <TabsTrigger value='contracts'>Contracts</TabsTrigger>
            <TabsTrigger value='messages'>Messages</TabsTrigger>
          </TabsList>

          {/* Invoices */}
          <TabsContent value='invoices'>
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className='space-y-3'>
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className='h-12 w-full' />
                    ))}
                  </div>
                ) : invoices.length === 0 ? (
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
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              statusColors[inv.status]
                            }`}
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

          {/* Jobs */}
          <TabsContent value='jobs'>
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className='space-y-3'>
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className='h-12 w-full' />
                    ))}
                  </div>
                ) : jobs.length === 0 ? (
                  <p className='py-4 text-center text-sm text-muted-foreground'>No jobs found.</p>
                ) : (
                  <div className='space-y-3'>
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className='flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between'
                      >
                        <div>
                          <p className='font-medium'>{job.title}</p>
                          <p className='text-sm text-muted-foreground'>{job.date}</p>
                        </div>
                        <span
                          className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusColors[job.status]
                          }`}
                        >
                          {formatStatus(job.status)}
                        </span>
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
                {loading ? (
                  <div className='space-y-3'>
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className='h-12 w-full' />
                    ))}
                  </div>
                ) : files.length === 0 ? (
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
                {loading ? (
                  <div className='space-y-3'>
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className='h-12 w-full' />
                    ))}
                  </div>
                ) : contracts.length === 0 ? (
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
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              statusColors[contract.status]
                            }`}
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
                {loading ? (
                  <div className='space-y-3 px-6 pb-6 pt-4'>
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className='h-16 w-full' />
                    ))}
                  </div>
                ) : (
                  <div className='h-[400px] px-4 pb-4 pt-2 sm:h-[440px] sm:px-6 sm:pb-6 sm:pt-3'>
                    <ChatUI
                      messages={chatMessages}
                      onSendMessage={handleSendMessage}
                      clientName={client?.fullName ?? 'Client'}
                      className='h-full border-border/70'
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default ClientDetail;
