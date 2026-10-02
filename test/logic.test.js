const test = require('node:test');
const assert = require('node:assert');
const L = require('../public/logic.js');

const T = L.today();
const k = (n) => L.dateKey(L.addDays(T, n));
const profile = (extra) => ({ cycleMode: 'natural', periodStart: k(-9), cycleLength: 28, periodLength: 5, weightKg: 62, heightCm: 165, age: 30, goal: 'glutes', activity: 'light', level: 'intermediate', ...extra });

test('cycle day and phases for a 28-day cycle', () => {
  assert.equal(L.cycleInfo(profile()).day, 10);
  assert.equal(L.cycleInfo(profile()).phase, 'follicular');
  assert.equal(L.cycleInfo(profile({ periodStart: k(0) })).phase, 'menstrual');
  assert.equal(L.cycleInfo(profile({ periodStart: k(-13) })).phase, 'ovulation');
  assert.equal(L.cycleInfo(profile({ periodStart: k(-20) })).phase, 'luteal');
});

test('late period stays in luteal instead of wrapping', () => {
  const c = L.cycleInfo(profile({ periodStart: k(-30) }));
  assert.equal(c.late, true);
  assert.equal(c.daysLate, 3);
  assert.equal(c.phase, 'luteal');
  // Forecasting future dates still wraps into the next cycle.
  assert.equal(L.cycleInfo(profile({ periodStart: k(-27) }), L.addDays(T, 2)).phase, 'menstrual');
});

test('steady mode for hormonal contraception', () => {
  const c = L.cycleInfo(profile({ cycleMode: 'hormonal' }));
  assert.equal(c.steady, true);
  assert.equal(c.phase, 'steady');
  assert.ok(L.targets(profile({ cycleMode: 'hormonal' }), c).kcal > 1000);
});

test('learns cycle length from logged periods', () => {
  const data = { profile: profile(), periods: [] };
  L.addPeriod(data, k(-66));
  L.addPeriod(data, k(-35));
  L.addPeriod(data, k(-5));
  assert.equal(data.profile.learnedLength, 31); // gaps 31 and 30 -> 30.5 -> 31
  L.addPeriod(data, k(-3)); // correction of the same period
  assert.equal(data.periods.length, 3);
  assert.equal(data.profile.periodStart, k(-3));
});

test('readiness score', () => {
  assert.equal(L.readiness({ energy: 5, sleep: 5, mood: 5, soreness: 1 }), 100);
  assert.equal(L.readiness({ energy: 1, sleep: 1, mood: 1, soreness: 5 }), 0);
  assert.ok(L.readiness({ energy: 3, sleep: 3, mood: 3, soreness: 3, symptoms: ['Cramps'] }) < 50);
});

const session = (date, phase, weight, reps, n = 3, name = 'Barbell hip thrust') => ({ date, phase, unit: 'kg', detail: [{ name, sets: Array.from({ length: n }, () => ({ weight, reps })) }] });

test('suggestLoad uses double progression', () => {
  const hist = [session(k(-7), 'follicular', 60, 8)];
  const up = L.suggestLoad('Barbell hip thrust', '8-10', [session(k(-7), 'follicular', 60, 10)], { phase: 'follicular', unit: 'kg' });
  assert.equal(up.weight, 65);
  assert.equal(up.reps, 8);
  const rep = L.suggestLoad('Barbell hip thrust', '8-10', hist, { phase: 'follicular', unit: 'kg' });
  assert.equal(rep.weight, 60);
  assert.equal(rep.reps, 9);
});

test('suggestLoad respects phase and readiness', () => {
  const hist = [session(k(-7), 'follicular', 60, 10)];
  assert.equal(L.suggestLoad('Barbell hip thrust', '8-10', hist, { phase: 'luteal', unit: 'kg' }).weight, 60);
  assert.equal(L.suggestLoad('Barbell hip thrust', '8-10', hist, { phase: 'menstrual', unit: 'kg' }).weight, 55);
  assert.equal(L.suggestLoad('Barbell hip thrust', '8-10', hist, { phase: 'follicular', unit: 'kg', readiness: 30 }).weight, 55);
  assert.equal(L.suggestLoad('Pull-up or assisted pull-up', 'AMRAP', hist, { phase: 'follicular' }), null);
  assert.equal(L.suggestLoad('Cable lateral raise', '15', [session(k(-3), 'follicular', 5, 15, 3, 'Cable lateral raise')], { phase: 'follicular', unit: 'kg' }).weight, 6);
});

test('detectPRs and strengthByPhase', () => {
  const prior = [session(k(-14), 'follicular', 60, 8), session(k(-7), 'luteal', 55, 8), session(k(-3), 'menstrual', 50, 8)];
  const now = session(k(0), 'follicular', 62.5, 8);
  assert.equal(L.detectPRs(now, prior).length, 1);
  assert.equal(L.detectPRs(session(k(0), 'follicular', 50, 8), prior).length, 0);
  const sbp = L.strengthByPhase(prior.concat([now, session(k(-21), 'luteal', 52.5, 8), session(k(-28), 'menstrual', 50, 8)]));
  assert.equal(sbp.best, 'follicular');
  assert.equal(sbp.low, 'menstrual');
  assert.ok(sbp.diff > 10);
});

test('patterns find energy dips and symptom phases', () => {
  const daily = {};
  for (let c = 0; c < 2; c++) {
    for (let d = 1; d <= 28; d++) {
      const date = k(-60 + c * 28 + d);
      const phase = d <= 5 ? 'menstrual' : d <= 12 ? 'follicular' : d <= 15 ? 'ovulation' : 'luteal';
      daily[date] = { energy: d >= 24 && d <= 26 ? 2 : 4, sleep: 4, mood: 4, soreness: 2, symptoms: d <= 2 ? ['Cramps'] : [], cycleDay: d, phase };
    }
  }
  const p = L.patterns(daily);
  assert.deepEqual(p.dipDays, [24, 25, 26]);
  assert.ok(p.insights.some((s) => s.includes('days 24-26')));
  assert.ok(p.insights.some((s) => s.startsWith('Cramps mostly shows up in your menstrual')));
});

test('weekly review adjusts plan', () => {
  const data = { profile: profile({ goal: 'lose' }), plan: {}, workouts: [], steps: {}, daily: {}, checkins: [{ date: k(-14), kg: 70 }, { date: k(-2), kg: 70 }] };
  for (let i = 0; i < 7; i++) data.workouts.push({ date: k(-i), name: 'x' });
  const stats = L.weeklyStats(data);
  assert.equal(stats.sessions, 7);
  assert.equal(stats.stepDays, 0);
  const { adjustments } = L.weeklyAdjust(stats, { feel: 'easy', hunger: 'ok', next: 'normal' }, data);
  const keys = adjustments.map((a) => a.key);
  assert.ok(keys.includes('volume'));
  assert.ok(keys.includes('stepBonus'));
  L.applyAdjustments(data.plan, adjustments);
  assert.equal(data.plan.volume, 1);
  assert.equal(data.plan.stepBonus, -1000);
});

test('streak forgives one missed day', () => {
  const data = { profile: profile(), plan: {}, workouts: [], steps: {}, daily: {} };
  [0, -1, -2, -4, -5, -6].forEach((n) => data.workouts.push({ date: k(n) }));
  assert.equal(L.streak(data).count, 6);
  data.workouts = data.workouts.filter((w) => w.date !== k(-5));
  assert.equal(L.streak(data).count, 4); // day -3 forgiven, second miss on day -5 ends it
});

test('grocery list aggregates a week of meals', () => {
  const data = { profile: profile({ avoid: ['Dairy'] }), mealSwaps: {} };
  const list = L.groceryList(data, T, 7);
  const all = Object.values(list).flat().map((i) => i.name);
  assert.ok(all.length > 10);
  assert.ok(!all.includes('Feta'));
});

test('suggestLoad works in pounds and converts kg history', () => {
  const lb = [{ date: k(-7), phase: 'follicular', unit: 'lb', detail: [{ name: 'Barbell hip thrust', sets: [{ weight: 135, reps: 10 }, { weight: 135, reps: 10 }] }] }];
  const s = L.suggestLoad('Barbell hip thrust', '8-10', lb, { phase: 'follicular', unit: 'lb' });
  assert.equal(s.unit, 'lb');
  assert.equal(s.weight, 145); // 135 >= 130 lb, so +10 lb
  const kg = [{ date: k(-7), phase: 'follicular', unit: 'kg', detail: [{ name: 'Dumbbell curl', sets: [{ weight: 8, reps: 10 }] }] }];
  const c = L.suggestLoad('Dumbbell curl', '12', kg, { phase: 'follicular', unit: 'lb' });
  assert.equal(c.unit, 'lb');
  assert.equal(c.weight, 17.5); // 8 kg = 17.6 lb, rounded to 2.5 lb steps; reps not yet at 12 so weight holds
});
