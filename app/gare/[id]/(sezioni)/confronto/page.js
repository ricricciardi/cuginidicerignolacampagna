import { notFound } from 'next/navigation';
import { loadCompetitionFor, competitionRuns, participants, periodActivities } from '@/lib/standings';
import { raceDays, dayCells, effort, improvement, pacing, WEEKLY_AFTER_DAYS } from '@/lib/compare';
import ViewTabs from '../view-tabs';
import Avatar from '../../../../avatar';
import { getT } from '@/lib/lingua';
import { requireStravaUser } from '@/lib/admin';
import { fmtDist, fmtTime, fmtPace, fmtShortDate } from '@/lib/format';
import { compWindow } from '@/lib/competition';

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
export default async function Confronto({ params, searchParams }) {
  const me = await requireStravaUser();
  const c = await loadCompetitionFor((await params).id, me);
  if (!c) notFound();
  const [runs, people, acts, t] = await Promise.all([competitionRuns(c), participants(c), periodActivities(c), getT()]);
  const days = raceDays(c, romeToday());
  const train = effort(acts, people);
  const weekly = days.length > WEEKLY_AFTER_DAYS;
  const cells = (e) => dayCells(days, e.days);
  const better = improvement(runs, people);
  // Record di ognuno (miglior tempo; a parità il primo) e com'è stato corso.
  const records = better.filter((e) => e.best).map((e) => ({ ...e, pace: pacing(e.best, c.distance_m) }))
    .sort((a, b) => a.best.time_s - b.best.time_s);
  const dist = fmtDist(c.distance_m);
  const { vista } = await searchParams;
  // Asse dei tempi comune a tutti i grafici: dall'inizio della gara a oggi (o alla fine).
  const win = compWindow(c);
  const span = [win.start.getTime(), Math.min(Date.now(), win.end.getTime())];
  // Scala verticale comune: quanto più lento del proprio record (in %), uguale per tutti i grafici.
  const slowest = Math.max(0.01, ...better.flatMap((e) => e.points.map((r) => r.time_s / e.best.time_s - 1)));
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
    <>
      <div className="nav-content" data-nav="Sezioni della gara">
      {people.length === 0 ? (
        <p>{t('Nessun cugino ha ancora collegato Strava. Chi lo collega compare qui.')}</p>
      ) : (
        <ViewTabs label="Tipo di confronto" ariaLabel={t('Tipo di confronto')}
          initial={Math.max(0, ['allenamento', 'miglioramento', 'passo'].indexOf(vista))}
          items={[
            { href: `/gare/${c.id}/confronto`, label: t('Impegno') },
            { href: `/gare/${c.id}/confronto?vista=miglioramento`, label: t('Progressi') },
            { href: `/gare/${c.id}/confronto?vista=passo`, label: t('Stile') },
          ]}
          panels={[
        <section key="allenamento" className="cmp" aria-label={t('Chi si allena di più')}>
          <p className="hint">{t('Tutte le corse del periodo di gara, anche quelle più corte di {dist}.', { dist })}{' '}
            {weekly
              ? t('Ogni quadratino è una settimana: più è acceso, più giorni ha corso.')
              : t('Ogni quadratino è un giorno: acceso se quel giorno ha corso.')}</p>
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
                  <span className="days" style={{ '--n': Math.min(26, cells(e).length) }} aria-label={t('{n} giorni su {tot} con almeno una corsa', { n: e.days.size, tot: days.length })}>
                    {cells(e).map((x) => <i key={x.key} className={`l${x.level}`} />)}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>,
        <section key="miglioramento" className="cmp" aria-label={t('Chi è migliorato di più')}>
          <p className="hint">{t('Dalla prima corsa valida in gara al record, sui {dist}.', { dist })} {t('Nel grafico ogni punto è una corsa: più in alto è più veloce, il record è rosa. Stessa scala per tutti.')}</p>
          <ol className="cmp-list">
            {better.map((e) => (
              <li key={e.user_id} className={e.user_id === me ? 'me' : undefined}>
                <Who p={e}>
                  <small>{e.gain != null
                    ? t('da {da} ({il}) a {a} ({al})', { da: fmtTime(e.first.time_s), il: fmtShortDate(e.first), a: fmtTime(e.best.time_s), al: fmtShortDate(e.best) })
                    : e.count ? t('Una sola corsa: serve la seconda') : t('Nessuna corsa in gara')}</small>
                </Who>
                {e.count > 0 && <Trend e={e} span={span} slowest={slowest} label={t('Tempi di {nome} nel periodo di gara', { nome: name(e) })} />}
                <span className={`cmp-val${e.gain > 0 ? ' up' : ''}`}>
                  {e.gain == null ? '—' : e.gain > 0 ? <>−{fmtTime(e.gain)}<small> {fmtPct1(e.pct)}%</small></> : t('stesso tempo')}
                </span>
              </li>
            ))}
          </ol>
        </section>,
        <section key="passo" className="cmp" aria-label={t('Come corre')}>
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
        </section>,
          ]} />
      )}
      </div>
    </>
  );
}

// Tempi di un cugino nel periodo di gara: un punto per corsa, più in alto = più veloce, record in rosa.
// Assi uguali per tutti: giorni della gara in orizzontale, distacco dal proprio record in verticale
// (il record sta in cima, `slowest` è il distacco più grande tra tutti i cugini).
const W = 300, H = 56, PAD = 7, DOTS_MAX = 30;
function Trend({ e, span: [t0, t1], slowest, label }) {
  const x = (r) => PAD + ((new Date(r.start_date).getTime() - t0) / Math.max(1, t1 - t0)) * (W - 2 * PAD);
  const y = (s) => PAD + ((s / e.best.time_s - 1) / slowest) * (H - 2 * PAD);
  const pts = e.points.map((r) => [x(r), y(r.time_s)]);
  return (
    <svg className="trend" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <line className="trend-base" x1={PAD} x2={W - PAD} y1={H - 1} y2={H - 1} />
      {pts.length > 1 && <polyline className="trend-line" points={pts.map((p) => p.join(',')).join(' ')} />}
      {/* Con tante corse (es. una gara di un anno) resta la linea e si segna solo il record. */}
      {e.points.map((r, i) => (e.points.length > DOTS_MAX && r !== e.best ? null :
        <circle key={r.id ?? i} className={r === e.best ? 'trend-dot best' : 'trend-dot'} cx={pts[i][0]} cy={pts[i][1]} r={r === e.best ? 5 : 3.5}>
          <title>{`${fmtShortDate(r)}: ${fmtTime(r.time_s)}`}</title>
        </circle>
      ))}
    </svg>
  );
}
