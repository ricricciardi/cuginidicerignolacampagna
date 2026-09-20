import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserId } from '@/lib/session';
import { authorizeUrl } from '@/lib/strava';

export async function GET(req) {
  if (!(await getUserId())) return NextResponse.redirect(new URL('/login', req.url));
  // Senza consenso a mostrare i tempi agli altri iscritti non si collega Strava.
  if (new URL(req.url).searchParams.get('consenso') !== '1') {
    return NextResponse.redirect(new URL('/dashboard?error=consent', req.url));
  }
  const state = crypto.randomUUID(); // protezione CSRF sul ritorno da Strava
  (await cookies()).set('strava_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return NextResponse.redirect(authorizeUrl(state));
}
