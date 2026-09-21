'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Sesso e data di nascita: si salvano senza ricaricare la pagina, così non si sposta niente.
// L'esito compare nel pulsante e sotto il modulo. Senza JavaScript il modulo si invia come prima.
export default function ProfileForm({ sex, birthDate, today }) {
  const router = useRouter();
  const [state, setState] = useState('idle'); // idle | saving | saved | error

  const submit = async (e) => {
    e.preventDefault();
    setState('saving');
    try {
      const res = await fetch('/api/profilo', {
        method: 'POST', body: new FormData(e.currentTarget), headers: { Accept: 'application/json' },
      });
      setState(res.ok ? 'saved' : 'error');
      if (res.ok) router.refresh(); // aggiorna l'etichetta «Completo» senza muovere la pagina
    } catch {
      setState('error');
    }
  };

  return (
    <form className="stack" method="post" action="/api/profilo" onSubmit={submit}
          onChange={() => state !== 'saving' && setState('idle')}>
      <div className="dates">
        <label>Sesso
          <select name="sex" required defaultValue={sex ?? ''}>
            <option value="" disabled>Scegli</option>
            <option value="M">Uomo</option>
            <option value="F">Donna</option>
          </select>
        </label>
        <label>Data di nascita
          <input type="date" name="birth_date" required defaultValue={birthDate ?? ''} max={today} />
        </label>
      </div>
      <button type="submit" disabled={state === 'saving'} data-state={state}>
        {state === 'saving' ? 'Salvataggio…' : state === 'saved' ? 'Salvato ✓' : 'Salva'}
      </button>
      <p className="field-error" role="status" aria-live="polite" hidden={state !== 'error'}>
        Controlla sesso e data di nascita: la data deve essere reale e non futura.
      </p>
    </form>
  );
}
