import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/session';
import { sendToUsers } from '@/lib/push';
import { normLang } from '@/lib/i18n';

const go = (req, path) => NextResponse.redirect(new URL(path, req.url), 303);

export async function POST(req) {
  const fd = await req.formData();
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const password = String(fd.get('password') ?? '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    return go(req, '/register?error=invalid');
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    // La lingua scelta prima di registrarsi (switch nella pagina di accesso) vale anche per le notifiche.
    const lingua = normLang(req.cookies.get('lingua')?.value);
    const [user] = await sql`insert into users (email, password_hash, lingua)
                             values (${email}, ${hash}, ${lingua}) returning id`;
    await createSession(user.id);
    // Avviso agli amministratori: c'è un nuovo iscritto da aggiungere alle gare.
    const admins = (await sql`select id from users where is_admin`).map((r) => r.id);
    await sendToUsers(admins, (t) => ({ title: t('Nuovo iscritto'), body: t('{email} si è registrato. Aggiungilo alle gare.', { email }),
      url: `/account/utenti?nuovo=${user.id}#u${user.id}`, tag: 'nuovo-iscritto' })).catch((e) => console.error('push nuovo iscritto', e));
  } catch (e) {
    if (e.code === '23505') return go(req, '/register?error=exists');
    throw e;
  }
  return go(req, '/gare');
}
