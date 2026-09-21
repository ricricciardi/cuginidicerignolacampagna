export const fmtTime = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const mm = String(m).padStart(2, '0'), ss = String(sec).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
};
export const fmtPace = (s, meters) => {
  const p = Math.round(s / (meters / 1000));
  return `${Math.floor(p / 60)}:${String(p % 60).padStart(2, '0')}`;
};
const localDate = (r) =>
  new Date((r.start_date_local ?? new Date(r.start_date).toISOString()).replace('Z', ''));
export const fmtDate = (r) =>
  localDate(r).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtShortDate = (r) =>
  localDate(r).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
// Dislivello netto: ↓ discesa, ↑ salita. null se non c'è il dato.
export const fmtElevation = (m) =>
  m == null ? null : m === 0 ? '± 0 m' : `${m < 0 ? '↓' : '↑'} ${Math.abs(m)} m`;
export const fmtKm = (m) =>
  (m / 1000).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
