import { fmtTime } from './format.js';

// Confronto di una classifica prima e dopo un aggiornamento: chi ha fatto un nuovo record e chi
// è stato superato. before/after: Map userId -> { pos, time_s, name } (solo chi ha un tempo).
// Restituisce [{ userId, title, body }]. Funzione pura: niente database, facile da provare.
// t: traduzione (di chi riceve la notifica); senza, italiano.
export function standingsChanges(comp, before, after, t = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => v?.[k] ?? m)) {
  const out = [];
  for (const [uid, now] of after) {
    const was = before.get(uid);
    if (!was || now.time_s < was.time_s) {
      out.push({
        userId: uid,
        title: t('Nuovo record in {gara}', { gara: comp.name }),
        body: t('{tempo} sui primi {km} km: sei {pos}°.', { tempo: fmtTime(now.time_s), km: comp.km, pos: now.pos }),
      });
      continue; // chi ha appena migliorato non riceve anche «ti hanno superato»
    }
    if (now.pos <= was.pos) continue;
    // Superato da chi ora gli sta davanti ma prima era dietro (o non aveva ancora un tempo).
    const passers = [...after]
      .filter(([other, o]) => other !== uid && o.pos < now.pos && (!before.has(other) || before.get(other).pos > was.pos))
      .map(([, o]) => o.name || t('Un cugino'));
    if (!passers.length) continue;
    const who = passers.length === 1
      ? t('{nome} ti ha superato', { nome: passers[0] })
      : t('{nomi} e {ultimo} ti hanno superato', { nomi: passers.slice(0, -1).join(', '), ultimo: passers.at(-1) });
    out.push({ userId: uid, title: t('Sorpasso in {gara}', { gara: comp.name }), body: t('{chi}: ora sei {pos}°.', { chi: who, pos: now.pos }) });
  }
  return out;
}
