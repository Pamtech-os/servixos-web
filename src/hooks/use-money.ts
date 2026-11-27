'use client';

import { useCallback } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { DEFAULT_CURRENCY, formatMoney, type MoneyFormatOptions } from '@/lib/money';

/** Formats amounts in the current business's own currency (from `/me`). */
export function useMoney() {
  const { profile } = useSubscription();
  const currency = profile?.currency ?? DEFAULT_CURRENCY;

  const format = useCallback(
    (amount: number, options?: MoneyFormatOptions) => formatMoney(amount, currency, options),
    [currency]
  );

  return { currency, format };
}
