import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { normLang } from '@/lib/i18n';

// Cambia lingua: cookie per un anno e, per chi ha fatto l'accesso, anche nel profilo
// (così le notifiche push arrivano nella lingua scelta). Si torna alla pagina di prima.
export async function POST(req) {
  const fd = await req.formData();
  const lang = normLang(fd.get('lingua'));
  const back = String(fd.get('back') ?? '/');
  const res = NextResponse.redirect(new URL(back.startsWith('/') ? back : '/', req.url), 303);
  res.cookies.set('lingua', lang, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  const userId = await getUserId();
  if (userId) await sql`update users set lingua = ${lang} where id = ${userId}`;
  return res;
}
