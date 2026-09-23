import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStravaUser } from '@/lib/admin';
import { sql } from '@/lib/db';
import { loadCompetitionFor, competitionRuns, periodActivities } from '@/lib/standings';
import { markRecords } from '@/lib/efforts';
import { ProgressChart } from '@/lib/chart';
import { fmtTime, fmtDate, fmtKm, fmtElevation, fmtDist, fmtPace } from '@/lib/format';
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
  if (c.total_km) return <KmAthlete c={c} uid={uid} me={me} athlete={athlete} />;

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
            <div className="km"><dt>{t('Record {dist}', { dist: fmtDist(c.distance_m) })}</dt><dd>{fmtTime(best)}</dd></div>
            <div><dt>{t('Corse')}</dt><dd>{runs.length}</dd></div>
            <div><dt>{t('Dalla prima')}</dt><dd>{first - best > 0 ? `−${fmtTime(first - best)}` : '0:00'}</dd></div>
          </dl>
          <h2>{t('Primi {dist} di ogni corsa', { dist: fmtDist(c.distance_m) })}</h2>
          <p className="legend">{t('Più in alto è più veloce. I punti pieni sono i nuovi record.')}</p>
          <div className="chart-wrap"><ProgressChart runs={runs} dist={fmtDist(c.distance_m)} t={t} /></div>
        </>
      ) : (
        <p>{c.best_segment
          ? t('Nessun tempo su {dist} in questa gara.', { dist: fmtDist(c.distance_m) })
          : t('Nessun tempo sui primi {dist} in questa gara.', { dist: fmtDist(c.distance_m) })}</p>
      )}
      {timed.length > 0 && c.distance_m >= 1000 && <p className="legend">{t('Tocca una corsa per vedere i parziali al km.', { dist: fmtDist(c.distance_m) })}</p>}
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
              {r.time_s == null || c.distance_m < 1000 ? <div className="run-row">{head}</div> : (
                <RunDetails open={r.time_s === best} head={head}>
                  <Splits splits={r.splits} km={Math.floor(c.distance_m / 1000)} />
                </RunDetails>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}

// Gara a km totali: km sommati, corse e passo medio, poi l'elenco delle corse del periodo.
async function KmAthlete({ c, uid, me, athlete }) {
  const [runs, t] = await Promise.all([periodActivities(c, uid), getT()]);
  const meters = runs.reduce((m, r) => m + r.distance_m, 0);
  const seconds = runs.reduce((s, r) => s + r.moving_time_s, 0);
  return (
    <main>
      <p className="back"><Link href={`/gare/${c.id}`}>{t('Torna a {nome}', { nome: c.name })}</Link></p>
      <div className="athlete-head">
        <Avatar name={athlete.athlete_name} src={athlete.avatar_url} size="lg" me={uid === me} />
        <h1>{athlete.athlete_name || t('Atleta senza nome')}</h1>
      </div>
      {runs.length ? (
        <>
          <dl className="stats summary">
            <div className="km"><dt>{t('Km totali')}</dt><dd>{fmtKm(meters)}</dd></div>
            <div><dt>{t('Corse')}</dt><dd>{runs.length}</dd></div>
            <div><dt>{t('Passo /km')}</dt><dd>{fmtPace(seconds, meters)}</dd></div>
          </dl>
          <ul className="history">
            {[...runs].reverse().map((r) => (
              <li key={r.id}>
                <div className="run-row">
                  <span>
                    <strong>{fmtDate(r)}</strong>
                    <small>{t('{p}/km', { p: fmtPace(r.moving_time_s, r.distance_m) })}</small>
                  </span>
                  <span className="time">{fmtKm(r.distance_m)} km</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>{t('Nessuna corsa in questa gara.')}</p>
      )}
    </main>
  );
}
