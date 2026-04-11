import type { ComponentProps } from 'react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, toast } from 'sonner';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

type ToasterProps = ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group'
      icons={{
        success: (
          <CheckCircle2 className='h-5 w-5 text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]' />
        ),
        error: (
          <XCircle className='h-5 w-5 text-destructive drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]' />
        ),
        warning: (
          <AlertTriangle className='h-5 w-5 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]' />
        ),
        info: <Info className='h-5 w-5 text-primary drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]' />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:rounded-xl group-[.toaster]:border',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg',
          success:
            'group-[.toaster]:!border-emerald-500/30 group-[.toaster]:!bg-emerald-500/5 group-[.toaster]:!shadow-[0_0_20px_-4px_rgba(16,185,129,0.3)]',
          error:
            'group-[.toaster]:!border-destructive/30 group-[.toaster]:!bg-destructive/5 group-[.toaster]:!shadow-[0_0_20px_-4px_rgba(239,68,68,0.3)]',
          warning:
            'group-[.toaster]:!border-amber-500/30 group-[.toaster]:!bg-amber-500/5 group-[.toaster]:!shadow-[0_0_20px_-4px_rgba(245,158,11,0.3)]',
          info: 'group-[.toaster]:!border-primary/30 group-[.toaster]:!bg-primary/5 group-[.toaster]:!shadow-[0_0_20px_-4px_rgba(59,130,246,0.3)]',
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
