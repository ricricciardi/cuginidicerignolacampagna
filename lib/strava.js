import { sql } from './db.js';
import { isRoadGpsRun } from './filter.js';

const TOKEN_URL = 'https://www.strava.com/oauth/token';
const API = 'https://www.strava.com/api/v3';

export class StravaError extends Error {
  constructor(status, body) {
    super(`Strava ${status}: ${body}`);
    this.status = status;
  }
}

async function tokenRequest(params) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      ...params,
    }),
  });
  if (!res.ok) throw new StravaError(res.status, await res.text());
  return res.json();
}

export function authorizeUrl(state) {
  const u = new URL('https://www.strava.com/oauth/authorize');
  u.searchParams.set('client_id', process.env.STRAVA_CLIENT_ID);
  u.searchParams.set('redirect_uri', `${process.env.APP_URL}/api/strava/callback`);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('approval_prompt', 'auto');
  // activity:read_all include anche le attività "Solo io".
  u.searchParams.set('scope', 'activity:read_all');
  u.searchParams.set('state', state);
  return u.toString();
}

export const exchangeCode = (code) =>
  tokenRequest({ code, grant_type: 'authorization_code' });

// I token Strava scadono dopo 6 ore: rinnova se mancano meno di 60 secondi.
export async function getValidAccessToken(conn) {
  if (Number(conn.expires_at) - 60 > Date.now() / 1000) return conn.access_token;
  const t = await tokenRequest({
    refresh_token: conn.refresh_token,
    grant_type: 'refresh_token',
  });
  await sql`update strava_connections
            set access_token = ${t.access_token}, refresh_token = ${t.refresh_token},
                expires_at = ${t.expires_at}
            where user_id = ${conn.user_id}`;
  return t.access_token;
}

// Una chiamata API ogni 200 attività.
export async function fetchEligibleRuns(accessToken, afterEpoch, beforeEpoch) {
  const runs = [];
  for (let page = 1; ; page++) {
    const url = `${API}/athlete/activities?per_page=200&page=${page}&after=${afterEpoch}&before=${beforeEpoch}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw new StravaError(res.status, await res.text());
    const batch = await res.json();
    if (batch.length === 0) break;
    runs.push(...batch.filter(isRoadGpsRun));
  }
  return runs;
}

// Dettaglio di una singola attività: contiene i parziali al chilometro (una chiamata API ciascuna).
export async function fetchActivity(accessToken, id) {
  const res = await fetch(`${API}/activities/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new StravaError(res.status, await res.text());
  return res.json();
}
