'use client';
import { useT } from '../lang-provider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Sesso e data di nascita: si salvano senza ricaricare la pagina, così non si sposta niente.
// L'esito compare nel pulsante e sotto il modulo. Senza JavaScript il modulo si invia come prima.
export default function ProfileForm({ sex, birthDate, today }) {
  const router = useRouter();
  const [state, setState] = useState('idle'); // idle | saving | saved | error
  const t = useT();

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
        <label>{t('Sesso')}
          <select name="sex" required defaultValue={sex ?? ''}>
            <option value="" disabled>{t('Scegli')}</option>
            <option value="M">{t('Uomo')}</option>
            <option value="F">{t('Donna')}</option>
          </select>
        </label>
        <label>{t('Data di nascita')}
          <input type="date" name="birth_date" required defaultValue={birthDate ?? ''} max={today} />
        </label>
      </div>
      <button type="submit" disabled={state === 'saving'} data-state={state}>
        {state === 'saving' ? t('Salvataggio…') : state === 'saved' ? t('Salvato ✓') : t('Salva')}
      </button>
      <p className="field-error" role="status" aria-live="polite" hidden={state !== 'error'}>
        {t('Controlla sesso e data di nascita: la data deve essere reale e non futura.')}
      </p>
    </form>
  );
}
