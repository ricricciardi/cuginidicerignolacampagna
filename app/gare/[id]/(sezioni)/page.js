import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadCompetitionFor, competitionRuns, standings, ageStandings, kmStandings, participants, periodActivities } from '@/lib/standings';
import { bestKmSplit } from '@/lib/efforts';
import { fmtTime, fmtDate, fmtElevation, fmtDist, fmtPace } from '@/lib/format';
import { fmtPct, MIN_GRADE_M } from '@/lib/agegrade';
import Avatar from '../../../avatar';
import ViewTabs from './view-tabs';
import { getT } from '@/lib/lingua';
import { requireStravaUser } from '@/lib/admin';

const NOTICES = {
  creata: 'Gara creata.',
  modificata: 'Modifiche salvate.',
};

export default async function Classifica({ params, searchParams }) {
  const me = await requireStravaUser();
  const c = await loadCompetitionFor((await params).id, me);
  if (!c) notFound();
  const sp = await searchParams;
  const notice = Object.keys(NOTICES).find((k) => sp[k]);
  if (c.total_km) {
    const [acts, people, t] = await Promise.all([periodActivities(c), participants(c), getT()]);
    return (
      <>
        {notice && <div className="notice">{t(NOTICES[notice])}</div>}
        <KmBoard rows={kmStandings(acts, people)} c={c} me={me} t={t} />
      </>
    );
  }
  // Punteggio solo se la gara lo prevede e dal miglio in su (sotto non ci sono tabelle).
  const graded = c.age_grading && c.distance_m >= MIN_GRADE_M;
  // In parallelo: sono indipendenti, così si aspetta la più lenta invece della somma.
  const [runs, people, t] = await Promise.all([competitionRuns(c), participants(c), getT()]);

  // Le classifiche si preparano tutte insieme e si cambiano nel browser (view-tabs.js).
  // Miglior parziale: il km più veloce di ogni corsa, solo per curiosità.
  const kmRuns = runs.map((r) => ({ ...r, time_s: bestKmSplit(r.splits), elev_m: null }));
  // Punteggio per primo (è la classifica più importante) e senza parametri nell'indirizzo;
  // senza punteggio la prima è Tempo.
  const base = `/gare/${c.id}`;
  const views = [
    graded && { key: 'eta', href: base, label: t('Punteggio'), rows: ageStandings(runs, people), byAge: true,
      legend: <>{t('Punteggio USATF 2025: il tuo tempo confrontato con il migliore al mondo per la tua età e il tuo sesso. Più alto è meglio.')}
        {' '}<Link href="/regolamento#eta">{t('Come si calcola')}</Link></> },
    { key: 'tempo', href: graded ? `${base}?vista=tempo` : base, label: t('Tempo'), rows: standings(runs, people) },
    { key: 'tratto', href: `${base}?vista=tratto`, label: t('Miglior parziale'), rows: standings(kmRuns, people),
      legend: t('Il chilometro più veloce di ogni corsa in gara, dai parziali di Strava. È solo per curiosità: non cambia la classifica della gara.') },
  ].filter(Boolean);
  const initial = Math.max(0, views.findIndex((v) => v.key === sp.vista));

  return (
    <>
      {notice && <div className="notice">{t(NOTICES[notice])}</div>}

      <div className="nav-content" data-nav="Sezioni della gara">
        <ViewTabs ariaLabel={t('Tipo di classifica')} initial={initial}
          items={views.map(({ href, label }) => ({ href, label }))}
          panels={views.map((v) => <Board key={v.key} view={v} c={c} me={me} t={t} />)} />
      </div>
    </>
  );
}

function Board({ view: { rows, byAge, legend }, c, me, t }) {
  const hasScore = (r) => (byAge ? r.pct != null : r.time_s != null);
  const meMissing = byAge && rows.find((r) => r.user_id === me)?.missing === 'dati';
  return (
    <>
      {meMissing && (
        <div className="notice">{t('Per comparire qui inserisci sesso e data di nascita in')} <Link href="/account#profilo">{t('il tuo account')}</Link>.</div>
      )}

      {rows.length === 0 ? (
        <p>{t('Nessun cugino ha ancora collegato Strava. Chi lo collega compare qui.')}</p>
      ) : (
        <>
        <div className="board-head" aria-hidden="true">
          <span>{t('Pos.')}</span><span /><span>{t('Cugino')}</span><span>{t('Volte')}</span><span>{byAge ? t('Punti') : t('Record')}</span>
        </div>
        <ol className="board">
          {rows.map((r, i) => (
            <li key={r.user_id} className={[r.user_id === me ? 'me' : '', !hasScore(r) ? 'senza-tempo' : '', i === 0 && hasScore(r) ? 'leader' : ''].filter(Boolean).join(' ') || undefined}>
              <Link href={`/gare/${c.id}/atleta/${r.user_id}`}>
                <span className="pos">{hasScore(r) ? i + 1 : '—'}</span>
                <Avatar name={r.athlete_name} src={r.avatar_url} me={r.user_id === me} />
                <span className="who" data-tu={t('Tu')}>
                  <strong title={r.athlete_name || t('Atleta senza nome')}>{r.athlete_name || t('Atleta senza nome')}</strong>
                  <small>
                    {hasScore(r)
                      ? [byAge ? `${fmtTime(r.time_s)}, ${fmtDate(r)}` : fmtDate(r), fmtElevation(r.elev_m)]
                          .filter(Boolean).join(' · ')
                      : (r.missing === 'dati' ? t('Mancano sesso o data di nascita') : t('Nessuna corsa in gara'))}
                  </small>
                </span>
                <span className="count" aria-label={t(r.reached === 1 ? '{n} volta oltre i {dist}' : '{n} volte oltre i {dist}', { n: r.reached, dist: fmtDist(c.distance_m) })}>{r.reached}</span>
                {byAge
                  ? <span className="pct">{fmtPct(r.pct)}</span>
                  : <span className="time">{r.time_s != null ? fmtTime(r.time_s) : '—'}</span>}
              </Link>
            </li>
          ))}
        </ol>
        </>
      )}
      {legend && <p className="legend legend-after">{legend}</p>}
    </>
  );
}

// Classifica delle gare a km totali: chi ha corso di più in testa, con quante corse e il passo medio.
const fmtKmTot = (m) => (m / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 });
function KmBoard({ rows, c, me, t }) {
  return rows.length === 0 ? (
    <p>{t('Nessun cugino ha ancora collegato Strava. Chi lo collega compare qui.')}</p>
  ) : (
    <>
      <div className="board-head" aria-hidden="true">
        <span>{t('Pos.')}</span><span /><span>{t('Cugino')}</span><span>{t('Corse')}</span><span>{t('Km')}</span>
      </div>
      <ol className="board">
        {rows.map((r, i) => (
          <li key={r.user_id} className={[r.user_id === me ? 'me' : '', !r.meters ? 'senza-tempo' : '', i === 0 && r.meters ? 'leader' : ''].filter(Boolean).join(' ') || undefined}>
            <Link href={`/gare/${c.id}/atleta/${r.user_id}`}>
              <span className="pos">{r.meters ? i + 1 : '—'}</span>
              <Avatar name={r.athlete_name} src={r.avatar_url} me={r.user_id === me} />
              <span className="who" data-tu={t('Tu')}>
                <strong title={r.athlete_name || t('Atleta senza nome')}>{r.athlete_name || t('Atleta senza nome')}</strong>
                <small>{r.meters ? t('{p}/km di media', { p: fmtPace(r.seconds, r.meters) }) : t('Ancora nessuna corsa')}</small>
              </span>
              <span className="count" aria-label={t(r.reached === 1 ? '{n} corsa' : '{n} corse', { n: r.reached })}>{r.reached}</span>
              <span className="time">{r.meters ? fmtKmTot(r.meters) : '—'}</span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="legend legend-after">{t('Conta la somma dei km di tutte le corse del periodo, di qualunque lunghezza.')}</p>
    </>
  );
}
