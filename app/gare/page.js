import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { isAdmin } from '@/lib/admin';
import { phase, statusLine, fmtDay } from '@/lib/competition';

const ORDER = { running: 0, before: 1, over: 2 };

export default async function Gare() {
  const userId = await getUserId();
  if (!userId) redirect('/login');
  const admin = await isAdmin(userId);
  const now = new Date();
  const comps = (admin
    ? await sql`select id, name, km, start_date, end_date from competitions order by start_date desc, id desc`
    : await sql`select c.id, c.name, c.km, c.start_date, c.end_date from competitions c
                join competition_participants p on p.competition_id = c.id and p.user_id = ${userId}
                order by c.start_date desc, c.id desc`)
    .map((c) => ({ ...c, phase: phase(c, now) }))
    .sort((a, b) => ORDER[a.phase] - ORDER[b.phase]);
  // Una sola gara: inutile passare dall'elenco, si va dritti alla classifica.
  if (comps.length === 1) redirect(`/gare/${comps[0].id}`);

  return (
    <main>
      <h1>Gare</h1>
      <p>Ogni gara ha i suoi km e le sue date. Le stesse corse Strava valgono per tutte. <a href="/regolamento">Leggi il regolamento</a></p>

      {comps.length === 0 ? (
        <p>{admin ? <>Ancora nessuna gara. Creala da <a href="/gare/impostazioni">Impostazioni gare</a>.</> : 'Non partecipi ancora a nessuna gara: ti aggiunge l\'amministratore.'}</p>
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
