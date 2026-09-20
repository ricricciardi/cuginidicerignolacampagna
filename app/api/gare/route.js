import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { validate } from '@/lib/competition';

const go = (req, path) => NextResponse.redirect(new URL(path, req.url), 303);

// Crea una gara. Può farlo qualsiasi iscritto.
export async function POST(req) {
  const userId = await getUserId();
  if (!userId) return go(req, '/login');
  const fd = Object.fromEntries(await req.formData());
  const { value, errors } = validate(fd);
  if (errors) return go(req, `/gare/nuova?${new URLSearchParams({ ...fd, err: JSON.stringify(errors) })}`);
  const [c] = await sql`insert into competitions (name, km, start_date, end_date, created_by)
                        values (${value.name}, ${value.km}, ${value.start_date}, ${value.end_date}, ${userId})
                        returning id`;
  return go(req, `/gare/${c.id}?creata=1`);
}
