export const DEFAULT_CURRENCY = 'USD';

export interface MoneyFormatOptions {
  /** Defaults to 0 for whole amounts and 2 otherwise. */
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  /** "₦25k" style, for chart axes. */
  compact?: boolean;
}

// Intl.NumberFormat construction is costly; cache one per currency + options combination.
const formatters = new Map<string, Intl.NumberFormat>();

const getFormatter = (currency: string, options: Intl.NumberFormatOptions) => {
  const key = `${currency}|${JSON.stringify(options)}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency, ...options });
    formatters.set(key, formatter);
  }
  return formatter;
};

/** Formats a major-unit amount in the given ISO 4217 currency, e.g. "NGN 25,000" → "₦25,000". */
export function formatMoney(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  { maximumFractionDigits, minimumFractionDigits, compact }: MoneyFormatOptions = {}
): string {
  const options: Intl.NumberFormatOptions = compact
    ? { notation: 'compact', maximumFractionDigits: maximumFractionDigits ?? 1 }
    : {
        minimumFractionDigits: minimumFractionDigits ?? (Number.isInteger(amount) ? 0 : 2),
        maximumFractionDigits: maximumFractionDigits ?? (Number.isInteger(amount) ? 0 : 2),
      };
  if ((options.minimumFractionDigits ?? 0) > (options.maximumFractionDigits ?? 20)) {
    options.minimumFractionDigits = options.maximumFractionDigits;
  }
  try {
    return getFormatter(currency, options).format(amount);
  } catch {
    // Unknown currency code: still show the amount with its code.
    return `${currency} ${amount.toLocaleString()}`;
  }
}

/** Decimal places of a currency's minor unit: 2 for USD/NGN, 3 for OMR, 0 for JPY. */
function minorUnitDigits(currency: string): number {
  try {
    return getFormatter(currency.toUpperCase(), {}).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

/**
 * Converts a Stripe-style minor-unit amount to major units. Not always ÷100:
 * OMR amounts are thousandths (11500 = OMR 11.500).
 */
export function fromMinorUnits(amount: number, currency: string = DEFAULT_CURRENCY): number {
  return amount / 10 ** minorUnitDigits(currency);
}
