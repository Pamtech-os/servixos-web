import { notFound } from 'next/navigation';
import type { ComponentType } from 'react';
import { getWebsiteData } from './get-website-data';
import type { WebsitePublicData } from './types';
import { resolveTemplate, type SiteTemplate } from '@/lib/website/site-templates';
import ClassicTemplate from './templates/classic';
import BubblesTemplate from './templates/bubbles';
import AuroraTemplate from './templates/aurora';
import KineticTemplate from './templates/kinetic';

const TEMPLATES: Record<SiteTemplate, ComponentType<{ data: WebsitePublicData }>> = {
  classic: ClassicTemplate,
  bubbles: BubblesTemplate,
  aurora: AuroraTemplate,
  kinetic: KineticTemplate,
};

export default async function SiteLandingPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const data = await getWebsiteData(subdomain);
  if (!data) notFound();

  const Template = TEMPLATES[resolveTemplate(data.website.template)];
  return <Template data={data} />;
}
