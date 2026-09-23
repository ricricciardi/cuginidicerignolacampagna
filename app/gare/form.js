import { DIST_MIN, DIST_MAX, DIST_STEP, NAME_MAX } from '@/lib/competition';
import Avatar from '../avatar';
import { getT } from '@/lib/lingua';

// Modulo condiviso da "Crea" e "Modifica". I valori arrivano dall'URL dopo un errore.
// people: tutti gli iscritti [{ id, name, avatar_url, strava }]; values.participants: id spuntati.
export default async function CompetitionForm({ action, values, people, errors = {}, submit }) {
  const t = await getT();
  const err = (k) => errors[k] && <span className="field-error">{t(errors[k])}</span>;
  const chosen = new Set((values.participants ?? []).map(Number));
  return (
    <form className="stack" method="post" action={action}>
      <label>{t('Nome della gara')}
        <input name="name" required maxLength={NAME_MAX} defaultValue={values.name ?? ''} placeholder={t('Es. Gara dei cugini 2026')} />
        {err('name')}
      </label>
      <label className="check toggle">
        <input type="checkbox" name="total_km" defaultChecked={values.total_km ?? false} />
        <span>
          <strong>{t('Classifica a km totali')}</strong>
          {t('Vince chi corre più km nel periodo della gara: si sommano tutte le corse, di qualunque lunghezza. Non serve la distanza.')}
        </span>
      </label>

      {/* Con i km totali accesi distanza, punteggio e miglior parziale non servono e si nascondono (CSS). */}
      <label className="per-distanza">{t('Distanza in metri')}
        <input name="distance_m" type="number" inputMode="numeric" min={DIST_MIN} max={DIST_MAX} step={DIST_STEP}
               defaultValue={values.distance_m ?? ''} placeholder="5000" />
        <span className="hint">{t('A passi di 100 m: 500 per mezzo chilometro, 5000 per 5 km, 21100 per la mezza maratona. Se la corsa è più lunga, conta il tempo al passaggio di questa distanza (o il parziale migliore, vedi sotto).')}</span>
        {err('distance_m')}
      </label>
      <div className="dates">
        <label>{t('Inizio')}
          <input name="start_date" type="date" required defaultValue={values.start_date ?? ''} />
          {err('start_date')}
        </label>
        <label>{t('Fine')}
          <input name="end_date" type="date" required defaultValue={values.end_date ?? ''} />
          {err('end_date')}
        </label>
      </div>
      <p className="hint">
        {t('Ora italiana: si parte alle 00:00 del giorno di inizio e si chiude alle 24:00 del giorno di fine. Tutto resta modificabile anche a gara partita: classifiche e tempi si ricalcolano.')}
      </p>

      <label className="check toggle per-distanza">
        <input type="checkbox" name="age_grading" defaultChecked={values.age_grading ?? true} />
        <span>
          <strong>{t('Applica il coefficiente età e sesso')}</strong>
          {t('Aggiunge la classifica a punteggio accanto a quella a tempo. Vale dal miglio (1.609 m) in su: per le gare più corte c\'è solo il tempo.')}
        </span>
      </label>

      <label className="check toggle per-distanza">
        <input type="checkbox" name="best_segment" defaultChecked={values.best_segment ?? false} />
        <span>
          <strong>{t('Conta il miglior parziale della corsa')}</strong>
          {t('Vale il parziale più veloce lungo quanto la gara, in qualunque punto della corsa: in una gara di 1 km, chi corre 5 km prende il suo km migliore. Spenta, conta il tempo dalla partenza.')}
        </span>
      </label>

      <fieldset className="people">
        <legend>{t('Partecipanti')}</legend>
        <p className="hint">{t('Chi non partecipa non vede la gara. In classifica compare solo chi ha collegato Strava.')}</p>
        {err('participants')}
        <ul>
          {people.map((p) => (
            <li key={p.id}>
              <label className="person">
                <input type="checkbox" name="participants" value={p.id} defaultChecked={chosen.has(p.id)} />
                <Avatar name={p.name} src={p.avatar_url} size="sm" />
                <span>
                  {p.name}
                  {!p.strava && <small>{t('Strava non collegato')}</small>}
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
