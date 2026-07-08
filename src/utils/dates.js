// The backend runs USE_TZ=False (naive datetimes). Emit a NAIVE local datetime
// string (no 'Z'/offset) so graphene parses it naive and matches the DB — sending
// UTC-aware ISO crashes the calendar-aware field ("can't subtract offset-naive and
// offset-aware datetimes"). Date-only input keeps the calendar day (start 00:00:00,
// end 23:59:59).
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
