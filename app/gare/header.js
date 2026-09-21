import { compWindow, fmtDay } from '@/lib/competition';
import Countdown from '../countdown';
import SegmentedLinks from '../segmented-links';
import { visibleCompetitionCount } from '@/lib/standings';

// Testata comune alle pagine di una gara: nome, regole, sezioni e conto alla rovescia.
// «Tutte le gare» solo se l'utente ne vede più di una: con una sola l'elenco rimanda qui.
export default async function CompetitionHeader({ c, current, userId }) {
  const many = (await visibleCompetitionCount(userId)) > 1;
  const { start, end } = compWindow(c);
  return (
    <>
      {many && <p className="back"><a href="/gare">Tutte le gare</a></p>}
      <h1>{c.name}</h1>
      <p className="comp-rules">
        Primi {c.km}&nbsp;km dalla partenza, corse su strada con GPS dal {fmtDay(c.start_date)} al {fmtDay(c.end_date)}.
      </p>
      <Countdown serverNow={Date.now()} start={start.getTime()} end={end.getTime()}
                 startLabel={fmtDay(c.start_date)} endLabel={fmtDay(c.end_date)} />
      <SegmentedLinks className="subtabs" label="Sezioni della gara" scroll={false} items={[
        { href: `/gare/${c.id}`, label: 'Classifica', current: current === 'classifica' },
        { href: `/gare/${c.id}/confronto`, label: 'Confronto', current: current === 'confronto' },
      ]} />
    </>
  );
}
