import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { isAdmin } from '@/lib/admin';
import { deauthorize, getValidAccessToken } from '@/lib/strava';

const go = (req, path) => NextResponse.redirect(new URL(path, req.url), 303);

// Elimina un utente (solo l'amministratore, mai sé stesso). Revoca l'accesso su Strava come
// quando si scollega; collegamento e corse spariscono con l'utente (on delete cascade).
export async function POST(req, { params }) {
  const userId = await getUserId();
  if (!userId) return go(req, '/login');
  if (!(await isAdmin(userId))) return go(req, '/gare');
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return go(req, '/account/utenti');
  if (id === userId) return go(req, '/account/utenti?error=self');

  const [conn] = await sql`select * from strava_connections where user_id = ${id}`;
  if (conn) {
    try {
      await deauthorize(await getValidAccessToken(conn));
    } catch (e) {
      console.error('deauthorize', e);
    }
  }
  await sql`delete from users where id = ${id}`;
  return go(req, '/account/utenti?eliminato=1');
}
