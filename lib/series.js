// Dati per il grafico di confronto: una serie per cugino, in ordine di data.
export function buildSeries(rows) {
  const byUser = new Map();
  for (const r of rows) {
    if (r.time_s == null) continue;
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, { userId: r.user_id, name: r.athlete_name, points: [] });
    byUser.get(r.user_id).points.push({ t: new Date(r.start_date).getTime(), s: r.time_s });
  }
  const series = [...byUser.values()];
  for (const x of series) {
    x.points.sort((a, b) => a.t - b.t);
    x.records = recordSteps(x.points);
    x.best = x.records[x.records.length - 1].s;
  }
  // Stesso ordine della classifica: record migliore prima, a parità chi l'ha fatto prima.
  return series.sort((a, b) => a.best - b.best ||
    a.records[a.records.length - 1].t - b.records[b.records.length - 1].t);
}

// Solo le corse che hanno migliorato il record personale.
export function recordSteps(points) {
  const out = [];
  for (const p of points) if (!out.length || p.s < out[out.length - 1].s) out.push(p);
  return out;
}
