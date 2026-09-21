import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { validProfile } from '@/lib/profile';
import { getUserId } from '@/lib/session';
import { authorizeUrl } from '@/lib/strava';

export async function GET(req) {
  const userId = await getUserId();
  if (!userId) return NextResponse.redirect(new URL('/login', req.url));
  // Senza consenso a mostrare i tempi agli altri iscritti non si collega Strava.
  if (new URL(req.url).searchParams.get('consenso') !== '1') {
    const [had] = await sql`select 1 from strava_connections where user_id = ${userId}`;
    return NextResponse.redirect(new URL(had ? '/account?error=consent#strava' : '/collega-strava?error=consent', req.url));
  }
  // Dalla pagina di benvenuto arrivano anche sesso e data di nascita: si salvano prima di andare su Strava.
  const q = new URL(req.url).searchParams;
  if (q.has('sex') || q.has('birth_date')) {
    const profile = validProfile(q.get('sex'), q.get('birth_date'));
    if (!profile) return NextResponse.redirect(new URL('/collega-strava?error=profilo', req.url));
    await sql`update users set sex = ${profile.sex}, birth_date = ${profile.birth} where id = ${userId}`;
  }
  const state = crypto.randomUUID(); // protezione CSRF sul ritorno da Strava
  (await cookies()).set('strava_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return NextResponse.redirect(authorizeUrl(state));
}
