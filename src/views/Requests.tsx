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
  Loader2,
  Trash2,
  Ban,
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
import { format, isValid } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import ConfirmModal from '@/components/ConfirmModal';
import ChatUI, { type ChatMessage } from '@/components/ChatUI';
import { getApiErrorMessage } from '@/common/network/http-client';
import { useServiceRequests, useRequestPriceEstimate, useRequestConversation } from '@/hooks/queries/use-requests';
import { useUpdateRequest, useDeleteRequest } from '@/hooks/mutations/use-requests';
import { buildPaginationMeta } from '@/lib/pagination';
import type { ServiceRequest, RequestStatus } from '@/lib/api-client';

const ITEMS_PER_PAGE = 10;

const safeFormat = (value: string | undefined | null, fmt: string, fallback = '—') => {
  if (!value) return fallback;
  const d = new Date(value);
  return isValid(d) ? format(d, fmt) : fallback;
};

const statusStyles: Record<RequestStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  accepted: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

const STATUS_TABS: Array<{ label: string; value: RequestStatus | undefined }> = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
];

// ─── Conversation chat wrapper ────────────────────────────────────────────────

function RequestChatSheet({
  request,
  open,
  onClose,
}: {
  request: ServiceRequest | null;
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const { isLoading: isLoadingConversation } = useRequestConversation(
    request?._id ?? '',
    open && !!request,
  );

  const handleSend = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'business',
        senderName: 'You',
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className='w-full sm:max-w-md p-0 flex flex-col'>
        <SheetHeader className='p-4 pb-0'>
          <SheetTitle className='text-base'>Chat with {request?.clientName}</SheetTitle>
          {request && (
            <p className='text-xs text-muted-foreground'>
              {request.service} &bull; {request.status}
            </p>
          )}
        </SheetHeader>
        <div className='flex-1 min-h-0 p-4 pt-2'>
          {isLoadingConversation ? (
            <div className='flex h-full items-center justify-center'>
              <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
            </div>
          ) : (
            <ChatUI
              messages={messages}
              onSendMessage={handleSend}
              clientName={request?.clientName ?? ''}
              className='h-full'
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── AI Price Estimate button ─────────────────────────────────────────────────

function AiPriceButton({
  requestId,
  hasEstimate,
  onEstimate,
}: {
  requestId: string;
  hasEstimate: boolean;
  onEstimate: (price: number) => void;
}) {
  const { refetch, isFetching } = useRequestPriceEstimate(requestId);

  const handleClick = async () => {
    const result = await refetch();
    if (result.data) {
      onEstimate(result.data.suggestedPrice);
      toast.success('AI Pricing Suggested', {
        description: `Recommended price: ${result.data.currency} ${result.data.suggestedPrice.toLocaleString()} — ${result.data.confidence} confidence.`,
      });
    }
  };

  return (
    <Button
      size='sm'
      variant='outline'
      className='gap-1.5 h-7 text-xs'
      onClick={handleClick}
      disabled={isFetching || hasEstimate}
    >
      {isFetching ? (
        <Loader2 className='h-3 w-3 animate-spin' />
      ) : (
        <Sparkles size={12} />
      )}
      {isFetching ? 'Analyzing...' : hasEstimate ? 'Price Suggested' : 'AI Suggest Price'}
    </Button>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

const Requests = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | undefined>(undefined);
  const [page, setPage] = useState(1);

  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatRequest, setChatRequest] = useState<ServiceRequest | null>(null);

  const [confirmAction, setConfirmAction] = useState<{
    type: 'accept' | 'reject' | 'cancel' | 'delete';
    request: ServiceRequest;
  } | null>(null);

  const [adjustedDate, setAdjustedDate] = useState<Date | undefined>();
  const [adjustedEndDate, setAdjustedEndDate] = useState<Date | undefined>();
  const [pricingValue, setPricingValue] = useState('');

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const minEndDate = useMemo(
    () => (adjustedDate && adjustedDate > today ? adjustedDate : today),
    [adjustedDate, today],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useServiceRequests({
    search: debouncedSearch || undefined,
    status: statusFilter,
    page,
    limit: ITEMS_PER_PAGE,
  });

  const requests = data?.data ?? [];
  const statistics = data?.statistics;
  const meta = data?.meta ?? buildPaginationMeta({ page, limit: ITEMS_PER_PAGE, total: 0 });

  const updateRequest = useUpdateRequest();
  const deleteRequest = useDeleteRequest();

  const openDetail = (req: ServiceRequest) => {
    const rawDate = new Date(req.requestedDate);
    const reqDate = isValid(rawDate) ? rawDate : today;
    reqDate.setHours(0, 0, 0, 0);
    const startDate = reqDate < today ? today : reqDate;

    const rawEnd = req.requestedEndDate ? new Date(req.requestedEndDate) : undefined;
    const reqEndDate = rawEnd && isValid(rawEnd) ? rawEnd : undefined;
    if (reqEndDate) reqEndDate.setHours(0, 0, 0, 0);
    const endDate = reqEndDate
      ? reqEndDate < startDate
        ? startDate
        : reqEndDate
      : undefined;

    setSelectedRequest(req);
    setAdjustedDate(startDate);
    setAdjustedEndDate(endDate);
    setPricingValue(req.quotedPrice != null ? String(req.quotedPrice) : '');
    setDetailOpen(true);
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    setAdjustedDate(date);
    if (date && adjustedEndDate && adjustedEndDate < date) {
      setAdjustedEndDate(date);
    }
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    const { type, request } = confirmAction;

    if (type === 'delete') {
      deleteRequest.mutate(request._id, {
        onSuccess: () => {
          toast.success('Request deleted');
          setConfirmAction(null);
          if (detailOpen && selectedRequest?._id === request._id) setDetailOpen(false);
        },
        onError: (err) => {
          toast.error('Failed to delete request', { description: getApiErrorMessage(err) });
          setConfirmAction(null);
        },
      });
      return;
    }

    if (type === 'accept') {
      const price = Number(pricingValue);
      if (!price || price <= 0) {
        toast.error('Pricing required', {
          description: 'Please set a valid price greater than 0 before accepting.',
        });
        setConfirmAction(null);
        return;
      }
    }

    const statusMap = { accept: 'accepted', reject: 'rejected', cancel: 'cancelled' } as const;
    const input =
      type === 'accept'
        ? {
            status: 'accepted' as const,
            quotedPrice: Number(pricingValue),
            startDate: adjustedDate?.toISOString(),
            endDate: adjustedEndDate?.toISOString(),
          }
        : { status: statusMap[type] };

    updateRequest.mutate(
      { id: request._id, input },
      {
        onSuccess: () => {
          toast.success(`Request ${statusMap[type]}`);
          setConfirmAction(null);
          setDetailOpen(false);
        },
        onError: (err) => {
          toast.error(`Failed to update request`, { description: getApiErrorMessage(err) });
          setConfirmAction(null);
        },
      },
    );
  };

  const summaryCards = [
    {
      title: 'Total',
      value: statistics?.total ?? 0,
      icon: Inbox,
      gradient: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
    },
    {
      title: 'Pending',
      value: statistics?.pending ?? 0,
      icon: Clock,
      gradient: 'linear-gradient(135deg, rgb(245 158 11), rgb(251 191 36))',
    },
    {
      title: 'Accepted',
      value: statistics?.accepted ?? 0,
      icon: CheckCircle2,
      gradient: 'linear-gradient(135deg, rgb(16 185 129), rgb(52 211 153))',
    },
    {
      title: 'Rejected',
      value: statistics?.rejected ?? 0,
      icon: XCircle,
      gradient: 'linear-gradient(135deg, hsl(var(--destructive)), hsl(var(--destructive) / 0.7))',
    },
  ];

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='font-display text-2xl font-bold md:text-3xl'>Requests</h1>
        <p className='text-sm text-muted-foreground'>
          Manage incoming service requests from clients.
        </p>
      </div>

      {/* Summary cards */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {summaryCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card>
              <CardContent className='relative p-6'>
                {isLoading ? (
                  <>
                    <Skeleton className='mb-2 h-4 w-24' />
                    <Skeleton className='h-8 w-16' />
                  </>
                ) : (
                  <>
                    <div
                      className='absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground shadow-sm'
                      style={{ background: stat.gradient }}
                    >
                      <stat.icon size={20} />
                    </div>
                    <p className='text-sm font-medium text-muted-foreground'>{stat.title}</p>
                    <p className='mt-1 font-display text-2xl font-bold'>{stat.value}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Request list */}
      <Card>
        <CardHeader className='flex flex-col gap-3'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <CardTitle className='text-base'>All Requests</CardTitle>
            <div className='relative w-full sm:w-64'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Search requests...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9'
              />
            </div>
          </div>

          {/* Status tabs */}
          <div className='flex flex-wrap gap-1.5'>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.label}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === tab.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className='space-y-3'>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className='h-16 w-full rounded-lg' />
              ))}
            </div>
          ) : (
            <>
              <div className='space-y-3'>
                <AnimatePresence>
                  {requests.map((req, i) => (
                    <motion.div
                      key={req._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.04 }}
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
                        <p className='text-xs text-muted-foreground mt-0.5'>
                          {safeFormat(req.createdAt, 'MMM d, yyyy')}
                        </p>
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
                          className='flex-1 gap-1.5 lg:flex-none'
                          onClick={() => {
                            setChatRequest(req);
                            setChatOpen(true);
                          }}
                        >
                          <MessageCircle size={14} /> Chat
                        </Button>
                        {req.status === 'pending' && (
                          <>
                            <Button
                              size='sm'
                              className='flex-1 gap-1.5 bg-emerald-600 text-primary-foreground hover:bg-emerald-700 lg:flex-none'
                              onClick={() => {
                                setSelectedRequest(req);
                                setPricingValue(req.quotedPrice != null ? String(req.quotedPrice) : '');
                                setConfirmAction({ type: 'accept', request: req });
                              }}
                            >
                              <CheckCircle2 size={14} /> Accept
                            </Button>
                            <Button
                              variant='destructive'
                              size='sm'
                              className='flex-1 gap-1.5 lg:flex-none'
                              onClick={() => setConfirmAction({ type: 'reject', request: req })}
                            >
                              <Ban size={14} /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {requests.length === 0 && (
                  <p className='py-8 text-center text-sm text-muted-foreground'>
                    No requests found.
                  </p>
                )}
              </div>

              <PaginationControls
                meta={meta}
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

      {/* Detail dialog */}
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
                  {selectedRequest.clientPhone && (
                    <p className='text-xs text-muted-foreground'>{selectedRequest.clientPhone}</p>
                  )}
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

              {/* Date pickers */}
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                <div>
                  <p className='text-xs font-medium text-muted-foreground mb-1'>Start Date</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        className='w-full justify-start gap-1.5 text-left font-normal text-xs'
                        disabled={selectedRequest.status !== 'pending'}
                      >
                        <CalendarIcon size={12} />
                        {adjustedDate && isValid(adjustedDate) ? format(adjustedDate, 'MMM d, yyyy') : 'Pick'}
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
                        disabled={selectedRequest.status !== 'pending'}
                      >
                        <CalendarIcon size={12} />
                        {adjustedEndDate && isValid(adjustedEndDate) ? format(adjustedEndDate, 'MMM d, yyyy') : 'Pick'}
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
                    <AiPriceButton
                      requestId={selectedRequest._id}
                      hasEstimate={selectedRequest.hasAiPriceEstimate}
                      onEstimate={(price) => setPricingValue(String(price))}
                    />
                  )}
                </div>
                <div className='flex items-center gap-2'>
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
                    Price is required before accepting.
                  </p>
                )}
              </div>

              {/* Client message */}
              {selectedRequest.message && (
                <div>
                  <p className='text-xs font-medium text-muted-foreground mb-1'>Message</p>
                  <div className='rounded-lg bg-muted/50 p-2.5 text-sm'>{selectedRequest.message}</div>
                </div>
              )}

              {/* Actions */}
              <div className='flex flex-col gap-2 sm:flex-row'>
                <Button
                  variant='outline'
                  className='w-full gap-1.5 sm:flex-1'
                  onClick={() => {
                    setDetailOpen(false);
                    setChatRequest(selectedRequest);
                    setChatOpen(true);
                  }}
                >
                  <MessageCircle size={14} /> Chat with Client
                </Button>
                {selectedRequest.status === 'pending' && (
                  <>
                    <Button
                      className='w-full gap-1.5 bg-emerald-600 text-primary-foreground hover:bg-emerald-700 sm:flex-1'
                      onClick={() =>
                        setConfirmAction({ type: 'accept', request: selectedRequest })
                      }
                    >
                      <CheckCircle2 size={14} /> Accept
                    </Button>
                    <Button
                      variant='destructive'
                      className='w-full gap-1.5 sm:flex-1'
                      onClick={() =>
                        setConfirmAction({ type: 'reject', request: selectedRequest })
                      }
                    >
                      <Ban size={14} /> Reject
                    </Button>
                  </>
                )}
                {(selectedRequest.status === 'pending' || selectedRequest.status === 'accepted') && (
                  <Button
                    variant='outline'
                    className='w-full gap-1.5 text-muted-foreground sm:flex-1'
                    onClick={() =>
                      setConfirmAction({ type: 'cancel', request: selectedRequest })
                    }
                  >
                    <XCircle size={14} /> Cancel
                  </Button>
                )}
                <Button
                  variant='outline'
                  className='w-full gap-1.5 text-destructive hover:bg-destructive/10 sm:w-auto'
                  onClick={() =>
                    setConfirmAction({ type: 'delete', request: selectedRequest })
                  }
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat sheet */}
      <RequestChatSheet
        request={chatRequest}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      {/* Confirm modals */}
      <ConfirmModal
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction?.type === 'accept'
            ? 'Accept this request?'
            : confirmAction?.type === 'reject'
              ? 'Reject this request?'
              : confirmAction?.type === 'cancel'
                ? 'Cancel this request?'
                : 'Delete this request?'
        }
        description={
          confirmAction?.type === 'accept'
            ? 'This will confirm the booking. A client record and job will be created automatically.'
            : confirmAction?.type === 'reject'
              ? 'The client will not be onboarded. This action cannot be undone.'
              : confirmAction?.type === 'cancel'
                ? 'This will cancel the request.'
                : 'This will permanently remove the request.'
        }
        confirmLabel={
          confirmAction?.type === 'accept'
            ? 'Accept'
            : confirmAction?.type === 'reject'
              ? 'Reject'
              : confirmAction?.type === 'cancel'
                ? 'Cancel Request'
                : 'Delete'
        }
        variant={
          confirmAction?.type === 'accept' ? 'default' : 'destructive'
        }
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};

export default Requests;
