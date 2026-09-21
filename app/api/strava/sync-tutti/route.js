import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/session';
import { isAdmin } from '@/lib/admin';
import { syncScope } from '@/lib/sync';
import { syncAll } from '@/lib/sync-all';

export const maxDuration = 60;     // secondi, limite della funzione su Vercel
const TIME_BUDGET_MS = 50_000;     // margine per chiudere prima del limite

const go = (req, path) => NextResponse.redirect(new URL(path, req.url), 303);

// Pulsante dell'amministratore: aggiorna subito da Strava tutti gli iscritti, come al mattino.
export async function POST(req) {
  const userId = await getUserId();
  if (!userId) return go(req, '/login');
  if (!(await isAdmin(userId))) return go(req, '/gare');
  const scope = await syncScope();
  if (!scope) return go(req, '/account?tutti=nessuna_gara#admin');
  const r = await syncAll(scope, TIME_BUDGET_MS);
  console.log('aggiornamento di tutti', JSON.stringify(r));
  const q = new URLSearchParams({ tutti: 'ok', salvate: String(r.saved), fatti: String(r.done), di: String(r.users) });
  if (r.pending || r.stopped) q.set('resta', '1');
  return go(req, `/account?${q}#admin`);
}
