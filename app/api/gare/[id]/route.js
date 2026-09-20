import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { validate, phase } from '@/lib/competition';
import { loadCompetition } from '@/lib/standings';

const go = (req, path) => NextResponse.redirect(new URL(path, req.url), 303);

// Modifica una gara: qualsiasi iscritto, solo finché non è partita.
export async function POST(req, { params }) {
  const userId = await getUserId();
  if (!userId) return go(req, '/login');
  const c = await loadCompetition((await params).id);
  if (!c) return go(req, '/gare');
  if (phase(c) !== 'before') return go(req, '/gare/impostazioni?error=bloccata');

  const fd = Object.fromEntries(await req.formData());
  const { value, errors } = validate(fd);
  if (errors) return go(req, `/gare/${c.id}/modifica?${new URLSearchParams({ ...fd, err: JSON.stringify(errors) })}`);
  await sql`update competitions
            set name = ${value.name}, km = ${value.km}, start_date = ${value.start_date},
                end_date = ${value.end_date}, updated_at = now()
            where id = ${c.id}`;
  return go(req, '/gare/impostazioni?modificata=1');
}
