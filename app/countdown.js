'use client';
import { useEffect, useState } from 'react';
import { remaining } from '@/lib/competition';
import { useT } from './lang-provider';

const pad = (n) => String(n).padStart(2, '0');

// Il server passa la sua ora: il primo disegno coincide, poi il telefono aggiorna ogni secondo.
export default function Countdown({ serverNow, start, end, startLabel, endLabel }) {
  const [now, setNow] = useState(serverNow);
  const t = useT();
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const phase = now < start ? 'before' : now < end ? 'running' : 'over';
  if (phase === 'over') {
    return (
      <section className="countdown over">
        <p className="cd-title">{t('Gara conclusa')}</p>
        <p className="cd-sub">{t('Si è chiusa il {data} alle 24:00. Le corse fatte entro la chiusura possono ancora arrivare.', { data: endLabel })}</p>
      </section>
    );
  }
  const r = remaining((phase === 'before' ? start : end) - now);
  const units = [
    [r.d, r.d === 1 ? t('giorno') : t('giorni')],
    [pad(r.h), t('ore')],
    [pad(r.m), t('min')],
    [pad(r.s), t('sec')],
  ];
  return (
    <section className={`countdown ${phase}`}
             aria-label={t(phase === 'before' ? 'Alla partenza mancano {d} giorni, {h} ore e {m} minuti' : 'Alla fine mancano {d} giorni, {h} ore e {m} minuti', { d: r.d, h: r.h, m: r.m })}>
      <p className="cd-title">{phase === 'before' ? t('Si parte tra') : t('Alla fine della gara mancano')}</p>
      <div className="cd-units" aria-hidden="true">
        {units.map(([v, l]) => (
          <div key={l}><span className="cd-num">{v}</span><span className="cd-lab">{l}</span></div>
        ))}
      </div>
      <p className="cd-sub">{phase === 'before' ? t('Partenza: {data}, ore 00:00', { data: startLabel }) : t('Arrivo: {data}, ore 24:00', { data: endLabel })}</p>
    </section>
  );
}
