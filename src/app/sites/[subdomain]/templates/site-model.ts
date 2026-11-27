import type { WebsitePublicData } from '../types';
import { servicePrice, startingPrice } from '@/lib/website/site-content';
import {
  indexByServiceName,
  nameKey,
  resolveSiteImages,
  type SiteGalleryImage,
  type SiteImage,
} from '@/lib/website/site-images';

export interface SiteService {
  name: string;
  description: string;
  image?: SiteImage;
  price: string | null;
}

/** Everything a template renders, with fallbacks already applied. */
export interface SiteModel {
  name: string;
  category: string;
  primary: string;
  secondary: string;
  tagline: string;
  hero: {
    headline: string;
    /** Headline minus its last two words; empty for very short headlines. */
    lead: string;
    /** Last two words of the headline, styled as the accent. */
    accent: string;
    sub: string;
    cta: string;
    image?: SiteImage;
  };
  services: SiteService[];
  fromPrice: string | null;
  valueProposition?: string;
  audience: string[];
  about?: { title: string; body: string; image?: SiteImage };
  gallery: SiteGalleryImage[];
  testimonial?: { quote: string; author: string };
  contactCta: string;
  phone?: string;
  email?: string;
  address?: string;
}

export function buildSiteModel({ business, website }: WebsitePublicData): SiteModel {
  const { aiContent, profile } = website;
  const images = resolveSiteImages(website.images, aiContent?.illustrations, business.name);
  const serviceImages = indexByServiceName(images.services);
  const primary = website.colorPrimary;
  const secondary = website.colorSecondary || primary;

  const headline = aiContent?.hero.headline ?? `Welcome to ${business.name}`;
  const words = headline.split(' ');

  const services = (
    aiContent?.services.length ? aiContent.services : business.services.map((name) => ({ name, description: '' }))
  ).map((s) => ({
    name: s.name,
    description: s.description,
    image: serviceImages.get(nameKey(s.name)),
    price: servicePrice(profile, s.name),
  }));

  const aboutBody = aiContent?.about.body ?? business.description;

  return {
    name: business.name,
    category: business.categoryName,
    primary,
    secondary,
    tagline: profile?.tagline || business.categoryName,
    hero: {
      headline,
      lead: words.slice(0, -2).join(' '),
      accent: words.slice(-2).join(' '),
      sub: aiContent?.hero.subheadline ?? business.description ?? business.categoryName,
      cta: aiContent?.hero.ctaText ?? 'Book a Service',
      image: images.hero,
    },
    services,
    fromPrice: startingPrice(profile),
    valueProposition: profile?.valueProposition,
    audience: profile?.targetCustomers ?? [],
    about: aboutBody
      ? { title: aiContent?.about.title ?? 'About Us', body: aboutBody, image: images.about }
      : undefined,
    gallery: images.gallery,
    testimonial: aiContent?.testimonialPlaceholder,
    contactCta: aiContent?.contact.callToAction ?? 'Ready to get started?',
    phone: business.phone,
    email: business.email,
    address: business.address,
  };
}

/** Three headline figures shared by every template's stats strip. */
export function siteStats(model: SiteModel): Array<{ value: string; label: string }> {
  const count = model.services.length;
  return [
    { value: `${count}`, label: count === 1 ? 'Service' : 'Services' },
    { value: model.category, label: 'Specialty' },
    model.fromPrice ? { value: model.fromPrice, label: 'Starting from' } : { value: '24/7', label: 'Online booking' },
  ];
}
