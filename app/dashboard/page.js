import Link from 'next/link';
import { requireStravaUser } from '@/lib/admin';
import { sql } from '@/lib/db';
import { fmtTime, fmtPace, fmtDate, fmtKm } from '@/lib/format';
import { syncScope } from '@/lib/sync';
import SyncButton from './sync-button';
import { InstallBanner } from '../install-app';

const fmtStamp = (d) => new Date(d).toLocaleString('it-IT', {
  timeZone: 'Europe/Rome', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});

const ERRORS = {
  rate: 'Strava ha raggiunto il limite di richieste. Riprova tra 15 minuti: le corse già lette restano salvate.',
  revoked: 'Strava non riconosce più il collegamento. Ricollegalo dal tuo account.',
  no_race: 'Nessuna gara è ancora partita: non ci sono corse da leggere.',
};

export default async function Dashboard({ searchParams }) {
  const userId = await requireStravaUser();
  const sp = await searchParams;

  const [[conn], runs, scope] = await Promise.all([
    sql`select athlete_name, avatar_url, last_synced_at from strava_connections where user_id = ${userId}`,
    sql`select * from activities where user_id = ${userId} order by start_date desc`,
    syncScope(),
  ]);
  const pending = Number(sp.pending ?? 0);
  const anyStarted = Boolean(scope);

  return (
    <main>
      <InstallBanner />
      <h1>Le mie corse</h1>
      <p>Corse su strada con GPS nei periodi delle gare. I tempi per ogni gara sono nelle pagine delle gare.</p>

      {sp.connected && (
        <div className="notice">Strava collegato, sei dentro! Premi Aggiorna adesso da Strava per leggere le tue corse.</div>
      )}
      {sp.error && <div className="notice error">{ERRORS[sp.error] ?? 'Qualcosa non ha funzionato.'}</div>}
      {sp.synced !== undefined && (
        <div className="notice">
          {sp.synced} corse nuove salvate.
          {pending > 0 && ` Ne restano ${pending}: premi di nuovo Aggiorna adesso da Strava o aspetta l\'aggiornamento di stanotte.`}
        </div>
      )}

      {conn ? (
        <div className="bar">
          <span className="connected">
            Le corse si aggiornano da sole ogni notte
            {conn.last_synced_at ? `; ultimo aggiornamento ${fmtStamp(conn.last_synced_at)}.` : '.'}
          </span>
          {!anyStarted ? (
            <div className="notice">Sei pronto. Le corse si leggono da quando parte la prima gara.</div>
          ) : (
            <SyncButton />
          )}
        </div>
      ) : (
        <div className="notice">Per vedere le tue corse <Link href="/collega-strava">collega Strava</Link>.</div>
      )}

      {runs.length > 0 ? (
        <>
          <ul className="runs">
            {runs.map((r) => (
              <li key={r.id}>
                <div className="run-head">
                  <strong>{r.name}</strong>
                  <time>{fmtDate(r)}</time>
                </div>
                <dl className="stats">
                  <div className="km"><dt>Km</dt><dd>{fmtKm(r.distance_m)}</dd></div>
                  <div><dt>Tempo</dt><dd>{fmtTime(r.elapsed_time_s)}</dd></div>
                  <div><dt>Passo /km</dt><dd>{fmtPace(r.moving_time_s, r.distance_m)}</dd></div>
                </dl>
                <div className="run-foot">
                  <span>In movimento {fmtTime(r.moving_time_s)}</span>
                  <a href={`https://www.strava.com/activities/${r.id}`} target="_blank" rel="noopener">Vedi su Strava</a>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : conn ? (
        <p>Nessuna corsa salvata. Si aggiornano ogni notte, oppure premi Aggiorna adesso da Strava.</p>
      ) : null}
    </main>
  );
}
