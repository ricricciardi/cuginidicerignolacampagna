import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin';
import { loadCompetition } from '@/lib/standings';
import { competitionRuns } from '@/lib/standings';
import { fmtDay, statusLine } from '@/lib/competition';

export default async function Elimina({ params }) {
  await requireAdminPage();
  const c = await loadCompetition((await params).id);
  if (!c) notFound();
  const runs = await competitionRuns(c);
  const conTempo = runs.filter((r) => r.time_s != null).length;

  return (
    <main>
      <p className="back"><a href="/gare/impostazioni">Torna alle impostazioni</a></p>
      <h1>Eliminare questa gara?</h1>
      <div className="notice error">
        <strong>{c.name}</strong><br />
        {c.km} km, dal {fmtDay(c.start_date)} al {fmtDay(c.end_date)}. {statusLine(c)}.
      </div>
      <p>
        Spariscono la gara, la sua classifica e il suo confronto. Le corse restano salvate
        e continuano a valere per le altre gare.
        {conTempo > 0 && ` In questa gara ci sono ${conTempo} tempi.`}
      </p>
      <p>L&apos;operazione non si può annullare.</p>
      <form className="stack" method="post" action={`/api/gare/${c.id}/elimina`}>
        <button className="danger" type="submit">Elimina la gara</button>
      </form>
      <p className="switch"><a href="/gare/impostazioni">Annulla</a></p>
    </main>
  );
}
