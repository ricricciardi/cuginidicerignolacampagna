import { notFound } from 'next/navigation';
import { loadCompetitionFor, competitionRuns } from '@/lib/standings';
import { buildSeries } from '@/lib/series';
import { compWindow } from '@/lib/competition';
import CompetitionHeader from '../../header';
import CompareChart from './compare-chart';
import { requireStravaUser } from '@/lib/admin';

export default async function Confronto({ params }) {
  const me = await requireStravaUser();
  const c = await loadCompetitionFor((await params).id, me);
  if (!c) notFound();
  const series = buildSeries(await competitionRuns(c));
  const { start, end } = compWindow(c);

  return (
    <main>
      <CompetitionHeader c={c} current="confronto" userId={me} />
      {series.length === 0 ? (
        <p>Ancora nessun tempo da confrontare. I primi arrivano la notte dopo la partenza.</p>
      ) : (
        <CompareChart series={series} me={me} km={c.km}
                      start={start.getTime()} end={Math.min(Date.now(), end.getTime())} />
      )}
    </main>
  );
}
