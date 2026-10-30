'use client';

import { useState } from 'react';
import { Check, CheckCircle2, Loader2, Pencil, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import {
  REQUIRED_SECTIONS,
  type OnboardingProfile,
  type ProfileSectionKey,
  type ProfileSectionMap,
  type SectionMeta,
  type StoredSection,
} from '@/lib/api-client';
import {
  useApproveProfileSection,
  useUpdateProfileSection,
} from '@/hooks/mutations/use-onboarding';
import { getApiErrorMessage } from '@/common/network/http-client';
import {
  BrandEditor,
  ConceptEditor,
  PRICE_UNIT_LABELS,
  ServicesEditor,
} from '@/components/onboarding/ProfileSectionEditors';
import { cn } from '@/lib/utils';

const SECTION_ORDER: ProfileSectionKey[] = [
  'person',
  'existingBusiness',
  'opportunities',
  'concept',
  'brand',
  'services',
  'workflows',
  'plan',
];

export const SECTION_LABELS: Record<ProfileSectionKey, string> = {
  person: 'About you',
  existingBusiness: 'Your current business',
  opportunities: 'Opportunities',
  concept: 'Business concept',
  brand: 'Brand',
  services: 'Services & pricing',
  workflows: 'Workflows',
  plan: 'Launch plan',
};

const REQUIRED = new Set<ProfileSectionKey>(REQUIRED_SECTIONS);

const META_KEYS = new Set<string>(['status', 'updatedBy', 'updatedAt'] satisfies Array<keyof SectionMeta>);

/** PATCH replaces the stored section and must not include the server-owned meta fields. */
const stripMeta = <K extends ProfileSectionKey>(section: StoredSection<K>): ProfileSectionMap[K] =>
  Object.fromEntries(
    Object.entries(section).filter(([key]) => !META_KEYS.has(key))
  ) as ProfileSectionMap[K];

const formatPrice = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
};

// ─── Read-only views ──────────────────────────────────────────────────────────

const Row = ({ label, children }: { label: string; children: React.ReactNode }) =>
  children ? (
    <div className='space-y-0.5'>
      <p className='text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>{label}</p>
      <div className='text-sm'>{children}</div>
    </div>
  ) : null;

const Chips = ({ items }: { items?: string[] }) =>
  items?.length ? (
    <div className='flex flex-wrap gap-1.5'>
      {items.map((item) => (
        <span key={item} className='rounded-full bg-muted px-2 py-0.5 text-xs'>
          {item}
        </span>
      ))}
    </div>
  ) : null;

const SectionView = ({
  sectionKey,
  section,
  onSelectOpportunity,
  selecting,
}: {
  sectionKey: ProfileSectionKey;
  section: OnboardingProfile[ProfileSectionKey];
  onSelectOpportunity: (index: number) => void;
  selecting: boolean;
}) => {
  if (!section) return null;

  switch (sectionKey) {
    case 'person': {
      const s = section as StoredSection<'person'>;
      return (
        <div className='space-y-2'>
          <Row label='Interests'><Chips items={s.interests} /></Row>
          <Row label='Skills'><Chips items={s.skills} /></Row>
          <Row label='Experience'>{s.experience}</Row>
          <Row label='Goals'><Chips items={s.goals} /></Row>
          <Row label='Time available'>{s.weeklyHours != null && `${s.weeklyHours} hours / week`}</Row>
          <Row label='Budget'>{s.budgetAmount != null && s.budgetAmount.toLocaleString()}</Row>
          <Row label='Concerns'><Chips items={s.concerns} /></Row>
        </div>
      );
    }
    case 'existingBusiness': {
      const s = section as StoredSection<'existingBusiness'>;
      return (
        <div className='space-y-2'>
          <Row label='Description'>{s.description}</Row>
          <Row label='Customers'>{s.customers}</Row>
          <Row label='Current services'><Chips items={s.currentServices} /></Row>
          <Row label='Current pricing'>{s.currentPricing}</Row>
          <Row label='Challenges'><Chips items={s.challenges} /></Row>
          <Row label='Growth goals'><Chips items={s.growthGoals} /></Row>
        </div>
      );
    }
    case 'opportunities': {
      const s = section as StoredSection<'opportunities'>;
      return (
        <div className='space-y-2'>
          {s.items.map((item, index) => {
            const selected = s.selectedIndex === index;
            return (
              <div
                key={item.title}
                className={cn(
                  'space-y-1.5 rounded-xl border p-3',
                  selected ? 'border-primary bg-primary/5' : 'border-border'
                )}
              >
                <div className='flex items-start justify-between gap-2'>
                  <p className='text-sm font-semibold'>{item.title}</p>
                  {selected ? (
                    <span className='flex items-center gap-1 text-xs text-primary'>
                      <Check className='h-3.5 w-3.5' /> Chosen
                    </span>
                  ) : (
                    <Button
                      size='sm'
                      variant='outline'
                      className='h-7 text-xs'
                      disabled={selecting}
                      onClick={() => onSelectOpportunity(index)}
                    >
                      Choose
                    </Button>
                  )}
                </div>
                <p className='text-xs text-muted-foreground'>{item.summary}</p>
                {item.whyItFits && <p className='text-xs'>Why it fits: {item.whyItFits}</p>}
                {item.estimatedStartupCost && (
                  <p className='text-xs text-muted-foreground'>
                    Estimated startup cost (suggestion): {item.estimatedStartupCost}
                  </p>
                )}
                {item.risks.length > 0 && (
                  <p className='text-xs text-muted-foreground'>Risks: {item.risks.join(' · ')}</p>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    case 'concept': {
      const s = section as StoredSection<'concept'>;
      return (
        <div className='space-y-2'>
          <Row label='Summary'>{s.summary}</Row>
          <Row label='Value proposition'>{s.valueProposition}</Row>
          <Row label='Target customers'><Chips items={s.targetCustomers} /></Row>
          <Row label='Industry'>{s.industry}</Row>
        </div>
      );
    }
    case 'brand': {
      const s = section as StoredSection<'brand'>;
      return (
        <div className='space-y-2'>
          <p className='font-display text-lg font-bold' style={{ fontFamily: s.font }}>
            {s.name}
          </p>
          {s.tagline && <p className='text-sm text-muted-foreground'>{s.tagline}</p>}
          <div className='flex items-center gap-3 text-xs text-muted-foreground'>
            {[s.primaryColor, s.secondaryColor].map((color) => (
              <span key={color} className='flex items-center gap-1.5'>
                <span className='h-4 w-4 rounded-full border border-border' style={{ background: color }} />
                {color}
              </span>
            ))}
            <span>· {s.font}</span>
          </div>
          <Row label='Tone'>{s.tone}</Row>
        </div>
      );
    }
    case 'services': {
      const s = section as StoredSection<'services'>;
      return (
        <div className='space-y-2'>
          {s.items.map((item) => (
            <div key={item.name} className='flex items-start justify-between gap-3'>
              <div>
                <p className='text-sm font-medium'>{item.name}</p>
                {item.description && (
                  <p className='text-xs text-muted-foreground'>{item.description}</p>
                )}
              </div>
              {item.price != null && (
                <span className='shrink-0 text-sm font-semibold'>
                  {formatPrice(item.price, s.currency)}
                  <span className='text-xs font-normal text-muted-foreground'>
                    {PRICE_UNIT_LABELS[item.priceUnit ?? 'fixed']}
                  </span>
                </span>
              )}
            </div>
          ))}
          <p className='text-[11px] text-muted-foreground'>
            Prices are AI suggestions — adjust them to your market.
          </p>
        </div>
      );
    }
    case 'workflows': {
      const s = section as StoredSection<'workflows'>;
      return (
        <div className='space-y-2'>
          {s.items.map((wf) => (
            <div key={wf.name}>
              <p className='text-sm font-medium'>{wf.name}</p>
              <ol className='ml-4 list-decimal text-xs text-muted-foreground'>
                {wf.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      );
    }
    case 'plan': {
      const s = section as StoredSection<'plan'>;
      return (
        <div className='space-y-2'>
          <Row label='Goals'><Chips items={s.goals} /></Row>
          <ul className='space-y-1.5'>
            {s.actions.map((action) => (
              <li key={action.title} className='text-sm'>
                <span className='font-medium'>{action.title}</span>
                {action.timeframe && (
                  <span className='text-xs text-muted-foreground'> · {action.timeframe}</span>
                )}
                {action.why && <p className='text-xs text-muted-foreground'>{action.why}</p>}
              </li>
            ))}
          </ul>
        </div>
      );
    }
  }
};

// ─── Section card ─────────────────────────────────────────────────────────────

const EDITABLE = new Set<ProfileSectionKey>(['concept', 'brand', 'services']);

const SectionCard = ({
  sectionKey,
  section,
  highlighted,
}: {
  sectionKey: ProfileSectionKey;
  section: OnboardingProfile[ProfileSectionKey];
  highlighted: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const updateMutation = useUpdateProfileSection();
  const approveMutation = useApproveProfileSection();
  const required = REQUIRED.has(sectionKey);

  const save = async (data: ProfileSectionMap[ProfileSectionKey]) => {
    try {
      await updateMutation.mutateAsync({ section: sectionKey, data });
      setEditing(false);
      toast.success(`${SECTION_LABELS[sectionKey]} saved`, { description: 'Approve it when you are happy.' });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const approve = async () => {
    try {
      await approveMutation.mutateAsync(sectionKey);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const selectOpportunity = (index: number) => {
    if (!section) return;
    const data = stripMeta(section as StoredSection<'opportunities'>);
    void save({ ...data, selectedIndex: index });
  };

  const approved = section?.status === 'approved';

  return (
    <div
      id={`profile-section-${sectionKey}`}
      className={cn(
        'space-y-3 rounded-2xl border bg-card/60 p-4 transition-colors',
        highlighted && !approved ? 'border-amber-500/70 ring-2 ring-amber-500/30' : 'border-border'
      )}
    >
      <div className='flex items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <h3 className='font-semibold'>{SECTION_LABELS[sectionKey]}</h3>
          {required && !approved && (
            <span className='rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500'>
              Required
            </span>
          )}
        </div>
        {section && (
          <span
            className={cn(
              'flex items-center gap-1 text-xs',
              approved ? 'text-emerald-500' : 'text-muted-foreground'
            )}
          >
            {approved ? (
              <>
                <CheckCircle2 className='h-3.5 w-3.5' /> Approved
              </>
            ) : section.updatedBy === 'ai' ? (
              <>
                <Sparkles className='h-3.5 w-3.5' /> AI draft
              </>
            ) : (
              <>
                <User className='h-3.5 w-3.5' /> Your draft
              </>
            )}
          </span>
        )}
      </div>

      {!section ? (
        <p className='text-xs text-muted-foreground'>
          The AI will draft this as you chat.
        </p>
      ) : editing ? (
        sectionKey === 'concept' ? (
          <ConceptEditor
            value={stripMeta(section as StoredSection<'concept'>)}
            saving={updateMutation.isPending}
            onSave={(v) => void save(v)}
            onCancel={() => setEditing(false)}
          />
        ) : sectionKey === 'brand' ? (
          <BrandEditor
            value={stripMeta(section as StoredSection<'brand'>)}
            saving={updateMutation.isPending}
            onSave={(v) => void save(v)}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <ServicesEditor
            value={stripMeta(section as StoredSection<'services'>)}
            saving={updateMutation.isPending}
            onSave={(v) => void save(v)}
            onCancel={() => setEditing(false)}
          />
        )
      ) : (
        <>
          <SectionView
            sectionKey={sectionKey}
            section={section}
            onSelectOpportunity={selectOpportunity}
            selecting={updateMutation.isPending}
          />
          <div className='flex flex-wrap justify-end gap-2'>
            {EDITABLE.has(sectionKey) && (
              <Button size='sm' variant='ghost' onClick={() => setEditing(true)}>
                <Pencil className='h-3.5 w-3.5' /> Edit
              </Button>
            )}
            {!approved && (
              <Button size='sm' onClick={() => void approve()} disabled={approveMutation.isPending}>
                {approveMutation.isPending ? (
                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                ) : (
                  <Check className='h-3.5 w-3.5' />
                )}
                Approve
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Panel ────────────────────────────────────────────────────────────────────

interface ProfilePanelProps {
  profile: OnboardingProfile;
  highlighted: ReadonlySet<ProfileSectionKey>;
}

const ProfilePanel = ({ profile, highlighted }: ProfilePanelProps) => {
  // Drafted sections in journey order, plus placeholders for required ones not drafted yet.
  const visible = SECTION_ORDER.filter((key) => profile[key] || REQUIRED.has(key));

  return (
    <div className='space-y-3'>
      <p className='text-xs text-muted-foreground'>
        Edit anything that isn&apos;t quite right, or ask the AI to change it in the chat. Approve
        the concept, brand and services to launch.
      </p>
      {visible.map((key) => (
        <SectionCard
          key={key}
          sectionKey={key}
          section={profile[key]}
          highlighted={highlighted.has(key)}
        />
      ))}
    </div>
  );
};

export default ProfilePanel;
