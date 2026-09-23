import Link from 'next/link';
import { compWindow, fmtDay } from '@/lib/competition';
import Countdown from '../countdown';
import GaraTabs from './gara-tabs';
import { getT } from '@/lib/lingua';
import { fmtDist } from '@/lib/format';

// Testata comune alle pagine di una gara: nome, regole, sezioni e conto alla rovescia.
// «Tutte le gare» solo se l'utente ne vede più di una (many): con una sola l'elenco rimanda qui.
export default async function CompetitionHeader({ c, many }) {
  const t = await getT();
  const { start, end } = compWindow(c);
  return (
    <>
      {many && <p className="back"><Link href="/gare">{t('Tutte le gare')}</Link></p>}
      <h1>{c.name}</h1>
      <p className="comp-rules">
        {t(c.total_km ? 'Somma dei km di tutte le corse su strada con GPS dal {dal} al {al}.'
          : c.best_segment ? 'Miglior parziale di {dist}, corse su strada con GPS dal {dal} al {al}.'
          : 'Primi {dist} dalla partenza, corse su strada con GPS dal {dal} al {al}.', { dist: fmtDist(c.distance_m), dal: fmtDay(c.start_date), al: fmtDay(c.end_date) })}
      </p>
      <Countdown serverNow={Date.now()} start={start.getTime()} end={end.getTime()}
                 startLabel={fmtDay(c.start_date)} endLabel={fmtDay(c.end_date)} />
      {/* Nelle gare a km totali il confronto (tempi, progressi, stile) non ha senso: solo la classifica. */}
      {!c.total_km && <GaraTabs id={c.id} ariaLabel={t('Sezioni della gara')} labels={[t('Classifica'), t('Confronto')]} />}
    </>
  );
}
