'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  CalendarIcon,
  MessageCircle,
  Sparkles,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import PaginationControls from '@/components/ui/pagination-controls';
import { format } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import ConfirmModal from '@/components/ConfirmModal';
import ChatUI, { type ChatMessage } from '@/components/ChatUI';
import { paginateArray } from '@/lib/pagination';

interface ServiceRequest {
  id: string;
  clientName: string;
  clientEmail: string;
  service: string;
  date: string;
  endDate?: string;
  message: string;
  status: 'pending' | 'accepted' | 'cancelled';
  createdAt: string;
  pricing?: number;
  hasAiPriceEstimate?: boolean;
}

const initialRequests: ServiceRequest[] = [
  {
    id: 'r1',
    clientName: 'Alice Thompson',
    clientEmail: 'alice@example.com',
    service: 'House Cleaning',
    date: '2024-04-20',
    endDate: '2024-04-20',
    message: "I'd like a deep clean for my 3-bedroom apartment before the weekend.",
    status: 'pending',
    createdAt: '2 hours ago',
  },
  {
    id: 'r2',
    clientName: 'David Park',
    clientEmail: 'david@example.com',
    service: 'Plumbing Repair',
    date: '2024-04-22',
    message: 'Kitchen sink is leaking. Need urgent repair.',
    status: 'pending',
    createdAt: '5 hours ago',
  },
  {
    id: 'r3',
    clientName: 'Maria Gonzalez',
    clientEmail: 'maria@example.com',
    service: 'Lawn Mowing',
    date: '2024-04-18',
    message: 'Weekly lawn maintenance for front and back yard.',
    status: 'accepted',
    createdAt: '1 day ago',
    pricing: 150,
  },
  {
    id: 'r4',
    clientName: 'Robert Kim',
    clientEmail: 'robert@example.com',
    service: 'Electrical Work',
    date: '2024-04-25',
    message: 'Need ceiling fan installed in living room.',
    status: 'pending',
    createdAt: '3 hours ago',
  },
  {
    id: 'r5',
    clientName: 'Jessica Liu',
    clientEmail: 'jessica@example.com',
    service: 'Painting',
    date: '2024-04-15',
    message: 'Interior painting for 2 rooms - light grey color.',
    status: 'cancelled',
    createdAt: '3 days ago',
  },
  {
    id: 'r6',
    clientName: 'Thomas Wright',
    clientEmail: 'thomas@example.com',
    service: 'AC Repair',
    date: '2024-04-19',
    message: 'AC unit not cooling properly. Needs servicing.',
    status: 'accepted',
    createdAt: '1 day ago',
    pricing: 320,
  },
  {
    id: 'r7',
    clientName: 'Emily Chen',
    clientEmail: 'emily@example.com',
    service: 'Carpet Cleaning',
    date: '2024-04-23',
    message: 'Deep carpet cleaning for the entire first floor.',
    status: 'pending',
    createdAt: '6 hours ago',
  },
  {
    id: 'r8',
    clientName: 'Nathan Brooks',
    clientEmail: 'nathan@example.com',
    service: 'Window Cleaning',
    date: '2024-04-21',
    message: 'External window cleaning for 2-story house.',
    status: 'pending',
    createdAt: '8 hours ago',
  },
];

const initialChatMessages: Record<string, ChatMessage[]> = {
  r1: [
    {
      id: 'cm1',
      sender: 'client',
      senderName: 'Alice Thompson',
      content: "Hi! I'd like to book a deep clean for this Saturday.",
      timestamp: '2:30 PM',
    },
    {
      id: 'cm2',
      sender: 'business',
      senderName: 'Servix Team',
      content: "Hello Alice! We'd be happy to help. How many rooms need cleaning?",
      timestamp: '2:35 PM',
    },
    {
      id: 'cm3',
      sender: 'client',
      senderName: 'Alice Thompson',
      content: '3 bedrooms, 2 bathrooms, kitchen and living room.',
      timestamp: '2:37 PM',
    },
  ],
  r2: [
    {
      id: 'cm4',
      sender: 'client',
      senderName: 'David Park',
      content: 'The kitchen sink has been leaking since yesterday. Can you come ASAP?',
      timestamp: '10:15 AM',
    },
    {
      id: 'cm5',
      sender: 'business',
      senderName: 'Servix Team',
      content: "We'll try to schedule you in tomorrow. Is morning okay?",
      timestamp: '10:20 AM',
    },
  ],
  r4: [
    {
      id: 'cm6',
      sender: 'client',
      senderName: 'Robert Kim',
      content: 'Hi, can you install a ceiling fan this week?',
      timestamp: '1:00 PM',
    },
  ],
  r7: [
    {
      id: 'cm7',
      sender: 'client',
      senderName: 'Emily Chen',
      content: 'Do you provide carpet cleaning for wool carpets?',
      timestamp: '3:15 PM',
    },
    {
      id: 'cm8',
      sender: 'client',
      senderName: 'Emily Chen',
      content: 'Also, how long does it usually take?',
      timestamp: '3:16 PM',
    },
    {
      id: 'cm9',
      sender: 'client',
      senderName: 'Emily Chen',
      content: 'One more thing - is there any special preparation needed?',
      timestamp: '3:20 PM',
    },
  ],
};

const getAISuggestedPrice = (service: string, message: string): number => {
  const prices: Record<string, number> = {
    'House Cleaning': 250,
    'Plumbing Repair': 180,
    'Lawn Mowing': 120,
    'Electrical Work': 275,
    Painting: 450,
    'AC Repair': 320,
    'Carpet Cleaning': 200,
    'Window Cleaning': 150,
  };
  const base = prices[service] || 200;
  const modifier = message.length > 50 ? 1.2 : 1.0;
  return Math.round(base * modifier);
};

const ITEMS_PER_PAGE = 5;

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  accepted: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const Requests = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ServiceRequest[]>(initialRequests);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRequest, setChatRequest] = useState<ServiceRequest | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'accept' | 'cancel';
    requestId: string;
  } | null>(null);
  const [chatMessages, setChatMessages] =
    useState<Record<string, ChatMessage[]>>(initialChatMessages);
  const [adjustedDate, setAdjustedDate] = useState<Date | undefined>();
  const [adjustedEndDate, setAdjustedEndDate] = useState<Date | undefined>();
  const [readMessages, setReadMessages] = useState<Record<string, number>>({});
  const [pricingValue, setPricingValue] = useState<string>('');
  const [aiPricingLoading, setAiPricingLoading] = useState(false);
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const minEndDate = useMemo(() => {
    if (adjustedDate && adjustedDate > today) {
      return adjustedDate;
    }
    return today;
  }, [adjustedDate, today]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(chatMessages).forEach(([reqId, msgs]) => {
      const clientMsgs = msgs.filter((m) => m.sender === 'client').length;
      const read = readMessages[reqId] || 0;
      const unread = clientMsgs - read;
      if (unread > 0) counts[reqId] = unread;
    });
    return counts;
  }, [chatMessages, readMessages]);

  const filtered = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.clientName.toLowerCase().includes(search.toLowerCase()) ||
          r.service.toLowerCase().includes(search.toLowerCase())
      ),
    [requests, search]
  );

  const pagination = useMemo(() => paginateArray(filtered, page, ITEMS_PER_PAGE), [filtered, page]);
  const { data: paginated, meta: paginationMeta } = pagination;

  useEffect(() => {
    if (page !== paginationMeta.page) {
      setPage(paginationMeta.page);
    }
  }, [page, paginationMeta.page]);

  const counts = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      accepted: requests.filter((r) => r.status === 'accepted').length,
      cancelled: requests.filter((r) => r.status === 'cancelled').length,
    }),
    [requests]
  );

  const openDetail = (req: ServiceRequest) => {
    const requestStartDate = new Date(req.date);
    requestStartDate.setHours(0, 0, 0, 0);
    const clampedStartDate = requestStartDate < today ? today : requestStartDate;

    const requestEndDate = req.endDate ? new Date(req.endDate) : undefined;
    if (requestEndDate) {
      requestEndDate.setHours(0, 0, 0, 0);
    }
    const clampedEndDate = requestEndDate
      ? requestEndDate < clampedStartDate
        ? clampedStartDate
        : requestEndDate
      : undefined;

    setSelectedRequest(req);
    setAdjustedDate(clampedStartDate);
    setAdjustedEndDate(clampedEndDate);
    setPricingValue(req.pricing ? req.pricing.toString() : '');
    setDetailOpen(true);
    const clientMsgCount = (chatMessages[req.id] || []).filter((m) => m.sender === 'client').length;
    setReadMessages((prev) => ({ ...prev, [req.id]: clientMsgCount }));
  };

  const openChat = (req: ServiceRequest) => {
    setChatRequest(req);
    setChatOpen(true);
    const clientMsgCount = (chatMessages[req.id] || []).filter((m) => m.sender === 'client').length;
    setReadMessages((prev) => ({ ...prev, [req.id]: clientMsgCount }));
  };

  const handleAISuggestPricing = async () => {
    if (!selectedRequest) return;
    setAiPricingLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    const suggested = getAISuggestedPrice(selectedRequest.service, selectedRequest.message);
    setPricingValue(suggested.toString());
    setRequests((prev) =>
      prev.map((request) =>
        request.id === selectedRequest.id
          ? { ...request, pricing: suggested, hasAiPriceEstimate: true }
          : request
      )
    );
    setSelectedRequest((prev) =>
      prev ? { ...prev, pricing: suggested, hasAiPriceEstimate: true } : prev
    );
    setAiPricingLoading(false);
    toast.success('AI Pricing Suggested', {
      description: `Recommended price: $${suggested} based on service analysis.`,
    });
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'accept') {
      const price = Number(pricingValue);
      if (!price || price <= 0) {
        toast.error('Pricing required', {
          description: 'Please set a valid price greater than $0 before accepting.',
        });
        setConfirmAction(null);
        return;
      }
    }
    setRequests((prev) =>
      prev.map((r) =>
        r.id === confirmAction.requestId
          ? {
              ...r,
              status: confirmAction.type === 'accept' ? 'accepted' : 'cancelled',
              ...(confirmAction.type === 'accept' ? { pricing: Number(pricingValue) } : {}),
            }
          : r
      )
    );
    if (selectedRequest?.id === confirmAction.requestId) {
      setSelectedRequest((prev) =>
        prev
          ? {
              ...prev,
              status: confirmAction.type === 'accept' ? 'accepted' : 'cancelled',
              ...(confirmAction.type === 'accept' ? { pricing: Number(pricingValue) } : {}),
            }
          : prev
      );
    }
    toast.success(
      `Request ${confirmAction.type === 'accept' ? 'accepted' : 'cancelled'} successfully.`
    );
    setConfirmAction(null);
  };

  const handleSendMessage = (requestId: string, content: string) => {
    const newMsg: ChatMessage = {
      id: `cm-${Date.now()}`,
      sender: 'business',
      senderName: 'Servix Team',
      content,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setChatMessages((prev) => ({
      ...prev,
      [requestId]: [...(prev[requestId] || []), newMsg],
    }));
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    setAdjustedDate(date);
    if (date && adjustedEndDate && adjustedEndDate < date) {
      setAdjustedEndDate(date);
    }
  };

  const summaryCards = [
    {
      title: 'Total Requests',
      value: counts.total,
      icon: Inbox,
      iconGradient: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
    },
    {
      title: 'Pending',
      value: counts.pending,
      icon: Clock,
      iconGradient: 'linear-gradient(135deg, rgb(245 158 11), rgb(251 191 36))',
    },
    {
      title: 'Accepted',
      value: counts.accepted,
      icon: CheckCircle2,
      iconGradient: 'linear-gradient(135deg, rgb(16 185 129), rgb(52 211 153))',
    },
    {
      title: 'Cancelled',
      value: counts.cancelled,
      icon: XCircle,
      iconGradient:
        'linear-gradient(135deg, hsl(var(--destructive)), hsl(var(--destructive) / 0.8))',
    },
  ];

  const isChatDisabled = (req: ServiceRequest) =>
    req.status === 'accepted' || req.status === 'cancelled';
  const hasAiPriceEstimate = selectedRequest?.hasAiPriceEstimate === true;

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-display text-2xl font-bold md:text-3xl'>Requests</h1>
        <p className='text-sm text-muted-foreground'>
          Manage incoming service requests from clients.
        </p>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {summaryCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            {loading ? (
              <Card>
                <CardContent className='p-6'>
                  <Skeleton className='mb-2 h-4 w-24' />
                  <Skeleton className='h-8 w-16' />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className='relative p-6'>
                  <div
                    className='absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground shadow-sm'
                    style={{ background: stat.iconGradient }}
                  >
                    <stat.icon size={20} />
                  </div>
                  <p className='text-sm font-medium text-muted-foreground'>{stat.title}</p>
                  <p className='mt-1 font-display text-2xl font-bold'>{stat.value}</p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ))}
      </div>

      {/* Request List */}
      <Card>
        <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <CardTitle className='text-base'>All Requests</CardTitle>
          <div className='relative w-full sm:w-64'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Search requests...'
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className='pl-9'
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='space-y-3'>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className='h-16 w-full rounded-lg' />
              ))}
            </div>
          ) : (
            <>
              <div className='space-y-3'>
                <AnimatePresence>
                  {paginated.map((req, i) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className='flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30 lg:flex-row lg:items-center lg:justify-between'
                    >
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <span className='font-medium text-sm'>{req.clientName}</span>
                          <Badge
                            variant='outline'
                            className={`text-xs ${statusStyles[req.status]}`}
                          >
                            {req.status}
                          </Badge>
                        </div>
                        <p className='text-sm text-muted-foreground mt-0.5'>{req.service}</p>
                        <p className='text-xs text-muted-foreground mt-0.5'>{req.createdAt}</p>
                      </div>
                      <div className='flex w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end'>
                        <Button
                          variant='outline'
                          size='sm'
                          className='flex-1 gap-1.5 lg:flex-none'
                          onClick={() => openDetail(req)}
                        >
                          <Eye size={14} /> View
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          className='relative flex-1 gap-1.5 lg:flex-none'
                          onClick={() => openChat(req)}
                        >
                          <MessageCircle size={14} /> Chat
                          {unreadCounts[req.id] && (
                            <span className='absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground'>
                              {unreadCounts[req.id]}
                            </span>
                          )}
                        </Button>
                        {req.status === 'pending' && (
                          <>
                            <Button
                              size='sm'
                              className='flex-1 gap-1.5 bg-emerald-600 text-primary-foreground hover:bg-emerald-700 lg:flex-none'
                              onClick={() => {
                                setSelectedRequest(req);
                                setPricingValue(req.pricing?.toString() || '');
                                setConfirmAction({
                                  type: 'accept',
                                  requestId: req.id,
                                });
                              }}
                            >
                              <CheckCircle2 size={14} /> Accept
                            </Button>
                            <Button
                              variant='destructive'
                              size='sm'
                              className='flex-1 gap-1.5 lg:flex-none'
                              onClick={() =>
                                setConfirmAction({
                                  type: 'cancel',
                                  requestId: req.id,
                                })
                              }
                            >
                              <XCircle size={14} /> Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {filtered.length === 0 && (
                  <p className='py-8 text-center text-sm text-muted-foreground'>
                    No requests found.
                  </p>
                )}
              </div>
              <PaginationControls
                meta={paginationMeta}
                onPageChange={setPage}
                className='mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'
                labelClassName='text-sm text-muted-foreground'
                controlsClassName='flex gap-2 self-end sm:self-auto'
                buttonSize='sm'
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog - without chat */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto backdrop-blur-xl sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <p className='text-xs font-medium text-muted-foreground'>Client</p>
                  <p className='text-sm font-semibold'>{selectedRequest.clientName}</p>
                  <p className='text-xs text-muted-foreground'>{selectedRequest.clientEmail}</p>
                </div>
                <div className='flex flex-wrap gap-4'>
                  <div>
                    <p className='text-xs font-medium text-muted-foreground'>Service</p>
                    <p className='text-sm font-semibold'>{selectedRequest.service}</p>
                  </div>
                  <div>
                    <p className='text-xs font-medium text-muted-foreground'>Status</p>
                    <Badge
                      variant='outline'
                      className={`mt-0.5 ${statusStyles[selectedRequest.status]}`}
                    >
                      {selectedRequest.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Date Adjustment */}
              <div className='space-y-2'>
                <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                  <div>
                    <p className='text-xs font-medium text-muted-foreground mb-1'>Start Date</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant='outline'
                          size='sm'
                          className='w-full justify-start gap-1.5 text-left font-normal text-xs'
                        >
                          <CalendarIcon size={12} />
                          {adjustedDate ? format(adjustedDate, 'MMM d, yyyy') : 'Pick'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0 backdrop-blur-xl' align='start'>
                        <Calendar
                          mode='single'
                          startMonth={today}
                          defaultMonth={adjustedDate && adjustedDate > today ? adjustedDate : today}
                          selected={adjustedDate}
                          onSelect={handleStartDateSelect}
                          disabled={{ before: today }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <p className='text-xs font-medium text-muted-foreground mb-1'>End Date</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant='outline'
                          size='sm'
                          className='w-full justify-start gap-1.5 text-left font-normal text-xs'
                        >
                          <CalendarIcon size={12} />
                          {adjustedEndDate ? format(adjustedEndDate, 'MMM d, yyyy') : 'Pick'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0 backdrop-blur-xl' align='start'>
                        <Calendar
                          mode='single'
                          startMonth={minEndDate}
                          defaultMonth={
                            adjustedEndDate && adjustedEndDate > minEndDate
                              ? adjustedEndDate
                              : minEndDate
                          }
                          selected={adjustedEndDate}
                          onSelect={setAdjustedEndDate}
                          disabled={{ before: minEndDate }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className='rounded-lg border border-border p-3 space-y-2'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <p className='flex items-center gap-1.5 text-xs font-semibold'>
                    <DollarSign size={14} className='text-primary' /> Pricing
                    {selectedRequest.status === 'pending' && (
                      <span className='text-destructive'>*</span>
                    )}
                  </p>
                  {selectedRequest.status === 'pending' && (
                    <Button
                      size='sm'
                      variant='outline'
                      className='gap-1.5 h-7 text-xs'
                      onClick={handleAISuggestPricing}
                      disabled={aiPricingLoading || hasAiPriceEstimate}
                    >
                      {aiPricingLoading ? (
                        <motion.div
                          className='h-3 w-3 rounded-full border-2 border-primary border-t-transparent'
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        />
                      ) : (
                        <Sparkles size={12} />
                      )}
                      {aiPricingLoading
                        ? 'Analyzing...'
                        : hasAiPriceEstimate
                          ? 'Price Suggested'
                          : 'AI Suggest Price'}
                    </Button>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-bold text-muted-foreground'>$</span>
                  <Input
                    type='number'
                    min={1}
                    placeholder='Enter price'
                    value={pricingValue}
                    onChange={(e) => setPricingValue(e.target.value)}
                    disabled={selectedRequest.status !== 'pending'}
                    className='h-8 text-sm'
                  />
                </div>
                {selectedRequest.status === 'pending' && !pricingValue && (
                  <p className='text-[10px] text-destructive'>
                    Price is required before accepting this request.
                  </p>
                )}
              </div>

              {/* Client Message */}
              <div>
                <p className='text-xs font-medium text-muted-foreground mb-1'>Client Message</p>
                <div className='rounded-lg bg-muted/50 p-2.5 text-sm'>
                  {selectedRequest.message}
                </div>
              </div>

              {/* Actions */}
              <div className='flex flex-col gap-2 sm:flex-row'>
                {!isChatDisabled(selectedRequest) && (
                  <Button
                    variant='outline'
                    className='w-full gap-1.5 sm:flex-1'
                    onClick={() => {
                      setDetailOpen(false);
                      openChat(selectedRequest);
                    }}
                  >
                    <MessageCircle size={14} /> Chat with Client
                  </Button>
                )}
                {selectedRequest.status === 'pending' && (
                  <>
                    <Button
                      className='w-full gap-1.5 bg-emerald-600 text-primary-foreground hover:bg-emerald-700 sm:flex-1'
                      onClick={() =>
                        setConfirmAction({
                          type: 'accept',
                          requestId: selectedRequest.id,
                        })
                      }
                    >
                      <CheckCircle2 size={14} /> Accept
                    </Button>
                    <Button
                      variant='destructive'
                      className='w-full gap-1.5 sm:flex-1'
                      onClick={() =>
                        setConfirmAction({
                          type: 'cancel',
                          requestId: selectedRequest.id,
                        })
                      }
                    >
                      <XCircle size={14} /> Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Sheet - full height slide-out panel */}
      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent className='w-full sm:max-w-md p-0 flex flex-col'>
          <SheetHeader className='p-4 pb-0'>
            <SheetTitle className='text-base'>
              Chat with {chatRequest?.clientName}
              {chatRequest && isChatDisabled(chatRequest) && (
                <Badge variant='outline' className='ml-2 text-[10px]'>
                  Disabled
                </Badge>
              )}
            </SheetTitle>
            {chatRequest && (
              <p className='text-xs text-muted-foreground'>
                {chatRequest.service} • {chatRequest.status}
              </p>
            )}
          </SheetHeader>
          {chatRequest && (
            <div className='flex-1 min-h-0 p-4 pt-2'>
              {isChatDisabled(chatRequest) ? (
                <div className='flex h-full items-center justify-center'>
                  <div className='text-center space-y-2'>
                    <MessageCircle className='mx-auto h-10 w-10 text-muted-foreground dark:text-muted-foreground/60' />
                    <p className='text-sm text-muted-foreground'>
                      Chat is disabled after the request has been {chatRequest.status}.
                    </p>
                  </div>
                </div>
              ) : (
                <ChatUI
                  messages={chatMessages[chatRequest.id] || []}
                  onSendMessage={(content) => handleSendMessage(chatRequest.id, content)}
                  clientName={chatRequest.clientName}
                  className='h-full'
                />
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Confirm Modal */}
      <ConfirmModal
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction?.type === 'accept' ? 'Accept this request?' : 'Cancel this request?'}
        description={
          confirmAction?.type === 'accept'
            ? 'This will confirm the booking and notify the client.'
            : 'This will cancel the request. The client will be notified.'
        }
        confirmLabel={confirmAction?.type === 'accept' ? 'Accept' : 'Cancel Request'}
        variant={confirmAction?.type === 'cancel' ? 'destructive' : 'default'}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};

export default Requests;
