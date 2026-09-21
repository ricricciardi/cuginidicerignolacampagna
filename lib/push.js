import webpush from 'web-push';
import { sql } from './db.js';

// Invio delle notifiche push con le chiavi VAPID. Senza chiavi configurate non manda niente.
let configured;
function ready() {
  if (configured === undefined) {
    const { VAPID_PUBLIC_KEY: pub, VAPID_PRIVATE_KEY: priv, VAPID_SUBJECT: subject } = process.env;
    configured = Boolean(pub && priv);
    if (configured) webpush.setVapidDetails(subject || 'mailto:admin@example.com', pub, priv);
  }
  return configured;
}

export const pushPublicKey = () => process.env.VAPID_PUBLIC_KEY || null;

// Manda { title, body, url, tag } a tutti i dispositivi degli utenti indicati.
// Le iscrizioni scadute (il browser le ha revocate) si cancellano.
export async function sendToUsers(userIds, payload) {
  if (!ready()) return 0;
  let sent = 0;
  for (const userId of new Set(userIds)) {
    const subs = await sql`select endpoint, p256dh, auth from push_subscriptions where user_id = ${userId}`;
    for (const s of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload), { TTL: 60 * 60 * 24 },
        );
        sent++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          await sql`delete from push_subscriptions where endpoint = ${s.endpoint}`;
        } else {
          console.error('push', e.statusCode ?? '', e.body ?? e.message);
        }
      }
    }
  }
  return sent;
}
