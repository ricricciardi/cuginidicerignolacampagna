import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { syncUser, syncScope } from '@/lib/sync';
import { standingsSnapshot, notifyStandings, notifyRaceDays, notifyBirthdays, notifyNewTimes } from '@/lib/notify';

export const maxDuration = 60;     // secondi, limite della funzione su Vercel
const TIME_BUDGET_MS = 50_000;     // margine per chiudere prima del limite

// Aggiornamento notturno di tutti gli iscritti, chiamato da Vercel Cron (vercel.json).
// Vercel invia "Authorization: Bearer <CRON_SECRET>".
export async function GET(req) {
  if (!process.env.CRON_SECRET ||
      req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'non autorizzato' }, { status: 401 });
  }
  // Notifiche «parte oggi» e «ultimo giorno»: anche quando non c'è niente da leggere.
  const raceDays = await notifyRaceDays();
  const birthdays = await notifyBirthdays();
  // Nessuna gara partita: niente da leggere.
  // DA DECIDERE: fino a quando, dopo la chiusura, continuare a raccogliere corse arrivate in ritardo.
  const scope = await syncScope();
  if (!scope) return NextResponse.json({ skipped: 'nessuna gara partita', raceDays, birthdays });
  const before = await standingsSnapshot(); // per le notifiche di record e sorpassi

  const started = Date.now();
  // Prima chi non è mai stato aggiornato o lo è da più tempo: se il tempo o i limiti Strava
  // finiscono, gli esclusi passano in testa la notte dopo.
  const conns = await sql`select * from strava_connections
                          order by last_synced_at asc nulls first, user_id asc`;
  const report = { users: conns.length, done: 0, saved: 0, pending: 0, revoked: 0, stopped: null };
  for (const conn of conns) {
    if (Date.now() - started > TIME_BUDGET_MS) { report.stopped = 'tempo'; break; }
    const r = await syncUser(conn, scope);
    report.newTimes = (report.newTimes ?? 0) + await notifyNewTimes(conn.user_id, r.savedIds);
    report.saved += r.saved;
    report.pending += r.pending;
    if (r.error === 'rate') { report.stopped = 'limite Strava'; break; }
    if (r.error === 'revoked') report.revoked++;
    report.done++;
  }
  report.raceDays = raceDays;
  report.birthdays = birthdays;
  report.notified = report.saved ? await notifyStandings(before, await standingsSnapshot()) : 0;
  console.log('aggiornamento notturno', JSON.stringify(report));
  return NextResponse.json(report);
}
