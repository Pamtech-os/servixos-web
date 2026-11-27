'use client';

import { useState } from 'react';
import type { WebsitePublicData, BookingField, BookingFieldKey } from '../types';
import { DEFAULT_BOOKING_FIELDS } from '../types';
import { fetchJson } from '@/common/network/http-client';
import BookingDatePicker from './booking-date-picker';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api-dev.servixos.com/api';

const INPUT_TYPE: Record<BookingFieldKey, string> = {
  clientName: 'text',
  clientEmail: 'email',
  clientPhone: 'tel',
  service: 'select',
  requestedDate: 'date',
  requestedEndDate: 'date',
  message: 'textarea',
};

interface Props {
  data: WebsitePublicData;
  subdomain: string;
}

export default function BookingFormClient({ data, subdomain }: Props) {
  const { business, website } = data;
  const { colorPrimary } = website;

  const form = website.bookingForm;
  const fields: BookingField[] = form?.fields ?? DEFAULT_BOOKING_FIELDS;
  const formTitle = form?.title ?? 'Book a Service';
  const formDescription =
    form?.description ?? "Fill out the form below and we'll get back to you within 24 hours.";

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, ''])),
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      // yyyy-MM-dd strings sort as dates: drop an end date the new start date has passed.
      if (key === 'requestedDate' && prev.requestedEndDate && prev.requestedEndDate < value) {
        next.requestedEndDate = '';
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // The date picker is a button, so the browser's `required` check doesn't cover it.
    const missingDate = fields.find(
      (f) => f.required && INPUT_TYPE[f.key] === 'date' && !values[f.key],
    );
    if (missingDate) {
      setError(`Please choose a date for "${missingDate.label}".`);
      return;
    }
    setSubmitting(true);
    setError(null);

    const body: Record<string, string> = {};
    for (const field of fields) {
      if (values[field.key]) body[field.key] = values[field.key];
    }

    try {
      await fetchJson(`${API_BASE}/requests?businessSlug=${subdomain}`, { method: 'POST', body: JSON.stringify(body) });
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : null;
      setError(message ?? 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center'>
        <div
          className='mb-6 flex h-16 w-16 items-center justify-center rounded-full'
          style={{ backgroundColor: `${colorPrimary}20` }}
        >
          <svg
            className='h-8 w-8'
            style={{ color: colorPrimary }}
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth={2}
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
          </svg>
        </div>
        <h2 className='mb-3 text-2xl font-bold text-gray-900'>Request Submitted!</h2>
        <p className='mb-8 max-w-md text-gray-500'>
          Thank you for reaching out to {business.name}. We&apos;ll get back to you shortly.
        </p>
        <a
          href='.'
          className='rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90'
          style={{ backgroundColor: colorPrimary }}
        >
          Back to Home
        </a>
      </div>
    );
  }

  return (
    <section className='px-4 py-16'>
      <div className='mx-auto max-w-xl'>
        <div className='mb-8 text-center'>
          <h1 className='text-3xl font-bold text-gray-900'>{formTitle}</h1>
          <p className='mt-2 text-gray-500'>{formDescription}</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-5'>
          {fields.map((field) => {
            const inputType = INPUT_TYPE[field.key];
            const value = values[field.key] ?? '';

            return (
              <div key={field.key}>
                <label
                  htmlFor={field.key}
                  className='mb-1.5 block text-sm font-medium text-gray-700'
                >
                  {field.label}
                  {field.required && <span className='ml-1 text-red-500'>*</span>}
                </label>

                {inputType === 'textarea' ? (
                  <textarea
                    id={field.key}
                    name={field.key}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={4}
                    value={value}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className='w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-transparent focus:ring-2'
                    style={{ '--tw-ring-color': colorPrimary } as React.CSSProperties}
                  />
                ) : inputType === 'select' ? (
                  <select
                    id={field.key}
                    name={field.key}
                    required={field.required}
                    value={value}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className='w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:ring-2'
                    style={{ '--tw-ring-color': colorPrimary } as React.CSSProperties}
                  >
                    <option value='' disabled>
                      {field.placeholder ?? 'Select an option'}
                    </option>
                    {business.services.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : inputType === 'date' ? (
                  <BookingDatePicker
                    id={field.key}
                    value={value}
                    onChange={(next) => handleChange(field.key, next)}
                    placeholder={field.placeholder}
                    colorPrimary={colorPrimary}
                    // An end date can't come before the chosen start date.
                    min={field.key === 'requestedEndDate' ? values.requestedDate : undefined}
                  />
                ) : (
                  <input
                    id={field.key}
                    name={field.key}
                    type={inputType}
                    placeholder={field.placeholder}
                    required={field.required}
                    value={value}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className='w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:ring-2'
                    style={{ '--tw-ring-color': colorPrimary } as React.CSSProperties}
                  />
                )}
              </div>
            );
          })}

          {error && (
            <p className='rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600'>{error}</p>
          )}

          <button
            type='submit'
            disabled={submitting}
            className='w-full rounded-xl py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60'
            style={{ backgroundColor: colorPrimary }}
          >
            {submitting ? 'Submitting…' : 'Submit Booking'}
          </button>
        </form>
      </div>
    </section>
  );
}
