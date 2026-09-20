import { notFound, redirect } from 'next/navigation';
import { getUserId } from '@/lib/session';
import { loadCompetition, competitionRuns } from '@/lib/standings';
import { buildSeries } from '@/lib/series';
import { compWindow } from '@/lib/competition';
import CompetitionHeader from '../../header';
import CompareChart from './compare-chart';

export default async function Confronto({ params }) {
  const me = await getUserId();
  if (!me) redirect('/login');
  const c = await loadCompetition((await params).id);
  if (!c) notFound();
  const series = buildSeries(await competitionRuns(c));
  const { start, end } = compWindow(c);

  return (
    <main>
      <CompetitionHeader c={c} current="confronto" />
      {series.length === 0 ? (
        <p>Ancora nessun tempo da confrontare. I primi arrivano la notte dopo la partenza.</p>
      ) : (
        <CompareChart series={series} me={me} km={c.km}
                      start={start.getTime()} end={Math.min(Date.now(), end.getTime())} />
      )}
    </main>
  );
}
