import { NextResponse } from 'next/server';
import { syncScope } from '@/lib/sync';
import { syncAll } from '@/lib/sync-all';
import { notifyRaceDays, notifyBirthdays } from '@/lib/notify';

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
  const report = await syncAll(scope, TIME_BUDGET_MS);
  report.raceDays = raceDays;
  report.birthdays = birthdays;
  console.log('aggiornamento notturno', JSON.stringify(report));
  return NextResponse.json(report);
}
