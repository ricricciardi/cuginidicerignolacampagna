import { sql } from './db.js';
import { compWindow } from './competition.js';
import { firstKmSeconds, netElevation, rank } from './efforts.js';
import { ageGradePct } from './agegrade.js';

export async function loadCompetition(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) return null;
  const [c] = await sql`select id, name, km, start_date, end_date, age_grading from competitions where id = ${n}`;
  return c ?? null;
}

// La gara, se l'utente può vederla: chi partecipa, oppure l'amministratore. Altrimenti null.
export async function loadCompetitionFor(id, userId) {
  const c = await loadCompetition(id);
  if (!c) return null;
  const [ok] = await sql`select 1 from users u
                         where u.id = ${userId} and (u.is_admin or exists (
                           select 1 from competition_participants p
                           where p.competition_id = ${c.id} and p.user_id = u.id))`;
  return ok ? c : null;
}

// Quante gare vede un utente: quelle a cui partecipa (l'amministratore le vede tutte).
export async function visibleCompetitionCount(userId) {
  const [r] = await sql`select count(*)::int as n from competitions c
                        where exists (select 1 from users u where u.id = ${userId} and u.is_admin)
                           or exists (select 1 from competition_participants p
                                      where p.competition_id = c.id and p.user_id = ${userId})`;
  return r.n;
}

// Id dei partecipanti di una gara.
export async function participantIds(competitionId) {
  return (await sql`select user_id from competition_participants where competition_id = ${competitionId}`)
    .map((r) => r.user_id);
}

// Sostituisce i partecipanti di una gara con quelli indicati. Restituisce gli id aggiunti.
export async function setParticipants(competitionId, userIds) {
  const before = new Set(await participantIds(competitionId));
  await sql`delete from competition_participants where competition_id = ${competitionId}`;
  for (const id of userIds) {
    await sql`insert into competition_participants (competition_id, user_id)
              select ${competitionId}, id from users where id = ${id}
              on conflict do nothing`;
  }
  return userIds.filter((id) => !before.has(id));
}

// Corse valide per una gara: nel periodo, oltre i km della gara, dei partecipanti che hanno dato il consenso.
// Il tempo (time_s) si calcola dai parziali salvati: null se mancano.
export async function competitionRuns(c, userId = null) {
  const { start, end } = compWindow(c);
  const rows = await sql`
    select a.id, a.user_id, c.athlete_name, coalesce('/api/foto/' || u.id || '?v=' || u.photo_v, c.avatar_url) as avatar_url, u.sex, u.birth_date,
           a.distance_m, a.splits, a.start_date, a.start_date_local
    from activities a
    join strava_connections c on c.user_id = a.user_id
    join users u on u.id = a.user_id
    join competition_participants p on p.competition_id = ${c.id} and p.user_id = a.user_id
    where c.consent_at is not null
      and a.start_date >= ${start.toISOString()} and a.start_date < ${end.toISOString()}
      and a.distance_m > ${c.km * 1000}
      and (${userId}::int is null or a.user_id = ${userId})
    order by a.start_date asc`;
  return rows.map((r) => {
    const time_s = firstKmSeconds(r.splits, c.km);
    const pct = ageGradePct({
      sex: r.sex, birthDate: r.birth_date, runDate: r.start_date_local ?? r.start_date, km: c.km, timeS: time_s,
    });
    return { ...r, time_s, pct, elev_m: netElevation(r.splits, c.km) };
  });
}

// Partecipanti della gara che hanno collegato Strava e dato il consenso: compaiono in classifica.
export async function participants(c) {
  return sql`select c.user_id, c.athlete_name, coalesce('/api/foto/' || u.id || '?v=' || u.photo_v, c.avatar_url) as avatar_url, u.sex, u.birth_date
             from strava_connections c join users u on u.id = c.user_id
             join competition_participants p on p.competition_id = ${c.id} and p.user_id = u.id
             where c.consent_at is not null`;
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

// Classifica per età e sesso: miglior punteggio di ciascuno (più alto è meglio), a parità chi l'ha
// fatto prima. Chi non ha punteggio (dati mancanti o nessuna corsa) va in fondo in ordine alfabetico.
export function ageStandings(runs, people = []) {
  const best = new Map();
  const count = new Map();
  for (const r of runs) {
    if (r.time_s == null) continue;
    count.set(r.user_id, (count.get(r.user_id) ?? 0) + 1);
    if (r.pct == null) continue;
    const b = best.get(r.user_id);
    if (!b || r.pct > b.pct) best.set(r.user_id, r);
  }
  const ranked = [...best.values()]
    .sort((a, b) => b.pct - a.pct || new Date(a.start_date) - new Date(b.start_date))
    .map((r) => ({ ...r, reached: count.get(r.user_id) }));
  const done = new Set(ranked.map((r) => r.user_id));
  const waiting = people
    .filter((p) => !done.has(p.user_id))
    .map((p) => ({
      ...p, pct: null, time_s: null, reached: count.get(p.user_id) ?? 0,
      missing: !p.sex || !p.birth_date ? 'dati' : 'corse',
    }))
    .sort((a, b) => (a.athlete_name ?? '').localeCompare(b.athlete_name ?? '', 'it'));
  return [...ranked, ...waiting];
}
