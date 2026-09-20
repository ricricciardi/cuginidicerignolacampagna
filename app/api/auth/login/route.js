import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/session';

export async function POST(req) {
  const fd = await req.formData();
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const password = String(fd.get('password') ?? '');
  const [user] = await sql`select id, password_hash from users where email = ${email}`;
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.redirect(new URL('/login?error=credentials', req.url), 303);
  }
  await createSession(user.id);
  return NextResponse.redirect(new URL('/gare', req.url), 303);
}
