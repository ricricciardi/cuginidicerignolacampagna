import StravaLogo from './strava-logo';

// Consenso e pulsante per collegare Strava: stesso testo nell'account e nella pagina di benvenuto.
export default function StravaConsent() {
  return (
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
  );
}
