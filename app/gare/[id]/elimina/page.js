import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin';
import { loadCompetition } from '@/lib/standings';
import { competitionRuns } from '@/lib/standings';
import { fmtDay, statusLine } from '@/lib/competition';
import { getT } from '@/lib/lingua';

export default async function Elimina({ params }) {
  await requireAdminPage();
  const t = await getT();
  const c = await loadCompetition((await params).id);
  if (!c) notFound();
  const runs = await competitionRuns(c);
  const conTempo = runs.filter((r) => r.time_s != null).length;

  return (
    <main>
      <p className="back"><Link href="/gare/impostazioni">{t('Torna alle impostazioni')}</Link></p>
      <h1>{t('Eliminare questa gara?')}</h1>
      <div className="notice error">
        <strong>{c.name}</strong><br />
        {t('{km} km, dal {dal} al {al}', { km: c.km, dal: fmtDay(c.start_date), al: fmtDay(c.end_date) })}. {statusLine(c, new Date(), t)}.
      </div>
      <p>
        {t('Spariscono la gara, la sua classifica e il suo confronto. Le corse restano salvate e continuano a valere per le altre gare.')}
        {conTempo > 0 && ' ' + t('In questa gara ci sono {n} tempi.', { n: conTempo })}
      </p>
      <p>{t('L\'operazione non si può annullare.')}</p>
      <form className="stack" method="post" action={`/api/gare/${c.id}/elimina`}>
        <button className="danger" type="submit">{t('Elimina la gara')}</button>
      </form>
      <p className="switch"><Link href="/gare/impostazioni">{t('Annulla')}</Link></p>
    </main>
  );
}
