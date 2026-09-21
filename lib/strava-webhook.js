import { createHash } from 'node:crypto';
import { sql } from './db.js';
import { getValidAccessToken, fetchActivity, fetchStreams, fetchAthlete, StravaError } from './strava.js';
import { isRoadGpsRun } from './filter.js';
import { splitsFromDetail, marksFromStreams } from './efforts.js';
import { syncScope } from './sync.js';
import { standingsSnapshot, notifyStandings, notifyNewTimes } from './notify.js';

// Avvisi in tempo reale da Strava (webhook): corse create, modificate, cancellate e accessi revocati.
// Strava non firma gli avvisi, quindi non ci si fida del contenuto: prima di salvare o cancellare
// qualcosa si ricontrolla sempre su Strava con il token del cugino. Un avviso falso non fa danni.

// Parola di verifica dell'iscrizione, ricavata da CRON_SECRET (nessuna variabile in più da impostare).
export const webhookVerifyToken = () =>
  createHash('sha256').update(`strava-webhook:${process.env.CRON_SECRET ?? ''}`).digest('hex').slice(0, 32);

const gone = (e) => e instanceof StravaError && (e.status === 404 || e.status === 403);
const revoked = (e) => e instanceof StravaError && (e.status === 401 || e.status === 400);

async function deleteRun(id) {
  await sql`delete from activities where id = ${id}`;
}

// Corsa creata o modificata: la si rilegge da Strava e si decide se tenerla, aggiornarla o toglierla.
async function refreshRun(conn, token, id, isNew) {
  let a;
  try {
    a = await fetchActivity(token, id);
  } catch (e) {
    if (gone(e)) { await deleteRun(id); return 'tolta'; }
    throw e;
  }
  const scope = await syncScope();
  const t = new Date(a.start_date).getTime() / 1000;
  const valid = scope && isRoadGpsRun(a) && a.distance > scope.minM && t > scope.after && t < scope.before;
  if (!valid) { await deleteRun(id); return 'non valida'; }

  const st = await fetchStreams(token, id);
  const splits = JSON.stringify(splitsFromDetail(a));
  const marks = JSON.stringify(marksFromStreams(st.time, st.distance) ?? []);
  const before = await standingsSnapshot();
  await sql`insert into activities
              (id, user_id, name, distance_m, moving_time_s, elapsed_time_s, splits, marks, start_date, start_date_local)
            values (${a.id}, ${conn.user_id}, ${a.name}, ${a.distance}, ${a.moving_time}, ${a.elapsed_time},
                    ${splits}::jsonb, ${marks}::jsonb, ${a.start_date}, ${a.start_date_local})
            on conflict (id) do update set
              name = excluded.name, distance_m = excluded.distance_m, moving_time_s = excluded.moving_time_s,
              elapsed_time_s = excluded.elapsed_time_s, splits = excluded.splits, marks = excluded.marks,
              start_date = excluded.start_date, start_date_local = excluded.start_date_local, synced_at = now()`;
  // Record, sorpassi e «Nuovo tempo» subito, come dopo «Aggiorna adesso».
  await notifyStandings(before, await standingsSnapshot());
  if (isNew) await notifyNewTimes(conn.user_id, [String(a.id)]);
  return isNew ? 'salvata' : 'aggiornata';
}

// Accesso revocato su Strava: stessa pulizia dello «Scollega» del sito (se Strava lo conferma).
async function athleteRevoked(conn) {
  try {
    await fetchAthlete(await getValidAccessToken(conn));
    return 'ancora autorizzato';
  } catch (e) {
    if (!revoked(e)) throw e;
  }
  await sql`delete from activities where user_id = ${conn.user_id}`;
  await sql`delete from strava_connections where user_id = ${conn.user_id}`;
  return 'scollegato';
}

// Un avviso: { object_type, aspect_type, object_id, owner_id, updates }.
export async function handleStravaEvent(ev) {
  const [conn] = await sql`select * from strava_connections where athlete_id = ${ev.owner_id}`;
  if (!conn) return 'atleta sconosciuto';
  if (ev.object_type === 'athlete') {
    return ev.updates?.authorized === 'false' ? athleteRevoked(conn) : 'ignorato';
  }
  if (ev.object_type !== 'activity') return 'ignorato';

  let token;
  try {
    token = await getValidAccessToken(conn);
  } catch (e) {
    // Un avviso su una corsa non cancella mai l'account: si segna solo «da ricollegare», come fa
    // l'aggiornamento del mattino. La pulizia completa c'è solo con l'avviso di revoca verificato.
    if (revoked(e)) {
      await sql`update strava_connections set last_sync_error = 'revoked' where user_id = ${conn.user_id}`;
      return 'token non valido';
    }
    throw e;
  }
  const [known] = await sql`select 1 from activities where id = ${ev.object_id} and user_id = ${conn.user_id}`;
  if (ev.aspect_type === 'delete') {
    if (!known) return 'non salvata';
    // Cancellata davvero? Se Strava la trova ancora, l'avviso era sbagliato: non si tocca.
    try {
      await fetchActivity(token, ev.object_id);
      return 'ancora su Strava';
    } catch (e) {
      if (!gone(e)) throw e;
    }
    await deleteRun(ev.object_id);
    return 'cancellata';
  }
  // create / update (per le modifiche si guardano solo le corse già salvate o che potrebbero entrare)
  return refreshRun(conn, token, ev.object_id, ev.aspect_type === 'create' || !known);
}
