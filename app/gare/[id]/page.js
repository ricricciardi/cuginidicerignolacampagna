import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadCompetitionFor, competitionRuns, standings, ageStandings, participants, visibleCompetitionCount } from '@/lib/standings';
import { fmtTime, fmtDate, fmtElevation } from '@/lib/format';
import { fmtPct } from '@/lib/agegrade';
import CompetitionHeader from '../header';
import Avatar from '../../avatar';
import SegmentedLinks from '../../segmented-links';
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
  const byAge = c.age_grading && sp.vista === 'eta';
  // In parallelo: sono indipendenti, così si aspetta la più lenta invece della somma.
  const [runs, people, count, t] = await Promise.all([competitionRuns(c), participants(c), visibleCompetitionCount(me), getT()]);
  const rows = byAge ? ageStandings(runs, people) : standings(runs, people);
  const notice = Object.keys(NOTICES).find((k) => sp[k]);
  const hasScore = (r) => (byAge ? r.pct != null : r.time_s != null);
  const meMissing = byAge && rows.find((r) => r.user_id === me)?.missing === 'dati';

  return (
    <main>
      {notice && <div className="notice">{t(NOTICES[notice])}</div>}
      <CompetitionHeader c={c} current="classifica" many={count > 1} />

      <div className="nav-content" data-nav="Sezioni della gara">
      {c.age_grading && <SegmentedLinks className="segmented view-switch" label="Tipo di classifica" ariaLabel={t('Tipo di classifica')} scroll={false} replace items={[
        { href: `/gare/${c.id}`, label: t('Tempo'), current: !byAge },
        { href: `/gare/${c.id}?vista=eta`, label: t('Punteggio'), current: byAge },
      ]} />}
      <div className="nav-content" data-nav="Tipo di classifica">
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
                <span className="count" aria-label={t(r.reached === 1 ? '{n} volta oltre i {km} km' : '{n} volte oltre i {km} km', { n: r.reached, km: c.km })}>{r.reached}</span>
                {byAge
                  ? <span className="pct">{fmtPct(r.pct)}</span>
                  : <span className="time">{r.time_s != null ? fmtTime(r.time_s) : '—'}</span>}
              </Link>
            </li>
          ))}
        </ol>
        </>
      )}
      {byAge && (
        <p className="legend legend-after">
          {t('Punteggio USATF 2025: il tuo tempo confrontato con il migliore al mondo per la tua età e il tuo sesso. Più alto è meglio.')}
          {' '}<Link href="/regolamento#eta">{t('Come si calcola')}</Link>
        </p>
      )}
      </div>
      </div>
    </main>
  );
}
