/**
 * Clock helpers.
 *
 * A session holds the machine from its own start time until the next session
 * begins. The last session of the day has nothing after it, so it falls back to
 * the scheduler's default span.
 */

export const MINUTES_IN_DAY = 1440;
export const DEFAULT_SPAN_MINUTES = 30;

export const clampHour = (n) => Math.min(23, Math.max(0, n));
export const clampMinute = (n) => Math.min(59, Math.max(0, n));

export function toMinutes(hour, minute) {
  return clampHour(hour) * 60 + clampMinute(minute);
}

export const pad = (n) => String(n).padStart(2, "0");

export function formatClock(minutes) {
  const m = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function formatSpan(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * Orders sessions by start time and resolves each span from the gap to the one
 * that follows it.
 */
export function resolveDay(sessions) {
  const ordered = [...sessions].sort((a, b) => a.startMinutes - b.startMinutes);

  return ordered.map((session, i) => {
    const next = ordered[i + 1];
    const span = next
      ? next.startMinutes - session.startMinutes
      : DEFAULT_SPAN_MINUTES;

    return {
      ...session,
      spanMinutes: span,
      spanIsDefault: !next,
      endMinutes: Math.min(MINUTES_IN_DAY, session.startMinutes + span),
    };
  });
}

/** Splits a command line into the binary and its arguments. */
export function parseCommand(line) {
  const parts = line.trim().split(/\s+/).filter(Boolean);
  return { bin: parts[0] ?? "", args: parts.slice(1) };
}
