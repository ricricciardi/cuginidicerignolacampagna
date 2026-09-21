// Tempo al passaggio dei primi N km, dalla partenza: somma dei primi N parziali al km
// (splits_metric di Strava), tempo trascorso con le pause, come il cronometro di una gara.
// I parziali sono tagliati a ~1000 m: tolleranza di 5 m per km sugli arrotondamenti GPS.
const TOLERANCE_PER_KM_M = 5;

export function firstKmSeconds(splits, km) {
  if (!Array.isArray(splits) || splits.length < km) return null;
  const first = splits.slice(0, km);
  const meters = first.reduce((t, x) => t + (x.m ?? 0), 0);
  if (meters < km * (1000 - TOLERANCE_PER_KM_M)) return null;
  return first.reduce((t, x) => t + (x.s ?? 0), 0);
}

// Parziali da salvare, dal dettaglio Strava: distanza, tempo trascorso e in movimento, dislivello.
// e è null (non assente) quando Strava non dà l'altitudine: così la corsa non viene riletta.
export const splitsFromDetail = (detail) =>
  (detail?.splits_metric ?? []).map((x) => ({
    m: x.distance, s: x.elapsed_time, mv: x.moving_time, e: x.elevation_difference ?? null,
  }));

// Dislivello netto sui primi N km, in metri: arrivo al km N meno partenza (negativo = discesa).
// Solo informativo, non cambia la classifica. null se mancano parziali o altitudine.
export function netElevation(splits, km) {
  if (!Array.isArray(splits) || splits.length < km) return null;
  const first = splits.slice(0, km);
  if (first.some((x) => typeof x.e !== 'number')) return null;
  return Math.round(first.reduce((t, x) => t + x.e, 0));
}

// Tempi di passaggio ogni 100 m, dagli stream di Strava (time e distance punto per punto).
// Restituisce [t100, t200, …] in secondi dalla partenza, pause comprese (come il cronometro),
// interpolando tra i due punti a cavallo di ogni traguardo. Fino all'ultimo 100 m completo.
export const MARK_STEP_M = 100;
export function marksFromStreams(time, distance) {
  if (!Array.isArray(time) || !Array.isArray(distance) || time.length !== distance.length || time.length < 2) return null;
  const marks = [];
  let i = 1;
  for (let target = MARK_STEP_M; target <= distance.at(-1); target += MARK_STEP_M) {
    while (i < distance.length && distance[i] < target) i++;
    if (i >= distance.length) break;
    const d0 = distance[i - 1], d1 = distance[i], t0 = time[i - 1], t1 = time[i];
    const f = d1 > d0 ? (target - d0) / (d1 - d0) : 0;
    marks.push(Math.round((t0 + f * (t1 - t0)) * 10) / 10);
  }
  return marks;
}

// Tempo al passaggio dei primi `meters` metri di una corsa: dai tempi ogni 100 m se ci sono,
// altrimenti (solo per distanze a km interi) dai parziali al km. null se non si può sapere.
export function timeAtDistance(run, meters) {
  const n = meters / MARK_STEP_M;
  if (Array.isArray(run.marks) && Number.isInteger(n) && run.marks.length >= n) return Math.round(run.marks[n - 1]);
  if (meters % 1000 === 0) return firstKmSeconds(run.splits, meters / 1000);
  return null;
}

// Tempo sul tratto più veloce lungo `meters` in qualunque punto della corsa (non solo dalla partenza):
// dai tempi ogni 100 m se ci sono, altrimenti (solo per distanze a km interi) dai parziali al km.
// Per le gare con il «miglior tratto» attivo. null se non si può sapere.
export function bestTimeOverDistance(run, meters) {
  const n = meters / MARK_STEP_M;
  if (Array.isArray(run.marks) && Number.isInteger(n) && run.marks.length >= n) {
    const at = (i) => (i < 0 ? 0 : run.marks[i]);
    let best = Infinity;
    for (let i = n - 1; i < run.marks.length; i++) best = Math.min(best, at(i) - at(i - n));
    return Math.round(best);
  }
  if (meters % 1000 !== 0) return null;
  const km = meters / 1000;
  const splits = Array.isArray(run.splits) ? run.splits : [];
  let best = null;
  for (let i = 0; i + km <= splits.length; i++) {
    const t = firstKmSeconds(splits.slice(i), km);
    if (t != null && (best == null || t < best)) best = t;
  }
  return best;
}

// Tempo di una corsa in una gara: miglior tratto o primi metri, secondo l'impostazione della gara.
export const raceTime = (run, c) =>
  (c.best_segment ? bestTimeOverDistance : timeAtDistance)(run, c.distance_m);

// Classifica: miglior tempo di ciascun utente; a parità vince chi l'ha fatto prima.
export function rank(bests) {
  return [...bests].sort(
    (a, b) => a.time_s - b.time_s || new Date(a.start_date) - new Date(b.start_date),
  );
}

// Per il grafico dei progressi: marca le corse che hanno migliorato il record personale.
export function markRecords(runsByDateAsc) {
  let best = Infinity;
  return runsByDateAsc.map((r) => {
    const isRecord = r.time_s != null && r.time_s < best;
    if (isRecord) best = r.time_s;
    return { ...r, isRecord };
  });
}
