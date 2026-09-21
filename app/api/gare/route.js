import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { isAdmin } from '@/lib/admin';
import { validate, formToQuery } from '@/lib/competition';
import { setParticipants } from '@/lib/standings';

const go = (req, path) => NextResponse.redirect(new URL(path, req.url), 303);

// Crea una gara con i suoi partecipanti. Solo l'amministratore.
export async function POST(req) {
  const userId = await getUserId();
  if (!userId) return go(req, '/login');
  if (!(await isAdmin(userId))) return go(req, '/gare');
  const fd = await req.formData();
  const { value, errors } = validate({ ...Object.fromEntries(fd), participants: fd.getAll('participants') });
  if (errors) return go(req, `/gare/nuova?${formToQuery(fd, errors)}`);
  const [c] = await sql`insert into competitions (name, km, start_date, end_date, age_grading, created_by)
                        values (${value.name}, ${value.km}, ${value.start_date}, ${value.end_date},
                                ${value.age_grading}, ${userId})
                        returning id`;
  await setParticipants(c.id, value.participants);
  return go(req, '/gare/impostazioni?creata=1');
}
