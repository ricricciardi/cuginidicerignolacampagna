import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { isAdmin } from '@/lib/admin';
import { loadCompetition } from '@/lib/standings';
import { notifyAdded } from '@/lib/notify';

const go = (req, path) => NextResponse.redirect(new URL(path, req.url), 303);

// Dalla pagina Utenti: aggiunge o toglie un iscritto da una gara (solo l'amministratore).
// Si torna sulla scheda dell'utente (#u<id>).
export async function POST(req, { params }) {
  const userId = await getUserId();
  if (!userId) return go(req, '/login');
  if (!(await isAdmin(userId))) return go(req, '/gare');
  const uid = Number((await params).id);
  const fd = await req.formData();
  const c = await loadCompetition(fd.get('competition_id'));
  if (!Number.isInteger(uid) || !c) return go(req, '/account/utenti');

  if (fd.get('azione') === 'togli') {
    await sql`delete from competition_participants where competition_id = ${c.id} and user_id = ${uid}`;
    return go(req, `/account/utenti?tolto=${uid}#u${uid}`);
  }
  const added = await sql`insert into competition_participants (competition_id, user_id)
                          select ${c.id}, id from users where id = ${uid}
                          on conflict do nothing returning user_id`;
  if (added.length) await notifyAdded(c, [uid], userId);
  return go(req, `/account/utenti?aggiunto=${uid}#u${uid}`);
}
