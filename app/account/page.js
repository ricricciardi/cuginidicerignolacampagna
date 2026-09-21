import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { isAdmin } from '@/lib/admin';
import ProfileForm from './profile-form';
import PhotoPicker from './photo-picker';
import StravaLogo from '../strava-logo';

const fmtStamp = (d) => new Date(d).toLocaleString('it-IT', {
  timeZone: 'Europe/Rome', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const ERRORS = {
  consent: 'Per collegare Strava serve il consenso a mostrare i tuoi tempi agli altri iscritti.',
  state: 'Il collegamento con Strava è scaduto o non è valido. Riprova.',
  denied: 'Hai annullato il collegamento con Strava.',
  scope: 'Per leggere le corse serve il permesso di accesso alle attività. Ricollega Strava lasciandolo attivo.',
  athlete_taken: 'Questo account Strava è già collegato a un altro utente del sito.',
  not_connected: 'Collega prima il tuo account Strava.',
  profilo: 'Controlla sesso e data di nascita: la data deve essere reale e non futura.',
};

export default async function Account({ searchParams }) {
  const userId = await getUserId();
  if (!userId) redirect('/login');
  const sp = await searchParams;

  const [me] = await sql`select email, sex, birth_date, photo_v from users where id = ${userId}`;
  const [conn] = await sql`select athlete_name, avatar_url, scope, connected_at, last_synced_at, last_sync_error
                           from strava_connections where user_id = ${userId}`;

  const admin = await isAdmin(userId);
  const revoked = conn?.last_sync_error === 'revoked';
  const readAll = conn?.scope.includes('activity:read_all');

  return (
    <main>
      <div className="account-head">
        <PhotoPicker name={conn?.athlete_name ?? me?.email}
                     src={me?.photo_v ? `/api/foto/${userId}?v=${me.photo_v}` : conn?.avatar_url}
                     custom={Boolean(me?.photo_v)} strava={Boolean(conn?.avatar_url)} />
        <div>
          <h1>{conn?.athlete_name || 'Il mio account'}</h1>
          <p className="hint">{me?.email}</p>
        </div>
      </div>

      {sp.error === 'profilo' && <div className="notice error">{ERRORS.profilo}</div>}
      {sp.profilo && <div className="notice">Dati salvati.</div>}

      <section className="card" id="profilo" aria-labelledby="profilo-title">
        <div className="card-head">
          <h2 id="profilo-title">Classifica per età e sesso</h2>
          {me?.sex && me?.birth_date ? <span className="pill ok">Completo</span> : <span className="pill">Da compilare</span>}
        </div>
        <p className="hint">
          Servono per confrontare i tempi di età e sesso diversi con le tabelle USATF 2025.
          La data di nascita non viene mai mostrata agli altri: vedono solo il punteggio. <a href="/regolamento#eta">Come funziona</a>
        </p>
        <ProfileForm sex={me?.sex} birthDate={me?.birth_date} today={new Date().toISOString().slice(0, 10)} />
      </section>

      {/* #strava: ci portano i link «collega Strava» e i ritorni da Strava; i loro messaggi stanno qui. */}
      <section className="card strava-card" id="strava" aria-labelledby="strava-title">
        <div className="card-head">
          <h2 id="strava-title">Strava</h2>
          {!conn ? <span className="pill">Non collegato</span>
            : revoked ? <span className="pill warn">Da ricollegare</span>
            : <span className="pill ok">Collegato</span>}
        </div>
        {sp.collega && !conn && (
          <div className="notice">Per vedere le gare e le tue corse collega prima il tuo account Strava.</div>
        )}
        {sp.error && sp.error !== 'profilo' && <div className="notice error">{ERRORS[sp.error] ?? 'Qualcosa non ha funzionato.'}</div>}
        {sp.connected && <div className="notice">Strava collegato. Ora aggiorna le corse da <a href="/dashboard">Le mie corse</a>.</div>}
        {sp.disconnected && <div className="notice">Strava scollegato. Le tue corse salvate sono state cancellate.</div>}
        {conn ? (
          <div className="strava-status">
            {revoked ? (
              <div className="notice error">Strava non riconosce più il collegamento: ricollegalo per aggiornare le corse.</div>
            ) : (
              <p className="status-ok">Account <strong>{conn.athlete_name || 'atleta Strava'}</strong></p>
            )}
            <dl className="status-list">
              <div><dt>Collegato dal</dt><dd>{fmtStamp(conn.connected_at)}</dd></div>
              <div><dt>Ultimo aggiornamento</dt><dd>{conn.last_synced_at ? fmtStamp(conn.last_synced_at) : 'mai'}</dd></div>
              <div><dt>Attività «Solo io»</dt><dd>{readAll ? 'incluse' : 'escluse'}</dd></div>
            </dl>
            {/* Ricollegare serve solo con l'accesso revocato o senza le attività «Solo io».
                Il consenso è già stato dato. */}
            {(revoked || !readAll) && (
              <form className="reconnect" method="get" action="/api/strava/connect">
                <p className="hint">
                  {revoked
                    ? 'Ricollega per riprendere ad aggiornare le corse.'
                    : 'Ricollega e lascia attivo il permesso sulle attività private per contare anche le corse «Solo io».'}
                </p>
                <input type="hidden" name="consenso" value="1" />
                <button className="button strava" type="submit"><StravaLogo />Ricollega Strava</button>
              </form>
            )}
            <details className="disconnect">
              <summary>Scollega Strava</summary>
              <p className="hint">
                Revochiamo l'accesso su Strava e cancelliamo le tue corse salvate: sparisci dalle classifiche
                finché non ricolleghi. Le corse su Strava non vengono toccate.
              </p>
              <form method="post" action="/api/strava/disconnect">
                <button className="danger" type="submit">Sì, scollega e cancella</button>
              </form>
            </details>
          </div>
        ) : (
          <form className="consent" method="get" action="/api/strava/connect">
            <label className="check">
              <input type="checkbox" name="consenso" value="1" required />
              <span>
                Acconsento che il mio nome Strava, la mia foto Strava, le date e i tempi delle mie corse, comprese
                quelle impostate come «Solo io», siano visibili agli altri iscritti al sito
                nelle classifiche, compresa quella per età e sesso, nei confronti delle gare e nella mia pagina dei progressi.
              </span>
            </label>
            <button className="button strava" type="submit"><StravaLogo />Collega con Strava</button>
          </form>
        )}
      </section>

      {admin && (
        <section className="card" aria-labelledby="admin-title">
          <div className="card-head">
            <h2 id="admin-title">Amministrazione</h2>
            <span className="pill ok">Admin</span>
          </div>
          <ul className="admin-links">
            <li><a href="/gare/impostazioni">Impostazioni gare<small>Crea, modifica ed elimina le gare</small></a></li>
            <li><a href="/account/utenti">Utenti<small>Chi è iscritto, stato di Strava, elimina</small></a></li>
          </ul>
        </section>
      )}

      <section className="logout">
        <a className="rules-link" href="/regolamento">Regolamento</a>
        <form method="post" action="/api/auth/logout">
          <button className="quiet" type="submit">Esci dall'account</button>
        </form>
      </section>
    </main>
  );
}
