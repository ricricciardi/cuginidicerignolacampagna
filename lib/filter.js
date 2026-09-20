// Regole di selezione: quali attività Strava sono corse su strada valide.

// Traccia GPS presente: coordinate di partenza o percorso registrato.
// Esclude sia le attività inserite a mano sia quelle registrate senza GPS.
function hasGps(a) {
  const hasStart = Array.isArray(a.start_latlng) && a.start_latlng.length === 2;
  const hasTrack = Boolean(a.map?.summary_polyline);
  return hasStart || hasTrack;
}

// Solo corsa su strada: sport_type Run, escluso tapis roulant (trainer).
// TrailRun e VirtualRun hanno sport_type diversi e restano fuori.
export function isRoadGpsRun(a) {
  const sport = a.sport_type ?? a.type;
  return sport === 'Run' && !a.trainer && !a.manual && hasGps(a);
}
