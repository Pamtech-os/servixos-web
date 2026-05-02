import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { type PaginationMeta } from '@/lib/pagination';
import { Button, type ButtonProps } from '@/components/ui/button';

type PaginationControlsProps = {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  label?: ReactNode;
  layout?: 'split' | 'centered';
  className?: string;
  labelClassName?: string;
  controlsClassName?: string;
  buttonSize?: ButtonProps['size'];
  buttonClassName?: string;
  hideWhenSinglePage?: boolean;
};

const PaginationControls = ({
  meta,
  onPageChange,
  label,
  layout = 'split',
  className,
  labelClassName,
  controlsClassName,
  buttonSize = 'icon',
  buttonClassName,
  hideWhenSinglePage = true,
}: PaginationControlsProps) => {
  if (hideWhenSinglePage && meta.totalPages <= 1) {
    return null;
  }

  const canGoPrev = meta.page > 1;
  const canGoNext = meta.page < meta.totalPages;

  if (layout === 'centered') {
    return (
      <div className={cn('flex items-center justify-center gap-2', className)}>
        <Button
          variant='outline'
          size={buttonSize}
          className={buttonClassName}
          disabled={!canGoPrev}
          onClick={() => canGoPrev && onPageChange(meta.page - 1)}
        >
          <ChevronLeft size={16} />
        </Button>
        <p className={cn('text-sm text-muted-foreground', labelClassName)}>
          {label ?? `Page ${meta.page} of ${meta.totalPages}`}
        </p>
        <Button
          variant='outline'
          size={buttonSize}
          className={buttonClassName}
          disabled={!canGoNext}
          onClick={() => canGoNext && onPageChange(meta.page + 1)}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <p className={cn('text-sm text-muted-foreground', labelClassName)}>
        {label ?? `Page ${meta.page} of ${meta.totalPages}`}
      </p>
      <div className={cn('flex gap-1', controlsClassName)}>
        <Button
          variant='outline'
          size={buttonSize}
          className={buttonClassName}
          disabled={!canGoPrev}
          onClick={() => canGoPrev && onPageChange(meta.page - 1)}
        >
          <ChevronLeft size={16} />
        </Button>
        <Button
          variant='outline'
          size={buttonSize}
          className={buttonClassName}
          disabled={!canGoNext}
          onClick={() => canGoNext && onPageChange(meta.page + 1)}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
};

export default PaginationControls;
