import Link from 'next/link';
import { sql } from '@/lib/db';
import { requireAdminPage } from '@/lib/admin';
import { phase, statusLine, fmtDay } from '@/lib/competition';
import { getT } from '@/lib/lingua';
import { fmtDist } from '@/lib/format';

const NOTICES = {
  eliminata: 'Gara eliminata.',
  creata: 'Gara creata.',
  modificata: 'Modifiche salvate.',
};

export default async function Impostazioni({ searchParams }) {
  await requireAdminPage();
  const sp = await searchParams;
  const t = await getT();
  const now = new Date();
  const comps = (await sql`select c.id, c.name, c.distance_m, c.start_date, c.end_date, c.age_grading,
                                  (select count(*) from competition_participants p where p.competition_id = c.id)::int as people
                           from competitions c order by c.start_date desc, c.id desc`)
    .map((c) => ({ ...c, phase: phase(c, now) }));
  const notice = Object.keys(NOTICES).find((k) => sp[k]);

  return (
    <main>
      <p className="back"><Link href="/gare">{t('Torna alle gare')}</Link></p>
      <h1>{t('Impostazioni gare')}</h1>
      {notice && <div className="notice">{t(NOTICES[notice])}</div>}
      <p>{t('Qui si creano, si modificano e si eliminano le gare e si sceglie chi partecipa. Tutto resta modificabile anche a gara partita.')}</p>
      <p><Link className="button" href="/gare/nuova">{t('Crea una gara')}</Link></p>

      {comps.length === 0 ? (
        <p>{t('Ancora nessuna gara.')}</p>
      ) : (
        <ul className="settings-list">
          {comps.map((c) => (
            <li key={c.id}>
              <div className="comp-main">
                <strong>{c.name}</strong>
                <small>{t('{dist}, dal {dal} al {al}', { dist: fmtDist(c.distance_m), dal: fmtDay(c.start_date), al: fmtDay(c.end_date) })}</small>
                <small>
                  {t(c.people === 1 ? '{n} partecipante' : '{n} partecipanti', { n: c.people })}
                  {' · '}{c.age_grading ? t('con coefficiente età e sesso') : t('solo tempo')}
                </small>
                <span className="comp-status">{statusLine(c, now, t)}</span>
              </div>
              <div className="row-actions">
                <Link href={`/gare/${c.id}/modifica`}>{t('Modifica')}</Link>
                <Link className="danger" href={`/gare/${c.id}/elimina`}>{t('Elimina')}</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
