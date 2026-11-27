'use client';

import { useState } from 'react';
import { format, isValid, parse, startOfToday } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const VALUE_FORMAT = 'yyyy-MM-dd';

// Parsed as a local date: new Date('2026-11-29') is UTC midnight, a day early west of Greenwich.
const toDate = (value: string) => {
  if (!value) return undefined;
  const date = parse(value, VALUE_FORMAT, new Date());
  return isValid(date) ? date : undefined;
};

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  colorPrimary: string;
  /** Earliest selectable day as yyyy-MM-dd; defaults to today. */
  min?: string;
}

/**
 * Calendar date picker for the public booking form. The site is always light whatever the
 * visitor's theme, so the colours are fixed here rather than taken from the app theme.
 */
export default function BookingDatePicker({
  id,
  value,
  onChange,
  placeholder,
  colorPrimary,
  min,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);
  const earliest = toDate(min ?? '') ?? startOfToday();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type='button'
          className='flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm outline-none transition-colors focus:ring-2'
          style={{ '--tw-ring-color': colorPrimary } as React.CSSProperties}
        >
          <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
            {selected ? format(selected, 'EEEE, MMMM d, yyyy') : (placeholder ?? 'Pick a date')}
          </span>
          <CalendarDays size={16} className='text-gray-400' />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='w-auto border-gray-200 bg-white p-0 text-gray-900'
        style={{ '--site-brand': colorPrimary } as React.CSSProperties}
      >
        <Calendar
          mode='single'
          selected={selected}
          defaultMonth={selected ?? earliest}
          disabled={{ before: earliest }}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, VALUE_FORMAT));
            setOpen(false);
          }}
          classNames={{
            weekday: 'text-gray-500 rounded-md w-9 font-normal text-[0.8rem]',
            day_button:
              'h-9 w-9 rounded-xl p-0 text-sm font-normal text-gray-900 transition-colors hover:bg-gray-100 disabled:pointer-events-none',
            selected:
              '[&>button]:!bg-[var(--site-brand)] [&>button]:!text-white [&>button]:hover:!bg-[var(--site-brand)]',
            today: '[&>button]:bg-gray-100 [&>button]:font-semibold',
            outside: 'opacity-40',
            disabled: 'opacity-30',
            button_previous:
              'absolute left-1 flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100',
            button_next:
              'absolute right-1 flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100',
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
