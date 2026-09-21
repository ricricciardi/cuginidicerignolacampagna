import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { syncUser, syncScope } from '@/lib/sync';
import { standingsSnapshot, notifyStandings } from '@/lib/notify';

export const maxDuration = 60; // secondi, limite della funzione su Vercel

const go = (req, path) => NextResponse.redirect(new URL(path, req.url), 303);

// Pulsante "Aggiorna adesso": aggiorna solo l'utente che lo preme.
export async function POST(req) {
  const userId = await getUserId();
  if (!userId) return go(req, '/login');
  const [conn] = await sql`select * from strava_connections where user_id = ${userId}`;
  if (!conn) return go(req, '/account?error=not_connected#strava');

  const before = await standingsSnapshot();
  const r = await syncUser(conn, await syncScope());
  // Corse nuove: record e sorpassi (a chi viene superato arriva la notifica).
  if (r.saved) await notifyStandings(before, await standingsSnapshot());
  const q = new URLSearchParams({ synced: String(r.saved), pending: String(r.pending) });
  if (r.error) q.set('error', r.error);
  return go(req, `/dashboard?${q}`);
}
