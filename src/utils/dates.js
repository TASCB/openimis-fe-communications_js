export function toISO(value, endOfDay = false) {
  if (!value) return null;
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    + `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  try {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return fmt(endOfDay ? new Date(y, m - 1, d, 23, 59, 59) : new Date(y, m - 1, d, 0, 0, 0));
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : fmt(d);
  } catch (e) {
    return value;
  }
}

// Backend runs USE_TZ=False / TIME_ZONE=UTC, so timestamps arrive as naive UTC with no
// tz marker; append Z so the browser parses them as UTC instead of local time.
export function parseDate(iso) {
  if (!iso) return null;
  const s = /([zZ]|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}Z`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function relTime(iso) {
  const d = parseDate(iso);
  if (!d) return '';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (Number.isNaN(diff)) return '';
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const hhmm = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800) return `Yesterday · ${hhmm}`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday=0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfMonth(date = new Date()) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(date = new Date()) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}
