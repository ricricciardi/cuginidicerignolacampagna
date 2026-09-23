import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { isAdmin } from '@/lib/admin';
import { validate, formToQuery } from '@/lib/competition';
import { loadCompetition, setParticipants } from '@/lib/standings';
import { notifyAdded } from '@/lib/notify';

const go = (req, path) => NextResponse.redirect(new URL(path, req.url), 303);

// Modifica una gara (solo l'amministratore): tutti i dati, anche a gara partita.
// Classifiche e tempi si ricalcolano dai parziali salvati.
export async function POST(req, { params }) {
  const userId = await getUserId();
  if (!userId) return go(req, '/login');
  if (!(await isAdmin(userId))) return go(req, '/gare');
  const c = await loadCompetition((await params).id);
  if (!c) return go(req, '/gare');
  const fd = await req.formData();
  const { value, errors } = validate({ ...Object.fromEntries(fd), participants: fd.getAll('participants') });
  if (errors) return go(req, `/gare/${c.id}/modifica?${formToQuery(fd, errors)}`);

  await sql`update competitions
            set name = ${value.name}, distance_m = ${value.distance_m}, km = null, start_date = ${value.start_date},
                end_date = ${value.end_date}, age_grading = ${value.age_grading},
                best_segment = ${value.best_segment}, total_km = ${value.total_km}, updated_at = now()
            where id = ${c.id}`;
  const added = await setParticipants(c.id, value.participants);
  await notifyAdded({ id: c.id, name: value.name, distance_m: value.distance_m, total_km: value.total_km }, added, userId);
  return go(req, '/gare/impostazioni?modificata=1');
}
