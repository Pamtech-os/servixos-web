'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUp, Loader2, Mic, Square, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ChatMessage } from '@/lib/api-client';
import { MAX_CHAT_MESSAGE_LENGTH } from '@/hooks/use-onboarding-chat';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis';
import { cn } from '@/lib/utils';

interface OnboardingChatProps {
  /** Shown before the first message, e.g. the opening question. */
  emptyState: React.ReactNode;
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
  error: string;
  onSend: (message: string) => void;
  onStop: () => void;
}

const Bubble = ({
  role,
  children,
  action,
}: {
  role: ChatMessage['role'];
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className={cn('flex items-end gap-1', role === 'user' ? 'justify-end' : 'justify-start')}>
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
    {action}
  </div>
);

const messageId = (m: ChatMessage, index: number) => `${m.createdAt}-${index}`;

const OnboardingChat = ({
  emptyState,
  messages,
  streamingText,
  isStreaming,
  error,
  onSend,
  onStop,
}: OnboardingChatProps) => {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const tts = useSpeechSynthesis();
  const { speak } = tts;
  // Replies to spoken messages are read aloud, so voice users never have to read the screen.
  const readNextReplyRef = useRef(false);
  const lastSeenCountRef = useRef(messages.length);

  const voice = useSpeechRecognition({
    onFinish: (transcript) => {
      const message = `${draft.trim()} ${transcript}`.trim().slice(0, MAX_CHAT_MESSAGE_LENGTH);
      readNextReplyRef.current = true;
      onSend(message);
      setDraft('');
    },
  });

  useEffect(() => {
    const grew = messages.length > lastSeenCountRef.current;
    lastSeenCountRef.current = messages.length;
    const last = messages[messages.length - 1];
    if (!grew || last?.role !== 'assistant' || !readNextReplyRef.current) return;
    readNextReplyRef.current = false;
    speak(messageId(last, messages.length - 1), last.content);
  }, [messages, speak]);

  const toggleListening = () => {
    if (voice.isListening) {
      voice.stop();
      return;
    }
    tts.stop();
    voice.start();
  };

  const toggleSpeaking = (id: string, text: string) => {
    if (tts.speakingId === id) tts.stop();
    else tts.speak(id, text);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, streamingText]);

  const submit = () => {
    const message = draft.trim();
    if (!message || isStreaming || message.length > MAX_CHAT_MESSAGE_LENGTH) return;
    readNextReplyRef.current = false;
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
          emptyState
        ) : (
          <>
            {messages.map((m, i) => {
              const id = messageId(m, i);
              const isSpeaking = tts.speakingId === id;
              return (
                <Bubble
                  key={id}
                  role={m.role}
                  action={
                    m.role === 'assistant' &&
                    tts.isSupported && (
                      <Button
                        type='button'
                        size='icon'
                        variant='ghost'
                        onClick={() => toggleSpeaking(id, m.content)}
                        aria-label={isSpeaking ? 'Stop reading aloud' : 'Read aloud'}
                        className={cn(
                          'h-7 w-7 shrink-0 text-muted-foreground',
                          isSpeaking && 'text-primary'
                        )}
                      >
                        {isSpeaking ? <VolumeX className='h-3.5 w-3.5' /> : <Volume2 className='h-3.5 w-3.5' />}
                      </Button>
                    )
                  }
                >
                  {m.content}
                </Bubble>
              );
            })}
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
        {(error || voice.error) && (
          <p className='rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive'>
            {error || voice.error}
          </p>
        )}
      </div>

      <div className='border-t border-border p-3'>
        <div className='flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:border-primary/50'>
          <Textarea
            value={voice.isListening ? `${draft} ${voice.interimTranscript}`.trim() : draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            readOnly={voice.isListening}
            placeholder={
              voice.isListening
                ? 'Listening… tap the mic again when you’re done'
                : isStreaming
                  ? 'Waiting for the reply…'
                  : 'Message your AI business advisor…'
            }
            rows={1}
            className='max-h-40 min-h-[40px] flex-1 resize-none border-0 bg-transparent p-2 shadow-none focus-visible:ring-0'
          />
          {voice.isSupported && (
            <Button
              type='button'
              size='icon'
              variant={voice.isListening ? 'destructive' : 'ghost'}
              onClick={toggleListening}
              disabled={isStreaming && !voice.isListening}
              aria-label={voice.isListening ? 'Stop recording and send' : 'Speak your message'}
              aria-pressed={voice.isListening}
              className={cn('shrink-0', voice.isListening && 'animate-pulse')}
            >
              {voice.isListening ? <Square className='h-4 w-4' /> : <Mic className='h-4 w-4' />}
            </Button>
          )}
          {isStreaming ? (
            <Button type='button' size='icon' variant='outline' onClick={onStop} aria-label='Stop reply'>
              <Square className='h-4 w-4' />
            </Button>
          ) : (
            <Button
              type='button'
              size='icon'
              onClick={submit}
              disabled={!draft.trim() || overLimit || voice.isListening}
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
