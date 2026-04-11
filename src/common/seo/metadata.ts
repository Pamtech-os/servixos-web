import type { Metadata } from 'next';

const DEFAULT_SITE_NAME = 'ServixOS';
const DEFAULT_DESCRIPTION =
  'ServixOS helps service businesses manage clients, jobs, teams, invoices, and analytics from one fast dashboard.';

export function buildPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description?: string;
  path: string;
}): Metadata {
  const resolvedDescription = description ?? DEFAULT_DESCRIPTION;

  return {
    title,
    description: resolvedDescription,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description: resolvedDescription,
      url: path,
      siteName: DEFAULT_SITE_NAME,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: resolvedDescription,
    },
  };
}
