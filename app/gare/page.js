import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { isAdmin, requireStravaUser } from '@/lib/admin';
import { phase, statusLine, fmtDay } from '@/lib/competition';
import { getT } from '@/lib/lingua';

const ORDER = { running: 0, before: 1, over: 2 };

export default async function Gare() {
  const userId = await requireStravaUser();
  const [admin, t] = await Promise.all([isAdmin(userId), getT()]);
  const now = new Date();
  const comps = (admin
    ? await sql`select id, name, distance_m, start_date, end_date from competitions order by start_date desc, id desc`
    : await sql`select c.id, c.name, c.distance_m, c.start_date, c.end_date from competitions c
                join competition_participants p on p.competition_id = c.id and p.user_id = ${userId}
                order by c.start_date desc, c.id desc`)
    .map((c) => ({ ...c, phase: phase(c, now) }))
    .sort((a, b) => ORDER[a.phase] - ORDER[b.phase]);
  // Una sola gara: inutile passare dall'elenco, si va dritti alla classifica.
  if (comps.length === 1) redirect(`/gare/${comps[0].id}`);

  return (
    <main>
      <h1>{t('Gare')}</h1>
      <p>{t('Ogni gara ha la sua distanza e le sue date. Le stesse corse Strava valgono per tutte.')} <Link href="/regolamento">{t('Leggi il regolamento')}</Link></p>

      {comps.length === 0 ? (
        <p>{admin ? <>{t('Ancora nessuna gara. Creala da')} <Link href="/gare/impostazioni">{t('Impostazioni gare')}</Link>.</> : t('Non partecipi ancora a nessuna gara: ti aggiunge l\'amministratore.')}</p>
      ) : (
        <ul className="comps">
          {comps.map((c) => (
            <li key={c.id} className={c.phase}>
              <Link href={`/gare/${c.id}`}>
                <span className="comp-km">{c.distance_m < 1000 ? c.distance_m : (c.distance_m / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })}<small>{c.distance_m < 1000 ? 'm' : 'km'}</small></span>
                <span className="comp-main">
                  <strong>{c.name}</strong>
                  <small>{fmtDay(c.start_date)} – {fmtDay(c.end_date)}</small>
                  <span className="comp-status">{statusLine(c, now, t)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
