import test from 'node:test';
import assert from 'node:assert/strict';
import { bestTimeOverDistance, timeAtDistance, raceTime } from '../lib/efforts.js';

// 3 km: primo km in 300 s, secondo in 240 s, terzo in 270 s (passaggi ogni 100 m, passo costante per km).
const marks = [];
let t = 0;
for (const km of [300, 240, 270]) for (let j = 0; j < 10; j++) marks.push((t += km / 10));
const run = { marks, splits: [{ m: 1000, s: 300 }, { m: 1000, s: 240 }, { m: 1000, s: 270 }] };

test('miglior tratto: il km più veloce, non il primo', () => assert.equal(bestTimeOverDistance(run, 1000), 240));
test('miglior tratto a cavallo di due km', () => assert.equal(bestTimeOverDistance(run, 1500), 240 + 135));
test('miglior tratto su tutta la corsa = tempo finale', () => assert.equal(bestTimeOverDistance(run, 3000), 810));
test('dalla partenza resta il primo km', () => assert.equal(timeAtDistance(run, 1000), 300));
test('senza passaggi: km migliore dai parziali', () =>
  assert.equal(bestTimeOverDistance({ splits: run.splits }, 1000), 240));
test('corsa troppo corta: nessun tempo', () => assert.equal(bestTimeOverDistance(run, 3100), null));
test('raceTime segue l\'impostazione della gara', () => {
  assert.equal(raceTime(run, { distance_m: 1000, best_segment: true }), 240);
  assert.equal(raceTime(run, { distance_m: 1000, best_segment: false }), 300);
});
