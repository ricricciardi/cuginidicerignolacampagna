import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';

const MAX_BYTES = 200 * 1024; // il browser la manda già rimpicciolita: ~20 KB

// Carica la foto dell'account (JPEG già ritagliato e rimpicciolito nel browser).
export async function POST(req) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });
  const file = (await req.formData()).get('photo');
  if (!file || typeof file.arrayBuffer !== 'function' || file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return NextResponse.json({ ok: false }, { status: 400 }); // non è un JPEG
  await sql`update users set photo = ${bytes.toString('base64')}, photo_v = ${Date.now()} where id = ${userId}`;
  return NextResponse.json({ ok: true });
}

// Torna alla foto di Strava (o alle iniziali).
export async function DELETE() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });
  await sql`update users set photo = null, photo_v = null where id = ${userId}`;
  return NextResponse.json({ ok: true });
}
