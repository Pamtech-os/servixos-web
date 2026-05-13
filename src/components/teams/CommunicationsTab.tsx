'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Megaphone, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import PaginationControls from '@/components/ui/pagination-controls';
import { getPaginationRange } from '@/lib/pagination';
import { toast } from '@/components/ui/sonner';
import { useAnnouncements } from '@/hooks/queries/use-announcements';
import { useCreateAnnouncement } from '@/hooks/mutations/use-announcements';
import { useTeamMessages } from '@/hooks/queries/use-team-messages';
import { useSendTeamMessage } from '@/hooks/mutations/use-team-messages';
import { useTeamSocket, type TypingUser } from '@/hooks/use-team-socket';
import { useAuth } from '@/contexts/AuthContext';
import { getApiErrorMessage } from '@/common/network/http-client';
import { useQueryClient, useQuery, type InfiniteData } from '@tanstack/react-query';
import type { TeamMessage } from '@/lib/api-client';
import type { PaginationMeta } from '@/lib/pagination';

type MessagePage = { data: TeamMessage[]; meta: PaginationMeta };

const TYPING_DEBOUNCE_MS = 2000;

const ANN_LIMIT = 4;

// Animated bouncing dots for the typing indicator
const TypingDots = () => (
  <span className='flex items-end gap-[3px]'>
    {[0, 160, 320].map((delay) => (
      <span
        key={delay}
        className='h-1 w-1 rounded-full bg-current animate-bounce'
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </span>
);

function buildTypingLabel(users: TypingUser[]): string {
  if (users.length === 1) return `${users[0].userName} is typing`;
  if (users.length === 2) return `${users[0].userName} and ${users[1].userName} are typing`;
  return `${users[0].userName} and ${users.length - 1} others are typing`;
}

const CommunicationsTab = () => {
  const { auth } = useAuth();
  const queryClient = useQueryClient();
  const [chatInput, setChatInput] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<TeamMessage[]>([]);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [annForm, setAnnForm] = useState({ title: '', description: '' });
  const [annPage, setAnnPage] = useState(1);

  // Chat scroll management refs
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const isNearBottomRef = useRef(true);
  const isInitialLoadRef = useRef(true);
  const seenMessageIds = useRef<Set<string>>(new Set());

  // Typing emit state
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEmittingTypingRef = useRef(false);

  const {
    data: messagesData,
    isLoading: messagesLoading,
    isError: messagesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTeamMessages();

  const { data: announcementsData, isLoading: announcementsLoading } = useAnnouncements({
    page: annPage,
    limit: ANN_LIMIT,
  });
  const sendMessage = useSendTeamMessage();
  const createAnnouncement = useCreateAnnouncement();
  const socketRef = useTeamSocket(seenMessageIds);

  const currentUserId = auth.user?.id ?? '';
  const currentUserName = auth.user
    ? `${auth.user.firstName} ${auth.user.lastName}`.trim()
    : '';
  const businessId = auth.user?.businessId ?? '';

  // Typing users from socket-maintained cache, excluding self
  const { data: rawTypingUsers = [] } = useQuery<TypingUser[]>({
    queryKey: ['team-typing', businessId],
    queryFn: () => [],
    initialData: [],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    enabled: false,
  });
  const typingUsers = rawTypingUsers.filter((u) => u.userId !== currentUserId);
  const typingLabel = typingUsers.length > 0 ? buildTypingLabel(typingUsers) : null;

  // API returns messages ascending (oldest first); flatten pages in order
  const messageList: TeamMessage[] = useMemo(() => {
    if (!messagesData?.pages?.length) return [];
    return messagesData.pages.flatMap((page) =>
      Array.isArray(page?.data) ? page.data : []
    );
  }, [messagesData]);

  const displayMessages = useMemo(
    () => [...messageList, ...optimisticMessages],
    [messageList, optimisticMessages]
  );

  const announcementList = announcementsData?.data ?? [];
  const announcementMeta = announcementsData?.meta;

  // Seed seenIds whenever new pages are loaded
  useEffect(() => {
    messagesData?.pages.forEach((page) => page.data.forEach((m) => seenMessageIds.current.add(m.id)));
  }, [messagesData]);

  // Unified scroll effect: restore position after older-page load, or scroll to bottom
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el || messagesLoading) return;

    if (prevScrollHeightRef.current > 0) {
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
    } else if (isInitialLoadRef.current && displayMessages.length > 0) {
      el.scrollTop = el.scrollHeight;
      isInitialLoadRef.current = false;
    } else if (isNearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [displayMessages.length, messagesLoading]);

  // Scroll to bottom when typing indicator appears/disappears
  useEffect(() => {
    if (!isNearBottomRef.current) return;
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [typingLabel]);

  // Cleanup typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const handleChatScroll = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (el.scrollTop < 80 && hasNextPage && !isFetchingNextPage) {
      prevScrollHeightRef.current = el.scrollHeight;
      void fetchNextPage();
    }
  };

  const emitTypingStart = () => {
    if (!socketRef.current) return;
    if (!isEmittingTypingRef.current) {
      isEmittingTypingRef.current = true;
      socketRef.current.emit('typing', { userId: currentUserId, userName: currentUserName });
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isEmittingTypingRef.current = false;
      socketRef.current?.emit('stop_typing', { userId: currentUserId, userName: currentUserName });
      typingTimerRef.current = null;
    }, TYPING_DEBOUNCE_MS);
  };

  const emitTypingStop = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (isEmittingTypingRef.current) {
      isEmittingTypingRef.current = false;
      socketRef.current?.emit('stop_typing', { userId: currentUserId, userName: currentUserName });
    }
  };

  const handleSendMessage = () => {
    const content = chatInput.trim();
    if (!content) return;

    emitTypingStop();

    const tempId = `optimistic-${Date.now()}`;
    const optimisticMsg: TeamMessage = {
      id: tempId,
      senderId: currentUserId,
      senderName: currentUserName,
      content,
      createdAt: new Date().toISOString(),
    };

    isNearBottomRef.current = true;
    setChatInput('');
    setOptimisticMessages((prev) => [...prev, optimisticMsg]);

    sendMessage.mutate(
      { content },
      {
        onSettled: (data) => {
          setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
          if (data && !seenMessageIds.current.has(data.id)) {
            seenMessageIds.current.add(data.id);
            queryClient.setQueryData<InfiniteData<MessagePage>>(
              ['team-messages', businessId],
              (prev) => {
                if (!prev?.pages?.length) return prev;
                const pages = [...prev.pages];
                const lastIdx = pages.length - 1;
                const lastPage = pages[lastIdx];
                pages[lastIdx] = { ...lastPage, data: [...lastPage.data, data] };
                return { ...prev, pages };
              }
            );
          }
        },
        onError: (err) => {
          setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
          toast.error(getApiErrorMessage(err));
        },
      }
    );
  };

  const handleCreateAnnouncement = () => {
    if (!annForm.title.trim()) {
      toast.error('Title is required.');
      return;
    }
    if (!annForm.description.trim()) {
      toast.error('Description is required.');
      return;
    }
    createAnnouncement.mutate(
      { title: annForm.title.trim(), description: annForm.description.trim() },
      {
        onSuccess: () => {
          setAnnForm({ title: '', description: '' });
          setShowAnnouncement(false);
          setAnnPage(1);
          toast.success('Announcement posted!');
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      }
    );
  };

  const annRange = announcementMeta ? getPaginationRange(announcementMeta) : null;

  return (
    <div className='mt-4 grid gap-6 lg:grid-cols-2'>
      {/* Team Chat */}
      <Card className='flex h-[420px] flex-col sm:h-[500px]'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Team Chat</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-1 flex-col overflow-hidden p-4 pt-0'>
          <div
            ref={chatScrollRef}
            onScroll={handleChatScroll}
            className='flex-1 space-y-3 overflow-y-auto pr-1'
          >
            {isFetchingNextPage && (
              <div className='flex justify-center py-2'>
                <Loader2 size={14} className='animate-spin text-muted-foreground' />
              </div>
            )}

            {messagesLoading ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 size={20} className='animate-spin text-muted-foreground' />
              </div>
            ) : messagesError ? (
              <p className='py-8 text-center text-sm text-muted-foreground'>
                Failed to load messages.
              </p>
            ) : displayMessages.length === 0 ? (
              <p className='py-8 text-center text-sm text-muted-foreground'>
                No messages yet. Say hello!
              </p>
            ) : (
              displayMessages.map((msg) => {
                const isOwn =
                  msg.senderId === currentUserId ||
                  (!!currentUserName && msg.senderName === currentUserName);
                const isOptimistic = msg.id.startsWith('optimistic-');
                const initials = msg.senderName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: isOptimistic ? 0.7 : 1, y: 0 }}
                    className={`flex items-start gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className='h-7 w-7 shrink-0'>
                      <AvatarFallback className='bg-muted text-[9px] font-bold'>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`max-w-[75%] rounded-xl px-3 py-1.5 text-sm ${
                        isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}
                    >
                      {!isOwn && (
                        <p className='mb-0.5 text-[10px] font-semibold opacity-70'>
                          {msg.senderName}
                        </p>
                      )}
                      <p>{msg.content}</p>
                      <p
                        className={`mt-0.5 text-[9px] ${
                          isOwn ? 'text-primary-foreground/75' : 'text-muted-foreground'
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Typing indicator */}
          <AnimatePresence>
            {typingLabel && (
              <motion.div
                key='typing-indicator'
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className='overflow-hidden'
              >
                <div className='flex items-center gap-1.5 px-1 pb-1 pt-1.5 text-[11px] text-muted-foreground'>
                  <span>{typingLabel}</span>
                  <TypingDots />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className='mt-2 flex gap-2'>
            <Input
              value={chatInput}
              onChange={(e) => {
                setChatInput(e.target.value);
                if (e.target.value.trim()) emitTypingStart();
                else emitTypingStop();
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder='Type a message...'
              className='h-9 text-sm'
              maxLength={5000}
            />
            <Button
              size='sm'
              className='h-9 shrink-0 gap-1'
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
            >
              <Send size={14} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Announcements */}
      <div className='space-y-4'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <h3 className='font-display text-base font-semibold'>Announcements</h3>
          <Button
            size='sm'
            variant='outline'
            className='w-full gap-1.5 sm:w-auto'
            onClick={() => setShowAnnouncement(true)}
          >
            <Plus size={14} /> New Announcement
          </Button>
        </div>
        <div className='space-y-3'>
          {announcementsLoading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 size={20} className='animate-spin text-muted-foreground' />
            </div>
          ) : announcementList.length === 0 ? (
            <p className='py-8 text-center text-sm text-muted-foreground'>No announcements yet.</p>
          ) : (
            announcementList.map((ann, i) => (
              <motion.div
                key={ann._id ?? `ann-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card>
                  <CardContent className='p-4'>
                    <div className='flex items-start gap-3'>
                      <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                        <Megaphone size={14} className='text-primary' />
                      </div>
                      <div className='flex-1'>
                        <div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
                          <p className='text-sm font-semibold'>{ann.title}</p>
                          <span className='text-[10px] text-muted-foreground'>
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className='mt-1 text-sm text-muted-foreground'>{ann.description}</p>
                        <p className='mt-2 text-[10px] text-muted-foreground'>— {ann.authorName}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {announcementMeta && annRange && (
          <PaginationControls
            meta={announcementMeta}
            onPageChange={setAnnPage}
            hideWhenSinglePage={false}
            label={`Showing ${annRange.from}–${annRange.to} of ${announcementMeta.total}`}
            labelClassName='text-xs text-muted-foreground'
            buttonClassName='h-8 w-8'
          />
        )}
      </div>

      {/* Create Announcement Dialog */}
      <Dialog open={showAnnouncement} onOpenChange={setShowAnnouncement}>
        <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>New Announcement</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label>Title *</Label>
              <Input
                value={annForm.title}
                onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                placeholder='Announcement title'
                maxLength={200}
              />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea
                value={annForm.description}
                onChange={(e) => setAnnForm({ ...annForm, description: e.target.value })}
                placeholder='Details...'
                rows={4}
                maxLength={5000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowAnnouncement(false)}
              disabled={createAnnouncement.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAnnouncement} disabled={createAnnouncement.isPending}>
              {createAnnouncement.isPending && (
                <Loader2 size={14} className='mr-1.5 animate-spin' />
              )}
              Post Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunicationsTab;
