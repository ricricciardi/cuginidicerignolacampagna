import Link from 'next/link';
import { sql } from '@/lib/db';
import { requireAdminPage } from '@/lib/admin';
import Avatar from '../../avatar';
import RaceToggle from './race-toggle';
import { phase, fmtGoal } from '@/lib/competition';
import { getT } from '@/lib/lingua';

const fmtDay = (d) => new Date(d).toLocaleDateString('it-IT', {
  timeZone: 'Europe/Rome', day: 'numeric', month: 'short', year: 'numeric',
});

const NOTICES = { eliminato: 'Utente eliminato.', aggiunto: 'Aggiunto alla gara.', tolto: 'Tolto dalla gara.' };

// Gestione utenti, solo per l'amministratore: chi è iscritto e a che punto è.
export default async function Utenti({ searchParams }) {
  const me = await requireAdminPage();
  const sp = await searchParams;
  const t = await getT();
  const users = await sql`
    select u.id, u.email, u.is_admin, u.created_at, u.sex is not null and u.birth_date is not null as profilo,
           c.user_id is not null as strava, c.athlete_name, coalesce('/api/foto/' || u.id || '?v=' || u.photo_v, c.avatar_url) as avatar_url, c.last_sync_error,
           (select count(*) from activities a where a.user_id = u.id)::int as corse
    from users u left join strava_connections c on c.user_id = u.id
    order by u.created_at asc`;
  // Gare in cui ha senso aggiungere qualcuno: in corso o che devono ancora partire.
  const now = new Date();
  const [comps, parts] = await Promise.all([
    sql`select id, name, distance_m, start_date, end_date, total_km from competitions order by start_date asc, id asc`,
    sql`select competition_id, user_id from competition_participants`,
  ]);
  const open = comps.filter((c) => phase(c, now) !== 'over');
  const inRace = new Set(parts.map((p) => `${p.competition_id}:${p.user_id}`));
  const notice = Object.keys(NOTICES).find((k) => sp[k]);
  const focus = Number(sp.nuovo ?? sp.aggiunto ?? sp.tolto); // scheda da evidenziare

  return (
    <main>
      <p className="back"><Link href="/account">{t('Torna al tuo account')}</Link></p>
      <h1>{t('Utenti')}</h1>
      <p>{t('{n} iscritti. Eliminare un utente cancella il suo account, il collegamento a Strava e le sue corse salvate.', { n: users.length })}</p>
      {notice && <div className="notice">{t(NOTICES[notice])}</div>}
      {sp.error === 'self' && <div className="notice error">{t('Non puoi eliminare il tuo account da qui.')}</div>}

      <ul className="settings-list users-list">
        {users.map((u) => (
          <li key={u.id} id={`u${u.id}`} className={u.id === focus ? 'focus' : undefined}>
            <div className="user-main">
              <Avatar name={u.athlete_name ?? u.email} src={u.avatar_url} />
              <div>
                <strong>{u.athlete_name || u.email}</strong>
                <small>{u.email}</small>
              </div>
              {u.is_admin && <span className="pill ok">{t('Admin')}</span>}
            </div>
            <dl className="status-list">
              <div><dt>{t('Iscritto dal')}</dt><dd>{fmtDay(u.created_at)}</dd></div>
              <div><dt>{t('Strava')}</dt><dd>
                {!u.strava ? t('non collegato') : u.last_sync_error === 'revoked' ? t('da ricollegare') : t('collegato')}
              </dd></div>
              <div><dt>{t('Corse salvate')}</dt><dd>{u.corse}</dd></div>
              <div><dt>{t('Sesso e data di nascita')}</dt><dd>{u.profilo ? t('inseriti') : t('mancano')}</dd></div>
            </dl>
            {open.length > 0 && (
              <div className="user-races">
                <strong>{t('Gare')}</strong>
                <ul>
                  {open.map((c) => {
                    const inside = inRace.has(`${c.id}:${u.id}`);
                    return (
                      <li key={c.id}>
                        <span>
                          {c.name}
                          <small>{fmtGoal(c, t)} · {phase(c, now) === 'running' ? t('in corso') : t('da iniziare')}</small>
                        </span>
                        <RaceToggle action={`/api/utenti/${u.id}/gare`} competitionId={c.id}>
                          {inside ? (
                            <>
                              <span className="in-race">{t('In gara ✓')}</span>
                              <button className="quiet" type="submit" name="azione" value="togli">{t('Togli')}</button>
                            </>
                          ) : (
                            <button className="button small" type="submit" name="azione" value="aggiungi">{t('Aggiungi')}</button>
                          )}
                        </RaceToggle>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {u.id !== me && (
              <details className="disconnect">
                <summary>{t('Elimina utente')}</summary>
                <p className="hint">
                  {t('Cancelliamo account, collegamento a Strava e corse salvate di {nome}: sparisce da tutte le classifiche. Non si può annullare.', { nome: u.athlete_name || u.email })}
                </p>
                <form method="post" action={`/api/utenti/${u.id}/elimina`}>
                  <button className="danger" type="submit">{t('Sì, elimina')}</button>
                </form>
              </details>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
