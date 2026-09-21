import StravaLogo from './strava-logo';

// Consenso e pulsante per collegare Strava: stesso testo nell'account e nella pagina di benvenuto.
// profile: nella pagina di benvenuto chiede anche sesso e data di nascita (servono al punteggio),
// che si salvano prima di andare su Strava. I campi partono sempre vuoti.
export default function StravaConsent({ profile = null }) {
  return (
    <form id="strava-consent" className="consent" method="get" action="/api/strava/connect">
      {profile && (
        <div className="consent-profile">
          <p className="hint">Per il punteggio per età e sesso. La data di nascita non viene mai mostrata agli altri.</p>
          <div className="dates">
            <label>Sesso
              <select name="sex" required defaultValue="">
                <option value="" disabled>Scegli</option>
                <option value="M">Uomo</option>
                <option value="F">Donna</option>
              </select>
            </label>
            <label>Data di nascita
              <input type="date" name="birth_date" required max={profile.today} />
            </label>
          </div>
        </div>
      )}
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
