// Regole di selezione: quali attività Strava sono corse su strada valide.

// Traccia GPS presente: coordinate di partenza o percorso registrato.
// Esclude sia le attività inserite a mano sia quelle registrate senza GPS.
function hasGps(a) {
  const hasStart = Array.isArray(a.start_latlng) && a.start_latlng.length === 2;
  const hasTrack = Boolean(a.map?.summary_polyline);
  return hasStart || hasTrack;
}

// Corsa o camminata su strada: sport_type Run o Walk, escluso tapis roulant (trainer).
// TrailRun, VirtualRun e Hike hanno sport_type diversi e restano fuori.
const SPORTS = new Set(['Run', 'Walk']);
export function isRoadGpsRun(a) {
  const sport = a.sport_type ?? a.type;
  return SPORTS.has(sport) && !a.trainer && !a.manual && hasGps(a);
}
