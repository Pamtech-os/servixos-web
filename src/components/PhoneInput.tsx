'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberWithError,
  AsYouType,
} from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PhoneValue {
  country: CountryCode;
  nationalNumber: string;
  isValid: boolean;
  e164: string;
}

interface Country {
  code: CountryCode;
  callingCode: string;
  name: string;
  flag: string;
}

// ─── Helpers (module-level, computed once) ───────────────────────────────────

const toFlag = (code: string) =>
  [...code.toUpperCase()].map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');

let _displayNames: Intl.DisplayNames | null = null;
const countryName = (code: string): string => {
  try {
    if (!_displayNames) _displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return _displayNames.of(code) ?? code;
  } catch {
    return code;
  }
};

const ALL_COUNTRIES: Country[] = getCountries()
  .map((code) => ({
    code,
    callingCode: getCountryCallingCode(code),
    name: countryName(code),
    flag: toFlag(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const POPULAR: CountryCode[] = [
  'US', 'GB', 'CA', 'AU', 'NG', 'IN', 'ZA', 'GH', 'KE',
  'AE', 'SG', 'DE', 'FR', 'BR', 'MX', 'PK', 'BD', 'PH',
];
const POPULAR_COUNTRIES = POPULAR.map((c) => ALL_COUNTRIES.find((a) => a.code === c)).filter(
  Boolean
) as Country[];

// ─── Exported helpers ─────────────────────────────────────────────────────────

export const getDefaultCountry = (): CountryCode => {
  if (typeof navigator === 'undefined') return 'US';
  const region = navigator.language?.split('-')[1]?.toUpperCase();
  const all = getCountries() as string[];
  return region && all.includes(region) ? (region as CountryCode) : 'US';
};

export const emptyPhone = (country: CountryCode = 'US'): PhoneValue => ({
  country,
  nationalNumber: '',
  isValid: false,
  e164: '',
});

/**
 * Returns a human-readable validation error or null if valid.
 * Handles edge cases: empty, too short, too long, wrong format for country.
 */
export const phoneError = (phone: PhoneValue): string | null => {
  const digits = phone.nationalNumber.replace(/\D/g, '');
  if (!digits) return 'Phone number is required';
  if (digits.length < 3) return 'Phone number is too short';
  try {
    // parsePhoneNumberWithError throws ParseError with .message for specific cases
    const parsed = parsePhoneNumberWithError(phone.nationalNumber, phone.country);
    if (!parsed) return 'Invalid phone number';
    if (!parsed.isValid()) return 'Invalid phone number for the selected country';
    return null;
  } catch (err) {
    if (err instanceof Error) {
      const msg = err.message;
      if (msg === 'TOO_SHORT') return 'Phone number is too short';
      if (msg === 'TOO_LONG') return 'Phone number is too long';
      if (msg === 'NOT_A_NUMBER') return 'That does not look like a phone number';
      if (msg === 'INVALID_COUNTRY') return 'Invalid country selected';
    }
    return 'Invalid phone number';
  }
};

// ─── Internal utilities ───────────────────────────────────────────────────────

const formatDigits = (digits: string, country: CountryCode): string => {
  const formatter = new AsYouType(country);
  let result = '';
  for (const d of digits) result = formatter.input(d);
  return result || digits;
};

const tryE164 = (nationalNumber: string, country: CountryCode): string => {
  if (!nationalNumber.trim()) return '';
  try {
    return parsePhoneNumberWithError(nationalNumber, country)?.format('E.164') ?? '';
  } catch {
    return '';
  }
};

const checkValid = (nationalNumber: string, country: CountryCode): boolean => {
  if (!nationalNumber.trim()) return false;
  try {
    return isValidPhoneNumber(nationalNumber, country);
  } catch {
    return false;
  }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: string }) => (
  <p className='px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
    {children}
  </p>
);

const CountryRow = ({
  country,
  selected,
  onSelect,
}: {
  country: Country;
  selected: boolean;
  onSelect: (c: Country) => void;
}) => (
  <button
    type='button'
    onClick={() => onSelect(country)}
    className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-muted ${
      selected ? 'bg-primary/10 text-primary' : 'text-foreground'
    }`}
  >
    <span className='shrink-0 text-base leading-none'>{country.flag}</span>
    <span className='flex-1 truncate text-left'>{country.name}</span>
    <span className='text-xs text-muted-foreground'>+{country.callingCode}</span>
    {selected && <Check size={12} className='shrink-0 text-primary' />}
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────

interface PhoneInputProps {
  value: PhoneValue;
  onChange: (v: PhoneValue) => void;
  error?: string;
  id?: string;
}

const PhoneInput = ({ value, onChange, error, id = 'phone-input' }: PhoneInputProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = ALL_COUNTRIES.find((c) => c.code === value.country) ?? ALL_COUNTRIES[0];

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return null;
    const q = search.toLowerCase().replace(/^\+/, '');
    return ALL_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.callingCode.startsWith(q) ||
        c.code.toLowerCase() === q
    );
  }, [search]);

  const emit = useCallback(
    (nationalNumber: string, country: CountryCode) => {
      onChange({
        country,
        nationalNumber,
        isValid: checkValid(nationalNumber, country),
        e164: tryE164(nationalNumber, country),
      });
    },
    [onChange]
  );

  const handleCountrySelect = (country: Country) => {
    setOpen(false);
    setSearch('');
    // Reformat existing digits for the new country
    const digits = value.nationalNumber.replace(/\D/g, '');
    emit(digits ? formatDigits(digits, country.code) : '', country.code);
  };

  const handlePhoneInput = (raw: string) => {
    // Strip everything except digits (allow leading +, but we handle country separately)
    const digits = raw.replace(/\D/g, '');
    emit(digits ? formatDigits(digits, value.country) : '', value.country);
  };

  const showValidTick =
    value.nationalNumber.length > 0 && value.isValid && !error;

  return (
    <div className='space-y-1'>
      <div className='flex gap-2'>
        {/* ── Country selector ── */}
        <div ref={dropdownRef} className='relative shrink-0'>
          <button
            type='button'
            onClick={() => setOpen((o) => !o)}
            aria-haspopup='listbox'
            aria-expanded={open}
            className={`flex h-10 min-w-[80px] items-center gap-1.5 rounded-lg border bg-background px-2.5 text-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring ${
              error ? 'border-destructive' : 'border-input'
            }`}
          >
            <span className='text-base leading-none'>{selected.flag}</span>
            <span className='text-xs font-medium tabular-nums text-muted-foreground'>
              +{selected.callingCode}
            </span>
            <ChevronDown
              size={12}
              className={`text-muted-foreground transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                role='listbox'
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.13 }}
                className='absolute left-0 top-[calc(100%+4px)] z-50 w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-xl'
              >
                {/* Search */}
                <div className='flex items-center gap-2 border-b border-border px-3 py-2.5'>
                  <Search size={13} className='shrink-0 text-muted-foreground' />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder='Search country or dial code...'
                    className='flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/80 dark:placeholder:text-muted-foreground/60'
                  />
                  {search && (
                    <button
                      type='button'
                      onClick={() => setSearch('')}
                      className='text-muted-foreground transition-colors hover:text-foreground'
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className='max-h-60 overflow-y-auto'>
                  {filtered ? (
                    /* ── Search results ── */
                    filtered.length === 0 ? (
                      <p className='px-3 py-5 text-center text-sm text-muted-foreground'>
                        No countries found
                      </p>
                    ) : (
                      filtered.map((c) => (
                        <CountryRow
                          key={c.code}
                          country={c}
                          selected={value.country === c.code}
                          onSelect={handleCountrySelect}
                        />
                      ))
                    )
                  ) : (
                    /* ── Default: popular + all ── */
                    <>
                      <SectionLabel>Popular</SectionLabel>
                      {POPULAR_COUNTRIES.map((c) => (
                        <CountryRow
                          key={`pop-${c.code}`}
                          country={c}
                          selected={value.country === c.code}
                          onSelect={handleCountrySelect}
                        />
                      ))}
                      <div className='mx-3 my-1 border-t border-border' />
                      <SectionLabel>All countries</SectionLabel>
                      {ALL_COUNTRIES.map((c) => (
                        <CountryRow
                          key={`all-${c.code}`}
                          country={c}
                          selected={value.country === c.code}
                          onSelect={handleCountrySelect}
                        />
                      ))}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Phone number input ── */}
        <div className='relative flex-1'>
          <Input
            id={id}
            type='tel'
            inputMode='tel'
            value={value.nationalNumber}
            onChange={(e) => handlePhoneInput(e.target.value)}
            placeholder='Phone number'
            autoComplete='tel-national'
            className={`pr-8 ${error ? 'border-destructive' : ''}`}
          />
          {/* Animated valid checkmark */}
          <AnimatePresence>
            {showValidTick && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className='pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2'
              >
                <Check size={14} className='text-emerald-500' />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Error message */}
      {error && <p className='text-[10px] text-destructive'>{error}</p>}

      {/* Format hint */}
      {!error && value.nationalNumber && !value.isValid && (
        <p className='text-[10px] font-medium text-destructive'>
          Enter a valid phone number for {selected.name}
        </p>
      )}
    </div>
  );
};

export type { CountryCode };
export default PhoneInput;
