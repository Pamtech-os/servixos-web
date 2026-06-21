'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import type { ComponentProps } from 'react';

function formatPriceDisplay(value: string | number): string {
  const str = String(value);
  const [integer, decimal] = str.split('.');
  const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimal !== undefined ? `${formatted}.${decimal}` : formatted;
}

type PriceInputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: number;
  onChange: (value: number) => void;
};

export function PriceInput({ value, onChange, ...props }: PriceInputProps) {
  const [display, setDisplay] = useState(() => (value === 0 ? '' : formatPriceDisplay(value)));
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setDisplay(value === 0 ? '' : formatPriceDisplay(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    const parts = raw.split('.');
    const normalized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw;
    setDisplay(normalized === '' ? '' : formatPriceDisplay(normalized));
    prevValueRef.current = parseFloat(normalized) || 0;
    onChange(parseFloat(normalized) || 0);
  };

  return <Input {...props} type='text' inputMode='decimal' value={display} onChange={handleChange} />;
}
