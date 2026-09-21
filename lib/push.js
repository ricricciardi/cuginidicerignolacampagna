import webpush from 'web-push';
import { sql } from './db.js';
import { makeT } from './i18n.js';

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

const APP_NAME = 'Cuginidicerignolacampagna';

// Manda { title, body, url, tag } a tutti i dispositivi degli utenti indicati.
// Il titolo della notifica è sempre il nome intero del sito (sotto l'icona resta «Cugini»):
// il titolo dell'evento diventa la prima riga del testo.
// Le iscrizioni scadute (il browser le ha revocate) si cancellano.
// payload può essere una funzione (t) => payload: così il testo è nella lingua di chi lo riceve.
export async function sendToUsers(userIds, payloadOrFn) {
  if (!ready()) return 0;
  let sent = 0;
  for (const userId of new Set(userIds)) {
    const subs = await sql`select endpoint, p256dh, auth from push_subscriptions where user_id = ${userId}`;
    if (!subs.length) continue;
    const [u] = await sql`select lingua from users where id = ${userId}`;
    const payload = typeof payloadOrFn === 'function' ? payloadOrFn(makeT(u?.lingua)) : payloadOrFn;
    for (const s of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ ...payload, title: APP_NAME, body: [payload.title, payload.body].filter(Boolean).join('\n') }),
          { TTL: 60 * 60 * 24 },
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
