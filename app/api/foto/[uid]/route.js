import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';

// Foto caricata di un iscritto, solo per chi ha fatto l'accesso. L'indirizzo contiene la
// versione (?v=), quindi il browser può tenerla in cache a lungo.
export async function GET(req, { params }) {
  if (!(await getUserId())) return new Response(null, { status: 401 });
  const uid = Number((await params).uid);
  if (!Number.isInteger(uid)) return new Response(null, { status: 404 });
  const [u] = await sql`select photo from users where id = ${uid}`;
  if (!u?.photo) return new Response(null, { status: 404 });
  return new Response(Buffer.from(u.photo, 'base64'), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=31536000, immutable' },
  });
}
