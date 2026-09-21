import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { validProfile } from '@/lib/profile';

// Solo in locale con il database finto: simula il ritorno da Strava con un collegamento finto,
// per provare il percorso dopo «Collega con Strava». In produzione non esiste (404).
export async function GET(req) {
  if (process.env.DEV_FAKE_DB !== '1' || process.env.NODE_ENV === 'production') return new Response(null, { status: 404 });
  const userId = await getUserId();
  if (!userId) return NextResponse.redirect(new URL('/login', req.url));
  const q = new URL(req.url).searchParams;
  const profile = validProfile(q.get('sex'), q.get('birth_date'));
  if (profile) await sql`update users set sex = ${profile.sex}, birth_date = ${profile.birth} where id = ${userId}`;
  await sql`insert into strava_connections (user_id, athlete_id, athlete_name, access_token, refresh_token, expires_at, scope, consent_at)
            values (${userId}, ${900000 + userId}, 'Cugino di prova', 'finto', 'finto', 0, 'read,activity:read_all', now())
            on conflict (user_id) do nothing`;
  return NextResponse.redirect(new URL('/dashboard?connected=1', req.url));
}
