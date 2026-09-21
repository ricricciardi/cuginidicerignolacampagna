import { KM_MIN, KM_MAX, NAME_MAX } from '@/lib/competition';
import Avatar from '../avatar';

// Modulo condiviso da "Crea" e "Modifica". I valori arrivano dall'URL dopo un errore.
// people: tutti gli iscritti [{ id, name, avatar_url, strava }]; values.participants: id spuntati.
export default function CompetitionForm({ action, values, people, errors = {}, submit }) {
  const err = (k) => errors[k] && <span className="field-error">{errors[k]}</span>;
  const chosen = new Set((values.participants ?? []).map(Number));
  return (
    <form className="stack" method="post" action={action}>
      <label>Nome della gara
        <input name="name" required maxLength={NAME_MAX} defaultValue={values.name ?? ''} placeholder="Es. Gara dei cugini 2026" />
        {err('name')}
      </label>
      <label>Km
        <input name="km" type="number" inputMode="numeric" required min={KM_MIN} max={KM_MAX} step={1}
               defaultValue={values.km ?? ''} />
        <span className="hint">Conta il tempo al passaggio di questo chilometro, anche se la corsa è più lunga.</span>
        {err('km')}
      </label>
      <div className="dates">
        <label>Inizio
          <input name="start_date" type="date" required defaultValue={values.start_date ?? ''} />
          {err('start_date')}
        </label>
        <label>Fine
          <input name="end_date" type="date" required defaultValue={values.end_date ?? ''} />
          {err('end_date')}
        </label>
      </div>
      <p className="hint">
        Ora italiana: si parte alle 00:00 del giorno di inizio e si chiude alle 24:00 del giorno di fine.
        Tutto resta modificabile anche a gara partita: classifiche e tempi si ricalcolano.
      </p>

      <label className="check toggle">
        <input type="checkbox" name="age_grading" defaultChecked={values.age_grading ?? true} />
        <span>
          <strong>Applica il coefficiente età e sesso</strong>
          Aggiunge la classifica a punteggio accanto a quella a tempo.
        </span>
      </label>

      <fieldset className="people">
        <legend>Partecipanti</legend>
        <p className="hint">Chi non partecipa non vede la gara. In classifica compare solo chi ha collegato Strava.</p>
        {err('participants')}
        <ul>
          {people.map((p) => (
            <li key={p.id}>
              <label className="person">
                <input type="checkbox" name="participants" value={p.id} defaultChecked={chosen.has(p.id)} />
                <Avatar name={p.name} src={p.avatar_url} size="sm" />
                <span>
                  {p.name}
                  {!p.strava && <small>Strava non collegato</small>}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <button type="submit">{submit}</button>
    </form>
  );
}
