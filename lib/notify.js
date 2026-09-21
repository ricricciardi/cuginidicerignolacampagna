import { sql } from './db.js';
import { phase, compWindow } from './competition.js';
import { competitionRuns, participants, standings } from './standings.js';
import { standingsChanges } from './standings-diff.js';
import { sendToUsers } from './push.js';
import { fmtDist } from './format.js';

const DAY = 86_400_000;
const romeToday = (now = new Date()) => now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });

// Gare di cui confrontare la classifica: in corso, o chiuse da meno di 3 giorni
// (le corse fatte entro la chiusura possono arrivare da Strava in ritardo).
async function watchedCompetitions(now = new Date()) {
  const comps = await sql`select id, name, distance_m, start_date, end_date from competitions`;
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
    // Il testo si costruisce nella lingua di ciascuno: la funzione riceve la sua t.
    for (const n of standingsChanges(comp, before[id]?.rows ?? new Map(), rows)) {
      sent += await sendToUsers([n.userId], (t) => {
        const m = standingsChanges(comp, before[id]?.rows ?? new Map(), rows, t).find((x) => x.userId === n.userId);
        return { title: m.title, body: m.body, url: `/gare/${comp.id}`, tag: `gara-${comp.id}` };
      });
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
  const comps = await sql`select id, name, distance_m, start_date, end_date from competitions
                          where start_date = ${today} or end_date = ${today}`;
  let sent = 0;
  for (const c of comps) {
    const ids = await participantIdsOf(c.id);
    if (c.start_date === today && await once(`start:${c.id}:${today}`)) {
      sent += await sendToUsers(ids, (t) => ({ title: t('Parte oggi {gara}', { gara: c.name }),
        body: t('Primi {dist}, fino al {al}. In bocca al lupo!', { dist: fmtDist(c.distance_m), al: c.end_date.split('-').reverse().join('/') }), url: `/gare/${c.id}`, tag: `gara-${c.id}` }));
    }
    if (c.end_date === today && await once(`end:${c.id}:${today}`)) {
      sent += await sendToUsers(ids, (t) => ({ title: t('Ultimo giorno per {gara}', { gara: c.name }),
        body: t('Hai tempo fino a mezzanotte per migliorare il tuo tempo.'), url: `/gare/${c.id}`, tag: `gara-${c.id}` }));
    }
  }
  return sent;
}

// Nuovi partecipanti di una gara (tranne chi li ha aggiunti).
export async function notifyAdded(comp, userIds, byUserId) {
  const ids = userIds.filter((id) => id !== byUserId);
  if (!ids.length) return 0;
  return sendToUsers(ids, (t) => ({ title: t('Sei in gara: {gara}', { gara: comp.name }),
    body: t('L\'amministratore ti ha aggiunto a {gara}: primi {dist}.', { gara: comp.name, dist: fmtDist(comp.distance_m) }), url: `/gare/${comp.id}`, tag: `gara-${comp.id}` }));
}

// Auguri di compleanno, solo al festeggiato (la data di nascita non si mostra agli altri).
// Una volta all'anno; chi è nato il 29 febbraio li riceve il 28 negli anni non bisestili.
export async function notifyBirthdays(now = new Date()) {
  const today = romeToday(now);
  const [year, mmdd] = [today.slice(0, 4), today.slice(5)];
  const leap = new Date(Date.UTC(Number(year), 1, 29)).getUTCMonth() === 1;
  const days = mmdd === '02-28' && !leap ? ['02-28', '02-29'] : [mmdd];
  const people = await sql`select u.id, u.birth_date, c.athlete_name from users u
                           left join strava_connections c on c.user_id = u.id
                           where u.birth_date is not null`;
  let sent = 0;
  for (const p of people.filter((x) => days.includes(x.birth_date.slice(5)))) {
    if (!(await once(`bday:${p.id}:${year}`))) continue;
    const first = (p.athlete_name ?? '').split(/\s+/)[0];
    sent += await sendToUsers([p.id], (t) => ({
      title: first ? t('Tanti auguri {nome}! 🎂', { nome: first }) : t('Tanti auguri! 🎂'),
      body: t('Buon compleanno dai Cuginidicerignolacampagna. Oggi una corsa è d\'obbligo, anche piano. #andràtuttobene'),
      url: '/gare', tag: 'compleanno',
    }));
  }
  return sent;
}
