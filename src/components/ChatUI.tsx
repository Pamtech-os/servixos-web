import { useState, useRef, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Paperclip, X, ImageIcon, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  sender: 'business' | 'client';
  senderName: string;
  content: string;
  timestamp: string;
  attachment?: { name: string; type: string };
}

interface ChatUIProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  clientName?: string;
  className?: string;
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

const ChatUI = ({
  messages,
  onSendMessage,
  clientName = 'Client',
  className = '',
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
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text && !attachment) return;
    const msg = attachment ? `${text ? text + ' ' : ''}📎 ${attachment.name}` : text;
    onSendMessage(msg);
    setInput('');
    setAttachment(null);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div
      className={`flex h-full flex-col rounded-xl border border-border bg-card overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className='flex items-center gap-3 border-b border-border px-4 py-3 bg-muted/30'>
        <div className='relative'>
          <Avatar className='h-9 w-9'>
            <AvatarFallback className='bg-gradient-to-br from-primary to-secondary text-xs font-bold text-primary-foreground'>
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
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm transition-shadow hover:shadow-md ${
                      isBusiness
                        ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p
                    className={`mt-1 text-[10px] text-muted-foreground ${
                      isBusiness ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.timestamp}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Attachment preview */}
      {attachment && (
        <div className='mx-3 mb-1 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2'>
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
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Type a message...'
            className='flex-1 border-0 bg-muted/50 focus-visible:ring-1'
          />
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size='icon'
              onClick={handleSend}
              disabled={!input.trim() && !attachment}
              className='h-9 w-9 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md hover:shadow-lg transition-shadow'
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
