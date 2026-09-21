'use client';
import { useEffect } from 'react';
import { useT } from './lang-provider';

// Errori nel caricamento di una pagina. Il caso tipico, subito dopo un rilascio: il telefono ha
// ancora aperta la versione vecchia e cerca file che non esistono più. Lì si ricarica da solo
// (una volta sola, per non entrare in un giro infinito); per gli altri errori c'è «Ricarica».
const isStale = (e) => /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i
  .test(`${e?.name} ${e?.message}`);

export default function Error({ error, reset }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
    if (!isStale(error)) return;
    try {
      if (sessionStorage.getItem('ricaricato')) return;
      sessionStorage.setItem('ricaricato', '1');
    } catch {}
    window.location.reload();
  }, [error]);

  return (
    <main>
      <h1>{t('Ops')}</h1>
      <p>{t('Qualcosa non ha funzionato nel caricare la pagina. Di solito basta ricaricarla.')}</p>
      <button type="button" onClick={() => { try { sessionStorage.removeItem('ricaricato'); } catch {} window.location.reload(); }}>
        {t('Ricarica')}
      </button>
      <p><button type="button" className="quiet" onClick={() => reset()}>{t('Riprova senza ricaricare')}</button></p>
    </main>
  );
}
