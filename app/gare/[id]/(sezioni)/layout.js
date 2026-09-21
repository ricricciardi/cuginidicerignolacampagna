import { notFound } from 'next/navigation';
import { loadCompetitionFor, visibleCompetitionCount } from '@/lib/standings';
import { requireStravaUser } from '@/lib/admin';
import CompetitionHeader from '../../header';

// Testata comune a Classifica e Confronto: resta al suo posto quando si passa dall'una all'altra,
// e cambia solo quello che sta sotto (con loading.js mentre arriva). Così la pagina non si
// accorcia e lo scroll non salta.
export default async function SezioniGara({ params, children }) {
  const me = await requireStravaUser();
  const c = await loadCompetitionFor((await params).id, me);
  if (!c) notFound();
  const count = await visibleCompetitionCount(me);
  return (
    <main>
      <CompetitionHeader c={c} many={count > 1} />
      {children}
    </main>
  );
}
