export type SiteTemplate = 'classic' | 'bubbles' | 'aurora' | 'kinetic';

export interface SiteTemplateMeta {
  id: SiteTemplate;
  name: string;
  description: string;
}

export const SITE_TEMPLATES: SiteTemplateMeta[] = [
  { id: 'classic', name: 'Classic', description: 'Clean and airy with soft floating blobs.' },
  { id: 'bubbles', name: 'Bubbles', description: 'Playful rising bubbles you can pop, bouncy cards and wavy sections.' },
  { id: 'aurora', name: 'Aurora', description: 'Dark, glowing northern-lights gradients with a cursor spotlight and 3D tilt cards.' },
  { id: 'kinetic', name: 'Kinetic', description: 'Bold moving type, scrolling marquees, parallax and magnetic buttons.' },
];

// Hash set — O(1) membership check for values coming off the wire
const TEMPLATE_IDS = new Set<string>(SITE_TEMPLATES.map((t) => t.id));

/** Unknown or missing values (older sites, older API) render as classic. */
export function resolveTemplate(value: string | undefined | null): SiteTemplate {
  return value && TEMPLATE_IDS.has(value) ? (value as SiteTemplate) : 'classic';
}
