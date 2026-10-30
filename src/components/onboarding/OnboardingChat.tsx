'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Building2, Lightbulb, Loader2, Sparkles, Square, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ChatMessage, StartingPoint } from '@/lib/api-client';
import { MAX_CHAT_MESSAGE_LENGTH } from '@/hooks/use-onboarding-chat';
import { cn } from '@/lib/utils';

const STARTERS: Array<{ id: StartingPoint; label: string; message: string; icon: typeof Compass }> = [
  {
    id: 'no_idea',
    label: "I don't have an idea yet",
    message: "I want to start a business but I don't have an idea yet. Can you help me find one?",
    icon: Compass,
  },
  {
    id: 'has_idea',
    label: 'I have a business idea',
    message: 'I have a business idea I want to turn into a real business.',
    icon: Lightbulb,
  },
  {
    id: 'existing_business',
    label: 'I already run a business',
    message: 'I already run a business and want to bring it online with ServixOS.',
    icon: Building2,
  },
];

interface OnboardingChatProps {
  firstName?: string;
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
  error: string;
  onSend: (message: string) => void;
  onStop: () => void;
}

const Bubble = ({ role, children }: { role: ChatMessage['role']; children: React.ReactNode }) => (
  <div className={cn('flex', role === 'user' ? 'justify-end' : 'justify-start')}>
    <div
      className={cn(
        'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
        role === 'user'
          ? 'rounded-br-md bg-primary text-primary-foreground'
          : 'rounded-bl-md border border-border bg-muted/40'
      )}
    >
      {children}
    </div>
  </div>
);

const OnboardingChat = ({
  firstName,
  messages,
  streamingText,
  isStreaming,
  error,
  onSend,
  onStop,
}: OnboardingChatProps) => {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, streamingText]);

  const submit = () => {
    const message = draft.trim();
    if (!message || isStreaming || message.length > MAX_CHAT_MESSAGE_LENGTH) return;
    onSend(message);
    setDraft('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const isEmpty = messages.length === 0 && !isStreaming;
  const overLimit = draft.length > MAX_CHAT_MESSAGE_LENGTH;

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div ref={scrollRef} className='flex-1 space-y-3 overflow-y-auto p-4'>
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className='mx-auto flex max-w-md flex-col items-center gap-4 py-8 text-center'
          >
            <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15'>
              <Sparkles className='h-6 w-6 text-primary' />
            </div>
            <div className='space-y-1'>
              <h2 className='font-display text-lg font-semibold'>
                Hi{firstName ? ` ${firstName}` : ''}, let&apos;s build your business
              </h2>
              <p className='text-sm text-muted-foreground'>
                Tell me where you&apos;re starting from. I&apos;ll draft your concept, brand, services
                and website as we talk, and you approve each part.
              </p>
            </div>
            <div className='grid w-full gap-2'>
              {STARTERS.map(({ id, label, message, icon: Icon }) => (
                <button
                  key={id}
                  type='button'
                  onClick={() => onSend(message)}
                  className='flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-primary/5'
                >
                  <Icon className='h-4 w-4 shrink-0 text-primary' />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <>
            {messages.map((m, i) => (
              <Bubble key={`${m.createdAt}-${i}`} role={m.role}>
                {m.content}
              </Bubble>
            ))}
            {isStreaming && (
              <Bubble role='assistant'>
                {streamingText || (
                  <span className='flex items-center gap-2 text-muted-foreground'>
                    <Loader2 className='h-3.5 w-3.5 animate-spin' /> Thinking…
                  </span>
                )}
              </Bubble>
            )}
          </>
        )}
        {error && (
          <p className='rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive'>
            {error}
          </p>
        )}
      </div>

      <div className='border-t border-border p-3'>
        <div className='flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:border-primary/50'>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? 'Waiting for the reply…' : 'Message your AI business advisor…'}
            rows={1}
            className='max-h-40 min-h-[40px] flex-1 resize-none border-0 bg-transparent p-2 shadow-none focus-visible:ring-0'
          />
          {isStreaming ? (
            <Button type='button' size='icon' variant='outline' onClick={onStop} aria-label='Stop reply'>
              <Square className='h-4 w-4' />
            </Button>
          ) : (
            <Button
              type='button'
              size='icon'
              onClick={submit}
              disabled={!draft.trim() || overLimit}
              aria-label='Send message'
              className='gradient-bg text-primary-foreground'
            >
              <ArrowUp className='h-4 w-4' />
            </Button>
          )}
        </div>
        {overLimit && (
          <p className='mt-1 text-right text-[10px] text-destructive'>
            {draft.length}/{MAX_CHAT_MESSAGE_LENGTH} characters
          </p>
        )}
      </div>
    </div>
  );
};

export default OnboardingChat;
