'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  BrandSection,
  ConceptSection,
  PriceUnit,
  ServiceItem,
  ServicesSection,
} from '@/lib/api-client';

const MAX_LIST_ITEMS = 20;
const MAX_LIST_ITEM_LENGTH = 200;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const FONTS = ['Inter', 'Poppins', 'Montserrat', 'Nunito', 'Lora', 'Playfair Display', 'Georgia'];
const PRICE_UNITS: Array<{ value: PriceUnit; label: string }> = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'hourly', label: 'Per hour' },
  { value: 'per_visit', label: 'Per visit' },
  { value: 'monthly', label: 'Per month' },
];

const linesToList = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim().slice(0, MAX_LIST_ITEM_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);

interface EditorProps<T> {
  value: T;
  saving: boolean;
  onSave: (value: T) => void;
  onCancel: () => void;
}

const EditorActions = ({
  saving,
  disabled,
  onCancel,
}: {
  saving: boolean;
  disabled?: boolean;
  onCancel: () => void;
}) => (
  <div className='flex justify-end gap-2 pt-1'>
    <Button type='button' variant='ghost' size='sm' onClick={onCancel} disabled={saving}>
      Cancel
    </Button>
    <Button type='submit' size='sm' disabled={saving || disabled}>
      {saving && <Loader2 className='h-3.5 w-3.5 animate-spin' />}
      Save
    </Button>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='space-y-1'>
    <Label className='text-xs text-muted-foreground'>{label}</Label>
    {children}
  </div>
);

// ─── Concept ──────────────────────────────────────────────────────────────────

export const ConceptEditor = ({ value, saving, onSave, onCancel }: EditorProps<ConceptSection>) => {
  const [form, setForm] = useState({
    summary: value.summary ?? '',
    valueProposition: value.valueProposition ?? '',
    targetCustomers: (value.targetCustomers ?? []).join('\n'),
    industry: value.industry ?? '',
  });
  const valid = form.summary.trim() && form.valueProposition.trim() && form.industry.trim();

  return (
    <form
      className='space-y-3'
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          summary: form.summary.trim(),
          valueProposition: form.valueProposition.trim(),
          targetCustomers: linesToList(form.targetCustomers),
          industry: form.industry.trim(),
        });
      }}
    >
      <Field label='Summary'>
        <Textarea
          value={form.summary}
          maxLength={2000}
          onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
        />
      </Field>
      <Field label='Value proposition'>
        <Textarea
          value={form.valueProposition}
          maxLength={2000}
          onChange={(e) => setForm((f) => ({ ...f, valueProposition: e.target.value }))}
        />
      </Field>
      <Field label='Target customers (one per line)'>
        <Textarea
          value={form.targetCustomers}
          onChange={(e) => setForm((f) => ({ ...f, targetCustomers: e.target.value }))}
        />
      </Field>
      <Field label='Industry'>
        <Input
          value={form.industry}
          maxLength={200}
          onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
        />
      </Field>
      <EditorActions saving={saving} disabled={!valid} onCancel={onCancel} />
    </form>
  );
};

// ─── Brand ────────────────────────────────────────────────────────────────────

const ColorField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <Field label={label}>
    <div className='flex items-center gap-2'>
      <input
        type='color'
        value={HEX_COLOR.test(value) ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className='h-9 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-transparent'
        aria-label={label}
      />
      <Input
        value={value}
        maxLength={7}
        onChange={(e) => onChange(e.target.value)}
        className={HEX_COLOR.test(value) ? '' : 'border-destructive'}
      />
    </div>
  </Field>
);

export const BrandEditor = ({ value, saving, onSave, onCancel }: EditorProps<BrandSection>) => {
  const [form, setForm] = useState<BrandSection>({
    name: value.name ?? '',
    tagline: value.tagline ?? '',
    primaryColor: value.primaryColor ?? '#2563eb',
    secondaryColor: value.secondaryColor ?? '#64748b',
    font: value.font ?? 'Inter',
    tone: value.tone ?? '',
  });
  const fonts = FONTS.includes(form.font) ? FONTS : [form.font, ...FONTS];
  const valid =
    form.name.trim() && HEX_COLOR.test(form.primaryColor) && HEX_COLOR.test(form.secondaryColor);

  return (
    <form
      className='space-y-3'
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...form,
          name: form.name.trim(),
          tagline: form.tagline?.trim(),
          tone: form.tone?.trim(),
        });
      }}
    >
      <Field label='Business name'>
        <Input
          value={form.name}
          maxLength={80}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </Field>
      <Field label='Tagline'>
        <Input
          value={form.tagline}
          maxLength={200}
          onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
        />
      </Field>
      <div className='grid gap-3 sm:grid-cols-2'>
        <ColorField
          label='Primary colour'
          value={form.primaryColor}
          onChange={(v) => setForm((f) => ({ ...f, primaryColor: v }))}
        />
        <ColorField
          label='Secondary colour'
          value={form.secondaryColor}
          onChange={(v) => setForm((f) => ({ ...f, secondaryColor: v }))}
        />
      </div>
      <div className='grid gap-3 sm:grid-cols-2'>
        <Field label='Font'>
          <Select value={form.font} onValueChange={(v) => setForm((f) => ({ ...f, font: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fonts.map((font) => (
                <SelectItem key={font} value={font}>
                  <span style={{ fontFamily: font }}>{font}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label='Tone of voice'>
          <Input
            value={form.tone}
            maxLength={200}
            onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))}
          />
        </Field>
      </div>
      <EditorActions saving={saving} disabled={!valid} onCancel={onCancel} />
    </form>
  );
};

// ─── Services ─────────────────────────────────────────────────────────────────

const MAX_SERVICES = 20;
const emptyService = (): ServiceItem => ({ name: '', description: '', priceUnit: 'fixed' });

export const ServicesEditor = ({ value, saving, onSave, onCancel }: EditorProps<ServicesSection>) => {
  const [currency, setCurrency] = useState(value.currency ?? '');
  const [items, setItems] = useState<ServiceItem[]>(
    value.items?.length ? value.items : [emptyService()]
  );
  const named = items.filter((i) => i.name.trim());
  const valid = /^[A-Z]{3}$/.test(currency) && named.length > 0;

  const updateItem = (index: number, patch: Partial<ServiceItem>) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <form
      className='space-y-3'
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          currency,
          items: named.map((i) => ({
            ...i,
            name: i.name.trim(),
            description: i.description?.trim(),
          })),
        });
      }}
    >
      <Field label='Currency (ISO code)'>
        <Input
          value={currency}
          maxLength={3}
          placeholder='GBP'
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          className='w-24'
        />
      </Field>

      <div className='space-y-2'>
        {items.map((item, index) => (
          <div key={index} className='space-y-2 rounded-xl border border-border p-3'>
            <div className='flex gap-2'>
              <Input
                value={item.name}
                maxLength={200}
                placeholder='Service name'
                onChange={(e) => updateItem(index, { name: e.target.value })}
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                aria-label='Remove service'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
            <Textarea
              value={item.description ?? ''}
              maxLength={2000}
              placeholder='Short description'
              rows={2}
              onChange={(e) => updateItem(index, { description: e.target.value })}
            />
            <div className='grid grid-cols-2 gap-2'>
              <Input
                type='number'
                min={0}
                step='0.01'
                value={item.price ?? ''}
                placeholder='Price'
                onChange={(e) =>
                  updateItem(index, {
                    price: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
              <Select
                value={item.priceUnit ?? 'fixed'}
                onValueChange={(v) => updateItem(index, { priceUnit: v as PriceUnit })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>

      <Button
        type='button'
        variant='outline'
        size='sm'
        className='w-full'
        disabled={items.length >= MAX_SERVICES}
        onClick={() => setItems((prev) => [...prev, emptyService()])}
      >
        <Plus className='h-3.5 w-3.5' /> Add service
      </Button>

      <EditorActions saving={saving} disabled={!valid} onCancel={onCancel} />
    </form>
  );
};

export const PRICE_UNIT_LABELS: Record<PriceUnit, string> = {
  fixed: '',
  hourly: '/hr',
  per_visit: '/visit',
  monthly: '/mo',
};
