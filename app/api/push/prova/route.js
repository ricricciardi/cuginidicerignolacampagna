import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/session';
import { sendToUsers } from '@/lib/push';

// «Mandami una prova»: una notifica a tutti i dispositivi dell'utente.
export async function POST() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });
  const sent = await sendToUsers([userId], {
    title: 'Notifiche attive 🎉', body: 'Ti avviseremo di sorpassi, record e gare. #andràtuttobene', url: '/gare', tag: 'prova',
  });
  return NextResponse.json({ ok: sent > 0, sent });
}
