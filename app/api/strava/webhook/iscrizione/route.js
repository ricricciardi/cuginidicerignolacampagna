import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/session';
import { isAdmin } from '@/lib/admin';
import { webhookVerifyToken } from '@/lib/strava-webhook';

const go = (req, path) => NextResponse.redirect(new URL(path, req.url), 303);
const SUBS = 'https://www.strava.com/api/v3/push_subscriptions';

// Iscrive l'app agli avvisi in tempo reale di Strava (una volta sola; se c'è già, lo dice).
// Strava ammette una sola iscrizione per app: se punta altrove la si sostituisce.
export async function POST(req) {
  const userId = await getUserId();
  if (!userId) return go(req, '/login');
  if (!(await isAdmin(userId))) return go(req, '/gare');
  const id = process.env.STRAVA_CLIENT_ID, secret = process.env.STRAVA_CLIENT_SECRET;
  const callback = `${process.env.APP_URL}/api/strava/webhook`;
  const auth = new URLSearchParams({ client_id: id ?? '', client_secret: secret ?? '' });
  try {
    const list = await (await fetch(`${SUBS}?${auth}`)).json();
    const mine = Array.isArray(list) ? list.find((s) => s.callback_url === callback) : null;
    if (mine) return go(req, '/account?webhook=attivo#admin');
    for (const s of Array.isArray(list) ? list : []) {
      await fetch(`${SUBS}/${s.id}?${auth}`, { method: 'DELETE' });
    }
    const res = await fetch(SUBS, {
      method: 'POST',
      body: new URLSearchParams({ client_id: id, client_secret: secret, callback_url: callback, verify_token: webhookVerifyToken() }),
    });
    if (!res.ok) {
      console.error('iscrizione webhook Strava', res.status, await res.text());
      return go(req, '/account?webhook=errore#admin');
    }
    return go(req, '/account?webhook=attivato#admin');
  } catch (e) {
    console.error('iscrizione webhook Strava', e);
    return go(req, '/account?webhook=errore#admin');
  }
}
