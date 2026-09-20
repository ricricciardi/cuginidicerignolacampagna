import { sql } from './db.js';
import { compWindow } from './competition.js';
import { firstKmSeconds, rank } from './efforts.js';

export async function loadCompetition(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) return null;
  const [c] = await sql`select id, name, km, start_date, end_date from competitions where id = ${n}`;
  return c ?? null;
}

// Corse valide per una gara: nel periodo, oltre i km della gara, di chi ha dato il consenso.
// Il tempo (time_s) si calcola dai parziali salvati: null se mancano.
export async function competitionRuns(c, userId = null) {
  const { start, end } = compWindow(c);
  const rows = await sql`
    select a.id, a.user_id, c.athlete_name, c.avatar_url, a.distance_m, a.splits, a.start_date, a.start_date_local
    from activities a
    join strava_connections c on c.user_id = a.user_id
    where c.consent_at is not null
      and a.start_date >= ${start.toISOString()} and a.start_date < ${end.toISOString()}
      and a.distance_m > ${c.km * 1000}
      and (${userId}::int is null or a.user_id = ${userId})
    order by a.start_date asc`;
  return rows.map((r) => ({ ...r, time_s: firstKmSeconds(r.splits, c.km) }));
}

// Tutti quelli che hanno collegato Strava e dato il consenso: partecipano a ogni gara.
export async function participants() {
  return sql`select user_id, athlete_name, avatar_url from strava_connections where consent_at is not null`;
}

// Classifica: prima chi ha un tempo, in ordine di tempo; poi chi non ne ha ancora,
// in ordine alfabetico. Per loro posizione e tempo sono un trattino.
export function standings(runs, people = []) {
  const timed = bests(runs);
  const done = new Set(timed.map((r) => r.user_id));
  const waiting = people
    .filter((p) => !done.has(p.user_id))
    .map((p) => ({ ...p, time_s: null, reached: 0 }))
    .sort((a, b) => (a.athlete_name ?? '').localeCompare(b.athlete_name ?? '', 'it'));
  return [...timed, ...waiting];
}

function bests(runs) {
  const best = new Map();
  const count = new Map();
  for (const r of runs) {
    if (r.time_s == null) continue;
    count.set(r.user_id, (count.get(r.user_id) ?? 0) + 1);
    const b = best.get(r.user_id);
    if (!b || r.time_s < b.time_s) best.set(r.user_id, r);
  }
  return rank([...best.values()]).map((r) => ({ ...r, reached: count.get(r.user_id) }));
}
