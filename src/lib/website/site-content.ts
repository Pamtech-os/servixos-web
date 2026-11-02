export interface SiteIllustration {
  url: string;
}

export interface SiteIllustrations {
  hero?: SiteIllustration;
  about?: SiteIllustration;
  services: Array<SiteIllustration & { name: string }>;
}

export type SitePriceUnit = 'fixed' | 'hourly' | 'per_visit' | 'monthly';

export interface SiteServiceOffer {
  name: string;
  description?: string;
  price?: number;
  priceUnit?: SitePriceUnit | string;
}

/** Owner-approved details from business setup, shown alongside the AI copy. */
export interface SiteProfile {
  tagline?: string;
  valueProposition?: string;
  targetCustomers: string[];
  currency?: string;
  services: SiteServiceOffer[];
}

const PRICE_UNIT_SUFFIX: Record<string, string> = {
  hourly: '/ hour',
  per_visit: '/ visit',
  monthly: '/ month',
};

/** "₦25,000 / visit"; null when the service has no price. */
export function formatPrice(price: number | undefined, currency: string | undefined, unit?: string): string | null {
  if (price == null) return null;
  let amount: string;
  try {
    amount = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price);
  } catch {
    amount = `${currency ?? ''} ${price.toLocaleString()}`.trim();
  }
  const suffix = unit ? PRICE_UNIT_SUFFIX[unit] : undefined;
  return suffix ? `${amount} ${suffix}` : amount;
}

const byName = <T extends { name: string }>(items: T[] | undefined, name: string): T | undefined => {
  const key = name.trim().toLowerCase();
  return items?.find((item) => item.name.trim().toLowerCase() === key);
};

/** The illustration drawn for a service, matched by name. */
export function serviceIllustration(illustrations: SiteIllustrations | undefined, name: string): string | undefined {
  return byName(illustrations?.services, name)?.url;
}

/** The setup price for a service, formatted, matched by name. */
export function servicePrice(profile: SiteProfile | undefined, name: string): string | null {
  const offer = byName(profile?.services, name);
  return offer ? formatPrice(offer.price, profile?.currency, offer.priceUnit) : null;
}

/** The lowest priced setup service, for a "from" headline figure. */
export function startingPrice(profile: SiteProfile | undefined): string | null {
  const priced = (profile?.services ?? []).filter((s) => s.price != null);
  if (!priced.length) return null;
  const cheapest = priced.reduce((min, s) => (s.price! < min.price! ? s : min));
  return formatPrice(cheapest.price, profile?.currency);
}
