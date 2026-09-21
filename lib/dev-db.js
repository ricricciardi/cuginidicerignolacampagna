// Database finto per lo sviluppo in locale (DEV_FAKE_DB=1): Postgres in memoria con
// PGlite, lo schema vero e dati di esempio. Si azzera a ogni riavvio del server.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PGlite, types } from '@electric-sql/pglite';

// Come il driver Neon: i bigint restano stringhe.
const parsers = { [types.INT8]: (v) => v };

export const DEV_USER_ID = 1;

export function devDb() {
  globalThis.__devDb ??= open().catch((e) => {
    globalThis.__devDb = null;
    throw e;
  });
  return globalThis.__devDb;
}

async function open() {
  const db = new PGlite({ parsers });
  await db.exec(await readFile(join(process.cwd(), 'schema.sql'), 'utf8'));
  await seed(db);
  await db.query('update users set is_admin = true where id = $1', [DEV_USER_ID]);
  await db.exec(`insert into competition_participants (competition_id, user_id)
                 select c.id, u.id from competitions c, users u where not (c.id = 1 and u.id = 4);
                 update competitions set age_grading = false where id = 2;`);
  return db;
}

const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

// Parziali al km attorno a un passo medio (secondi al km), con qualche oscillazione.
// Dislivello per km: saliscendi attorno a una pendenza media (metri per km, negativa = discesa).
function splits(km, pace, jitter, slope = 0) {
  return Array.from({ length: km }, (_, i) => {
    const s = Math.round(pace + Math.sin(i * 1.7 + jitter) * 8);
    const e = Math.round((slope + Math.sin(i * 2.3 + jitter) * 6) * 10) / 10;
    return { m: 1000, s: s + (i % 5 === 4 ? 6 : 0), mv: s, e };
  });
}

async function seed(db) {
  const people = [
    // L'ultimo non ha ancora inserito sesso e data di nascita.
    ['riccardo@example.com', 'Riccardo R.', 285, 'M', '1990-04-12'],
    ['marco@example.com', 'Marco C.', 300, 'M', '1972-11-03'],
    ['giulia@example.com', 'Giulia D.', 312, 'F', '1985-06-25'],
    ['antonio@example.com', 'Antonio F.', 330, null, null],
  ];
  for (const [i, [email, name, , sex, birth]] of people.entries()) {
    await db.query(`insert into users (email, password_hash, sex, birth_date) values ($1, 'x', $2, $3)`,
                   [email, sex, birth]);
    await db.query(
      `insert into strava_connections (user_id, athlete_id, athlete_name, access_token, refresh_token,
                                       expires_at, scope, consent_at, last_synced_at)
       values ($1, $2, $3, 'x', 'x', 0, 'read,activity:read_all', now(), now() - interval '3 hours')`,
      [i + 1, 1000 + i, name]);
  }

  const comps = [
    ['Mezza di primavera', 21, day(-180), day(-150)],
    ['Dieci d\'estate', 10, day(-60), day(-30)],
    ['Quindici d\'autunno', 15, day(-10), day(20)],
    ['Maratonina d\'inverno', 21, day(60), day(90)],
  ];
  for (const c of comps) {
    await db.query(`insert into competitions (name, km, start_date, end_date, created_by)
                    values ($1, $2, $3, $4, 1)`, [...c]);
  }

  // Corse: una ogni 4-6 giorni negli ultimi 200 giorni, tra 11 e 23 km.
  let id = 9000000000;
  for (const [i, [, , pace]] of people.entries()) {
    for (let d = -200 + i; d < 0; d += 4 + ((d + i) % 3)) {
      const km = 11 + ((d * 7 + i * 3) % 13 + 13) % 13;
      const p = pace - Math.round((d + 200) / 20) + ((d * 13) % 9);
      // Marco ogni tanto corre in discesa (circa -12 m/km), gli altri su percorsi quasi piani.
      const sp = splits(km, p, d + i, i === 1 && d % 3 === 0 ? -12 : 0);
      const elapsed = sp.reduce((t, x) => t + x.s, 0);
      const start = new Date(Date.now() + d * 86400000);
      start.setUTCHours(5 + i, 30, 0, 0);
      await db.query(
        `insert into activities (id, user_id, name, distance_m, moving_time_s, elapsed_time_s,
                                 splits, start_date, start_date_local)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id++, i + 1, `Corsa di ${km} km`, km * 1000 + 120, elapsed - km * 2, elapsed,
         JSON.stringify(sp), start.toISOString(), start.toISOString().slice(0, 19) + 'Z']);
    }
  }
}

// Stesso uso del tag `sql` di Neon: restituisce le righe.
export async function devSql(strings, ...values) {
  const text = strings.reduce((q, s, i) => q + '$' + i + s);
  return (await (await devDb()).query(text, values)).rows;
}
