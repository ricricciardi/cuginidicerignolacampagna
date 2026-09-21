// Age grading con le tabelle USATF MLDR 2025 (Alan Jones): confronta tempi di età e sesso diversi.
// Punteggio = standard per età, sesso e distanza / tempo, in percentuale. 100% = migliore prestazione
// al mondo per quell'età e quel sesso. Più alto è meglio.
import DATA from './agegrade-data.js';

// Le tabelle USATF partono dal miglio: sotto non c'è punteggio.
export const MIN_GRADE_M = 1609;
export const AGE_MIN = 5;
export const AGE_MAX = 100;

// Età compiuta nel giorno della corsa. Date come 'AAAA-MM-GG' (la corsa può avere anche l'ora).
export function ageOn(birthDate, runDate) {
  if (!birthDate || !runDate) return null;
  const [by, bm, bd] = birthDate.slice(0, 10).split('-').map(Number);
  const [ry, rm, rd] = String(runDate).slice(0, 10).split('-').map(Number);
  let age = ry - by;
  if (rm < bm || (rm === bm && rd < bd)) age--;
  return age;
}

// Standard (secondi) per sesso, età e distanza. Sulle distanze delle tabelle si usa il valore;
// in mezzo si interpola con il metodo ufficiale 2025: u = ln(d/d1) / ln(d2/d1), S = S1(1-u) + S2·u.
export function standardSeconds(sex, age, km) {
  const t = DATA[sex];
  const f = t?.factors[age];
  if (!f) return null;
  const S = (i) => t.distances[i].openSec / f[i];
  const d = t.distances.map((x) => x.km);
  const exact = d.findIndex((x) => Math.abs(x - km) < 1e-6);
  if (exact !== -1) return S(exact);
  const i = d.findIndex((x, k) => k < d.length - 1 && x < km && km < d[k + 1]);
  if (i === -1) return null; // fuori dalle distanze coperte (sotto 1 miglio o sopra 200 km)
  const u = Math.log(km / d[i]) / Math.log(d[i + 1] / d[i]);
  return S(i) * (1 - u) + S(i + 1) * u;
}

// Punteggio in percentuale, oppure null se mancano dati o la distanza/età non è coperta.
export function ageGradePct({ sex, birthDate, runDate, km, timeS }) {
  if (!sex || !timeS) return null;
  const age = ageOn(birthDate, runDate);
  if (age == null || age < AGE_MIN || age > AGE_MAX) return null;
  const std = standardSeconds(sex, age, km);
  return std ? (std / timeS) * 100 : null;
}

export const fmtPct = (p) =>
  p == null ? '—' : `${p.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
