export type BookingFieldKey =
  | 'clientName'
  | 'clientEmail'
  | 'clientPhone'
  | 'service'
  | 'requestedDate'
  | 'requestedEndDate'
  | 'message';

export interface BookingField {
  key: BookingFieldKey;
  label: string;
  placeholder?: string;
  required: boolean;
}

export interface WebsitePublicData {
  business: {
    name: string;
    categoryName: string;
    description?: string;
    phone?: string;
    email?: string;
    address?: string;
    services: string[];
  };
  website: {
    colorPrimary: string;
    colorSecondary: string;
    font: string;
    logoUrl?: string;
    aiContent?: {
      hero: {
        headline: string;
        subheadline: string;
        ctaText: string;
      };
      about: {
        title: string;
        body: string;
      };
      services: Array<{
        name: string;
        description: string;
      }>;
      testimonialPlaceholder: {
        quote: string;
        author: string;
      };
      contact: {
        callToAction: string;
      };
    };
    bookingForm?: {
      title: string;
      description?: string;
      fields: BookingField[];
    };
  };
}

export const DEFAULT_BOOKING_FIELDS: BookingField[] = [
  { key: 'clientName', label: 'Full Name', placeholder: 'John Doe', required: true },
  { key: 'clientEmail', label: 'Email Address', placeholder: 'john@example.com', required: true },
  { key: 'clientPhone', label: 'Phone Number', placeholder: '+1 (555) 000-0000', required: false },
  { key: 'service', label: 'Service Required', placeholder: 'Select a service', required: true },
  { key: 'requestedDate', label: 'Start Date', placeholder: 'Select start date', required: true },
  { key: 'message', label: 'Job Details', placeholder: 'Describe what you need done...', required: false },
];
