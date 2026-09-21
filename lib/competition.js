// Gare: nome, km (interi), data di inizio e di fine. Date in ora italiana:
// si parte alle 00:00 del giorno di inizio, si chiude alle 24:00 del giorno di fine.

const TZ = 'Europe/Rome';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const KM_MIN = 1;
export const KM_MAX = 100;
export const NAME_MAX = 60;

// Scarto in minuti tra ora italiana e UTC in un certo istante (tiene conto dell'ora legale).
function romeOffsetMinutes(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date);
  const g = (t) => Number(parts.find((p) => p.type === t).value);
  const asUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'));
  return (asUtc - date.getTime()) / 60000;
}

// Mezzanotte italiana di una data 'AAAA-MM-GG'.
export function romeMidnight(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d);
  let t = guess - romeOffsetMinutes(new Date(guess)) * 60000;
  const off = romeOffsetMinutes(new Date(t));
  t = guess - off * 60000;
  return new Date(t);
}

const nextDay = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
};

export function compWindow(c) {
  return { start: romeMidnight(c.start_date), end: romeMidnight(nextDay(c.end_date)) };
}

export function phase(c, now = new Date()) {
  const { start, end } = compWindow(c);
  if (now < start) return 'before';
  if (now < end) return 'running';
  return 'over';
}

// Conta l'ora di partenza della corsa.
export function inWindow(c, date) {
  const { start, end } = compWindow(c);
  const t = new Date(date);
  return t >= start && t < end;
}

export const fmtDay = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('it-IT', {
    timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric',
  });
};

export function remaining(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

// Stato in una riga, per l'elenco delle gare.
// t: funzione di traduzione (lib/i18n.js); senza, resta in italiano.
const plain = (s, v) => (v ? s.replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m) : s);
export function statusLine(c, now = new Date(), t = plain) {
  const p = phase(c, now);
  const { start, end } = compWindow(c);
  const days = (ms) => {
    const r = remaining(ms);
    if (r.d >= 1) return t(r.d === 1 ? '{n} giorno' : '{n} giorni', { n: r.d });
    if (r.h >= 1) return t(r.h === 1 ? '{n} ora' : '{n} ore', { n: r.h });
    return t('{n} min', { n: Math.max(1, r.m) });
  };
  if (p === 'before') return t('Parte tra {tempo}', { tempo: days(start - now) });
  if (p === 'running') return t('In corso, finisce tra {tempo}', { tempo: days(end - now) });
  return t('Conclusa');
}

// Il nome si può cambiare sempre, anche a gara partita.
// Valori del modulo rimandati nell'URL dopo un errore, e riletti dalla pagina.
export function formToQuery(fd, errors) {
  return new URLSearchParams({
    name: fd.get('name') ?? '', km: fd.get('km') ?? '', start_date: fd.get('start_date') ?? '',
    end_date: fd.get('end_date') ?? '', participants: fd.getAll('participants').join(','),
    age_grading: fd.get('age_grading') === 'on' ? '1' : '0', err: JSON.stringify(errors),
  });
}
export function queryToForm(sp) {
  return {
    ...sp, participants: (sp.participants ?? '').split(',').filter(Boolean).map(Number),
    age_grading: sp.age_grading === '1',
  };
}

// Controlla i dati del modulo. Restituisce { value } oppure { errors }.
export function validate(input) {
  const errors = {};
  const name = String(input.name ?? '').trim();
  const kmRaw = String(input.km ?? '').trim();
  const start = String(input.start_date ?? '').trim();
  const end = String(input.end_date ?? '').trim();
  if (!name) errors.name = 'Dai un nome alla gara.';
  else if (name.length > NAME_MAX) errors.name = `Il nome può avere al massimo ${NAME_MAX} caratteri.`;
  const km = Number(kmRaw);
  if (!/^\d+$/.test(kmRaw) || km < KM_MIN || km > KM_MAX) errors.km = `I km devono essere un numero intero tra ${KM_MIN} e ${KM_MAX}.`;
  const okDate = (s) => DATE_RE.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z')) &&
    new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
  if (!okDate(start)) errors.start_date = 'Scegli una data di inizio valida.';
  if (!okDate(end)) errors.end_date = 'Scegli una data di fine valida.';
  if (!errors.start_date && !errors.end_date && end < start) errors.end_date = 'La fine non può essere prima dell\u2019inizio.';
  // Partecipanti: id degli utenti spuntati nel modulo, almeno uno.
  const participants = [...new Set([].concat(input.participants ?? []).map(Number))].filter(Number.isInteger);
  if (!participants.length) errors.participants = 'Scegli almeno un partecipante.';
  return Object.keys(errors).length
    ? { errors }
    : { value: { name, km, start_date: start, end_date: end, participants, age_grading: input.age_grading === 'on' } };
}
