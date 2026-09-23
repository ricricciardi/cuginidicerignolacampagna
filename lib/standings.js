import { sql } from './db.js';
import { compWindow } from './competition.js';
import { raceTime, netElevation, rank } from './efforts.js';
import { ageGradePct } from './agegrade.js';

export async function loadCompetition(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) return null;
  const [c] = await sql`select id, name, distance_m, start_date, end_date, age_grading, best_segment, total_km from competitions where id = ${n}`;
  return c ?? null;
}

// La gara, se l'utente può vederla: chi partecipa, oppure l'amministratore. Altrimenti null.
export async function loadCompetitionFor(id, userId) {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) return null;
  const [c] = await sql`select c.id, c.name, c.distance_m, c.start_date, c.end_date, c.age_grading, c.best_segment, c.total_km from competitions c
                        where c.id = ${n} and exists (
                          select 1 from users u where u.id = ${userId} and (u.is_admin or exists (
                            select 1 from competition_participants p where p.competition_id = c.id and p.user_id = u.id)))`;
  return c ?? null;
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
// Il tempo (time_s) si calcola dai passaggi o dai parziali salvati: null se mancano.
// Le gare a km totali non hanno tempi: nessuna corsa (la classifica viene da periodActivities).
export async function competitionRuns(c, userId = null) {
  if (c.total_km) return [];
  const { start, end } = compWindow(c);
  const rows = await sql`
    select a.id, a.user_id, c.athlete_name, coalesce('/api/foto/' || u.id || '?v=' || u.photo_v, c.avatar_url) as avatar_url, u.sex, u.birth_date,
           a.distance_m, a.splits, a.marks, a.start_date, a.start_date_local
    from activities a
    join strava_connections c on c.user_id = a.user_id
    join users u on u.id = a.user_id
    join competition_participants p on p.competition_id = ${c.id} and p.user_id = a.user_id
    where c.consent_at is not null
      and a.start_date >= ${start.toISOString()} and a.start_date < ${end.toISOString()}
      and a.distance_m > ${c.distance_m}
      and (${userId}::int is null or a.user_id = ${userId})
    order by a.start_date asc`;
  return rows.map((r) => {
    const time_s = raceTime(r, c);
    const pct = ageGradePct({
      sex: r.sex, birthDate: r.birth_date, runDate: r.start_date_local ?? r.start_date, km: c.distance_m / 1000, timeS: time_s,
    });
    // Dislivello dai parziali al km: solo per distanze a km interi misurate dalla partenza.
    const elev_m = !c.best_segment && c.distance_m % 1000 === 0 ? netElevation(r.splits, c.distance_m / 1000) : null;
    return { ...r, time_s, pct, elev_m };
  });
}

// Tutte le corse del periodo dei partecipanti, anche più corte della gara: per il confronto sull'impegno
// e per le gare a km totali. Con userId solo quelle di quell'utente.
export async function periodActivities(c, userId = null) {
  const { start, end } = compWindow(c);
  return sql`
    select a.id, a.user_id, a.distance_m, a.moving_time_s, a.start_date, a.start_date_local
    from activities a
    join strava_connections s on s.user_id = a.user_id
    join competition_participants p on p.competition_id = ${c.id} and p.user_id = a.user_id
    where s.consent_at is not null
      and a.start_date >= ${start.toISOString()} and a.start_date < ${end.toISOString()}
      and (${userId}::int is null or a.user_id = ${userId})
    order by a.start_date asc`;
}

// Partecipanti della gara che hanno collegato Strava e dato il consenso: compaiono in classifica.
export async function participants(c) {
  return sql`select c.user_id, c.athlete_name, coalesce('/api/foto/' || u.id || '?v=' || u.photo_v, c.avatar_url) as avatar_url, u.sex, u.birth_date
             from strava_connections c join users u on u.id = c.user_id
             join competition_participants p on p.competition_id = ${c.id} and p.user_id = u.id
             where c.consent_at is not null`;
}

// Classifica delle gare a km totali: somma dei metri di tutte le corse del periodo, più km in testa.
// Chi non ha ancora corso va in fondo in ordine alfabetico. activities: da periodActivities.
export function kmStandings(activities, people = []) {
  const by = new Map(people.map((p) => [p.user_id, { ...p, meters: 0, seconds: 0, reached: 0 }]));
  for (const a of activities) {
    const e = by.get(a.user_id);
    if (!e) continue;
    e.meters += a.distance_m;
    e.seconds += a.moving_time_s;
    e.reached++;
  }
  return [...by.values()].sort((a, b) => b.meters - a.meters ||
    (a.athlete_name ?? '').localeCompare(b.athlete_name ?? '', 'it'));
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
