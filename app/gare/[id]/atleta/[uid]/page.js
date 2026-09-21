import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStravaUser } from '@/lib/admin';
import { sql } from '@/lib/db';
import { loadCompetitionFor, competitionRuns } from '@/lib/standings';
import { markRecords } from '@/lib/efforts';
import { ProgressChart } from '@/lib/chart';
import { fmtTime, fmtDate, fmtKm, fmtElevation } from '@/lib/format';
import Avatar from '../../../../avatar';
import Splits from '../../../splits';
import RunDetails from '../../../run-details';

export default async function Atleta({ params }) {
  const me = await requireStravaUser();
  const p = await params;
  const c = await loadCompetitionFor(p.id, me);
  const uid = Number(p.uid);
  if (!c || !Number.isInteger(uid)) notFound();

  // Solo chi partecipa a questa gara ha una pagina qui.
  const [athlete] = await sql`select c.athlete_name, coalesce('/api/foto/' || u.id || '?v=' || u.photo_v, c.avatar_url) as avatar_url
                              from strava_connections c join users u on u.id = c.user_id
                              join competition_participants p on p.user_id = c.user_id and p.competition_id = ${c.id}
                              where c.user_id = ${uid} and c.consent_at is not null`;
  if (!athlete) notFound();

  const runs = markRecords(await competitionRuns(c, uid));
  const timed = runs.filter((r) => r.time_s != null);
  const best = timed.length ? Math.min(...timed.map((r) => r.time_s)) : null;
  const first = timed[0]?.time_s;

  return (
    <main>
      <p className="back"><Link href={`/gare/${c.id}`}>Torna a {c.name}</Link></p>
      <div className="athlete-head">
        <Avatar name={athlete.athlete_name} src={athlete.avatar_url} size="lg" />
        <h1>{athlete.athlete_name || 'Atleta senza nome'}</h1>
      </div>
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
      {timed.length > 0 && <p className="legend">Tocca una corsa per vedere i parziali dei primi {c.km}&nbsp;km.</p>}
      <ul className="history">
        {[...runs].reverse().map((r) => {
          const head = (
            <>
              <span>
                <strong>{fmtDate(r)}</strong>
                <small>{[`${fmtKm(r.distance_m)} km`, fmtElevation(r.elev_m)].filter(Boolean).join(' · ')}</small>
              </span>
              <span className="time">
                {r.time_s != null ? fmtTime(r.time_s) : 'n.d.'}
                {r.isRecord && <em>record</em>}
              </span>
            </>
          );
          // Senza tempo non ci sono parziali da mostrare. La corsa del record è già aperta.
          return (
            <li key={r.id}>
              {r.time_s == null ? <div className="run-row">{head}</div> : (
                <RunDetails open={r.time_s === best} head={head}>
                  <Splits splits={r.splits} km={c.km} />
                </RunDetails>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
