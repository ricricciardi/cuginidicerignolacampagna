'use client';
import { usePathname } from 'next/navigation';
import { useT } from './lang-provider';

// «Powered by Strava» (obbligatorio per le regole di Strava, logo non modificato), preceduto dal
// nostro nome così è chiaro che l'app è dei cugini e Strava è la fonte dei dati. Solo nelle pagine
// che mostrano dati di Strava: le pagine di una gara e Le mie corse.
const WITH_STRAVA_DATA = [/^\/gare\/\d+/, /^\/dashboard/];

export default function StravaAttribution() {
  const path = usePathname();
  const t = useT();
  if (!WITH_STRAVA_DATA.some((re) => re.test(path))) return null;
  return (
    <footer className="strava-attrib">
      <span>{t('Un\'app dei Cuginidicerignolacampagna · dati da')}</span>
      <a href="https://www.strava.com" target="_blank" rel="noopener">
        <img src="/powered-by-strava.svg" alt="Powered by Strava" width="110" height="11" />
      </a>
    </footer>
  );
}
