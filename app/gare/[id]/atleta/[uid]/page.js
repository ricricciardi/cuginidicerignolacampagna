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
import { getT } from '@/lib/lingua';

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

  const [runsRaw, t] = await Promise.all([competitionRuns(c, uid), getT()]);
  const runs = markRecords(runsRaw);
  const timed = runs.filter((r) => r.time_s != null);
  const best = timed.length ? Math.min(...timed.map((r) => r.time_s)) : null;
  const first = timed[0]?.time_s;

  return (
    <main>
      <p className="back"><Link href={`/gare/${c.id}`}>{t('Torna a {nome}', { nome: c.name })}</Link></p>
      <div className="athlete-head">
        <Avatar name={athlete.athlete_name} src={athlete.avatar_url} size="lg" me={uid === me} />
        <h1>{athlete.athlete_name || t('Atleta senza nome')}</h1>
      </div>
      {best != null ? (
        <>
          <dl className="stats summary">
            <div className="km"><dt>{t('Record {km} km', { km: c.km })}</dt><dd>{fmtTime(best)}</dd></div>
            <div><dt>{t('Corse')}</dt><dd>{runs.length}</dd></div>
            <div><dt>{t('Dalla prima')}</dt><dd>{first - best > 0 ? `−${fmtTime(first - best)}` : '0:00'}</dd></div>
          </dl>
          <h2>{t('Primi {km} km di ogni corsa', { km: c.km })}</h2>
          <p className="legend">{t('Più in alto è più veloce. I punti pieni sono i nuovi record.')}</p>
          <div className="chart-wrap"><ProgressChart runs={runs} km={c.km} t={t} /></div>
        </>
      ) : (
        <p>{t('Nessun tempo sui primi {km} km in questa gara.', { km: c.km })}</p>
      )}
      {timed.length > 0 && <p className="legend">{t('Tocca una corsa per vedere i parziali dei primi {km} km.', { km: c.km })}</p>}
      <ul className="history">
        {[...runs].reverse().map((r) => {
          const head = (
            <>
              <span>
                <strong>{fmtDate(r)}</strong>
                <small>{[`${fmtKm(r.distance_m)} km`, fmtElevation(r.elev_m)].filter(Boolean).join(' · ')}</small>
              </span>
              <span className="time">
                {r.time_s != null ? fmtTime(r.time_s) : t('n.d.')}
                {r.isRecord && <em>{t('record')}</em>}
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
