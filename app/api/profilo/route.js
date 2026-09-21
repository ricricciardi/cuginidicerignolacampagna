import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';

const go = (req, path) => NextResponse.redirect(new URL(path, req.url), 303);

// Sesso e data di nascita: servono solo per la classifica per età e sesso.
export async function POST(req) {
  const userId = await getUserId();
  if (!userId) return go(req, '/login');
  const fd = await req.formData();
  const sex = String(fd.get('sex') ?? '');
  const birth = String(fd.get('birth_date') ?? '');
  const parsed = new Date(birth + 'T00:00:00Z');
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(birth) && !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === birth &&
    birth >= '1920-01-01' && birth <= new Date().toISOString().slice(0, 10);
  // Dal modulo con JavaScript arriva Accept: application/json e si risponde senza reindirizzare.
  const json = (req.headers.get('accept') ?? '').includes('application/json');
  if (!['M', 'F'].includes(sex) || !valid) {
    return json ? NextResponse.json({ ok: false }, { status: 400 }) : go(req, '/account?error=profilo#profilo');
  }
  await sql`update users set sex = ${sex}, birth_date = ${birth} where id = ${userId}`;
  return json ? NextResponse.json({ ok: true }) : go(req, '/account?profilo=1#profilo');
}
