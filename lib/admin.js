import { redirect } from 'next/navigation';
import { sql } from './db.js';
import { getUserId } from './session.js';

// Amministratore: l'unico che gestisce le gare e gli utenti. Si imposta dal database
// (users.is_admin), non dal sito.
export async function isAdmin(userId) {
  if (!userId) return false;
  const [u] = await sql`select is_admin from users where id = ${userId}`;
  return Boolean(u?.is_admin);
}

// Tutti gli iscritti, per scegliere i partecipanti di una gara.
export async function allPeople() {
  return sql`select u.id, coalesce(c.athlete_name, u.email) as name,
                    coalesce('/api/foto/' || u.id || '?v=' || u.photo_v, c.avatar_url) as avatar_url,
                    c.user_id is not null as strava
             from users u left join strava_connections c on c.user_id = u.id
             order by lower(coalesce(c.athlete_name, u.email))`;
}

// Per le pagine di gare e corse: serve l'accesso e, tranne all'amministratore, Strava collegato.
// Chi non l'ha ancora collegato va nel suo account a farlo.
export async function requireStravaUser() {
  const userId = await getUserId();
  if (!userId) redirect('/login');
  const [u] = await sql`select u.is_admin, c.user_id is not null as strava
                        from users u left join strava_connections c on c.user_id = u.id where u.id = ${userId}`;
  if (!u?.is_admin && !u?.strava) redirect('/account?collega=1#strava');
  return userId;
}

// Per le pagine riservate: senza accesso al login, chi non è amministratore torna alle gare.
export async function requireAdminPage() {
  const userId = await getUserId();
  if (!userId) redirect('/login');
  if (!(await isAdmin(userId))) redirect('/gare');
  return userId;
}
