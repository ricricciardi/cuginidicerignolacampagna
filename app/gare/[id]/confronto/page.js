import { notFound } from 'next/navigation';
import { loadCompetitionFor, competitionRuns, participants, periodActivities, visibleCompetitionCount } from '@/lib/standings';
import { raceDays, effort, improvement, pacing } from '@/lib/compare';
import CompetitionHeader from '../../header';
import Avatar from '../../../avatar';
import { getT } from '@/lib/lingua';
import { requireStravaUser } from '@/lib/admin';
import { fmtDist, fmtTime, fmtPace, fmtShortDate } from '@/lib/format';

const romeToday = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
const fmtKmTot = (m) => (m / 1000).toLocaleString('it-IT', { maximumFractionDigits: m < 10000 ? 1 : 0 });
const fmtPct1 = (x) => (x * 100).toLocaleString('it-IT', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

// Come corre: etichetta e spiegazione per ogni tipo (lib/compare.js, pacing).
const KINDS = {
  spinta: ['Finale in spinta', 'Seconda metà più veloce della prima'],
  metronomo: ['Metronomo', 'Stesso passo dall\'inizio alla fine'],
  cala: ['Cala un po\'', 'Seconda metà un filo più lenta'],
  razzo: ['Parte a razzo', 'Parte forte e poi cede'],
};

// Confronto tra cugini: chi si allena di più, chi è migliorato di più e come corre ognuno.
export default async function Confronto({ params }) {
  const me = await requireStravaUser();
  const c = await loadCompetitionFor((await params).id, me);
  if (!c) notFound();
  const [runs, people, acts, count, t] = await Promise.all([
    competitionRuns(c), participants(c), periodActivities(c), visibleCompetitionCount(me), getT(),
  ]);
  const days = raceDays(c, romeToday());
  const train = effort(acts, people);
  const better = improvement(runs, people);
  // Record di ognuno (miglior tempo; a parità il primo) e com'è stato corso.
  const records = better.filter((e) => e.best).map((e) => ({ ...e, pace: pacing(e.best, c.distance_m) }))
    .sort((a, b) => a.best.time_s - b.best.time_s);
  const dist = fmtDist(c.distance_m);
  const name = (p) => p.athlete_name || t('Atleta senza nome');
  const Who = ({ p, children }) => (
    <>
      <Avatar name={p.athlete_name} src={p.avatar_url} me={p.user_id === me} />
      <span className="who" data-tu={t('Tu')}>
        <strong title={name(p)}>{name(p)}</strong>
        {children}
      </span>
    </>
  );

  return (
    <main>
      <CompetitionHeader c={c} current="confronto" many={count > 1} />
      <div className="nav-content" data-nav="Sezioni della gara">
      {people.length === 0 ? (
        <p>{t('Nessun cugino ha ancora collegato Strava. Chi lo collega compare qui.')}</p>
      ) : (
        <>
        <section className="card cmp" aria-labelledby="cmp-train">
          <div className="card-head"><h2 id="cmp-train">{t('Chi si allena di più')}</h2></div>
          <p className="hint">{t('Tutte le corse del periodo di gara, anche quelle più corte di {dist}. Ogni quadratino è un giorno: acceso se quel giorno ha corso.', { dist })}</p>
          <ol className="cmp-list">
            {train.map((e) => (
              <li key={e.user_id} className={e.user_id === me ? 'me' : undefined}>
                <Who p={e}>
                  <small>{e.runs
                    ? [t(e.runs === 1 ? '{n} corsa' : '{n} corse', { n: e.runs }), t('{p}/km di media', { p: fmtPace(e.seconds, e.meters) })].join(' · ')
                    : t('Ancora nessuna corsa')}</small>
                </Who>
                <span className="cmp-val">{fmtKmTot(e.meters)}<small> km</small></span>
                {days.length > 0 && (
                  <span className="days" style={{ '--n': days.length }} aria-label={t('{n} giorni su {tot} con almeno una corsa', { n: e.days.size, tot: days.length })}>
                    {days.map((d) => <i key={d} className={e.days.has(d) ? 'on' : undefined} />)}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="card cmp" aria-labelledby="cmp-better">
          <div className="card-head"><h2 id="cmp-better">{t('Chi è migliorato di più')}</h2></div>
          <p className="hint">{t('Dalla prima corsa valida in gara al record, sui {dist}.', { dist })}</p>
          <ol className="cmp-list">
            {better.map((e) => (
              <li key={e.user_id} className={e.user_id === me ? 'me' : undefined}>
                <Who p={e}>
                  <small>{e.gain != null
                    ? t('da {da} ({il}) a {a} ({al})', { da: fmtTime(e.first.time_s), il: fmtShortDate(e.first), a: fmtTime(e.best.time_s), al: fmtShortDate(e.best) })
                    : e.count ? t('Una sola corsa: serve la seconda') : t('Nessuna corsa in gara')}</small>
                </Who>
                <span className={`cmp-val${e.gain > 0 ? ' up' : ''}`}>
                  {e.gain == null ? '—' : e.gain > 0 ? <>−{fmtTime(e.gain)}<small> {fmtPct1(e.pct)}%</small></> : t('stesso tempo')}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="card cmp" aria-labelledby="cmp-pace">
          <div className="card-head"><h2 id="cmp-pace">{t('Come corre')}</h2></div>
          <p className="hint">{t('Nella corsa del record: il passo della prima metà dei {dist} contro quello della seconda.', { dist })}</p>
          {records.length === 0 ? <p>{t('Ancora nessun record in gara.')}</p> : (
            <ol className="cmp-list">
              {records.map((e) => (
                <li key={e.user_id} className={e.user_id === me ? 'me' : undefined}>
                  <Who p={e}>
                    <small>{e.pace
                      ? t('1ª metà {a}/km · 2ª metà {b}/km', { a: fmtPace(e.pace.pace1, 1000), b: fmtPace(e.pace.pace2, 1000) })
                      : t('Mancano i passaggi per dividere la corsa')}</small>
                  </Who>
                  {e.pace && (
                    <span className={`pill pace-${e.pace.kind}`} title={t(KINDS[e.pace.kind][1])}>{t(KINDS[e.pace.kind][0])}</span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
        </>
      )}
      </div>
    </main>
  );
}
