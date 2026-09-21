'use client';
import { useState } from 'react';
import { fmtTime } from '@/lib/format';
import { useT } from '../../../lang-provider';

// Colori fluo distinguibili; dal nono cugino in poi si ripetono tratteggiati.
const COLORS = ['#d7ff1f', '#ff2fb2', '#2ef2ff', '#ff9f1c', '#b388ff', '#39ff88', '#ff5e5e', '#ffe14d'];
const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

export default function CompareChart({ series, me, km, start, end }) {
  const [mode, setMode] = useState('record');   // 'record' | 'tutte'
  const t = useT();
  const [focus, setFocus] = useState(null);     // userId in evidenza

  const all = series.flatMap((x) => x.points);
  const t0 = start, t1 = Math.max(end, ...all.map((p) => p.t));
  let lo = Math.min(...all.map((p) => p.s)), hi = Math.max(...all.map((p) => p.s));
  if (hi - lo < 120) { lo -= 60; hi += 60; }
  // Margine sinistro per etichette tipo 1:02:50 quando si supera l'ora.
  const W = 340, H = 250, L = hi >= 3600 ? 68 : 54, R = 10, T = 14, B = 30;
  const x = (t) => L + ((t - t0) / (t1 - t0 || 1)) * (W - L - R);
  const y = (s) => T + ((s - lo) / (hi - lo)) * (H - T - B); // più in alto = più veloce

  // Etichette dei mesi: al più 6, distribuite sull'asse.
  const ticks = [];
  const d = new Date(t0); d.setDate(1); d.setHours(0, 0, 0, 0); d.setMonth(d.getMonth() + 1);
  for (; d.getTime() <= t1; d.setMonth(d.getMonth() + 1)) ticks.push(d.getTime());
  const step = Math.ceil(ticks.length / 6) || 1;
  const shown = ticks.filter((_, i) => i % step === 0);

  const pathFor = (s) => {
    if (mode === 'record') {
      const r = s.records;
      let p = `M${x(r[0].t).toFixed(1)},${y(r[0].s).toFixed(1)}`;
      for (let i = 1; i < r.length; i++) p += ` H${x(r[i].t).toFixed(1)} V${y(r[i].s).toFixed(1)}`;
      return p + ` H${x(t1).toFixed(1)}`; // il record resta valido fino a oggi
    }
    return s.points.map((q, i) => `${i ? 'L' : 'M'}${x(q.t).toFixed(1)},${y(q.s).toFixed(1)}`).join(' ');
  };

  const color = (i) => COLORS[i % COLORS.length];
  const dashed = (i) => (i >= COLORS.length ? '6 4' : undefined);
  const leader = series[0];

  return (
    <div className="compare">
      <div className="segmented" role="group" aria-label={t('Cosa mostrare')}>
        <button type="button" aria-pressed={mode === 'record'} onClick={() => setMode('record')}>{t('Record')}</button>
        <button type="button" aria-pressed={mode === 'tutte'} onClick={() => setMode('tutte')}>{t('Tutte le corse')}</button>
      </div>
      <p className="legend">
        {mode === 'record'
          ? t('Ogni linea sale quando quel cugino migliora il suo record. Più in alto è più veloce.')
          : t('Il tempo di ogni corsa, uno dopo l\u2019altro. Più in alto è più veloce.')}
      </p>

      <div className="chart-wrap">
        <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img"
             aria-label={t('Primi {km} km, confronto di {n} cugini. In testa {nome} con {tempo}.', { km, n: series.length, nome: leader.name || t('un atleta'), tempo: fmtTime(leader.best) })}>
          <line x1={L} x2={W - R} y1={y(lo)} y2={y(lo)} className="grid" />
          <line x1={L} x2={W - R} y1={y(hi)} y2={y(hi)} className="grid" />
          <text x={L - 6} y={y(lo) + 4} textAnchor="end" className="axis">{fmtTime(Math.round(lo))}</text>
          <text x={L - 6} y={y(hi) + 4} textAnchor="end" className="axis">{fmtTime(Math.round(hi))}</text>
          {shown.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={T} y2={H - B} className="grid faint" />
              <text x={x(t)} y={H - 10} textAnchor="middle" className="axis">{MONTHS[new Date(t).getMonth()]}</text>
            </g>
          ))}
          {series.map((s, i) => {
            const dim = focus != null && focus !== s.userId;
            const strong = focus === s.userId || (focus == null && s.userId === me);
            return (
              <g key={s.userId} className="serie" style={{ opacity: dim ? 0.12 : 1 }}>
                <path d={pathFor(s)} fill="none" stroke={color(i)} strokeWidth={strong ? 3.5 : 2}
                      strokeDasharray={dashed(i)} strokeLinejoin="round"
                      style={{ filter: `drop-shadow(0 0 3px ${color(i)})` }} />
                {(mode === 'record' ? s.records : s.points).map((q) => (
                  <circle key={q.t} cx={x(q.t)} cy={y(q.s)} r={strong ? 3.5 : 2.5} fill={color(i)} />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <ul className="people">
        {series.map((s, i) => (
          <li key={s.userId}>
            <button type="button" aria-pressed={focus === s.userId}
                    onClick={() => setFocus(focus === s.userId ? null : s.userId)}>
              <span className="swatch" style={{ background: color(i), boxShadow: `0 0 8px ${color(i)}` }}
                    data-dashed={dashed(i) ? '' : undefined} />
              <span className="pname">{s.name || t('Atleta senza nome')}{s.userId === me && <small> {t('Tu')}</small>}</span>
              <span className="ptime">{fmtTime(s.best)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
