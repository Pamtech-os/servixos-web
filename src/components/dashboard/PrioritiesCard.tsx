'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, ClipboardList, Inbox, Lightbulb, Target } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUiActions } from '@/common/state/ui-context';
import { useAiPriorities, AI_PRIORITIES_KEY } from '@/hooks/queries/use-ai-priorities';
import type { PriorityItem, PriorityItemType, SuggestionPriority } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<PriorityItemType, typeof Inbox> = {
  request: Inbox,
  suggestion: Lightbulb,
  task: ClipboardList,
};

const PRIORITY_STYLES: Record<SuggestionPriority, { label: string; className: string }> = {
  high: { label: 'High', className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  medium: { label: 'Medium', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
};

const PriorityRow = ({
  item,
  index,
  onAction,
}: {
  item: PriorityItem;
  index: number;
  onAction: (item: PriorityItem) => void;
}) => {
  const Icon = TYPE_ICONS[item.type] ?? Target;
  const priority = PRIORITY_STYLES[item.priority];

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className='flex flex-col gap-3 rounded-xl border border-border/60 bg-background/60 p-4 sm:flex-row sm:items-start'
    >
      <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
        <Icon size={16} />
      </span>
      <div className='min-w-0 flex-1 space-y-1.5'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='text-sm font-semibold'>{item.title}</p>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', priority.className)}>
            {priority.label}
          </span>
        </div>
        <p className='text-xs leading-relaxed text-muted-foreground'>{item.why}</p>
        {item.evidence.length > 0 && (
          <dl className='flex flex-wrap gap-x-4 gap-y-1 pt-0.5 text-[11px]'>
            {item.evidence.map((e) => (
              <div key={e.label} className='flex gap-1'>
                <dt className='text-muted-foreground'>{e.label}:</dt>
                <dd className='font-medium'>{e.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <Button size='sm' variant='outline' className='h-8 shrink-0 gap-1.5 self-start' onClick={() => onAction(item)}>
        {item.action.label} <ArrowRight size={14} />
      </Button>
    </motion.li>
  );
};

/** "Your priorities today": open suggestions, due tasks and unanswered requests, ranked together. */
const PrioritiesCard = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setReviewSuggestionId } = useUiActions();
  const { data, isLoading, isError } = useAiPriorities();

  if (isError) return null;
  if (isLoading || !data) return <Skeleton className='h-48 rounded-2xl' />;

  const handleAction = ({ action }: PriorityItem) => {
    // Marked stale so the list is fresh when the owner comes back to the dashboard.
    void queryClient.invalidateQueries({ queryKey: [AI_PRIORITIES_KEY], refetchType: 'none' });
    if (action.type === 'review_suggestion') setReviewSuggestionId(action.targetId);
    else if (action.type === 'open_task') router.push(`/teams?tab=tasks&task=${action.targetId}`);
    else router.push(`/requests?id=${action.targetId}`);
  };

  const remaining = data.totalOpen - data.items.length;

  return (
    <Card>
      <CardContent className='space-y-4 p-5 sm:p-6'>
        <div className='flex items-center gap-2'>
          <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground'>
            <Target size={16} />
          </span>
          <div>
            <h2 className='font-display text-lg font-bold'>Your priorities today</h2>
            <p className='text-sm text-muted-foreground'>{data.headline}</p>
          </div>
        </div>

        {/* With no items the headline already says nothing needs attention. */}
        {data.items.length > 0 && (
          <ol className='space-y-3'>
            {data.items.map((item, i) => (
              <PriorityRow key={item.id} item={item} index={i} onAction={handleAction} />
            ))}
          </ol>
        )}

        {remaining > 0 && (
          <p className='text-xs text-muted-foreground'>and {remaining} more</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PrioritiesCard;
