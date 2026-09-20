import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { phase, statusLine, fmtDay } from '@/lib/competition';

const NOTICES = {
  eliminata: 'Gara eliminata.',
  creata: 'Gara creata.',
  modificata: 'Modifiche salvate.',
};

export default async function Impostazioni({ searchParams }) {
  if (!(await getUserId())) redirect('/login');
  const sp = await searchParams;
  const now = new Date();
  const comps = (await sql`select id, name, km, start_date, end_date from competitions
                           order by start_date desc, id desc`)
    .map((c) => ({ ...c, phase: phase(c, now) }));
  const notice = Object.keys(NOTICES).find((k) => sp[k]);

  return (
    <main>
      <p className="back"><a href="/gare">Torna alle gare</a></p>
      <h1>Impostazioni gare</h1>
      {notice && <div className="notice">{NOTICES[notice]}</div>}
      {sp.error === 'bloccata' && <div className="notice error">La gara è partita: non si può più modificare.</div>}
      <p>Qui si creano, si modificano e si eliminano le gare. Una gara partita non si può più modificare, ma si può eliminare.</p>
      <p><a className="button" href="/gare/nuova">Crea una gara</a></p>

      {comps.length === 0 ? (
        <p>Ancora nessuna gara.</p>
      ) : (
        <ul className="settings-list">
          {comps.map((c) => (
            <li key={c.id}>
              <div className="comp-main">
                <strong>{c.name}</strong>
                <small>{c.km} km, dal {fmtDay(c.start_date)} al {fmtDay(c.end_date)}</small>
                <span className="comp-status">{statusLine(c, now)}</span>
              </div>
              <div className="row-actions">
                {c.phase === 'before'
                  ? <a href={`/gare/${c.id}/modifica`}>Modifica</a>
                  : <span className="locked">Non modificabile</span>}
                <a className="danger" href={`/gare/${c.id}/elimina`}>Elimina</a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
