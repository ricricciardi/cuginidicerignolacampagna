import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { fmtTime, fmtPace, fmtDate, fmtKm } from '@/lib/format';
import { syncScope } from '@/lib/sync';
import Avatar from '../avatar';

const fmtStamp = (d) => new Date(d).toLocaleString('it-IT', {
  timeZone: 'Europe/Rome', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});

const ERRORS = {
  consent: 'Per collegare Strava serve il consenso a mostrare i tuoi tempi agli altri iscritti.',
  state: 'Il collegamento con Strava è scaduto o non è valido. Riprova.',
  denied: 'Hai annullato il collegamento con Strava.',
  scope: 'Per leggere le corse serve il permesso di accesso alle attività. Ricollega Strava lasciandolo attivo.',
  athlete_taken: 'Questo account Strava è già collegato a un altro utente del sito.',
  not_connected: 'Collega prima il tuo account Strava.',
  rate: 'Strava ha raggiunto il limite di richieste. Riprova tra 15 minuti: le corse già lette restano salvate.',
  revoked: 'Strava non riconosce più il collegamento. Ricollega il tuo account.',
  no_race: 'Nessuna gara è ancora partita: non ci sono corse da leggere.',
};

export default async function Dashboard({ searchParams }) {
  const userId = await getUserId();
  if (!userId) redirect('/login');
  const sp = await searchParams;

  const [conn] = await sql`select athlete_name, avatar_url, last_synced_at from strava_connections where user_id = ${userId}`;
  const runs = await sql`select * from activities where user_id = ${userId} order by start_date desc`;
  const pending = Number(sp.pending ?? 0);
  const anyStarted = Boolean(await syncScope());

  return (
    <main>
      <h1>Le mie corse</h1>
      <p>Corse su strada con GPS nei periodi delle gare. I tempi per ogni gara sono nelle pagine delle gare.</p>

      {sp.error && <div className="notice error">{ERRORS[sp.error] ?? 'Qualcosa non ha funzionato.'}</div>}
      {sp.connected && <div className="notice">Strava collegato. Ora aggiorna le attività.</div>}
      {sp.synced !== undefined && (
        <div className="notice">
          {sp.synced} corse nuove salvate.
          {pending > 0 && ` Ne restano ${pending}: premi di nuovo Aggiorna adesso o aspetta l\'aggiornamento di stanotte.`}
        </div>
      )}

      {conn ? (
        <div className="bar">
          <span className="connected">
            <Avatar name={conn.athlete_name} src={conn.avatar_url} />
            Collegato come <strong>{conn.athlete_name || 'atleta Strava'}</strong>.
            {' '}Le corse si aggiornano da sole ogni notte
            {conn.last_synced_at ? `; ultimo aggiornamento ${fmtStamp(conn.last_synced_at)}.` : '.'}
          </span>
          {!anyStarted ? (
            <div className="notice">Sei pronto. Le corse si leggono da quando parte la prima gara.</div>
          ) : (
            <form method="post" action="/api/strava/sync"><button type="submit">Aggiorna adesso</button></form>
          )}
        </div>
      ) : (
        <form className="consent" method="get" action="/api/strava/connect">
          <label className="check">
            <input type="checkbox" name="consenso" value="1" required />
            <span>
              Acconsento che il mio nome Strava, la mia foto Strava, le date e i tempi delle mie corse, comprese
              quelle impostate come «Solo io», siano visibili agli altri iscritti al sito
              nelle classifiche e nei confronti delle gare e nella mia pagina dei progressi.
            </span>
          </label>
          <button className="button strava" type="submit">Collega con Strava</button>
        </form>
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
        <p>Nessuna corsa salvata. Si aggiornano ogni notte, oppure premi Aggiorna adesso.</p>
      ) : null}
    </main>
  );
}
