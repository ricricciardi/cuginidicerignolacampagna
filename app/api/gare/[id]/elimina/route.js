import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { loadCompetition } from '@/lib/standings';

const go = (req, path) => NextResponse.redirect(new URL(path, req.url), 303);

// Elimina una gara. Le corse restano: valgono per le altre gare.
export async function POST(req, { params }) {
  if (!(await getUserId())) return go(req, '/login');
  const c = await loadCompetition((await params).id);
  if (!c) return go(req, '/gare/impostazioni');
  await sql`delete from competitions where id = ${c.id}`;
  return go(req, '/gare/impostazioni?eliminata=1');
}
