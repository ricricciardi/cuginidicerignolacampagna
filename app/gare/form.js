import { KM_MIN, KM_MAX, NAME_MAX } from '@/lib/competition';

// Modulo condiviso da "Crea" e "Modifica". I valori arrivano dall'URL dopo un errore.
export default function CompetitionForm({ action, values, errors = {}, submit, locked = false }) {
  const err = (k) => errors[k] && <span className="field-error">{errors[k]}</span>;
  return (
    <form className="stack" method="post" action={action}>
      <label>Nome della gara
        <input name="name" required maxLength={NAME_MAX} defaultValue={values.name ?? ''} placeholder="Es. Gara dei cugini 2026" />
        {err('name')}
      </label>
      <label>Km
        <input name="km" type="number" inputMode="numeric" required min={KM_MIN} max={KM_MAX} step={1}
               defaultValue={values.km ?? ''} disabled={locked} />
        <span className="hint">Conta il tempo al passaggio di questo chilometro, anche se la corsa è più lunga.</span>
        {err('km')}
      </label>
      <div className="dates">
        <label>Inizio
          <input name="start_date" type="date" required defaultValue={values.start_date ?? ''} disabled={locked} />
          {err('start_date')}
        </label>
        <label>Fine
          <input name="end_date" type="date" required defaultValue={values.end_date ?? ''} disabled={locked} />
          {err('end_date')}
        </label>
      </div>
      <p className="hint">
        Ora italiana: si parte alle 00:00 del giorno di inizio e si chiude alle 24:00 del giorno di fine.
        {locked ? ' A gara partita km e date sono bloccati, il nome no.' : ' Dopo la partenza restano modificabili solo i nomi.'}
      </p>
      <button type="submit">{submit}</button>
    </form>
  );
}
