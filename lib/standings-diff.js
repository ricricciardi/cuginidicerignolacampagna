import { fmtTime } from './format.js';

// Confronto di una classifica prima e dopo un aggiornamento: chi ha fatto un nuovo record e chi
// è stato superato. before/after: Map userId -> { pos, time_s, name } (solo chi ha un tempo).
// Restituisce [{ userId, title, body }]. Funzione pura: niente database, facile da provare.
export function standingsChanges(comp, before, after) {
  const out = [];
  for (const [uid, now] of after) {
    const was = before.get(uid);
    if (!was || now.time_s < was.time_s) {
      out.push({
        userId: uid,
        title: `Nuovo record in ${comp.name}`,
        body: `${fmtTime(now.time_s)} sui primi ${comp.km} km: sei ${now.pos}°.`,
      });
      continue; // chi ha appena migliorato non riceve anche «ti hanno superato»
    }
    if (now.pos <= was.pos) continue;
    // Superato da chi ora gli sta davanti ma prima era dietro (o non aveva ancora un tempo).
    const passers = [...after]
      .filter(([other, o]) => other !== uid && o.pos < now.pos && (!before.has(other) || before.get(other).pos > was.pos))
      .map(([, o]) => o.name || 'Un cugino');
    if (!passers.length) continue;
    const who = passers.length === 1 ? `${passers[0]} ti ha superato` : `${passers.slice(0, -1).join(', ')} e ${passers.at(-1)} ti hanno superato`;
    out.push({ userId: uid, title: `Sorpasso in ${comp.name}`, body: `${who}: ora sei ${now.pos}°.` });
  }
  return out;
}
