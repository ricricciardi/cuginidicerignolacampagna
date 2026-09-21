'use client';
import { useState } from 'react';
import StravaLogo from '../strava-logo';

// «Aggiorna adesso da Strava»: la lettura richiede qualche secondo, intanto il pulsante lo dice.
export default function SyncButton() {
  const [busy, setBusy] = useState(false);
  return (
    <form method="post" action="/api/strava/sync" onSubmit={() => setBusy(true)}>
      <button className="button strava" type="submit" disabled={busy} data-state={busy ? 'saving' : undefined}>
        <StravaLogo />
        {busy ? 'Aggiornamento da Strava…' : 'Aggiorna adesso da Strava'}
      </button>
    </form>
  );
}
