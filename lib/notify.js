import { sql } from './db.js';
import { phase, compWindow } from './competition.js';
import { competitionRuns, participants, standings } from './standings.js';
import { standingsChanges } from './standings-diff.js';
import { sendToUsers } from './push.js';

const DAY = 86_400_000;
const romeToday = (now = new Date()) => now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });

// Gare di cui confrontare la classifica: in corso, o chiuse da meno di 3 giorni
// (le corse fatte entro la chiusura possono arrivare da Strava in ritardo).
async function watchedCompetitions(now = new Date()) {
  const comps = await sql`select id, name, km, start_date, end_date from competitions`;
  return comps.filter((c) => phase(c, now) === 'running' ||
    (phase(c, now) === 'over' && now - compWindow(c).end < 3 * DAY));
}

// Fotografia delle classifiche a tempo: { compId: { comp, rows: Map userId -> { pos, time_s, name } } }.
export async function standingsSnapshot() {
  const snap = {};
  for (const c of await watchedCompetitions()) {
    const rows = standings(await competitionRuns(c), await participants(c)).filter((r) => r.time_s != null);
    snap[c.id] = { comp: c, rows: new Map(rows.map((r, i) => [r.user_id, { pos: i + 1, time_s: r.time_s, name: r.athlete_name }])) };
  }
  return snap;
}

// Record e sorpassi tra due fotografie.
export async function notifyStandings(before, after) {
  let sent = 0;
  for (const [id, { comp, rows }] of Object.entries(after)) {
    for (const n of standingsChanges(comp, before[id]?.rows ?? new Map(), rows)) {
      sent += await sendToUsers([n.userId], { title: n.title, body: n.body, url: `/gare/${comp.id}`, tag: `gara-${comp.id}` });
    }
  }
  return sent;
}

// Una volta sola per chiave (es. «parte oggi»): true se è la prima volta.
async function once(key) {
  const rows = await sql`insert into notifications_sent (key) values (${key}) on conflict do nothing returning key`;
  return rows.length > 0;
}

async function participantIdsOf(compId) {
  return (await sql`select user_id from competition_participants where competition_id = ${compId}`).map((r) => r.user_id);
}

// Gare che partono o finiscono oggi (ora italiana), ai loro partecipanti.
export async function notifyRaceDays(now = new Date()) {
  const today = romeToday(now);
  const comps = await sql`select id, name, km, start_date, end_date from competitions
                          where start_date = ${today} or end_date = ${today}`;
  let sent = 0;
  for (const c of comps) {
    const ids = await participantIdsOf(c.id);
    if (c.start_date === today && await once(`start:${c.id}:${today}`)) {
      sent += await sendToUsers(ids, { title: `Parte oggi ${c.name}`,
        body: `Primi ${c.km} km, fino al ${c.end_date.split('-').reverse().join('/')}. In bocca al lupo!`, url: `/gare/${c.id}`, tag: `gara-${c.id}` });
    }
    if (c.end_date === today && await once(`end:${c.id}:${today}`)) {
      sent += await sendToUsers(ids, { title: `Ultimo giorno per ${c.name}`,
        body: 'Hai tempo fino a mezzanotte per migliorare il tuo tempo.', url: `/gare/${c.id}`, tag: `gara-${c.id}` });
    }
  }
  return sent;
}

// Nuovi partecipanti di una gara (tranne chi li ha aggiunti).
export async function notifyAdded(comp, userIds, byUserId) {
  const ids = userIds.filter((id) => id !== byUserId);
  if (!ids.length) return 0;
  return sendToUsers(ids, { title: `Sei in gara: ${comp.name}`,
    body: `L'amministratore ti ha aggiunto a ${comp.name}: primi ${comp.km} km.`, url: `/gare/${comp.id}`, tag: `gara-${comp.id}` });
}
