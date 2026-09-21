import Link from 'next/link';
import { compWindow, fmtDay } from '@/lib/competition';
import Countdown from '../countdown';
import SegmentedLinks from '../segmented-links';
import { getT } from '@/lib/lingua';
import { fmtDist } from '@/lib/format';

// Testata comune alle pagine di una gara: nome, regole, sezioni e conto alla rovescia.
// «Tutte le gare» solo se l'utente ne vede più di una (many): con una sola l'elenco rimanda qui.
export default async function CompetitionHeader({ c, current, many }) {
  const t = await getT();
  const { start, end } = compWindow(c);
  return (
    <>
      {many && <p className="back"><Link href="/gare">{t('Tutte le gare')}</Link></p>}
      <h1>{c.name}</h1>
      <p className="comp-rules">
        {t(c.best_segment ? 'Miglior parziale di {dist}, corse su strada con GPS dal {dal} al {al}.' : 'Primi {dist} dalla partenza, corse su strada con GPS dal {dal} al {al}.', { dist: fmtDist(c.distance_m), dal: fmtDay(c.start_date), al: fmtDay(c.end_date) })}
      </p>
      <Countdown serverNow={Date.now()} start={start.getTime()} end={end.getTime()}
                 startLabel={fmtDay(c.start_date)} endLabel={fmtDay(c.end_date)} />
      <SegmentedLinks className="subtabs" label="Sezioni della gara" ariaLabel={t('Sezioni della gara')} scroll={false} items={[
        { href: `/gare/${c.id}`, label: t('Classifica'), current: current === 'classifica' },
        { href: `/gare/${c.id}/confronto`, label: t('Confronto'), current: current === 'confronto' },
      ]} />
    </>
  );
}
