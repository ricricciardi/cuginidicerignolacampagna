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
