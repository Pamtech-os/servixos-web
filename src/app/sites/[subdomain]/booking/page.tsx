import { notFound } from 'next/navigation';
import { getWebsiteData } from '../get-website-data';
import BookingFormClient from './booking-form-client';

export default async function BookingPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const data = await getWebsiteData(subdomain);
  if (!data) notFound();

  return <BookingFormClient data={data} subdomain={subdomain} />;
}
