'use client';

import { useState } from 'react';
import { Globe, Loader2, MessageSquarePlus, RefreshCw, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/sonner';
import type { WebsitePreview } from '@/lib/api-client';
import { useRegeneratePreview } from '@/hooks/mutations/use-onboarding';
import { HttpError, getApiErrorMessage } from '@/common/network/http-client';

const MAX_INSTRUCTIONS_LENGTH = 1000;

interface WebsitePreviewPanelProps {
  preview: WebsitePreview | undefined;
  isLoading: boolean;
  /** Generation needs a drafted concept and brand. */
  canGenerate: boolean;
}

const SitePreview = ({ preview }: { preview: WebsitePreview }) => {
  const { business, website } = preview;
  const content = website.aiContent;
  const primary = website.colorPrimary;
  const secondary = website.colorSecondary;
  const services = content?.services.length
    ? content.services
    : business.services.map((name) => ({ name, description: '' }));
  const testimonial = content?.testimonialPlaceholder;

  return (
    <div
      className='overflow-hidden rounded-xl border border-border bg-white text-slate-900'
      style={{ fontFamily: website.font }}
    >
      {/* Browser chrome */}
      <div className='flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-3 py-2'>
        {['#f87171', '#fbbf24', '#34d399'].map((c) => (
          <span key={c} className='h-2.5 w-2.5 rounded-full' style={{ background: c }} />
        ))}
        <span className='ml-2 truncate text-[11px] text-slate-500'>{business.name}</span>
      </div>

      <section
        className='px-6 py-10 text-white'
        style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
      >
        <p className='text-xs font-semibold uppercase tracking-wider opacity-80'>{business.name}</p>
        <h3 className='mt-2 text-2xl font-bold leading-tight'>
          {content?.hero.headline ?? `Welcome to ${business.name}`}
        </h3>
        <p className='mt-2 text-sm opacity-90'>
          {content?.hero.subheadline ?? business.description ?? business.categoryName}
        </p>
        <span className='mt-4 inline-block rounded-full bg-white px-4 py-2 text-xs font-semibold' style={{ color: primary }}>
          {content?.hero.ctaText ?? 'Book a Service'}
        </span>
      </section>

      {content?.about && (
        <section className='px-6 py-6'>
          <h4 className='text-base font-bold'>{content.about.title}</h4>
          <p className='mt-1 text-sm text-slate-600'>{content.about.body}</p>
        </section>
      )}

      {services.length > 0 && (
        <section className='bg-slate-50 px-6 py-6'>
          <h4 className='text-base font-bold'>Services</h4>
          <div className='mt-3 grid gap-2 sm:grid-cols-2'>
            {services.map((s) => (
              <div key={s.name} className='rounded-lg border border-slate-200 bg-white p-3'>
                <p className='text-sm font-semibold' style={{ color: primary }}>
                  {s.name}
                </p>
                {s.description && <p className='mt-1 text-xs text-slate-600'>{s.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {testimonial && (
        <section className='px-6 py-6'>
          {testimonial.isPlaceholder ? (
            // Shown as a placeholder only; the public site hides it until replaced.
            <div className='rounded-lg border-2 border-dashed border-slate-300 p-4 text-center'>
              <MessageSquarePlus className='mx-auto h-5 w-5 text-slate-400' />
              <p className='mt-1 text-xs font-semibold text-slate-500'>Add a real review</p>
              <p className='mt-1 text-xs italic text-slate-400'>&ldquo;{testimonial.quote}&rdquo;</p>
            </div>
          ) : (
            <blockquote className='rounded-lg bg-slate-50 p-4 text-sm italic text-slate-700'>
              &ldquo;{testimonial.quote}&rdquo;
              <footer className='mt-2 text-xs not-italic text-slate-500'>— {testimonial.author}</footer>
            </blockquote>
          )}
        </section>
      )}

      {content?.contact && (
        <section className='px-6 pb-8 pt-2 text-center'>
          <p className='text-sm font-medium'>{content.contact.callToAction}</p>
        </section>
      )}
    </div>
  );
};

const WebsitePreviewPanel = ({ preview, isLoading, canGenerate }: WebsitePreviewPanelProps) => {
  const [instructions, setInstructions] = useState('');
  const regenerate = useRegeneratePreview();
  const hasContent = Boolean(preview?.generatedAt);

  const handleGenerate = async () => {
    try {
      await regenerate.mutateAsync(instructions.trim() || undefined);
      setInstructions('');
    } catch (err) {
      if (err instanceof HttpError && err.status === 503) {
        toast.error('Website generation failed', { description: 'Please try again in a moment.' });
      } else if (err instanceof HttpError && err.status === 429) {
        toast.error('Too many previews', { description: 'Wait a minute before regenerating.' });
      } else {
        toast.error(getApiErrorMessage(err));
      }
    }
  };

  return (
    <div className='space-y-3'>
      <div className='flex gap-2'>
        <Input
          value={instructions}
          maxLength={MAX_INSTRUCTIONS_LENGTH}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={hasContent ? 'e.g. a warmer hero, shorter about section' : 'Optional style notes'}
          disabled={!canGenerate || regenerate.isPending}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleGenerate();
          }}
        />
        <Button
          onClick={() => void handleGenerate()}
          disabled={!canGenerate || regenerate.isPending}
          className='shrink-0'
        >
          {regenerate.isPending ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : hasContent ? (
            <RefreshCw className='h-4 w-4' />
          ) : (
            <Wand2 className='h-4 w-4' />
          )}
          {hasContent ? 'Regenerate' : 'Generate'}
        </Button>
      </div>

      {!canGenerate && (
        <p className='text-xs text-muted-foreground'>
          Your website preview unlocks once the AI has drafted your concept and brand.
        </p>
      )}

      {isLoading || regenerate.isPending ? (
        <Skeleton className='h-[420px] rounded-xl' />
      ) : preview ? (
        <SitePreview preview={preview} />
      ) : (
        <div className='flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center'>
          <Globe className='h-8 w-8 text-muted-foreground' />
          <p className='text-sm text-muted-foreground'>Your website preview will appear here.</p>
        </div>
      )}

      <p className='text-[11px] text-muted-foreground'>
        This is a preview. Your site is saved unpublished when you launch, and you can publish
        it from the Website Builder.
      </p>
    </div>
  );
};

export default WebsitePreviewPanel;
