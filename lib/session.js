import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const key = () => new TextEncoder().encode(process.env.SESSION_SECRET);
const MAX_AGE = 60 * 60 * 24 * 30; // 30 giorni

export async function createSession(userId) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
  (await cookies()).set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function getUserId() {
  const token = (await cookies()).get('session')?.value;
  // In locale col database finto si è sempre loggati come il primo utente di esempio.
  if (!token && process.env.DEV_FAKE_DB === '1' && process.env.NODE_ENV !== 'production') return 1;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.uid;
  } catch {
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete('session');
}
