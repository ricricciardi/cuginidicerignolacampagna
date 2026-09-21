import { fmtTime, fmtShortDate } from './format.js';

// Grafico SVG del tempo sui primi N km di ogni corsa. Asse verticale invertito:
// più in alto = più veloce, così un miglioramento sale.
export function ProgressChart({ runs, km, t = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => v?.[k] ?? m) }) {
  const pts = runs.filter((r) => r.time_s != null);
  if (pts.length === 0) return null;
  const times = pts.map((r) => r.time_s);
  const dates = pts.map((r) => new Date(r.start_date).getTime());
  let lo = Math.min(...times), hi = Math.max(...times);
  if (hi - lo < 60) { lo -= 30; hi += 30; }
  // Margine sinistro per etichette tipo 1:02:50 quando si supera l'ora.
  const W = 340, H = 200, L = hi >= 3600 ? 68 : 54, R = 12, T = 16, B = 34;
  const d0 = Math.min(...dates), d1 = Math.max(...dates);
  const x = (t) => (d1 === d0 ? (L + W - R) / 2 : L + ((t - d0) / (d1 - d0)) * (W - L - R));
  const y = (s) => T + ((s - lo) / (hi - lo)) * (H - T - B);
  const line = pts.map((r, i) => `${i ? 'L' : 'M'}${x(dates[i]).toFixed(1)},${y(r.time_s).toFixed(1)}`).join(' ');

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img"
         aria-label={t('Tempo sui primi {km} km di ogni corsa, da {da} a {a}', { km, da: fmtTime(Math.max(...times)), a: fmtTime(Math.min(...times)) })}>
      <line x1={L} x2={W - R} y1={y(lo)} y2={y(lo)} className="grid" />
      <line x1={L} x2={W - R} y1={y(hi)} y2={y(hi)} className="grid" />
      <text x={L - 6} y={y(lo) + 4} textAnchor="end" className="axis">{fmtTime(Math.round(lo))}</text>
      <text x={L - 6} y={y(hi) + 4} textAnchor="end" className="axis">{fmtTime(Math.round(hi))}</text>
      <text x={L} y={H - 10} className="axis">{fmtShortDate(pts[0])}</text>
      {pts.length > 1 && (
        <text x={W - R} y={H - 10} textAnchor="end" className="axis">{fmtShortDate(pts[pts.length - 1])}</text>
      )}
      {pts.length > 1 && <path d={line} className="trend" />}
      {pts.map((r, i) => (
        <circle key={r.id} cx={x(dates[i])} cy={y(r.time_s)} r={r.isRecord ? 5 : 3.5}
                className={r.isRecord ? 'dot record' : 'dot'} />
      ))}
    </svg>
  );
}
