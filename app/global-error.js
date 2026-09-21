'use client';
import { useEffect } from 'react';

// Ultima rete di sicurezza: errore anche nella struttura della pagina (intestazione e tab).
// Stessa logica di app/error.js, ma con html e body propri e stili in linea.
const isStale = (e) => /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i
  .test(`${e?.name} ${e?.message}`);

export default function GlobalError({ error }) {
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
    <html lang="it">
      <body style={{ margin: 0, minHeight: '100vh', background: '#120a24', color: '#f4f1ff', fontFamily: 'system-ui, sans-serif',
                     display: 'grid', placeItems: 'center', padding: '1.25rem', textAlign: 'center' }}>
        <div>
          <h1 style={{ color: '#d7ff1f' }}>Ops</h1>
          <p>Qualcosa non ha funzionato. Di solito basta ricaricare la pagina.</p>
          <button type="button" onClick={() => { try { sessionStorage.removeItem('ricaricato'); } catch {} window.location.reload(); }}
                  style={{ font: 'inherit', fontWeight: 800, padding: '.75rem 1.5rem', borderRadius: 999, border: 0, background: '#d7ff1f', color: '#140a24' }}>
            Ricarica
          </button>
        </div>
      </body>
    </html>
  );
}
