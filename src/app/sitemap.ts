import type { MetadataRoute } from 'next';

const baseUrl = 'https://servixos.app';

const routes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/dashboard',
  '/clients',
  '/invoices',
  '/jobs',
  '/roles',
  '/payments',
  '/activity-logs',
  '/analytics',
  '/requests',
  '/ai-insights',
  '/ai-advisor',
  '/teams',
  '/settings',
  '/my-website',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const updatedAt = new Date();

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: updatedAt,
    changeFrequency: 'weekly',
    priority: route === '/dashboard' ? 1 : 0.7,
  }));
}
