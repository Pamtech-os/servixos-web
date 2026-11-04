'use client';

import { useSyncExternalStore } from 'react';
import { getSoundAlertsEnabled, setSoundAlertsEnabled, subscribeSoundAlerts } from '@/lib/notification-sound';

/** The per-device "Sound alerts" setting, kept in sync across components and tabs. */
export function useSoundAlerts() {
  const enabled = useSyncExternalStore(subscribeSoundAlerts, getSoundAlertsEnabled, () => true);
  return { enabled, setEnabled: setSoundAlertsEnabled };
}
