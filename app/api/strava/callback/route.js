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
    return go(req, '/account?error=state#strava');
  }

  // DA DECIDERE: comportamento quando l'utente rifiuta o toglie il permesso.
  // DA DECIDERE: se toglie la spunta sulle attività private resta activity:read e le "Solo io" non arrivano.
  if (url.searchParams.get('error')) return go(req, '/account?error=denied#strava');
  const scopes = (url.searchParams.get('scope') ?? '').split(',');
  if (!scopes.includes('activity:read') && !scopes.includes('activity:read_all')) {
    return go(req, '/account?error=scope#strava');
  }

  const t = await exchangeCode(url.searchParams.get('code'));
  const name = [t.athlete?.firstname, t.athlete?.lastname].filter(Boolean).join(' ');
  const avatar = t.athlete?.profile_medium || t.athlete?.profile || null;
  try {
    await sql`insert into strava_connections
                (user_id, athlete_id, athlete_name, avatar_url, access_token, refresh_token, expires_at, scope, consent_at)
              values (${userId}, ${t.athlete.id}, ${name}, ${avatar}, ${t.access_token},
                      ${t.refresh_token}, ${t.expires_at}, ${scopes.join(',')}, now())
              on conflict (user_id) do update set
                athlete_id = excluded.athlete_id, athlete_name = excluded.athlete_name,
                avatar_url = excluded.avatar_url,
                access_token = excluded.access_token, refresh_token = excluded.refresh_token,
                expires_at = excluded.expires_at, scope = excluded.scope,
                consent_at = now(), connected_at = now()`;
  } catch (e) {
    // DA DECIDERE: stesso account Strava già collegato a un altro utente del sito.
    if (e.code === '23505') return go(req, '/account?error=athlete_taken#strava');
    throw e;
  }
  return go(req, '/account?connected=1#strava');
}
