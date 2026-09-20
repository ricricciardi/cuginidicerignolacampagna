import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { phase, statusLine, fmtDay } from '@/lib/competition';

const ORDER = { running: 0, before: 1, over: 2 };

export default async function Gare() {
  if (!(await getUserId())) redirect('/login');
  const now = new Date();
  const comps = (await sql`select id, name, km, start_date, end_date from competitions order by start_date desc, id desc`)
    .map((c) => ({ ...c, phase: phase(c, now) }))
    .sort((a, b) => ORDER[a.phase] - ORDER[b.phase]);

  return (
    <main>
      <h1>Gare</h1>
      <p>Ogni gara ha i suoi km e le sue date. Le stesse corse Strava valgono per tutte.</p>
      <p><a className="button" href="/gare/nuova">Crea una gara</a></p>
      {comps.length === 0 ? (
        <p>Ancora nessuna gara. Creane una per iniziare.</p>
      ) : (
        <ul className="comps">
          {comps.map((c) => (
            <li key={c.id} className={c.phase}>
              <a href={`/gare/${c.id}`}>
                <span className="comp-km">{c.km}<small>km</small></span>
                <span className="comp-main">
                  <strong>{c.name}</strong>
                  <small>{fmtDay(c.start_date)} – {fmtDay(c.end_date)}</small>
                  <span className="comp-status">{statusLine(c, now)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
