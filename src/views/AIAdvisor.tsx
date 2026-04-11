'use client';

import { useState, useRef, useEffect, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, DollarSign, Megaphone, Settings2, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const quickTopics = [
  {
    label: 'Pricing Strategy',
    icon: DollarSign,
    prompt:
      'Analyze my current pricing strategy and suggest improvements based on my business data.',
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-500/10',
    textColor: 'text-emerald-600',
  },
  {
    label: 'Marketing',
    icon: Megaphone,
    prompt:
      'Give me marketing recommendations to grow my client base based on my current business performance.',
    color: 'from-primary to-secondary',
    bg: 'bg-primary/10',
    textColor: 'text-primary',
  },
  {
    label: 'Operations',
    icon: Settings2,
    prompt: 'How can I optimize my business operations to improve efficiency and reduce costs?',
    color: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-500/10',
    textColor: 'text-violet-600',
  },
];

const mockResponses: Record<string, string> = {
  pricing: `## 💰 Pricing Analysis

Based on your current data, here are my recommendations:

**Current Average Project Value:** $4,125

### Recommendations:
1. **Increase base rates by 10-15%** — Your completion rate and client retention suggest strong demand. A modest increase would add ~$1,240/month.
2. **Introduce tiered pricing** — Offer Basic, Standard, and Premium packages. Clients like Olivia Davis ($21,000 total spent) would benefit from a premium tier.
3. **Add rush fees** — For urgent requests (like David Park's plumbing repair), charge a 25% premium.
4. **Bundle services** — Combine related services (e.g., cleaning + carpet cleaning) at a 10% discount to increase average order value.

**Projected Impact:** +18% revenue increase within 3 months.`,

  marketing: `## 📣 Marketing Recommendations

Based on your analytics and client data:

**Current Metrics:** 3,020 visitors | 3.2% conversion rate

### Recommendations:
1. **Optimize your /services page** — It's your 2nd most visited page (3,240 views). Add clear CTAs and testimonials.
2. **Re-engage dormant clients** — 3 clients haven't been contacted in 30+ days. A simple follow-up email could generate repeat business worth ~$8,000.
3. **Leverage top clients for referrals** — Sarah Johnson and Olivia Davis are high-value clients. Offer a 10% referral bonus.
4. **Improve conversion rate** — Your 3.2% rate is below industry average (5%). A/B test your landing page and add social proof.
5. **Local SEO** — Most clients are in TX and CA. Focus Google My Business optimization in these areas.

**Projected Impact:** +25% new client acquisition in 60 days.`,

  operations: `## ⚙️ Operations Optimization

Based on your job and scheduling data:

**Current Job Completion Rate:** 40% (Target: 60%+)

### Recommendations:
1. **Prioritize in-progress jobs** — You have 3 jobs stuck in progress. Assign dedicated time blocks to complete them this week.
2. **Group jobs by location** — Clients in TX (Houston, Dallas, Austin) could be grouped to save 3-5 hours/week in travel.
3. **Automate invoice follow-ups** — 4 unpaid invoices ($11,600 outstanding). Set up automatic reminders at 7, 14, and 30 days.
4. **Streamline onboarding** — Create templates for contracts and proposals. Currently each takes ~45 minutes manually.
5. **Track employee performance** — Use activity logs to identify bottlenecks and reward top performers.

**Projected Impact:** 30% improvement in operational efficiency within 4 weeks.`,
};

const AIAdvisor = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const simulateResponse = (prompt: string) => {
    setIsTyping(true);
    const lowerPrompt = prompt.toLowerCase();
    let response = mockResponses.operations;
    if (lowerPrompt.includes('pricing') || lowerPrompt.includes('price')) {
      response = mockResponses.pricing;
    } else if (
      lowerPrompt.includes('marketing') ||
      lowerPrompt.includes('client base') ||
      lowerPrompt.includes('grow')
    ) {
      response = mockResponses.marketing;
    }

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSend = (content: string) => {
    if (!content.trim()) return;
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    simulateResponse(content);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const showWelcome = messages.length === 0 && !isTyping;

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
              <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg sm:mb-6 sm:h-16 sm:w-16'>
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
                    onClick={() => handleSend(topic.prompt)}
                    className={`flex items-center justify-start gap-3 rounded-xl border border-border p-3 text-left transition-all hover:shadow-md sm:flex-col sm:items-center sm:p-5 sm:text-center ${topic.bg}`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${topic.color} text-primary-foreground sm:h-11 sm:w-11`}
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
                        ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground'
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
                        {msg.content.split('\n').map((line, i) => {
                          if (line.startsWith('## '))
                            return (
                              <h3 key={i} className='mt-2 mb-2 text-base font-bold'>
                                {line.replace('## ', '')}
                              </h3>
                            );
                          if (line.startsWith('### '))
                            return (
                              <h4 key={i} className='mt-2 mb-1 text-sm font-semibold'>
                                {line.replace('### ', '')}
                              </h4>
                            );
                          if (line.startsWith('**') && line.endsWith('**'))
                            return (
                              <p key={i} className='font-semibold my-1'>
                                {line.replace(/\*\*/g, '')}
                              </p>
                            );
                          if (line.match(/^\d+\.\s\*\*/)) {
                            const parts = line.match(/^(\d+\.)\s\*\*(.+?)\*\*\s*—?\s*(.*)/);
                            if (parts)
                              return (
                                <p key={i} className='my-0.5'>
                                  {parts[1]} <strong>{parts[2]}</strong>{' '}
                                  {parts[3] ? `— ${parts[3]}` : ''}
                                </p>
                              );
                          }
                          if (line.trim() === '') return <br key={i} />;
                          return (
                            <p key={i} className='my-0.5'>
                              {line.replace(/\*\*/g, '')}
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
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
                  onClick={() => handleSend(topic.prompt)}
                  disabled={isTyping}
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
              disabled={isTyping}
            />
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                size='icon'
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isTyping}
                className='h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md'
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
