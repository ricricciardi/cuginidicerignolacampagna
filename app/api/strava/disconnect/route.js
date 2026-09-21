import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { deauthorize, getValidAccessToken } from '@/lib/strava';

const go = (req, path) => NextResponse.redirect(new URL(path, req.url), 303);

// Scollega Strava: revoca l'accesso su Strava, poi cancella collegamento e corse salvate
// (l'accordo API Strava chiede di cancellare i dati quando l'accesso viene revocato).
export async function POST(req) {
  const userId = await getUserId();
  if (!userId) return go(req, '/login');
  const [conn] = await sql`select * from strava_connections where user_id = ${userId}`;
  if (!conn) return go(req, '/account');

  // Se Strava non risponde si scollega lo stesso: l'utente può revocare anche da strava.com.
  try {
    await deauthorize(await getValidAccessToken(conn));
  } catch (e) {
    console.error('deauthorize', e);
  }
  await sql`delete from activities where user_id = ${userId}`;
  await sql`delete from strava_connections where user_id = ${userId}`;
  return go(req, '/account?disconnected=1#strava');
}
