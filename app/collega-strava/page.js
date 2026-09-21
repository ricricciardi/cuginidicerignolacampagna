import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { getUserId } from '@/lib/session';
import StravaConsent from '../strava-consent';

export const metadata = { title: 'Collega Strava — Cuginidicerignolacampagna' };

const ERRORS = {
  consent: 'Per collegare Strava serve la spunta sul consenso.',
  state: 'Il collegamento con Strava è scaduto o non è valido. Riprova.',
  denied: 'Hai annullato il collegamento su Strava. Nessun problema: riprova quando vuoi.',
  scope: 'Su Strava è stato tolto il permesso di leggere le attività. Riprova lasciandolo attivo.',
  athlete_taken: 'Questo account Strava è già collegato a un altro utente del sito.',
  profilo: 'Controlla sesso e data di nascita: la data deve essere reale e non futura.',
};

// Benvenuto: dopo accesso o registrazione, chi non ha ancora Strava arriva qui per collegarlo.
export default async function CollegaStrava({ searchParams }) {
  const userId = await getUserId();
  if (!userId) redirect('/login');
  const [conn] = await sql`select 1 from strava_connections where user_id = ${userId}`;
  if (conn) redirect('/gare');
  const sp = await searchParams;

  return (
    <main className="onboarding">
      <p className="step">Ultimo passo</p>
      <h1>Collega Strava</h1>
      <p>
        Ce l&apos;hai quasi fatta. Le gare dei cugini si corrono con le corse che registri su Strava:
        il sito le legge da lì, da solo, ogni notte.
      </p>
      <ol className="onboarding-steps">
        <li>Indica sesso e data di nascita e spunta il consenso qui sotto.</li>
        <li>Premi <strong>Collega con Strava</strong> e accedi a Strava.</li>
        <li>Su Strava lascia attivi i permessi e premi <strong>Autorizza</strong>.</li>
      </ol>
      {sp.error && <div className="notice error">{ERRORS[sp.error] ?? 'Qualcosa non ha funzionato. Riprova.'}</div>}
      <div className="card strava-card">
        <StravaConsent profile={{ today: new Date().toISOString().slice(0, 10) }} />
      </div>
      <p className="hint">
        Il sito legge solo le corse, non modifica niente su Strava. Puoi scollegarlo quando vuoi dal tuo account.
      </p>
      {process.env.DEV_FAKE_DB === '1' && process.env.NODE_ENV !== 'production' && (
        // Solo in locale: stessi campi del modulo, ma invece di Strava simula il collegamento.
        <p className="onboarding-exit">
          <button className="quiet" type="submit" form="strava-consent" formAction="/api/dev/strava-finto">
            Simula collegamento Strava (solo in locale)
          </button>
        </p>
      )}
      <form className="onboarding-exit" method="post" action="/api/auth/logout">
        <button className="quiet" type="submit">Non ora, esci</button>
      </form>
    </main>
  );
}
