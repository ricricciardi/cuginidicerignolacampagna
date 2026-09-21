// Confronto tra cugini in una gara: impegno, miglioramento e modo di correre.
// Funzioni pure: i dati arrivano da lib/standings.js.
import { timeAtDistance, MARK_STEP_M } from './efforts.js';

// Giorno della corsa in ora italiana (AAAA-MM-GG): start_date_local è l'ora locale scritta come UTC.
const runDay = (r) => (r.start_date_local ?? new Date(r.start_date).toISOString()).slice(0, 10);

// Giorni del periodo di gara da mostrare: dall'inizio fino a oggi (o alla fine, se è già passata).
export function raceDays(c, today) {
  const last = c.end_date < today ? c.end_date : today;
  const out = [];
  for (let d = new Date(c.start_date + 'T00:00:00Z'); d.toISOString().slice(0, 10) <= last; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

// Impegno: per ogni partecipante corse, metri, tempo e giorni in cui ha corso nel periodo.
// activities: tutte le corse del periodo (anche più corte della gara). Ordine: più km prima.
export function effort(activities, people) {
  const by = new Map(people.map((p) => [p.user_id, { ...p, runs: 0, meters: 0, seconds: 0, days: new Set() }]));
  for (const a of activities) {
    const e = by.get(a.user_id);
    if (!e) continue;
    e.runs++;
    e.meters += a.distance_m;
    e.seconds += a.moving_time_s;
    e.days.add(runDay(a));
  }
  return [...by.values()].sort((a, b) => b.meters - a.meters || (a.athlete_name ?? '').localeCompare(b.athlete_name ?? '', 'it'));
}

// Miglioramento: dalla prima corsa valida in gara al record. runs: corse della gara con time_s.
// Ordine: miglioramento in percentuale, poi chi ha una sola corsa, poi chi non ne ha.
export function improvement(runs, people) {
  const by = new Map(people.map((p) => [p.user_id, { ...p, first: null, best: null, count: 0 }]));
  const sorted = [...runs].filter((r) => r.time_s != null).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  for (const r of sorted) {
    const e = by.get(r.user_id);
    if (!e) continue;
    e.count++;
    e.first ??= r;
    if (!e.best || r.time_s < e.best.time_s) e.best = r;
  }
  const rows = [...by.values()].map((e) => {
    const gain = e.count > 1 ? e.first.time_s - e.best.time_s : null;
    return { ...e, gain, pct: gain != null ? gain / e.first.time_s : null };
  });
  const rank = (e) => (e.pct != null ? 0 : e.count ? 1 : 2);
  return rows.sort((a, b) => rank(a) - rank(b) || (b.pct ?? 0) - (a.pct ?? 0) ||
    (a.athlete_name ?? '').localeCompare(b.athlete_name ?? '', 'it'));
}

// Come corre: passo della prima e della seconda metà della distanza di gara, nella corsa del record.
// kind: 'spinta' (seconda metà più veloce), 'metronomo', 'cala', 'razzo' (parte forte e cede).
export function pacing(run, meters) {
  const half = Math.round(meters / 2 / MARK_STEP_M) * MARK_STEP_M;
  if (!half || half >= meters) return null;
  const t1 = timeAtDistance(run, half);
  const t = timeAtDistance(run, meters);
  if (t1 == null || t == null || t <= t1) return null;
  const pace1 = t1 / half * 1000;
  const pace2 = (t - t1) / (meters - half) * 1000;
  const r = pace2 / pace1 - 1;
  const kind = r < -0.01 ? 'spinta' : r <= 0.01 ? 'metronomo' : r <= 0.04 ? 'cala' : 'razzo';
  return { pace1: Math.round(pace1), pace2: Math.round(pace2), kind };
}
