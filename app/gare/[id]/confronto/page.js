import { notFound } from 'next/navigation';
import { loadCompetitionFor, competitionRuns, visibleCompetitionCount } from '@/lib/standings';
import { buildSeries } from '@/lib/series';
import { compWindow } from '@/lib/competition';
import CompetitionHeader from '../../header';
import CompareChart from './compare-chart';
import { requireStravaUser } from '@/lib/admin';

export default async function Confronto({ params }) {
  const me = await requireStravaUser();
  const c = await loadCompetitionFor((await params).id, me);
  if (!c) notFound();
  const [runs, count] = await Promise.all([competitionRuns(c), visibleCompetitionCount(me)]);
  const series = buildSeries(runs);
  const { start, end } = compWindow(c);

  return (
    <main>
      <CompetitionHeader c={c} current="confronto" many={count > 1} />
      <div className="nav-content" data-nav="Sezioni della gara">
      {series.length === 0 ? (
        <p>Ancora nessun tempo da confrontare. I primi arrivano la notte dopo la partenza.</p>
      ) : (
        <CompareChart series={series} me={me} km={c.km}
                      start={start.getTime()} end={Math.min(Date.now(), end.getTime())} />
      )}
      </div>
    </main>
  );
}
