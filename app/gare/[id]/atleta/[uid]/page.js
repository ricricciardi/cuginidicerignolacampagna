import { notFound, redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { loadCompetition, competitionRuns } from '@/lib/standings';
import { markRecords } from '@/lib/efforts';
import { ProgressChart } from '@/lib/chart';
import { fmtTime, fmtDate, fmtKm } from '@/lib/format';

export default async function Atleta({ params }) {
  const me = await getUserId();
  if (!me) redirect('/login');
  const p = await params;
  const c = await loadCompetition(p.id);
  const uid = Number(p.uid);
  if (!c || !Number.isInteger(uid)) notFound();

  const [athlete] = await sql`select athlete_name from strava_connections
                              where user_id = ${uid} and consent_at is not null`;
  if (!athlete) notFound();

  const runs = markRecords(await competitionRuns(c, uid));
  const timed = runs.filter((r) => r.time_s != null);
  const best = timed.length ? Math.min(...timed.map((r) => r.time_s)) : null;
  const first = timed[0]?.time_s;

  return (
    <main>
      <p className="back"><a href={`/gare/${c.id}`}>Torna a {c.name}</a></p>
      <h1>{athlete.athlete_name || 'Atleta senza nome'}</h1>
      {best != null ? (
        <>
          <dl className="stats summary">
            <div className="km"><dt>Record {c.km} km</dt><dd>{fmtTime(best)}</dd></div>
            <div><dt>Corse</dt><dd>{runs.length}</dd></div>
            <div><dt>Dalla prima</dt><dd>{first - best > 0 ? `−${fmtTime(first - best)}` : '0:00'}</dd></div>
          </dl>
          <h2>Primi {c.km}&nbsp;km di ogni corsa</h2>
          <p className="legend">Più in alto è più veloce. I punti pieni sono i nuovi record.</p>
          <div className="chart-wrap"><ProgressChart runs={runs} km={c.km} /></div>
        </>
      ) : (
        <p>Nessun tempo sui primi {c.km} km in questa gara.</p>
      )}
      <ul className="history">
        {[...runs].reverse().map((r) => (
          <li key={r.id}>
            <span>
              <strong>{fmtDate(r)}</strong>
              <small>{fmtKm(r.distance_m)} km</small>
            </span>
            <span className="time">
              {r.time_s != null ? fmtTime(r.time_s) : 'n.d.'}
              {r.isRecord && <em>record</em>}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
