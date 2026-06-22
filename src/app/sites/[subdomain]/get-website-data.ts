import type { WebsitePublicData } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api-dev.servixos.com/api';

export async function getWebsiteData(subdomain: string): Promise<WebsitePublicData | null> {
  try {
    const res = await fetch(`${API_BASE}/website/public/${subdomain}`, {
      next: { revalidate: 300 },
      headers: { 'x-channel': 'web' },
    });
    if (!res.ok) {
      console.error(`[getWebsiteData] ${subdomain}: HTTP ${res.status}`);
      return null;
    }
    const json = await res.json();
    if (!json.data) console.error(`[getWebsiteData] ${subdomain}: empty data`, json);
    return (json.data as WebsitePublicData) ?? null;
  } catch (err) {
    console.error(`[getWebsiteData] ${subdomain}: fetch error`, err);
    return null;
  }
}
