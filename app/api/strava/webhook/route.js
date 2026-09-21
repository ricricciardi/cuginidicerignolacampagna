import { NextResponse, after } from 'next/server';
import { handleStravaEvent, webhookVerifyToken } from '@/lib/strava-webhook';

export const maxDuration = 60;

// Verifica dell'iscrizione: Strava chiama con hub.challenge e si risponde con lo stesso valore.
export async function GET(req) {
  const q = new URL(req.url).searchParams;
  if (q.get('hub.mode') !== 'subscribe' || q.get('hub.verify_token') !== webhookVerifyToken()) {
    return NextResponse.json({ error: 'non autorizzato' }, { status: 403 });
  }
  return NextResponse.json({ 'hub.challenge': q.get('hub.challenge') });
}

// Avviso di Strava: si risponde subito (Strava vuole una risposta entro 2 secondi) e il lavoro
// si fa dopo la risposta.
export async function POST(req) {
  const ev = await req.json().catch(() => null);
  if (!ev?.object_type || !ev?.owner_id || !ev?.object_id) return NextResponse.json({ ok: false }, { status: 400 });
  after(async () => {
    try {
      console.log('strava webhook', ev.object_type, ev.aspect_type, ev.object_id, '→', await handleStravaEvent(ev));
    } catch (e) {
      console.error('strava webhook', ev.object_type, ev.aspect_type, ev.object_id, e);
    }
  });
  return NextResponse.json({ ok: true });
}
