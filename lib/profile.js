// Sesso e data di nascita, per il punteggio per età e sesso: controllo dei valori del modulo.
// Restituisce { sex, birth } se validi, altrimenti null.
export function validProfile(sexRaw, birthRaw, today = new Date()) {
  const sex = String(sexRaw ?? '');
  const birth = String(birthRaw ?? '');
  const parsed = new Date(birth + 'T00:00:00Z');
  const ok = ['M', 'F'].includes(sex) && /^\d{4}-\d{2}-\d{2}$/.test(birth) && !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === birth && birth >= '1920-01-01' && birth <= today.toISOString().slice(0, 10);
  return ok ? { sex, birth } : null;
}
