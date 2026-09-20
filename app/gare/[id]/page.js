import { notFound, redirect } from 'next/navigation';
import { getUserId } from '@/lib/session';
import { loadCompetition, competitionRuns, standings } from '@/lib/standings';
import { fmtTime, fmtDate } from '@/lib/format';
import CompetitionHeader from '../header';

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
  const rows = standings(await competitionRuns(c));
  const notice = Object.keys(NOTICES).find((k) => sp[k]);

  return (
    <main>
      {sp.error === 'bloccata' && <div className="notice error">La gara è partita: non si può più modificare.</div>}
      {notice && <div className="notice">{NOTICES[notice]}</div>}
      <CompetitionHeader c={c} current="classifica" />
      {rows.length === 0 ? (
        <p>Ancora nessun tempo in gara. Dopo la partenza i tempi compaiono qui entro la notte.</p>
      ) : (
        <>
        <div className="board-head" aria-hidden="true">
          <span>Pos.</span><span>Cugino</span><span>Volte</span><span>Record</span>
        </div>
        <ol className="board">
          {rows.map((r, i) => (
            <li key={r.user_id} className={r.user_id === me ? 'me' : undefined}>
              <a href={`/gare/${c.id}/atleta/${r.user_id}`}>
                <span className="pos">{i + 1}</span>
                <span className="who">
                  <strong>{r.athlete_name || 'Atleta senza nome'}</strong>
                  <small>{fmtDate(r)}</small>
                </span>
                <span className="count" aria-label={`${r.reached} ${r.reached === 1 ? 'volta' : 'volte'} oltre i ${c.km} km`}>{r.reached}</span>
                <span className="time">{fmtTime(r.time_s)}</span>
              </a>
            </li>
          ))}
        </ol>
        </>
      )}
    </main>
  );
}
