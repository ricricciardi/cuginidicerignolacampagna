import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { syncUser, syncScope } from '@/lib/sync';

export const maxDuration = 60; // secondi, limite della funzione su Vercel

const go = (req, path) => NextResponse.redirect(new URL(path, req.url), 303);

// Pulsante "Aggiorna adesso": aggiorna solo l'utente che lo preme.
export async function POST(req) {
  const userId = await getUserId();
  if (!userId) return go(req, '/login');
  const [conn] = await sql`select * from strava_connections where user_id = ${userId}`;
  if (!conn) return go(req, '/account?error=not_connected#strava');

  const r = await syncUser(conn, await syncScope());
  const q = new URLSearchParams({ synced: String(r.saved), pending: String(r.pending) });
  if (r.error) q.set('error', r.error);
  return go(req, `/dashboard?${q}`);
}
