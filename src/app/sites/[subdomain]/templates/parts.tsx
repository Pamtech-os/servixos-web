const ICON_PATHS = {
  phone:
    'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  email:
    'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  pin: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
  arrow: 'M17 8l4 4m0 0l-4 4m4-4H3',
  chevron: 'M9 5l7 7-7 7',
} as const;

export type IconName = keyof typeof ICON_PATHS;

export function Icon({ name, className = 'h-4 w-4', strokeWidth = 2.2 }: { name: IconName; className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={strokeWidth} aria-hidden='true'>
      <path strokeLinecap='round' strokeLinejoin='round' d={ICON_PATHS[name]} />
    </svg>
  );
}

export interface ContactItem {
  icon: IconName;
  label: string;
  value: string;
  href?: string;
}

/** Phone, email and address entries the business has filled in, in display order. */
export function contactItems({ phone, email, address }: { phone?: string; email?: string; address?: string }): ContactItem[] {
  const items: ContactItem[] = [];
  if (phone) items.push({ icon: 'phone', label: 'Phone', value: phone, href: `tel:${phone}` });
  if (email) items.push({ icon: 'email', label: 'Email', value: email, href: `mailto:${email}` });
  if (address) items.push({ icon: 'pin', label: 'Address', value: address });
  return items;
}
