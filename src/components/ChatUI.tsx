import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent as ReactKeyboardEvent,
  type ChangeEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Paperclip, X, ImageIcon, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/sonner';

export type ChatMessageStatus = 'sent' | 'delivered' | 'read';

export interface ChatMessageAttachment {
  name: string;
  type?: string;
  size?: number;
  url?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'business' | 'client';
  senderName: string;
  content?: string;
  timestamp: string;
  status?: ChatMessageStatus;
  attachment?: ChatMessageAttachment;
}

export interface ChatSendPayload {
  content: string;
  attachment?: File;
}

interface ChatUIProps {
  messages: ChatMessage[];
  onSendMessage: (payload: ChatSendPayload) => void | Promise<void>;
  clientName?: string;
  className?: string;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  typingIndicatorText?: string;
}

const EMOJI_LIST = [
  '😀',
  '😂',
  '😊',
  '🥰',
  '😎',
  '🤩',
  '😇',
  '🤗',
  '👍',
  '👏',
  '🎉',
  '🔥',
  '💯',
  '❤️',
  '✅',
  '⭐',
  '🙏',
  '💪',
  '🤝',
  '👋',
  '📋',
  '🛠️',
  '📞',
  '💬',
  '⏰',
  '📅',
  '✨',
  '🏠',
  '🔧',
  '🎨',
  '🧹',
  '💡',
];

const STATUS_LABEL: Record<ChatMessageStatus, string> = {
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
};

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const TypingDots = () => (
  <span className='flex items-end gap-[3px]'>
    {[0, 150, 300].map((delay) => (
      <span
        key={delay}
        className='h-1 w-1 rounded-full bg-current animate-bounce'
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </span>
);

const ChatUI = ({
  messages,
  onSendMessage,
  clientName = 'Client',
  className = '',
  onTypingStart,
  onTypingStop,
  typingIndicatorText,
}: ChatUIProps) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingIndicatorText]);

  useEffect(() => {
    return () => {
      onTypingStop?.();
    };
  }, [onTypingStop]);

  const handleSend = () => {
    const text = input.trim();
    if (!text && !attachment) return;

    const payload = { content: text, attachment: attachment ?? undefined };
    setInput('');
    setAttachment(null);
    onTypingStop?.();
    void Promise.resolve(onSendMessage(payload)).catch(() => {});
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large', { description: 'Maximum file size is 10MB.' });
        return;
      }
      setAttachment(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
    setEmojiOpen(false);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (value.trim()) onTypingStart?.();
    else onTypingStop?.();
  };

  const sendDisabled = !input.trim() && !attachment;

  return (
    <div
      className={`flex h-full flex-col rounded-xl border border-border bg-card overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className='flex items-center gap-3 border-b border-border px-4 py-3 bg-muted/30'>
        <div className='relative'>
          <Avatar className='h-9 w-9'>
            <AvatarFallback className='gradient-bg text-xs font-bold text-primary-foreground'>
              {clientName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <span className='absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500' />
        </div>
        <div>
          <p className='text-sm font-semibold'>{clientName}</p>
          <p className='text-xs text-muted-foreground'>Online</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className='flex-1 overflow-y-auto p-4 space-y-3'>
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isBusiness = msg.sender === 'business';
            const attachmentSize = formatFileSize(msg.attachment?.size);

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className={`flex ${isBusiness ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`group relative max-w-[75%] ${isBusiness ? 'order-2' : ''}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-shadow hover:shadow-md space-y-2 ${
                      isBusiness
                        ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}
                  >
                    {msg.content && <p className='whitespace-pre-wrap break-words'>{msg.content}</p>}

                    {msg.attachment && (
                      <>
                        {msg.attachment.url ? (
                          <a
                            href={msg.attachment.url}
                            target='_blank'
                            rel='noreferrer'
                            className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                              isBusiness
                                ? 'border-primary-foreground/30 bg-primary-foreground/10 hover:bg-primary-foreground/20'
                                : 'border-border bg-background/70 hover:bg-background'
                            }`}
                          >
                            {msg.attachment.type?.startsWith('image/') ? (
                              <ImageIcon size={13} className='shrink-0' />
                            ) : (
                              <FileIcon size={13} className='shrink-0' />
                            )}
                            <span className='truncate'>{msg.attachment.name}</span>
                            {attachmentSize && <span className='shrink-0 opacity-75'>{attachmentSize}</span>}
                          </a>
                        ) : (
                          <div
                            className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs ${
                              isBusiness
                                ? 'border-primary-foreground/30 bg-primary-foreground/10'
                                : 'border-border bg-background/70'
                            }`}
                          >
                            {msg.attachment.type?.startsWith('image/') ? (
                              <ImageIcon size={13} className='shrink-0' />
                            ) : (
                              <FileIcon size={13} className='shrink-0' />
                            )}
                            <span className='truncate'>{msg.attachment.name}</span>
                            {attachmentSize && <span className='shrink-0 opacity-75'>{attachmentSize}</span>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <p
                    className={`mt-1 text-[10px] text-muted-foreground ${
                      isBusiness ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.timestamp}
                    {isBusiness && msg.status ? ` • ${STATUS_LABEL[msg.status]}` : ''}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Typing indicator */}
      <AnimatePresence>
        {typingIndicatorText && (
          <motion.div
            key='typing-indicator'
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className='overflow-hidden border-t border-border/50'
          >
            <div className='flex items-center gap-1.5 px-4 py-2 text-[11px] text-muted-foreground'>
              <span>{typingIndicatorText}</span>
              <TypingDots />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachment preview */}
      {attachment && (
        <div className='mx-3 mb-1 mt-2 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2'>
          {attachment.type.startsWith('image/') ? (
            <ImageIcon size={14} className='text-primary shrink-0' />
          ) : (
            <FileIcon size={14} className='text-primary shrink-0' />
          )}
          <span className='text-xs truncate flex-1'>{attachment.name}</span>
          <button
            onClick={() => setAttachment(null)}
            className='text-muted-foreground hover:text-foreground'
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input - pinned to bottom */}
      <div className='border-t border-border p-3 mt-auto'>
        <div className='flex items-center gap-2'>
          <input
            ref={fileInputRef}
            type='file'
            className='hidden'
            onChange={handleFileSelect}
            accept='image/*,.pdf,.doc,.docx,.txt'
          />
          <Button
            variant='ghost'
            size='icon'
            className='shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground'
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={16} />
          </Button>
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground'
              >
                <Smile size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-64 p-2' align='start' side='top'>
              <div className='grid grid-cols-8 gap-1'>
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addEmoji(emoji)}
                    className='flex h-8 w-8 items-center justify-center rounded-md text-base hover:bg-muted transition-colors'
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Input
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!input.trim()) onTypingStop?.();
            }}
            placeholder='Type a message...'
            className='flex-1 border-0 bg-muted/50 focus-visible:ring-1'
            maxLength={5000}
          />
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size='icon'
              onClick={() => {
                handleSend();
              }}
              disabled={sendDisabled}
              className='gradient-bg h-9 w-9 rounded-full text-primary-foreground shadow-md transition-shadow hover:shadow-lg'
            >
              <Send size={16} />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ChatUI;
