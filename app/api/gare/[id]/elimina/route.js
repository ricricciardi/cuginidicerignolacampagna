import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { isAdmin } from '@/lib/admin';
import { loadCompetition } from '@/lib/standings';

const go = (req, path) => NextResponse.redirect(new URL(path, req.url), 303);

// Elimina una gara (solo l'amministratore). Le corse restano: valgono per le altre gare.
export async function POST(req, { params }) {
  const userId = await getUserId();
  if (!userId) return go(req, '/login');
  if (!(await isAdmin(userId))) return go(req, '/gare');
  const c = await loadCompetition((await params).id);
  if (!c) return go(req, '/gare/impostazioni');
  await sql`delete from competitions where id = ${c.id}`;
  return go(req, '/gare/impostazioni?eliminata=1');
}
