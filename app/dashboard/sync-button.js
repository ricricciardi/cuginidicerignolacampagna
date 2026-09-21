'use client';
import { useState } from 'react';
import StravaLogo from '../strava-logo';
import { useT } from '../lang-provider';

// «Aggiorna adesso da Strava»: la lettura richiede qualche secondo, intanto il pulsante lo dice.
export default function SyncButton() {
  const [busy, setBusy] = useState(false);
  const t = useT();
  return (
    <form method="post" action="/api/strava/sync" onSubmit={() => setBusy(true)}>
      <button className="button strava" type="submit" disabled={busy} data-state={busy ? 'saving' : undefined}>
        <StravaLogo />
        {busy ? t('Aggiornamento da Strava…') : t('Aggiorna adesso da Strava')}
      </button>
    </form>
  );
}
