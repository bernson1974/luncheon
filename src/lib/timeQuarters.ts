/**
 * Snap "HH:mm" to nearest quarter (00, 15, 30, 45), within 00:00–23:45.
 */
export function snapTimeToQuarterHour(time: string): string {
  const trimmed = time.trim();
  if (!trimmed) return "";
  const m = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!m) return trimmed;
  let h = parseInt(m[1], 10);
  let min = parseInt(m[2], 10);
  if (Number.isNaN(h) || Number.isNaN(min)) return trimmed;
  const total = h * 60 + min;
  let snapped = Math.round(total / 15) * 15;
  if (snapped < 0) snapped = 0;
  const maxMin = 23 * 60 + 45;
  if (snapped > maxMin) snapped = maxMin;
  const fh = Math.floor(snapped / 60);
  const fm = snapped % 60;
  return `${String(fh).padStart(2, "0")}:${String(fm).padStart(2, "0")}`;
}
