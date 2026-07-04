'use client';

import { useState, useRef, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, DollarSign, Megaphone, Settings2, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { getApiErrorMessage, getSubscriptionRequiredInfo } from '@/common/network/http-client';
import { useAskAdvisor } from '@/hooks/mutations/use-ai-advisor';
import { useUpgradePlan } from '@/common/state/upgrade-plan-context';
import type { AdvisorTopic } from '@/lib/api-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  title?: string;
  content: string;
  timestamp: string;
}

const quickTopics: {
  label: string;
  topic: AdvisorTopic;
  icon: typeof DollarSign;
  prompt: string;
  iconGradient: string;
  bg: string;
  textColor: string;
}[] = [
  {
    label: 'Pricing Strategy',
    topic: 'pricing',
    icon: DollarSign,
    prompt:
      'Analyze my current pricing strategy and suggest improvements based on my business data.',
    iconGradient: 'linear-gradient(135deg, rgb(16 185 129), rgb(5 150 105))',
    bg: 'bg-emerald-500/10',
    textColor: 'text-emerald-600',
  },
  {
    label: 'Marketing',
    topic: 'marketing',
    icon: Megaphone,
    prompt:
      'Give me marketing recommendations to grow my client base based on my current business performance.',
    iconGradient: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
    bg: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    label: 'Operations',
    topic: 'operations',
    icon: Settings2,
    prompt: 'How can I optimize my business operations to improve efficiency and reduce costs?',
    iconGradient: 'linear-gradient(135deg, rgb(139 92 246), rgb(124 58 237))',
    bg: 'bg-violet-500/10',
    textColor: 'text-violet-600',
  },
];

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

const AIAdvisor = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { mutateAsync: askAdvisor, isPending } = useAskAdvisor();
  const { showUpgradeModal } = useUpgradePlan();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isPending]);

  const handleSend = async (question: string, topic?: AdvisorTopic) => {
    const trimmed = question.trim();
    if (!trimmed || isPending) return;

    setMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}-user`, role: 'user', content: trimmed, timestamp: timestamp() },
    ]);
    setInput('');

    try {
      const result = await askAdvisor({ question: trimmed, topic });
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          title: result.title,
          content: result.answer,
          timestamp: timestamp(),
        },
      ]);
    } catch (err) {
      const subscriptionInfo = getSubscriptionRequiredInfo(err);
      if (subscriptionInfo) {
        const upgradeUrl = subscriptionInfo.upgradeUrl || '/settings?tab=subscription';
        showUpgradeModal({
          featureName: 'AI Advisor',
          currentPlan: capitalize(subscriptionInfo.currentPlan) || undefined,
          requiredPlan: capitalize(subscriptionInfo.requiredPlan) || 'Pro',
          onUpgrade: () => router.push(upgradeUrl),
        });
        return;
      }
      toast.error('Failed to get advice', { description: getApiErrorMessage(err) });
    }
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend(input);
    }
  };

  const showWelcome = messages.length === 0 && !isPending;

  return (
    <div className='flex h-full min-h-0 flex-col overflow-hidden'>
      {/* Header */}
      <div className='mb-2 shrink-0 sm:mb-3'>
        <h1 className='font-display flex items-center gap-2 text-xl font-bold md:text-2xl'>
          <Bot size={24} className='text-primary' />
          AI Business Advisor
        </h1>
        <p className='text-xs text-muted-foreground'>
          Get AI-powered advice on pricing, marketing, and operations.
        </p>
      </div>

      {/* Chat area */}
      <Card className='flex min-h-0 flex-1 flex-col overflow-hidden border-border'>
        <div ref={scrollRef} className='min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 md:p-6'>
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='flex h-full flex-col items-center justify-center text-center'
            >
              <div className='gradient-bg mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground shadow-lg sm:mb-6 sm:h-16 sm:w-16'>
                <Sparkles size={32} />
              </div>
              <h2 className='mb-2 font-display text-lg font-bold sm:text-xl'>
                How can I help your business?
              </h2>
              <p className='mb-6 max-w-md text-xs text-muted-foreground sm:mb-8 sm:text-sm'>
                Ask me about pricing, marketing strategies, or operations optimization. I will
                analyze your business data and provide actionable insights.
              </p>
              <div className='grid w-full max-w-lg gap-2 sm:grid-cols-3 sm:gap-3'>
                {quickTopics.map((topic) => (
                  <motion.button
                    key={topic.label}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => void handleSend(topic.prompt, topic.topic)}
                    className={`flex items-center justify-start gap-3 rounded-xl border border-border p-3 text-left transition-all hover:shadow-md sm:flex-col sm:items-center sm:p-5 sm:text-center ${topic.bg}`}
                  >
                    <div
                      className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-sm sm:h-11 sm:w-11'
                      style={{ background: topic.iconGradient }}
                    >
                      <topic.icon size={20} />
                    </div>
                    <span className={`text-sm font-semibold ${topic.textColor}`}>
                      {topic.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[92%] gap-3 sm:max-w-[80%] ${
                    msg.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      msg.role === 'user'
                        ? 'gradient-bg text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className='prose prose-sm dark:prose-invert max-w-none'>
                        {msg.title && (
                          <h3 className='mt-0 mb-2 text-base font-bold'>{msg.title}</h3>
                        )}
                        {msg.content.split('\n').map((line, i) =>
                          line.trim() === '' ? (
                            <br key={i} />
                          ) : (
                            <p key={i} className='my-0.5 whitespace-pre-wrap'>
                              {line}
                            </p>
                          )
                        )}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='mb-4 flex items-center gap-3'
            >
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground'>
                <Bot size={16} />
              </div>
              <div className='flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground'>
                <Loader2 size={14} className='animate-spin' />
                Analyzing your business data...
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className='border-t border-border p-3 sm:p-4'>
          {messages.length > 0 && (
            <div className='mb-3 flex flex-wrap gap-2'>
              {quickTopics.map((topic) => (
                <Button
                  key={topic.label}
                  variant='outline'
                  size='sm'
                  className='gap-1.5 text-xs'
                  onClick={() => void handleSend(topic.prompt, topic.topic)}
                  disabled={isPending}
                >
                  <topic.icon size={12} />
                  {topic.label}
                </Button>
              ))}
            </div>
          )}
          <div className='flex items-center gap-2'>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Ask about your business...'
              className='flex-1'
              maxLength={500}
              disabled={isPending}
            />
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                size='icon'
                onClick={() => void handleSend(input)}
                disabled={!input.trim() || isPending}
                className='gradient-bg h-10 w-10 rounded-full text-primary-foreground shadow-md'
              >
                <Send size={16} />
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIAdvisor;
