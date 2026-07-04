'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  DollarSign,
  Users,
  BarChart3,
  TrendingUp,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAiInsights } from '@/hooks/queries/use-ai-insights';
import type { InsightCategory, InsightSeverity } from '@/lib/api-client';

const categoryConfig: Record<
  InsightCategory,
  { label: string; icon: typeof DollarSign; color: string; bg: string }
> = {
  revenue: {
    label: 'Revenue',
    icon: DollarSign,
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
  },
  clients: {
    label: 'Clients',
    icon: Users,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  operations: {
    label: 'Operations',
    icon: BarChart3,
    color: 'text-violet-600',
    bg: 'bg-violet-500/10',
  },
  growth: {
    label: 'Growth',
    icon: TrendingUp,
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
  },
};

const priorityStyles: Record<InsightSeverity, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

const AIInsights = () => {
  const [activeCategory, setActiveCategory] = useState<InsightCategory | 'all'>('all');
  const { data, isLoading, isError, isFetching, refetch } = useAiInsights();

  const insights = useMemo(() => data?.insights ?? [], [data]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: insights.length };
    (data?.categories ?? []).forEach((c) => {
      counts[c.key] = c.count;
    });
    return counts;
  }, [data, insights.length]);

  const filtered = useMemo(
    () =>
      activeCategory === 'all' ? insights : insights.filter((i) => i.category === activeCategory),
    [insights, activeCategory]
  );

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='font-display flex items-center gap-2 text-2xl font-bold md:text-3xl'>
            <Sparkles size={28} className='text-primary' />
            AI Insights
          </h1>
          <p className='text-sm text-muted-foreground'>Smart suggestions to grow your business</p>
        </div>
        <Button
          variant='outline'
          size='sm'
          className='w-full justify-center gap-2 sm:w-auto'
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh
        </Button>
      </div>

      {/* Category Filter Chips */}
      <div className='-mx-1 overflow-x-auto pb-1'>
        <div className='flex w-max gap-2 px-1'>
          {(Object.keys(categoryConfig) as InsightCategory[]).map((cat) => {
            const config = categoryConfig[cat];
            const count = categoryCounts[cat] || 0;
            const isActive = activeCategory === cat;
            return (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(isActive ? 'all' : cat)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all sm:px-4 sm:py-2.5 sm:text-sm ${
                  isActive
                    ? `${config.bg} border-current ${config.color} shadow-sm`
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-lg sm:h-7 sm:w-7 ${config.bg}`}
                >
                  <config.icon size={14} className={config.color} />
                </div>
                {config.label}
                <span className='font-bold'>{count}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Insights List */}
      {isLoading ? (
        <div className='space-y-4'>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className='p-5'>
                <div className='flex items-start gap-4'>
                  <Skeleton className='h-10 w-10 rounded-xl' />
                  <div className='flex-1 space-y-2'>
                    <Skeleton className='h-5 w-48' />
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-4 w-2/3' />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <div className='py-12 text-center'>
          <Sparkles className='mx-auto mb-3 h-10 w-10 text-muted-foreground dark:text-muted-foreground/60' />
          <p className='text-sm text-muted-foreground'>
            Unable to generate AI insights at this time. Please try again.
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {filtered.map((insight, i) => {
            const config = categoryConfig[insight.category];
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: 'spring', damping: 20 }}
              >
                <Card className='transition-shadow hover:shadow-md'>
                  <CardContent className='p-4 sm:p-5'>
                    <div className='flex items-start gap-3 sm:gap-4'>
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bg}`}
                      >
                        <config.icon size={18} className={config.color} />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='mb-1 flex flex-wrap items-center gap-2'>
                          <h3 className='font-semibold text-sm'>{insight.title}</h3>
                          <Badge
                            variant='outline'
                            className={`text-[10px] px-1.5 py-0 ${
                              priorityStyles[insight.severity]
                            }`}
                          >
                            {insight.severity}
                          </Badge>
                        </div>
                        <p className='text-sm text-muted-foreground leading-relaxed'>
                          {insight.description}
                        </p>
                        {insight.action && (
                          <Link
                            href={insight.action.link}
                            className='mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline'
                          >
                            {insight.action.label} <ExternalLink size={10} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <p className='py-12 text-center text-sm text-muted-foreground'>
              No insights in this category.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AIInsights;
