import test from 'node:test';
import assert from 'node:assert/strict';
import { raceDays, dayCells, effort, improvement, pacing } from '../lib/compare.js';

const people = [{ user_id: 1, athlete_name: 'Anna' }, { user_id: 2, athlete_name: 'Bruno' }, { user_id: 3, athlete_name: 'Carla' }];

test('giorni della gara fino a oggi', () => {
  assert.deepEqual(raceDays({ start_date: '2026-09-28', end_date: '2026-10-10' }, '2026-10-01'),
    ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01']);
  assert.equal(raceDays({ start_date: '2026-09-01', end_date: '2026-09-03' }, '2026-10-01').length, 3);
});

test('impegno: corse, km e giorni, più km prima', () => {
  const act = [
    { user_id: 2, distance_m: 5000, moving_time_s: 1500, start_date_local: '2026-09-01T07:00:00Z' },
    { user_id: 2, distance_m: 8000, moving_time_s: 2400, start_date_local: '2026-09-01T19:00:00Z' },
    { user_id: 1, distance_m: 6000, moving_time_s: 1800, start_date_local: '2026-09-02T07:00:00Z' },
  ];
  const [b, a, c] = effort(act, people);
  assert.deepEqual([b.athlete_name, b.runs, b.meters, b.days.size], ['Bruno', 2, 13000, 1]);
  assert.equal(a.athlete_name, 'Anna');
  assert.deepEqual([c.athlete_name, c.runs], ['Carla', 0]);
});

test('miglioramento dalla prima corsa al record', () => {
  const runs = [
    { user_id: 1, time_s: 1600, start_date: '2026-09-05' },
    { user_id: 1, time_s: 1500, start_date: '2026-09-01' },
    { user_id: 1, time_s: 1450, start_date: '2026-09-09' },
    { user_id: 2, time_s: 1300, start_date: '2026-09-02' },
  ];
  const [a, b, c] = improvement(runs, people);
  assert.deepEqual([a.athlete_name, a.gain, a.first.time_s, a.best.time_s], ['Anna', 50, 1500, 1450]);
  assert.deepEqual([b.athlete_name, b.gain, b.count], ['Bruno', null, 1]);
  assert.deepEqual([c.athlete_name, c.count], ['Carla', 0]);
});

test('come corre: prima e seconda metà', () => {
  const marks = (p1, p2) => Array.from({ length: 20 }, (_, i) => (i < 10 ? (i + 1) * p1 / 10 : p1 + (i - 9) * p2 / 10));
  assert.equal(pacing({ marks: marks(300, 280) }, 2000).kind, 'spinta');
  assert.equal(pacing({ marks: marks(300, 301) }, 2000).kind, 'metronomo');
  assert.equal(pacing({ marks: marks(300, 309) }, 2000).kind, 'cala');
  assert.deepEqual(pacing({ marks: marks(280, 320) }, 2000), { pace1: 280, pace2: 320, kind: 'razzo' });
  assert.equal(pacing({ marks: [] }, 2000), null);
});

test('striscia: a giorni fino a 6 settimane, poi a settimane', () => {
  const days = raceDays({ start_date: '2026-01-01', end_date: '2026-12-31' }, '2026-01-14');
  assert.equal(dayCells(days, new Set(['2026-01-02'])).length, 14);
  const year = raceDays({ start_date: '2026-01-01', end_date: '2026-12-31' }, '2027-01-01');
  const ran = new Set(['2026-01-01', '2026-01-03', '2026-01-05', '2026-01-06', '2026-01-09']);
  const cells = dayCells(year, ran);
  assert.equal(cells.length, 53);
  assert.deepEqual(cells.slice(0, 3).map((x) => [x.n, x.level]), [[4, 3], [1, 1], [0, 0]]);
});
