import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';

// Iscrizione alle notifiche di questo dispositivo (dal browser: PushSubscription in JSON).
export async function POST(req) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });
  const sub = await req.json().catch(() => null);
  const { endpoint, keys } = sub ?? {};
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://') || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await sql`insert into push_subscriptions (endpoint, user_id, p256dh, auth)
            values (${endpoint}, ${userId}, ${keys.p256dh}, ${keys.auth})
            on conflict (endpoint) do update set user_id = excluded.user_id,
              p256dh = excluded.p256dh, auth = excluded.auth`;
  return NextResponse.json({ ok: true });
}

// Disiscrizione di questo dispositivo.
export async function DELETE(req) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });
  const { endpoint } = (await req.json().catch(() => null)) ?? {};
  if (typeof endpoint === 'string') {
    await sql`delete from push_subscriptions where endpoint = ${endpoint} and user_id = ${userId}`;
  }
  return NextResponse.json({ ok: true });
}
