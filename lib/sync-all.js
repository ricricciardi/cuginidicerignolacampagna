import { sql } from './db.js';
import { syncUser } from './sync.js';
import { standingsSnapshot, notifyStandings, notifyNewTimes } from './notify.js';

// Aggiorna da Strava tutti gli iscritti collegati: la usano l'aggiornamento del mattino e il
// pulsante dell'amministratore. Prima chi non è mai stato aggiornato o lo è da più tempo: se il
// tempo o i limiti Strava finiscono, gli esclusi passano in testa la volta dopo.
export async function syncAll(scope, budgetMs) {
  const before = await standingsSnapshot(); // per le notifiche di record e sorpassi
  const started = Date.now();
  const conns = await sql`select * from strava_connections
                          order by last_synced_at asc nulls first, user_id asc`;
  const report = { users: conns.length, done: 0, saved: 0, pending: 0, revoked: 0, newTimes: 0, stopped: null };
  for (const conn of conns) {
    if (Date.now() - started > budgetMs) { report.stopped = 'tempo'; break; }
    const r = await syncUser(conn, scope);
    report.newTimes += await notifyNewTimes(conn.user_id, r.savedIds);
    report.saved += r.saved;
    report.pending += r.pending;
    if (r.error === 'rate') { report.stopped = 'limite Strava'; break; }
    if (r.error === 'revoked') report.revoked++;
    report.done++;
  }
  report.notified = report.saved ? await notifyStandings(before, await standingsSnapshot()) : 0;
  return report;
}
