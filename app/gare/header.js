import { compWindow, fmtDay } from '@/lib/competition';
import Countdown from '../countdown';

// Testata comune alle pagine di una gara: nome, regole, sezioni e conto alla rovescia.
export default function CompetitionHeader({ c, current }) {
  const { start, end } = compWindow(c);
  return (
    <>
      <p className="back"><a href="/gare">Tutte le gare</a></p>
      <h1>{c.name}</h1>
      <p className="comp-rules">
        Primi {c.km}&nbsp;km dalla partenza, corse su strada con GPS dal {fmtDay(c.start_date)} al {fmtDay(c.end_date)}.
      </p>
      <Countdown serverNow={Date.now()} start={start.getTime()} end={end.getTime()}
                 startLabel={fmtDay(c.start_date)} endLabel={fmtDay(c.end_date)} />
      <nav className="subtabs" aria-label="Sezioni della gara">
        <a href={`/gare/${c.id}`} aria-current={current === 'classifica' ? 'page' : undefined}>Classifica</a>
        <a href={`/gare/${c.id}/confronto`} aria-current={current === 'confronto' ? 'page' : undefined}>Confronto</a>
      </nav>
    </>
  );
}
