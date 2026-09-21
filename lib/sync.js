import { sql } from './db.js';
import { getValidAccessToken, fetchEligibleRuns, fetchActivity, fetchStreams, fetchAthlete, StravaError } from './strava.js';
import { splitsFromDetail, marksFromStreams } from './efforts.js';
import { compWindow, phase } from './competition.js';

export const DETAIL_BATCH = 25; // chiamate a Strava per utente per ogni aggiornamento (dettagli e stream)

// Cosa leggere da Strava: le corse che possono servire ad almeno una gara già partita.
// Periodo = unione dei periodi di quelle gare; distanza oltre i km della gara più corta.
export async function syncScope(now = new Date()) {
  const comps = (await sql`select id, distance_m, start_date, end_date from competitions`)
    .filter((c) => phase(c, now) !== 'before');
  if (!comps.length) return null;
  const windows = comps.map(compWindow);
  return {
    comps,
    after: Math.floor(Math.min(...windows.map((w) => w.start.getTime())) / 1000) - 1,
    before: Math.floor(Math.max(...windows.map((w) => w.end.getTime())) / 1000),
    minM: Math.min(...comps.map((c) => c.distance_m)),
  };
}

// Legge da Strava le corse nuove di un utente e le salva. Usata dal pulsante e dall'aggiornamento notturno.
// Esito: { saved, pending, error } con error in: null | 'rate' | 'revoked' | 'no_race'.
export async function syncUser(conn, scope, maxDetails = DETAIL_BATCH) {
  if (!scope) return { saved: 0, pending: 0, error: 'no_race' };
  let token, runs;
  try {
    token = await getValidAccessToken(conn);
    // Nome e foto si aggiornano a ogni lettura: se il cugino li cambia su Strava, cambiano anche qui.
    const a = await fetchAthlete(token);
    const name = [a.firstname, a.lastname].filter(Boolean).join(' ');
    await sql`update strava_connections
              set athlete_name = ${name || null}, avatar_url = ${a.profile_medium || a.profile || null}
              where user_id = ${conn.user_id}`;
    runs = (await fetchEligibleRuns(token, scope.after, scope.before))
      .filter((a) => a.distance > scope.minM)
      .filter((a) => {
        const t = new Date(a.start_date).getTime() / 1000;
        return t > scope.after && t < scope.before;
      });
  } catch (e) {
    if (e instanceof StravaError && e.status === 429) return { saved: 0, pending: 0, error: 'rate' };
    // DA DECIDERE: 401/400 = permesso revocato su Strava.
    if (e instanceof StravaError && (e.status === 401 || e.status === 400)) {
      await sql`update strava_connections set last_sync_error = 'revoked' where user_id = ${conn.user_id}`;
      return { saved: 0, pending: 0, error: 'revoked' };
    }
    throw e;
  }

  // Le corse già salvate non si rileggono: lo storico resta com'era al primo salvataggio.
  // DA DECIDERE: corse cancellate o modificate su Strava dopo il salvataggio.
  const known = new Set((await sql`select id from activities where user_id = ${conn.user_id}`)
    .map((r) => String(r.id)));
  const fresh = runs.filter((a) => !known.has(String(a.id)));

  // Ogni corsa nuova costa due chiamate: dettaglio (parziali al km, dislivello) e stream (tempi
  // ogni 100 m). Le chiamate avanzate completano le corse salvate prima (senza stream o senza
  // dislivello), dalle più recenti. Tutto dentro lo stesso budget per utente.
  let budget = maxDetails;
  let saved = 0;
  let error = null;
  // Senza stream utilizzabili si salva [] (non null), così la corsa non viene riletta ogni volta.
  const streamMarks = async (id) => {
    const st = await fetchStreams(token, id);
    return JSON.stringify(marksFromStreams(st.time, st.distance) ?? []);
  };
  for (const a of fresh) {
    if (budget < 2) break;
    try {
      const splits = JSON.stringify(splitsFromDetail(await fetchActivity(token, a.id)));
      const marks = await streamMarks(a.id);
      budget -= 2;
      await sql`insert into activities
                  (id, user_id, name, distance_m, moving_time_s, elapsed_time_s, splits, marks,
                   start_date, start_date_local)
                values (${a.id}, ${conn.user_id}, ${a.name}, ${a.distance}, ${a.moving_time},
                        ${a.elapsed_time}, ${splits}::jsonb, ${marks}::jsonb, ${a.start_date}, ${a.start_date_local})
                on conflict (id) do nothing`;
      saved++;
    } catch (e) {
      if (e instanceof StravaError && e.status === 429) { error = 'rate'; break; }
      throw e;
    }
  }
  if (!error && budget > 0) {
    const old = await sql`select id, marks is null as no_marks,
                                 (jsonb_array_length(splits) > 0 and not (splits->0 ? 'e')) as no_elev
                          from activities
                          where user_id = ${conn.user_id}
                            and (marks is null or (jsonb_array_length(splits) > 0 and not (splits->0 ? 'e')))
                          order by start_date desc limit ${budget}`;
    for (const r of old) {
      if (budget <= 0) break;
      try {
        if (r.no_marks) {
          await sql`update activities set marks = ${await streamMarks(r.id)}::jsonb where id = ${r.id}`;
          budget--;
        }
        if (r.no_elev && budget > 0) {
          const splits = JSON.stringify(splitsFromDetail(await fetchActivity(token, r.id)));
          await sql`update activities set splits = ${splits}::jsonb where id = ${r.id}`;
          budget--;
        }
      } catch (e) {
        if (e instanceof StravaError && e.status === 429) { error = 'rate'; break; }
        if (e instanceof StravaError && e.status === 404) { // cancellata su Strava: non riprovare
          await sql`update activities set marks = '[]'::jsonb where id = ${r.id} and marks is null`;
          continue;
        }
        throw e;
      }
    }
  }
  const pending = fresh.length - saved;
  if (!error) {
    await sql`update strava_connections set last_synced_at = now(), last_sync_error = null
              where user_id = ${conn.user_id}`;
  }
  return { saved, pending, error };
}
