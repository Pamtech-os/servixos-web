// Some backend timestamps include a trailing "Z" even though the value is already
// in business local time. Remove the marker so JavaScript doesn't apply timezone conversion.
export function parseBusinessLocalDateTime(value?: string | null): Date | null {
  if (!value) return null;
  const normalized = value.endsWith('Z') ? value.slice(0, -1) : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
