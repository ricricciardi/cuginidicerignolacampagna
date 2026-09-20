import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { createSession } from '@/lib/session';

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
    const [user] = await sql`insert into users (email, password_hash)
                             values (${email}, ${hash}) returning id`;
    await createSession(user.id);
  } catch (e) {
    if (e.code === '23505') return go(req, '/register?error=exists');
    throw e;
  }
  return go(req, '/gare');
}
