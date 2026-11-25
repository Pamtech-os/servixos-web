import { useId } from 'react';
import { ChevronDown, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SuggestionEducation } from '@/lib/api-client';

export const PRINCIPLE_BOX_CLASS =
  'rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2 text-[12px] leading-relaxed';

interface SuggestionEducationSectionProps {
  education: SuggestionEducation;
  expanded: boolean;
  onToggle: () => void;
}

const SuggestionEducationSection = ({
  education,
  expanded,
  onToggle,
}: SuggestionEducationSectionProps) => {
  const bodyId = useId();

  return (
    <div className='rounded-xl border border-border bg-muted/20'>
      <button
        type='button'
        aria-expanded={expanded}
        aria-controls={bodyId}
        onClick={onToggle}
        className='flex w-full items-center justify-between gap-2 px-3 py-2 text-left'
      >
        <span className='flex min-w-0 flex-wrap items-center gap-1.5'>
          <span className='text-[12px] font-semibold'>Why this matters</span>
          <span className='inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400'>
            <GraduationCap size={11} aria-hidden />
            <span className='sr-only'>Business concept: </span>
            {education.concept.name}
          </span>
        </span>
        <ChevronDown
          size={14}
          aria-hidden
          className={cn('shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')}
        />
      </button>
      <div id={bodyId} hidden={!expanded} className='space-y-2 px-3 pb-3'>
        <p className='text-[12px] leading-relaxed text-muted-foreground'>{education.whyItMatters}</p>
        <div className={PRINCIPLE_BOX_CLASS}>
          <p className='mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'>
            Established principle
          </p>
          <p>{education.principle}</p>
        </div>
      </div>
    </div>
  );
};

export default SuggestionEducationSection;
