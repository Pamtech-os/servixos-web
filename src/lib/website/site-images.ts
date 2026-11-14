import type { SiteIllustrations } from './site-content';

export type PhotoSlot = 'hero' | 'about';

export interface SitePhoto {
  url: string;
  publicId: string;
  width: number;
  height: number;
  alt?: string;
}
export interface SiteServicePhoto extends SitePhoto {
  serviceName: string;
}
export interface SiteGalleryPhoto extends SitePhoto {
  id: string;
  caption?: string;
}

export interface SitePhotos {
  hero?: SitePhoto;
  about?: SitePhoto;
  services: SiteServicePhoto[];
  gallery: SiteGalleryPhoto[];
}

/** What a section renders: the owner's photo when there is one, otherwise the AI illustration. */
export interface SiteImage {
  url: string;
  source: 'photo' | 'illustration';
  alt: string;
  /** Photos only. */
  width?: number;
  /** Photos only. */
  height?: number;
}
export interface SiteServiceImage extends SiteImage {
  serviceName: string;
}
export interface SiteGalleryImage extends SiteImage {
  id: string;
  caption?: string;
}

export interface SiteImages {
  hero?: SiteImage;
  about?: SiteImage;
  /** Display order. */
  services: SiteServiceImage[];
  gallery: SiteGalleryImage[];
}

export interface WebsitePhotosData {
  photos: SitePhotos;
  images: SiteImages;
}

export const PHOTO_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  maxGallery: 12,
  altMax: 200,
  captionMax: 300,
  accept: 'image/jpeg,image/png,image/webp,image/avif',
} as const;

const ACCEPTED_TYPES: ReadonlySet<string> = new Set(PHOTO_LIMITS.accept.split(','));

/** A user-facing reason the file can't be uploaded, or null when it looks fine. */
export function photoFileError(file: File): string | null {
  if (!file.size) return 'That file is empty.';
  if (file.size > PHOTO_LIMITS.maxBytes) return 'Photos must be 10 MB or smaller.';
  // Some browsers leave `type` blank for HEIC; the server checks the real bytes either way.
  if (/\.hei[cf]$/i.test(file.name) || /hei[cf]/i.test(file.type)) {
    return 'HEIC photos aren’t supported. Share it as a JPEG and try again.';
  }
  if (file.type && !ACCEPTED_TYPES.has(file.type)) return 'Photo must be a JPEG, PNG, WebP or AVIF image.';
  return null;
}

export const nameKey = (name: string) => name.trim().toLowerCase();

/** Case-insensitive lookup by service name, built once so each card lookup is O(1). */
export function indexByServiceName<T extends { serviceName: string }>(items: readonly T[] | undefined): Map<string, T> {
  const index = new Map<string, T>();
  for (const item of items ?? []) {
    const key = nameKey(item.serviceName);
    if (!index.has(key)) index.set(key, item);
  }
  return index;
}

/**
 * The images a site renders. Uses `website.images` as the API resolved it; only API versions
 * that predate photos fall back to the raw illustrations.
 */
export function resolveSiteImages(
  images: SiteImages | undefined,
  illustrations: SiteIllustrations | undefined,
  businessName: string,
): SiteImages {
  if (images) return { ...images, services: images.services ?? [], gallery: images.gallery ?? [] };

  const illustration = (url: string | undefined, alt: string): SiteImage | undefined =>
    url ? { url, alt, source: 'illustration' } : undefined;

  return {
    hero: illustration(illustrations?.hero?.url, businessName),
    about: illustration(illustrations?.about?.url, `About ${businessName}`),
    services: (illustrations?.services ?? []).map((s) => ({
      serviceName: s.name,
      url: s.url,
      alt: s.name,
      source: 'illustration' as const,
    })),
    gallery: [],
  };
}
