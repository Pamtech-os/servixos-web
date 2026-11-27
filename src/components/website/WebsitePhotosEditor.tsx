'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  ImagePlus,
  Images,
  Layout,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  Users,
  Wrench,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import ConfirmModal from '@/components/ConfirmModal';
import {
  useAddGalleryPhotoMutation,
  useRemoveGalleryPhotoMutation,
  useRemoveServicePhotoMutation,
  useRemoveSlotPhotoMutation,
  useReorderGalleryMutation,
  useSetServicePhotoMutation,
  useSetSlotPhotoMutation,
} from '@/hooks/mutations/use-website';
import { getApiErrorMessage } from '@/common/network/http-client';
import type { WebsiteConfig } from '@/lib/api-client';
import {
  PHOTO_LIMITS,
  indexByServiceName,
  nameKey,
  photoFileError,
  resolveSiteImages,
  type PhotoSlot,
  type SiteImage,
} from '@/lib/website/site-images';

type UploadTarget =
  | { kind: 'slot'; slot: PhotoSlot; label: string }
  | { kind: 'service'; serviceName: string; label: string }
  | { kind: 'gallery'; label: string };

type RemoveTarget =
  | { kind: 'slot'; slot: PhotoSlot; label: string }
  | { kind: 'service'; serviceName: string; label: string }
  | { kind: 'gallery'; photoId: string; label: string };

const SLOTS: Array<{ slot: PhotoSlot; label: string; hint: string; icon: typeof Layout }> = [
  { slot: 'hero', label: 'Hero', hint: 'The first thing visitors see. Wide shots work best.', icon: Layout },
  { slot: 'about', label: 'About', hint: 'You, your team or your workspace.', icon: Users },
];

// ─── Image preview ────────────────────────────────────────────────────────────

function ImagePreview({ image, className = '' }: { image?: SiteImage; className?: string }) {
  if (!image) {
    return (
      <div className={`flex items-center justify-center bg-muted/40 ${className}`}>
        <ImageIcon className='h-6 w-6 text-muted-foreground' />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading='lazy'
        className='h-full w-full'
        style={{ objectFit: image.source === 'photo' ? 'cover' : 'contain' }}
      />
      <Badge
        variant='secondary'
        className='absolute left-2 top-2 border-0 bg-black/60 px-1.5 py-0 text-[10px] font-medium text-white'
      >
        {image.source === 'photo' ? 'Your photo' : 'AI illustration'}
      </Badge>
    </div>
  );
}

// ─── Upload dialog ────────────────────────────────────────────────────────────

function PhotoUploadDialog({ target, onClose }: { target: UploadTarget | null; onClose: () => void }) {
  const setSlot = useSetSlotPhotoMutation();
  const setService = useSetServicePhotoMutation();
  const addToGallery = useAddGalleryPhotoMutation();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [dragging, setDragging] = useState(false);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (target) return;
    setFile(null);
    setAlt('');
    setCaption('');
  }, [target]);

  const pending = setSlot.isPending || setService.isPending || addToGallery.isPending;

  const pick = (next: File | undefined) => {
    if (!next) return;
    const error = photoFileError(next);
    if (error) {
      toast.error(error);
      return;
    }
    setFile(next);
  };

  const handleUpload = async () => {
    if (!target || !file) return;
    try {
      if (target.kind === 'slot') await setSlot.mutateAsync({ slot: target.slot, file, alt });
      else if (target.kind === 'service') await setService.mutateAsync({ serviceName: target.serviceName, file, alt });
      else await addToGallery.mutateAsync({ file, alt, caption });
      toast.success('Photo saved', { description: 'It now replaces the illustration on your site.' });
      onClose();
    } catch (err) {
      toast.error('Upload failed', { description: getApiErrorMessage(err) });
    }
  };

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{target?.kind === 'gallery' ? 'Add to gallery' : `${target?.label} photo`}</DialogTitle>
          <DialogDescription>
            JPEG, PNG, WebP or AVIF up to 10 MB. iPhone users: share HEIC photos as JPEG first.
          </DialogDescription>
        </DialogHeader>

        <button
          type='button'
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files[0]);
          }}
          className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
            dragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50'
          }`}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt='Selected photo' className='h-full w-full object-cover' />
          ) : (
            <span className='flex flex-col items-center gap-2 text-sm text-muted-foreground'>
              <ImagePlus className='h-8 w-8' />
              Click to choose a photo, or drop one here
            </span>
          )}
        </button>
        <input
          ref={inputRef}
          type='file'
          accept={PHOTO_LIMITS.accept}
          className='sr-only'
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        <div className='space-y-1.5'>
          <Label htmlFor='photo-alt' className='text-xs'>
            Description <span className='text-muted-foreground'>(optional, helps search and screen readers)</span>
          </Label>
          <Input
            id='photo-alt'
            value={alt}
            maxLength={PHOTO_LIMITS.altMax}
            placeholder='e.g. Our team fitting a new boiler'
            onChange={(e) => setAlt(e.target.value)}
            disabled={pending}
          />
        </div>

        {target?.kind === 'gallery' && (
          <div className='space-y-1.5'>
            <Label htmlFor='photo-caption' className='text-xs'>
              Caption <span className='text-muted-foreground'>(optional, shown under the photo)</span>
            </Label>
            <Input
              id='photo-caption'
              value={caption}
              maxLength={PHOTO_LIMITS.captionMax}
              placeholder='e.g. Kitchen refit in Lekki, finished in 3 days'
              onChange={(e) => setCaption(e.target.value)}
              disabled={pending}
            />
          </div>
        )}

        <DialogFooter className='gap-2'>
          {file && (
            <Button variant='outline' disabled={pending} onClick={() => inputRef.current?.click()}>
              <RefreshCw className='h-4 w-4' /> Choose another
            </Button>
          )}
          <Button disabled={!file || pending} onClick={() => void handleUpload()}>
            {pending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Upload className='h-4 w-4' />}
            {pending ? 'Uploading…' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Editor ───────────────────────────────────────────────────────────────────

interface WebsitePhotosEditorProps {
  config: WebsiteConfig | undefined;
  isLoading: boolean;
}

export default function WebsitePhotosEditor({ config, isLoading }: WebsitePhotosEditorProps) {
  const removeSlot = useRemoveSlotPhotoMutation();
  const removeService = useRemoveServicePhotoMutation();
  const removeFromGallery = useRemoveGalleryPhotoMutation();
  const reorderGallery = useReorderGalleryMutation();

  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null);

  const photos = config?.photos;
  const images = useMemo(
    () => resolveSiteImages(config?.images, config?.aiContent?.illustrations, 'Your business'),
    [config?.images, config?.aiContent?.illustrations],
  );
  const serviceImages = useMemo(() => indexByServiceName(images.services), [images.services]);
  const servicePhotos = useMemo(() => indexByServiceName(photos?.services), [photos?.services]);

  // images.services is already in display order; older API versions only have the copy's services.
  const serviceNames = useMemo(
    () =>
      images.services.length
        ? images.services.map((s) => s.serviceName)
        : (config?.aiContent?.services ?? []).map((s) => s.name),
    [images.services, config?.aiContent?.services],
  );

  const gallery = photos?.gallery ?? [];
  const galleryImages = useMemo(() => new Map(images.gallery.map((g) => [g.id, g])), [images.gallery]);
  const galleryFull = gallery.length >= PHOTO_LIMITS.maxGallery;
  const removing = removeSlot.isPending || removeService.isPending || removeFromGallery.isPending;

  const handleRemove = async () => {
    const target = removeTarget;
    if (!target) return;
    setRemoveTarget(null);
    try {
      if (target.kind === 'slot') await removeSlot.mutateAsync(target.slot);
      else if (target.kind === 'service') await removeService.mutateAsync(target.serviceName);
      else await removeFromGallery.mutateAsync(target.photoId);
      toast.success('Photo removed', {
        description: target.kind === 'gallery' ? undefined : 'The AI illustration is back. A new one may take about a minute.',
      });
    } catch (err) {
      toast.error('Couldn’t remove photo', { description: getApiErrorMessage(err) });
    }
  };

  // O(n) swap of neighbours; the API needs every id exactly once.
  const move = async (index: number, delta: -1 | 1) => {
    const ids = gallery.map((g) => g.id);
    const to = index + delta;
    if (to < 0 || to >= ids.length) return;
    [ids[index], ids[to]] = [ids[to], ids[index]];
    try {
      await reorderGallery.mutateAsync(ids);
    } catch (err) {
      toast.error('Couldn’t reorder gallery', { description: getApiErrorMessage(err) });
    }
  };

  if (isLoading) {
    return <div className='h-64 animate-pulse rounded-xl bg-muted' />;
  }

  if (!config) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center gap-2 py-12 text-center'>
          <ImageIcon className='h-8 w-8 text-muted-foreground' />
          <p className='text-sm text-muted-foreground'>Set up your website first, then add your own photos here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      <p className='rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground'>
        Your photos replace the AI illustrations section by section. Remove a photo and the illustration comes back.
      </p>

      {/* Hero & About */}
      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Page photos</CardTitle>
          <CardDescription>The big images at the top of your site and in your About section.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2'>
          {SLOTS.map(({ slot, label, hint, icon: Icon }) => {
            const hasPhoto = !!photos?.[slot];
            const busy = removeSlot.isPending && removeSlot.variables === slot;
            return (
              <div key={slot} className='overflow-hidden rounded-xl border border-border'>
                <ImagePreview image={images[slot]} className='aspect-[16/10]' />
                <div className='space-y-3 p-3'>
                  <div>
                    <p className='flex items-center gap-1.5 text-sm font-semibold'>
                      <Icon className='h-3.5 w-3.5 text-primary' /> {label}
                    </p>
                    <p className='text-xs text-muted-foreground'>{hint}</p>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Button size='sm' variant='outline' className='h-8 gap-1.5 text-xs' onClick={() => setUploadTarget({ kind: 'slot', slot, label })}>
                      <Upload className='h-3.5 w-3.5' /> {hasPhoto ? 'Replace' : 'Upload photo'}
                    </Button>
                    {hasPhoto && (
                      <Button
                        size='sm'
                        variant='ghost'
                        className='h-8 gap-1.5 text-xs text-destructive hover:text-destructive'
                        disabled={busy}
                        onClick={() => setRemoveTarget({ kind: 'slot', slot, label })}
                      >
                        {busy ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Trash2 className='h-3.5 w-3.5' />} Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Wrench className='h-4 w-4 text-primary' /> Service photos
          </CardTitle>
          <CardDescription>
            One photo per service card. Renaming or removing a service in Content deletes its photo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serviceNames.length === 0 ? (
            <p className='text-sm text-muted-foreground'>Your services will appear here once your website copy is generated.</p>
          ) : (
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              {serviceNames.map((name) => {
                const key = nameKey(name);
                const hasPhoto = servicePhotos.has(key);
                const busy = removeService.isPending && removeService.variables === name;
                return (
                  <div key={key} className='overflow-hidden rounded-xl border border-border'>
                    <ImagePreview image={serviceImages.get(key)} className='aspect-[4/3]' />
                    <div className='space-y-2 p-3'>
                      <p className='truncate text-sm font-semibold' title={name}>{name}</p>
                      <div className='flex flex-wrap gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          className='h-8 gap-1.5 text-xs'
                          onClick={() => setUploadTarget({ kind: 'service', serviceName: name, label: name })}
                        >
                          <Upload className='h-3.5 w-3.5' /> {hasPhoto ? 'Replace' : 'Upload'}
                        </Button>
                        {hasPhoto && (
                          <Button
                            size='sm'
                            variant='ghost'
                            className='h-8 gap-1.5 text-xs text-destructive hover:text-destructive'
                            disabled={busy}
                            onClick={() => setRemoveTarget({ kind: 'service', serviceName: name, label: name })}
                          >
                            {busy ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Trash2 className='h-3.5 w-3.5' />} Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gallery */}
      <Card>
        <CardHeader className='flex flex-row items-start justify-between gap-3 space-y-0'>
          <div className='space-y-1.5'>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Images className='h-4 w-4 text-primary' /> Gallery
              <Badge variant='outline' className='text-[10px]'>
                {gallery.length}/{PHOTO_LIMITS.maxGallery}
              </Badge>
            </CardTitle>
            <CardDescription>Show off finished jobs. The gallery is hidden on your site until you add a photo.</CardDescription>
          </div>
          <Button
            size='sm'
            className='shrink-0 gap-1.5'
            disabled={galleryFull}
            title={galleryFull ? `The gallery holds at most ${PHOTO_LIMITS.maxGallery} photos` : undefined}
            onClick={() => setUploadTarget({ kind: 'gallery', label: 'Gallery' })}
          >
            <ImagePlus className='h-4 w-4' /> Add photo
          </Button>
        </CardHeader>
        <CardContent>
          {gallery.length === 0 ? (
            <button
              type='button'
              onClick={() => setUploadTarget({ kind: 'gallery', label: 'Gallery' })}
              className='flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border py-10 text-sm text-muted-foreground transition-colors hover:bg-muted/40'
            >
              <ImagePlus className='h-7 w-7' />
              Add your first gallery photo
            </button>
          ) : (
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              {gallery.map((photo, i) => {
                const busy = removeFromGallery.isPending && removeFromGallery.variables === photo.id;
                return (
                  <figure key={photo.id} className='overflow-hidden rounded-xl border border-border'>
                    <ImagePreview
                      image={galleryImages.get(photo.id) ?? { ...photo, alt: photo.alt ?? photo.caption ?? '', source: 'photo' }}
                      className='aspect-[4/3]'
                    />
                    <figcaption className='space-y-2 p-3'>
                      <p className='line-clamp-2 min-h-[2rem] text-xs text-muted-foreground'>{photo.caption || 'No caption'}</p>
                      <div className='flex items-center justify-between gap-1'>
                        <div className='flex gap-1'>
                          <Button
                            size='icon'
                            variant='outline'
                            className='h-8 w-8'
                            aria-label='Move earlier'
                            disabled={i === 0 || reorderGallery.isPending}
                            onClick={() => void move(i, -1)}
                          >
                            <ArrowLeft className='h-3.5 w-3.5' />
                          </Button>
                          <Button
                            size='icon'
                            variant='outline'
                            className='h-8 w-8'
                            aria-label='Move later'
                            disabled={i === gallery.length - 1 || reorderGallery.isPending}
                            onClick={() => void move(i, 1)}
                          >
                            <ArrowRight className='h-3.5 w-3.5' />
                          </Button>
                        </div>
                        <Button
                          size='sm'
                          variant='ghost'
                          className='h-8 gap-1.5 text-xs text-destructive hover:text-destructive'
                          disabled={busy}
                          onClick={() => setRemoveTarget({ kind: 'gallery', photoId: photo.id, label: 'this gallery photo' })}
                        >
                          {busy ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Trash2 className='h-3.5 w-3.5' />} Remove
                        </Button>
                      </div>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <PhotoUploadDialog target={uploadTarget} onClose={() => setUploadTarget(null)} />

      <ConfirmModal
        open={!!removeTarget}
        onOpenChange={(open) => !open && !removing && setRemoveTarget(null)}
        title='Remove photo?'
        description={
          removeTarget?.kind === 'gallery'
            ? 'This photo will be removed from your gallery.'
            : `Your ${removeTarget?.label} photo will be deleted and the AI illustration will be shown again.`
        }
        confirmLabel='Remove'
        onConfirm={() => void handleRemove()}
      />
    </div>
  );
}
