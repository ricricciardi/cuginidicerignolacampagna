import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isRoadGpsRun as isEligibleRun } from '../lib/filter.js';

const base = {
  sport_type: 'Run', trainer: false, manual: false, distance: 10500,
  start_latlng: [41.27, 15.89], map: { summary_polyline: 'abc' },
};
test('corsa su strada con GPS: inclusa', () => assert.ok(isEligibleRun(base)));
test('tapis roulant: escluso', () => assert.ok(!isEligibleRun({ ...base, trainer: true })));
test('trail: escluso', () => assert.ok(!isEligibleRun({ ...base, sport_type: 'TrailRun' })));
test('virtuale: esclusa', () => assert.ok(!isEligibleRun({ ...base, sport_type: 'VirtualRun' })));
test('bici: esclusa', () => assert.ok(!isEligibleRun({ ...base, sport_type: 'Ride' })));
test('inserita a mano: esclusa', () => assert.ok(!isEligibleRun({ ...base, manual: true })));
test('registrata senza GPS: esclusa', () =>
  assert.ok(!isEligibleRun({ ...base, start_latlng: [], map: { summary_polyline: '' } })));
test('solo traccia, senza coordinate di partenza: inclusa', () =>
  assert.ok(isEligibleRun({ ...base, start_latlng: [] })));
test('vecchie attività con solo "type"', () =>
  assert.ok(isEligibleRun({ type: 'Run', distance: 12000, start_latlng: [41, 15] })));

import { firstKmSeconds, rank, markRecords, splitsFromDetail, netElevation } from '../lib/efforts.js';
const km = (sec, m = 1000) => ({ m, s: sec, mv: sec });
test('corsa di 11 km: tempo al decimo chilometro', () =>
  assert.equal(firstKmSeconds([...Array(10)].map(() => km(300)).concat(km(280), km(60, 150)), 10), 3000));
test('primi 10 km, non i più veloci: il km lento iniziale conta', () =>
  assert.equal(firstKmSeconds([km(420), ...Array(11).fill(km(290))], 10), 420 + 9 * 290));
test('parziali con arrotondamenti GPS (999,6 m): validi', () =>
  assert.equal(firstKmSeconds(Array(11).fill(km(300, 999.6)), 10), 3000));
test('meno di 10 parziali: nessun tempo', () =>
  assert.equal(firstKmSeconds(Array(9).fill(km(300)), 10), null));
test('parziali mancanti: nessun tempo', () => assert.equal(firstKmSeconds(undefined, 10), null));
test('classifica: più veloce prima, a parità chi l\'ha fatto prima', () => {
  const r = rank([
    { user_id: 1, time_s: 3000, start_date: '2026-09-10' },
    { user_id: 2, time_s: 2900, start_date: '2026-09-12' },
    { user_id: 3, time_s: 3000, start_date: '2026-09-01' },
  ]);
  assert.deepEqual(r.map((x) => x.user_id), [2, 3, 1]);
});
test('record personali marcati in ordine di data', () => {
  const r = markRecords([{ time_s: 3100 }, { time_s: 3200 }, { time_s: null }, { time_s: 3000 }]);
  assert.deepEqual(r.map((x) => x.isRecord), [true, false, false, true]);
});

import { buildSeries, recordSteps } from '../lib/series.js';
test('record nel tempo: solo i miglioramenti', () =>
  assert.deepEqual(recordSteps([{ t: 1, s: 3100 }, { t: 2, s: 3200 }, { t: 3, s: 3050 }, { t: 4, s: 3050 }]).map((p) => p.t), [1, 3]));
test('serie per cugino, ordinate come la classifica', () => {
  const s = buildSeries([
    { user_id: 1, athlete_name: 'A', start_date: '2026-10-01', time_s: 3000 },
    { user_id: 2, athlete_name: 'B', start_date: '2026-10-02', time_s: 2900 },
    { user_id: 1, athlete_name: 'A', start_date: '2026-09-28', time_s: 3100 },
    { user_id: 3, athlete_name: 'C', start_date: '2026-10-03', time_s: null },
  ]);
  assert.deepEqual(s.map((x) => [x.userId, x.best, x.points.length]), [[2, 2900, 1], [1, 3000, 2]]);
});

test('stessi parziali, gare diverse: primi 5 e primi 15 km', () => {
  const sp = Array(16).fill(km(300));
  assert.equal(firstKmSeconds(sp, 5), 1500);
  assert.equal(firstKmSeconds(sp, 15), 4500);
});
test('parziali salvati dal dettaglio Strava', () =>
  assert.deepEqual(splitsFromDetail({ splits_metric: [{ distance: 1000.2, elapsed_time: 310, moving_time: 300, elevation_difference: -4.2 }] }),
    [{ m: 1000.2, s: 310, mv: 300, e: -4.2 }]));
test('parziali senza altitudine: dislivello null, non assente', () =>
  assert.deepEqual(splitsFromDetail({ splits_metric: [{ distance: 1000, elapsed_time: 300, moving_time: 300 }] }),
    [{ m: 1000, s: 300, mv: 300, e: null }]));
test('dislivello netto sui primi N km, solo quelli', () => {
  const sp = [-5, -4.6, 2, -3, 10].map((e) => ({ m: 1000, s: 300, e }));
  assert.equal(netElevation(sp, 4), -11);
  assert.equal(netElevation(sp, 5), -1);
});
test('dislivello: niente dato se manca un km o l\'altitudine', () => {
  assert.equal(netElevation([{ m: 1000, s: 300, e: 1 }], 2), null);
  assert.equal(netElevation([{ m: 1000, s: 300, e: 1 }, { m: 1000, s: 300 }], 2), null);
  assert.equal(netElevation(undefined, 2), null);
});

import { romeMidnight, compWindow, phase, inWindow, validate, statusLine, remaining } from '../lib/competition.js';
const gara = { km: 10, start_date: '2026-09-25', end_date: '2027-09-25' };
test('mezzanotte italiana con ora legale (+02:00)', () => assert.equal(romeMidnight('2026-09-25').toISOString(), '2026-09-24T22:00:00.000Z'));
test('mezzanotte italiana con ora solare (+01:00)', () => assert.equal(romeMidnight('2027-01-15').toISOString(), '2027-01-14T23:00:00.000Z'));
test('mezzanotte nel giorno del cambio d\'ora (28/3/2027)', () => assert.equal(romeMidnight('2027-03-28').toISOString(), '2027-03-27T23:00:00.000Z'));
test('fine gara: 24:00 del giorno di fine', () => assert.equal(compWindow(gara).end.toISOString(), '2027-09-25T22:00:00.000Z'));
test('fasi della gara', () => {
  assert.equal(phase(gara, new Date('2026-09-24T23:59:59+02:00')), 'before');
  assert.equal(phase(gara, new Date('2026-09-25T00:00:00+02:00')), 'running');
  assert.equal(phase(gara, new Date('2027-09-25T23:59:59+02:00')), 'running');
  assert.equal(phase(gara, new Date('2027-09-26T00:00:00+02:00')), 'over');
});
test('corsa alle 23:50 dell\'ultimo giorno vale, alle 00:10 dopo no', () => {
  assert.ok(inWindow(gara, '2027-09-25T21:50:00Z'));
  assert.ok(!inWindow(gara, '2027-09-25T22:10:00Z'));
});
test('gara di un solo giorno', () => {
  const g = { km: 5, start_date: '2026-10-04', end_date: '2026-10-04' };
  assert.ok(inWindow(g, '2026-10-04T06:00:00Z'));
  assert.ok(!inWindow(g, '2026-10-04T22:30:00Z'));
});
test('conto alla rovescia', () => assert.deepEqual(remaining((4 * 86400 + 3 * 3600 + 5 * 60 + 9) * 1000), { d: 4, h: 3, m: 5, s: 9 }));
test('stato in una riga', () => {
  assert.equal(statusLine(gara, new Date('2026-09-20T12:00:00Z')), 'Parte tra 4 giorni');
  assert.equal(statusLine(gara, new Date('2027-09-26T12:00:00Z')), 'Conclusa');
});
test('modulo valido', () => assert.deepEqual(
  validate({ name: ' Prova ', km: '5', start_date: '2026-09-01', end_date: '2026-09-30', participants: ['2', '1', '2'], age_grading: 'on' }).value,
  { name: 'Prova', km: 5, start_date: '2026-09-01', end_date: '2026-09-30', participants: [2, 1], age_grading: true }));
test('modulo: un solo partecipante arriva come stringa, coefficiente spento se non spuntato', () => assert.deepEqual(
  validate({ name: 'x', km: '5', start_date: '2026-09-01', end_date: '2026-09-02', participants: '3' }).value,
  { name: 'x', km: 5, start_date: '2026-09-01', end_date: '2026-09-02', participants: [3], age_grading: false }));
test('modulo: senza partecipanti rifiutato', () =>
  assert.ok(validate({ name: 'x', km: '5', start_date: '2026-09-01', end_date: '2026-09-02' }).errors.participants));
test('modulo: km decimali, zero o troppi rifiutati', () => {
  for (const km of ['10.5', '0', '101', '', 'dieci']) assert.ok(validate({ name: 'x', km, start_date: '2026-09-01', end_date: '2026-09-02' }).errors.km, km);
});
test('modulo: fine prima dell\'inizio e date impossibili rifiutate', () => {
  assert.ok(validate({ name: 'x', km: '10', start_date: '2026-09-10', end_date: '2026-09-01' }).errors.end_date);
  assert.ok(validate({ name: 'x', km: '10', start_date: '2026-02-30', end_date: '2026-03-01' }).errors.start_date);
});
test('modulo: nome vuoto o troppo lungo rifiutato', () => {
  assert.ok(validate({ name: '  ', km: '10', start_date: '2026-09-01', end_date: '2026-09-02' }).errors.name);
  assert.ok(validate({ name: 'x'.repeat(61), km: '10', start_date: '2026-09-01', end_date: '2026-09-02' }).errors.name);
});

import { standings } from '../lib/standings.js';
test('classifica: record e volte oltre i km (le corse senza tempo non contano)', () => {
  const r = standings([
    { user_id: 1, time_s: 3100, start_date: '2026-10-01' },
    { user_id: 1, time_s: 3000, start_date: '2026-10-05' },
    { user_id: 1, time_s: null, start_date: '2026-10-06' },
    { user_id: 2, time_s: 2950, start_date: '2026-10-02' },
  ]);
  assert.deepEqual(r.map((x) => [x.user_id, x.time_s, x.reached]), [[2, 2950, 1], [1, 3000, 2]]);
});

test('classifica: tutti i cugini, chi non ha tempi in fondo in ordine alfabetico', () => {
  const runs = [
    { user_id: 1, athlete_name: 'Riccardo', time_s: 3000, start_date: '2026-10-01' },
    { user_id: 2, athlete_name: 'Mimmo', time_s: 2900, start_date: '2026-10-02' },
  ];
  const people = [
    { user_id: 1, athlete_name: 'Riccardo' }, { user_id: 2, athlete_name: 'Mimmo' },
    { user_id: 3, athlete_name: 'Tonino' }, { user_id: 4, athlete_name: 'Alfredo' },
  ];
  const r = standings(runs, people);
  assert.deepEqual(r.map((x) => [x.athlete_name, x.time_s, x.reached]),
    [['Mimmo', 2900, 1], ['Riccardo', 3000, 1], ['Alfredo', null, 0], ['Tonino', null, 0]]);
});
test('classifica senza nessun tempo: solo i nomi, in ordine alfabetico', () => {
  const r = standings([], [{ user_id: 2, athlete_name: 'Nunzia' }, { user_id: 1, athlete_name: 'Franco' }]);
  assert.deepEqual(r.map((x) => x.athlete_name), ['Franco', 'Nunzia']);
});


import { ageOn, standardSeconds, ageGradePct } from '../lib/agegrade.js';
test('età compiuta il giorno della corsa', () => {
  assert.equal(ageOn('1986-09-18', '2026-09-17T08:00:00Z'), 39);
  assert.equal(ageOn('1986-09-18', '2026-09-18T08:00:00Z'), 40);
});
test('standard assoluto 10 km pubblicati: 26:24 uomini (30 anni), 28:46 donne (25 anni)', () => {
  assert.equal(Math.round(standardSeconds('M', 30, 10)), 1584);
  assert.equal(Math.round(standardSeconds('F', 25, 10)), 1726);
});
test('esempio pubblicato: uomo di 50 anni, 10 km in 49:31 = 60%', () => {
  const p = ageGradePct({ sex: 'M', birthDate: '1976-01-01', runDate: '2026-06-01', km: 10, timeS: 49 * 60 + 31 });
  assert.ok(Math.abs(p - 60) < 0.05, p);
});
test('interpolazione ufficiale: 7 km sta tra 4 miglia e 8 km', () => {
  const s7 = standardSeconds('M', 40, 7);
  assert.ok(s7 > standardSeconds('M', 40, 6.437376) && s7 < standardSeconds('M', 40, 8));
});
test('stesso tempo: la donna o il più anziano ottengono un punteggio più alto', () => {
  const base = { birthDate: '1986-01-01', runDate: '2026-06-01', km: 10, timeS: 3000 };
  assert.ok(ageGradePct({ ...base, sex: 'F' }) > ageGradePct({ ...base, sex: 'M' }));
  assert.ok(ageGradePct({ ...base, sex: 'M', birthDate: '1966-01-01' }) > ageGradePct({ ...base, sex: 'M' }));
});
test('casi non coperti: 1 km, età fuori tabella, dati mancanti', () => {
  assert.equal(standardSeconds('M', 40, 1), null);
  assert.equal(ageGradePct({ sex: 'M', birthDate: '2023-01-01', runDate: '2026-06-01', km: 10, timeS: 3000 }), null);
  assert.equal(ageGradePct({ sex: null, birthDate: '1986-01-01', runDate: '2026-06-01', km: 10, timeS: 3000 }), null);
});

import { ageStandings } from '../lib/standings.js';
test('classifica per età e sesso: punteggio più alto in testa, chi non ha dati in fondo', () => {
  const runs = [
    { user_id: 1, athlete_name: 'Riccardo', time_s: 3000, pct: 55.0, start_date: '2026-10-01' },
    { user_id: 1, athlete_name: 'Riccardo', time_s: 2900, pct: 57.0, start_date: '2026-10-03' },
    { user_id: 2, athlete_name: 'Nunzia', time_s: 3300, pct: 58.5, start_date: '2026-10-02' },
    { user_id: 3, athlete_name: 'Mimmo', time_s: 2800, pct: null, start_date: '2026-10-02' },
  ];
  const people = [
    { user_id: 1, athlete_name: 'Riccardo', sex: 'M', birth_date: '1986-09-18' },
    { user_id: 2, athlete_name: 'Nunzia', sex: 'F', birth_date: '1960-01-01' },
    { user_id: 3, athlete_name: 'Mimmo', sex: null, birth_date: null },
    { user_id: 4, athlete_name: 'Alfredo', sex: 'M', birth_date: '1990-01-01' },
  ];
  const r = ageStandings(runs, people);
  assert.deepEqual(r.map((x) => [x.athlete_name, x.pct, x.reached, x.missing ?? null]),
    [['Nunzia', 58.5, 1, null], ['Riccardo', 57.0, 2, null], ['Alfredo', null, 0, 'corse'], ['Mimmo', null, 1, 'dati']]);
});

import { standingsChanges } from '../lib/standings-diff.js';
const gara15 = { name: 'Quindici', km: 15 };
const snap = (...rows) => new Map(rows.map(([uid, time_s, name], i) => [uid, { pos: i + 1, time_s, name }]));
test('notifiche: nuovo record a chi migliora, sorpasso a chi viene superato', () => {
  const before = snap([1, 4000, 'Anna'], [2, 4100, 'Bruno'], [3, 4200, 'Carlo']);
  const after = snap([3, 3900, 'Carlo'], [1, 4000, 'Anna'], [2, 4100, 'Bruno']);
  const n = standingsChanges(gara15, before, after);
  assert.deepEqual(n.map((x) => [x.userId, x.title]), [
    [3, 'Nuovo record in Quindici'], [1, 'Sorpasso in Quindici'], [2, 'Sorpasso in Quindici']]);
  assert.equal(n[1].body, 'Carlo ti ha superato: ora sei 2°.');
  assert.equal(n[0].body, '1:05:00 sui primi 15 km: sei 1°.');
});
test('notifiche: primo tempo è un record; chi arriva dopo di te non ti supera', () => {
  const n = standingsChanges(gara15, snap([1, 4000, 'Anna']), snap([1, 4000, 'Anna'], [2, 4100, 'Bruno']));
  assert.deepEqual(n.map((x) => [x.userId, x.title]), [[2, 'Nuovo record in Quindici']]);
});
test('notifiche: nessun cambiamento, nessuna notifica', () => {
  const s = snap([1, 4000, 'Anna'], [2, 4100, 'Bruno']);
  assert.deepEqual(standingsChanges(gara15, s, s), []);
});
test('notifiche: superato da due cugini insieme', () => {
  const before = snap([1, 4000, 'Anna'], [2, 4100, 'Bruno'], [3, 4200, 'Carlo']);
  const after = snap([2, 3800, 'Bruno'], [3, 3900, 'Carlo'], [1, 4000, 'Anna']);
  const a = standingsChanges(gara15, before, after).find((x) => x.userId === 1);
  assert.equal(a.body, 'Bruno e Carlo ti hanno superato: ora sei 3°.');
});
