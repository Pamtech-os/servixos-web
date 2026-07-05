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
        success: <CheckCircle2 className='h-5 w-5 text-emerald-500' />,
        error: <XCircle className='h-5 w-5 text-destructive' />,
        warning: <AlertTriangle className='h-5 w-5 text-amber-500' />,
        info: <Info className='h-5 w-5 text-primary' />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:border group-[.toaster]:border-l-4 group-[.toaster]:shadow-md group-[.toaster]:rounded-lg',
          title: 'group-[.toast]:text-foreground group-[.toast]:font-medium',
          description: 'group-[.toast]:text-muted-foreground',
          closeButton:
            'group-[.toast]:bg-background group-[.toast]:text-muted-foreground group-[.toast]:border-border hover:group-[.toast]:text-foreground hover:group-[.toast]:bg-muted',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md',
          success: 'group-[.toaster]:!border-l-emerald-500',
          error: 'group-[.toaster]:!border-l-destructive',
          warning: 'group-[.toaster]:!border-l-amber-500',
          info: 'group-[.toaster]:!border-l-primary',
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
