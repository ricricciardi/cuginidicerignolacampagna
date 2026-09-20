'use client';
import { useEffect, useState } from 'react';
import { remaining } from '@/lib/competition';

const pad = (n) => String(n).padStart(2, '0');

// Il server passa la sua ora: il primo disegno coincide, poi il telefono aggiorna ogni secondo.
export default function Countdown({ serverNow, start, end, startLabel, endLabel }) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const phase = now < start ? 'before' : now < end ? 'running' : 'over';
  if (phase === 'over') {
    return (
      <section className="countdown over">
        <p className="cd-title">Gara conclusa</p>
        <p className="cd-sub">Si è chiusa il {endLabel} alle 24:00. Le corse fatte entro la chiusura possono ancora arrivare.</p>
      </section>
    );
  }
  const r = remaining((phase === 'before' ? start : end) - now);
  const units = [
    [r.d, r.d === 1 ? 'giorno' : 'giorni'],
    [pad(r.h), 'ore'],
    [pad(r.m), 'min'],
    [pad(r.s), 'sec'],
  ];
  return (
    <section className={`countdown ${phase}`}
             aria-label={`${phase === 'before' ? 'Alla partenza' : 'Alla fine'} mancano ${r.d} giorni, ${r.h} ore e ${r.m} minuti`}>
      <p className="cd-title">{phase === 'before' ? 'Si parte tra' : 'Alla fine della gara mancano'}</p>
      <div className="cd-units" aria-hidden="true">
        {units.map(([v, l]) => (
          <div key={l}><span className="cd-num">{v}</span><span className="cd-lab">{l}</span></div>
        ))}
      </div>
      <p className="cd-sub">{phase === 'before' ? `Partenza: ${startLabel}, ore 00:00` : `Arrivo: ${endLabel}, ore 24:00`}</p>
    </section>
  );
}
