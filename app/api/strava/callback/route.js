import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { exchangeCode } from '@/lib/strava';

const go = (req, path) => NextResponse.redirect(new URL(path, req.url));

export async function GET(req) {
  const userId = await getUserId();
  if (!userId) return go(req, '/login');

  const url = new URL(req.url);
  const jar = await cookies();
  const expected = jar.get('strava_state')?.value;
  jar.delete('strava_state');
  if (!expected || url.searchParams.get('state') !== expected) {
    return go(req, '/dashboard?error=state');
  }

  // DA DECIDERE: comportamento quando l'utente rifiuta o toglie il permesso.
  // DA DECIDERE: se toglie la spunta sulle attività private resta activity:read e le "Solo io" non arrivano.
  if (url.searchParams.get('error')) return go(req, '/dashboard?error=denied');
  const scopes = (url.searchParams.get('scope') ?? '').split(',');
  if (!scopes.includes('activity:read') && !scopes.includes('activity:read_all')) {
    return go(req, '/dashboard?error=scope');
  }

  const t = await exchangeCode(url.searchParams.get('code'));
  const name = [t.athlete?.firstname, t.athlete?.lastname].filter(Boolean).join(' ');
  try {
    await sql`insert into strava_connections
                (user_id, athlete_id, athlete_name, access_token, refresh_token, expires_at, scope, consent_at)
              values (${userId}, ${t.athlete.id}, ${name}, ${t.access_token},
                      ${t.refresh_token}, ${t.expires_at}, ${scopes.join(',')}, now())
              on conflict (user_id) do update set
                athlete_id = excluded.athlete_id, athlete_name = excluded.athlete_name,
                access_token = excluded.access_token, refresh_token = excluded.refresh_token,
                expires_at = excluded.expires_at, scope = excluded.scope,
                consent_at = now(), connected_at = now()`;
  } catch (e) {
    // DA DECIDERE: stesso account Strava già collegato a un altro utente del sito.
    if (e.code === '23505') return go(req, '/dashboard?error=athlete_taken');
    throw e;
  }
  return go(req, '/dashboard?connected=1');
}
