import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import { isAdmin } from '@/lib/admin';
import ProfileForm from './profile-form';
import PhotoPicker from './photo-picker';
import StravaLogo from '../strava-logo';
import StravaConsent from '../strava-consent';
import { getT } from '@/lib/lingua';
import LangSwitch from '../lang-switch';
import PushToggle from './push-toggle';
import { ReopenTour } from '../tour';
import { InstallCard } from '../install-app';
import { pushPublicKey } from '@/lib/push';
import ScrollTo from './scroll-to';

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
  const t = await getT();

  const [[me], [conn], admin] = await Promise.all([
    sql`select email, sex, birth_date, photo_v from users where id = ${userId}`,
    sql`select athlete_name, avatar_url, scope, connected_at, last_synced_at, last_sync_error
        from strava_connections where user_id = ${userId}`,
    isAdmin(userId),
  ]);
  const revoked = conn?.last_sync_error === 'revoked';
  const readAll = conn?.scope.includes('activity:read_all');

  return (
    <main>
      <div className="account-head">
        <PhotoPicker name={conn?.athlete_name ?? me?.email}
                     src={me?.photo_v ? `/api/foto/${userId}?v=${me.photo_v}` : conn?.avatar_url}
                     custom={Boolean(me?.photo_v)} strava={Boolean(conn?.avatar_url)} />
        <div>
          <h1>{conn?.athlete_name || t('Il mio account')}</h1>
          <p className="hint">{me?.email}</p>
        </div>
      </div>

      {sp.error === 'profilo' && <div className="notice error">{t(ERRORS.profilo)}</div>}
      {sp.profilo && <div className="notice">{t('Dati salvati.')}</div>}

      <section className="card" id="profilo" aria-labelledby="profilo-title">
        <div className="card-head">
          <h2 id="profilo-title">{t('Dati per il punteggio')}</h2>
          {me?.sex && me?.birth_date ? <span className="pill ok">{t('Completo')}</span> : <span className="pill">{t('Da compilare')}</span>}
        </div>
        <p className="hint">
          {t('Servono per confrontare i tempi di età e sesso diversi con le tabelle USATF 2025. La data di nascita non viene mai mostrata agli altri: vedono solo il punteggio.')}
          {' '}<Link href="/regolamento#eta">{t('Come funziona')}</Link>
        </p>
        <ProfileForm sex={me?.sex} birthDate={me?.birth_date} today={new Date().toISOString().slice(0, 10)} />
      </section>

      {/* #strava: ci portano i link «collega Strava» e i ritorni da Strava; i loro messaggi stanno qui. */}
      <section className="card strava-card" id="strava" aria-labelledby="strava-title">
        <div className="card-head">
          <h2 id="strava-title">{t('Strava')}</h2>
          {!conn ? <span className="pill">{t('Non collegato')}</span>
            : revoked ? <span className="pill warn">{t('Da ricollegare')}</span>
            : <span className="pill ok">{t('Collegato')}</span>}
        </div>
        {sp.error && sp.error !== 'profilo' && <div className="notice error">{t(ERRORS[sp.error] ?? 'Qualcosa non ha funzionato.')}</div>}
        {sp.connected && <div className="notice">{t('Strava collegato. Ora aggiorna le corse da')} <Link href="/dashboard">{t('Le mie corse')}</Link>.</div>}
        {sp.disconnected && <div className="notice">{t('Strava scollegato. Le tue corse salvate sono state cancellate.')}</div>}
        {conn ? (
          <div className="strava-status">
            {revoked ? (
              <div className="notice error">{t('Strava non riconosce più il collegamento: ricollegalo per aggiornare le corse.')}</div>
            ) : (
              <p className="status-ok">{t('Account')} <strong>{conn.athlete_name || t('atleta Strava')}</strong></p>
            )}
            <dl className="status-list">
              <div><dt>{t('Collegato dal')}</dt><dd>{fmtStamp(conn.connected_at)}</dd></div>
              <div><dt>{t('Ultimo aggiornamento')}</dt><dd>{conn.last_synced_at ? fmtStamp(conn.last_synced_at) : t('mai')}</dd></div>
              <div><dt>{t('Attività «Solo io»')}</dt><dd>{readAll ? t('incluse') : t('escluse')}</dd></div>
            </dl>
            {/* Ricollegare serve solo con l'accesso revocato o senza le attività «Solo io».
                Il consenso è già stato dato. */}
            {(revoked || !readAll) && (
              <form className="reconnect" method="get" action="/api/strava/connect">
                <p className="hint">
                  {revoked
                    ? t('Ricollega per riprendere ad aggiornare le corse.')
                    : t('Ricollega e lascia attivo il permesso sulle attività private per contare anche le corse «Solo io».')}
                </p>
                <input type="hidden" name="consenso" value="1" />
                <button className="button strava" type="submit"><StravaLogo />{t('Ricollega Strava')}</button>
              </form>
            )}
            <details className="disconnect">
              <summary>{t('Scollega Strava')}</summary>
              <p className="hint">
                {t('Revochiamo l\'accesso su Strava e cancelliamo le tue corse salvate: sparisci dalle classifiche finché non ricolleghi. Le corse su Strava non vengono toccate.')}
              </p>
              <form method="post" action="/api/strava/disconnect">
                <button className="danger" type="submit">{t('Sì, scollega e cancella')}</button>
              </form>
            </details>
          </div>
        ) : (
          <StravaConsent />
        )}
      </section>

      <PushToggle publicKey={pushPublicKey()} />

      {admin && (
        <section className="card" id="admin" aria-labelledby="admin-title">
          <div className="card-head">
            <h2 id="admin-title">{t('Amministrazione')}</h2>
            <span className="pill ok">{t('Admin')}</span>
          </div>
          {(sp.tutti || sp.webhook) && <ScrollTo id="admin" />}
          <ul className="admin-links">
            <li><Link href="/gare/impostazioni">{t('Impostazioni gare')}<small>{t('Crea, modifica ed elimina le gare')}</small></Link></li>
            <li><Link href="/account/utenti">{t('Utenti')}<small>{t('Chi è iscritto, stato di Strava, elimina')}</small></Link></li>
          </ul>
          {sp.tutti === 'ok' && <div className="notice">{t('Aggiornati {fatti} iscritti su {di}: {n} corse nuove salvate.', { fatti: sp.fatti, di: sp.di, n: sp.salvate })}{sp.resta && ` ${t('Non è finito tutto: premi di nuovo tra qualche minuto.')}`}</div>}
          {sp.tutti === 'nessuna_gara' && <div className="notice">{t('Nessuna gara è ancora partita: non c\'è niente da leggere.')}</div>}
          <form className="webhook-form" method="post" action="/api/strava/sync-tutti">
            <p className="hint">{t('Legge subito da Strava le corse nuove di tutti gli iscritti, come l\'aggiornamento del mattino. Può metterci fino a un minuto.')}</p>
            <button className="button secondary" type="submit">{t('Aggiorna tutti da Strava')}</button>
          </form>
          {/* Avvisi in tempo reale da Strava: corse nuove, modificate o cancellate (una volta sola) */}
          {sp.webhook === 'attivo' && <div className="notice">{t('Gli aggiornamenti in tempo reale da Strava sono già attivi.')}</div>}
          {sp.webhook === 'attivato' && <div className="notice">{t('Aggiornamenti in tempo reale da Strava attivati.')}</div>}
          {sp.webhook === 'errore' && <div className="notice error">{t('Strava non ha accettato l\'iscrizione. Riprova tra qualche minuto.')}</div>}
          <form className="webhook-form" method="post" action="/api/strava/webhook/iscrizione">
            <p className="hint">{t('Con gli aggiornamenti in tempo reale, le corse nuove, modificate o cancellate su Strava si aggiornano subito anche qui. Basta attivarli una volta.')}</p>
            <button className="button secondary" type="submit">{t('Attiva o controlla gli aggiornamenti da Strava')}</button>
          </form>
        </section>
      )}

      <section className="card" id="lingua" aria-labelledby="lingua-title">
        <div className="card-head">
          <h2 id="lingua-title">{t('Lingua')}</h2>
        </div>
        <p className="hint">{t('Scegli come vuoi leggere il sito. Il cerignolano è una prima versione: se trovi una parola sbagliata, dillo all\'amministratore.')}</p>
        <LangSwitch back="/account#lingua" />
      </section>

      <InstallCard />

      <section className="logout">
        <Link className="rules-link" href="/regolamento">{t('Regolamento')}</Link>
        <ReopenTour />
        <form method="post" action="/api/auth/logout">
          <button className="quiet" type="submit">{t('Esci dall\'account')}</button>
        </form>
      </section>
    </main>
  );
}
