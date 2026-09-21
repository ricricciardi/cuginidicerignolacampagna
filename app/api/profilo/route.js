import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { validProfile } from '@/lib/profile';

const go = (req, path) => NextResponse.redirect(new URL(path, req.url), 303);

// Sesso e data di nascita: servono solo per la classifica per età e sesso.
export async function POST(req) {
  const userId = await getUserId();
  if (!userId) return go(req, '/login');
  const fd = await req.formData();
  const profile = validProfile(fd.get('sex'), fd.get('birth_date'));
  // Dal modulo con JavaScript arriva Accept: application/json e si risponde senza reindirizzare.
  const json = (req.headers.get('accept') ?? '').includes('application/json');
  if (!profile) {
    return json ? NextResponse.json({ ok: false }, { status: 400 }) : go(req, '/account?error=profilo#profilo');
  }
  await sql`update users set sex = ${profile.sex}, birth_date = ${profile.birth} where id = ${userId}`;
  return json ? NextResponse.json({ ok: true }) : go(req, '/account?profilo=1#profilo');
}
