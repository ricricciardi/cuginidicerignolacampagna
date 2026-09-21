import { sql } from '@/lib/db';
import { requireAdminPage } from '@/lib/admin';
import { phase, statusLine, fmtDay } from '@/lib/competition';

const NOTICES = {
  eliminata: 'Gara eliminata.',
  creata: 'Gara creata.',
  modificata: 'Modifiche salvate.',
};

export default async function Impostazioni({ searchParams }) {
  await requireAdminPage();
  const sp = await searchParams;
  const now = new Date();
  const comps = (await sql`select c.id, c.name, c.km, c.start_date, c.end_date, c.age_grading,
                                  (select count(*) from competition_participants p where p.competition_id = c.id)::int as people
                           from competitions c order by c.start_date desc, c.id desc`)
    .map((c) => ({ ...c, phase: phase(c, now) }));
  const notice = Object.keys(NOTICES).find((k) => sp[k]);

  return (
    <main>
      <p className="back"><a href="/gare">Torna alle gare</a></p>
      <h1>Impostazioni gare</h1>
      {notice && <div className="notice">{NOTICES[notice]}</div>}
      <p>Qui si creano, si modificano e si eliminano le gare e si sceglie chi partecipa. Tutto resta modificabile anche a gara partita.</p>
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
                <small>
                  {c.people} {c.people === 1 ? 'partecipante' : 'partecipanti'}
                  {c.age_grading ? ' · con coefficiente età e sesso' : ' · solo tempo'}
                </small>
                <span className="comp-status">{statusLine(c, now)}</span>
              </div>
              <div className="row-actions">
                <a href={`/gare/${c.id}/modifica`}>Modifica</a>
                <a className="danger" href={`/gare/${c.id}/elimina`}>Elimina</a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
