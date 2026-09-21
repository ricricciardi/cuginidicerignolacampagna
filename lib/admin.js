import { cache } from 'react';
import { redirect } from 'next/navigation';
import { sql } from './db.js';
import { getUserId } from './session.js';

// L'utente collegato, letto una volta sola per richiesta (cache di React): lo usano la barra
// in alto, i controlli di accesso e le pagine, senza rifare la query a ogni passo.
export const loadMe = cache(async (userId) => {
  if (!userId) return null;
  const [u] = await sql`select u.id, u.email, u.is_admin, c.user_id is not null as strava, c.athlete_name,
                               coalesce('/api/foto/' || u.id || '?v=' || u.photo_v, c.avatar_url) as avatar_url
                        from users u left join strava_connections c on c.user_id = u.id where u.id = ${userId}`;
  return u ?? null;
});

// Amministratore: l'unico che gestisce le gare e gli utenti. Si imposta dal database
// (users.is_admin), non dal sito.
export async function isAdmin(userId) {
  return Boolean((await loadMe(userId))?.is_admin);
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
// Chi non l'ha ancora collegato va alla pagina di benvenuto per farlo.
export async function requireStravaUser() {
  const userId = await getUserId();
  if (!userId) redirect('/login');
  const u = await loadMe(userId);
  if (!u?.is_admin && !u?.strava) redirect('/collega-strava');
  return userId;
}

// Per le pagine riservate: senza accesso al login, chi non è amministratore torna alle gare.
export async function requireAdminPage() {
  const userId = await getUserId();
  if (!userId) redirect('/login');
  if (!(await isAdmin(userId))) redirect('/gare');
  return userId;
}
