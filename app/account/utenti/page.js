import { sql } from '@/lib/db';
import { requireAdminPage } from '@/lib/admin';
import Avatar from '../../avatar';

const fmtDay = (d) => new Date(d).toLocaleDateString('it-IT', {
  timeZone: 'Europe/Rome', day: 'numeric', month: 'short', year: 'numeric',
});

const NOTICES = { eliminato: 'Utente eliminato.' };

// Gestione utenti, solo per l'amministratore: chi è iscritto e a che punto è.
export default async function Utenti({ searchParams }) {
  const me = await requireAdminPage();
  const sp = await searchParams;
  const users = await sql`
    select u.id, u.email, u.is_admin, u.created_at, u.sex is not null and u.birth_date is not null as profilo,
           c.user_id is not null as strava, c.athlete_name, coalesce('/api/foto/' || u.id || '?v=' || u.photo_v, c.avatar_url) as avatar_url, c.last_sync_error,
           (select count(*) from activities a where a.user_id = u.id)::int as corse
    from users u left join strava_connections c on c.user_id = u.id
    order by u.created_at asc`;
  const notice = Object.keys(NOTICES).find((k) => sp[k]);

  return (
    <main>
      <p className="back"><a href="/account">Torna al tuo account</a></p>
      <h1>Utenti</h1>
      <p>{users.length} iscritti. Eliminare un utente cancella il suo account, il collegamento a Strava e le sue corse salvate.</p>
      {notice && <div className="notice">{NOTICES[notice]}</div>}
      {sp.error === 'self' && <div className="notice error">Non puoi eliminare il tuo account da qui.</div>}

      <ul className="settings-list users-list">
        {users.map((u) => (
          <li key={u.id}>
            <div className="user-main">
              <Avatar name={u.athlete_name ?? u.email} src={u.avatar_url} />
              <div>
                <strong>{u.athlete_name || u.email}</strong>
                <small>{u.email}</small>
              </div>
              {u.is_admin && <span className="pill ok">Admin</span>}
            </div>
            <dl className="status-list">
              <div><dt>Iscritto dal</dt><dd>{fmtDay(u.created_at)}</dd></div>
              <div><dt>Strava</dt><dd>
                {!u.strava ? 'non collegato' : u.last_sync_error === 'revoked' ? 'da ricollegare' : 'collegato'}
              </dd></div>
              <div><dt>Corse salvate</dt><dd>{u.corse}</dd></div>
              <div><dt>Sesso e data di nascita</dt><dd>{u.profilo ? 'inseriti' : 'mancano'}</dd></div>
            </dl>
            {u.id !== me && (
              <details className="disconnect">
                <summary>Elimina utente</summary>
                <p className="hint">
                  Cancelliamo account, collegamento a Strava e corse salvate di {u.athlete_name || u.email}:
                  sparisce da tutte le classifiche. Non si può annullare.
                </p>
                <form method="post" action={`/api/utenti/${u.id}/elimina`}>
                  <button className="danger" type="submit">Sì, elimina</button>
                </form>
              </details>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
