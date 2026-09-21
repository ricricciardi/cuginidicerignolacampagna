import { notFound, redirect } from 'next/navigation';
import { getUserId } from '@/lib/session';
import { loadCompetition, competitionRuns, standings, ageStandings, participants } from '@/lib/standings';
import { fmtTime, fmtDate } from '@/lib/format';
import { fmtPct } from '@/lib/agegrade';
import CompetitionHeader from '../header';
import Avatar from '../../avatar';

const NOTICES = {
  creata: 'Gara creata.',
  modificata: 'Modifiche salvate.',
};

export default async function Classifica({ params, searchParams }) {
  const me = await getUserId();
  if (!me) redirect('/login');
  const c = await loadCompetition((await params).id);
  if (!c) notFound();
  const sp = await searchParams;
  const byAge = sp.vista === 'eta';
  const runs = await competitionRuns(c);
  const people = await participants();
  const rows = byAge ? ageStandings(runs, people) : standings(runs, people);
  const notice = Object.keys(NOTICES).find((k) => sp[k]);
  const hasScore = (r) => (byAge ? r.pct != null : r.time_s != null);
  const meMissing = byAge && rows.find((r) => r.user_id === me)?.missing === 'dati';

  return (
    <main>
      {sp.error === 'bloccata' && <div className="notice error">La gara è partita: non si può più modificare.</div>}
      {notice && <div className="notice">{NOTICES[notice]}</div>}
      <CompetitionHeader c={c} current="classifica" />

      <nav className="segmented view-switch" aria-label="Tipo di classifica">
        <a href={`/gare/${c.id}`} aria-current={!byAge ? 'page' : undefined}>Tempo</a>
        <a href={`/gare/${c.id}?vista=eta`} aria-current={byAge ? 'page' : undefined}>Età e sesso</a>
      </nav>
      {byAge && (
        <p className="legend">
          Punteggio USATF 2025: il tuo tempo confrontato con il migliore al mondo per la tua età e il tuo sesso.
          Più alto è meglio. <a href="/regolamento#eta">Come si calcola</a>
        </p>
      )}
      {meMissing && (
        <div className="notice">Per comparire qui inserisci sesso e data di nascita in <a href="/dashboard#profilo">Le mie corse</a>.</div>
      )}

      {rows.length === 0 ? (
        <p>Nessun cugino ha ancora collegato Strava. Chi lo collega compare qui.</p>
      ) : (
        <>
        <div className="board-head" aria-hidden="true">
          <span>Pos.</span><span /><span>Cugino</span><span>Volte</span><span>{byAge ? 'Punti' : 'Record'}</span>
        </div>
        <ol className="board">
          {rows.map((r, i) => (
            <li key={r.user_id} className={[r.user_id === me ? 'me' : '', !hasScore(r) ? 'senza-tempo' : '', i === 0 && hasScore(r) ? 'leader' : ''].filter(Boolean).join(' ') || undefined}>
              <a href={`/gare/${c.id}/atleta/${r.user_id}`}>
                <span className="pos">{hasScore(r) ? i + 1 : '—'}</span>
                <Avatar name={r.athlete_name} src={r.avatar_url} />
                <span className="who">
                  <strong title={r.athlete_name || 'Atleta senza nome'}>{r.athlete_name || 'Atleta senza nome'}</strong>
                  <small>
                    {hasScore(r)
                      ? (byAge ? `${fmtTime(r.time_s)}, ${fmtDate(r)}` : fmtDate(r))
                      : (r.missing === 'dati' ? 'Mancano sesso o data di nascita' : 'Nessuna corsa in gara')}
                  </small>
                </span>
                <span className="count" aria-label={`${r.reached} ${r.reached === 1 ? 'volta' : 'volte'} oltre i ${c.km} km`}>{r.reached}</span>
                {byAge
                  ? <span className="pct">{fmtPct(r.pct)}</span>
                  : <span className="time">{r.time_s != null ? fmtTime(r.time_s) : '—'}</span>}
              </a>
            </li>
          ))}
        </ol>
        </>
      )}
    </main>
  );
}
