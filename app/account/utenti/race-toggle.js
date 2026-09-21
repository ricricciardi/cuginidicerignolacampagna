'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Aggiunge o toglie un utente da una gara senza ricaricare la pagina, così si resta dove si è.
// Senza JavaScript resta un form normale che torna sulla scheda.
export default function RaceToggle({ action, competitionId, children }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget, e.nativeEvent.submitter);
    setBusy(true);
    try {
      await fetch(action, { method: 'POST', body: fd, redirect: 'manual' });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form method="post" action={action} onSubmit={onSubmit} aria-busy={busy}>
      <input type="hidden" name="competition_id" value={competitionId} />
      <fieldset disabled={busy} style={{ display: 'contents', border: 0, margin: 0, padding: 0 }}>{children}</fieldset>
    </form>
  );
}
