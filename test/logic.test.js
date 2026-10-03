const test = require('node:test');
const assert = require('node:assert');
const L = require('../public/logic.js');
const D = require('../public/data.js');

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

test('parseOFF reads per-serving and per-100 g nutrition', () => {
  const p = L.parseOFF({ code: '0123', product_name: 'Greek Yogurt Vanilla', brands: 'Oikos, Danone', serving_size: '150 g', serving_quantity: '150', nutriments: { 'energy-kcal_100g': 60, proteins_100g: 10, carbohydrates_100g: 4, fat_100g: 0 } }, '0123');
  assert.equal(p.brand, 'Oikos');
  assert.equal(p.perServing.kcal, 90);
  assert.equal(p.perServing.protein, 15);
  assert.deepEqual(L.foodMacros(p, 2, 'servings'), { kcal: 180, protein: 30, carbs: 12, fat: 0 });
  assert.equal(L.foodMacros(p, 50, 'grams').protein, 5);
  assert.equal(L.parseOFF({ product_name: 'No data', nutriments: {} }), null);
});

test('macrosFor sums meals, scanned foods and extra protein', () => {
  const data = { eaten: { [k(0)]: { lunch: { protein: 40, kcal: 600 } } }, foodLog: { [k(0)]: [{ kcal: 200, protein: 20, carbs: 10, fat: 5 }] }, proteinExtra: { [k(0)]: 10 } };
  assert.deepEqual(L.macrosFor(data, k(0)), { kcal: 800, protein: 70, carbs: 10, fat: 5 });
  assert.equal(L.proteinFor(data, k(0)), 70);
});

test('validBarcode checks the check digit', () => {
  assert.equal(L.validBarcode('5000112637922'), true); // EAN-13
  assert.equal(L.validBarcode('5000112637923'), false);
  assert.equal(L.validBarcode('036000291452'), true); // UPC-A
  assert.equal(L.validBarcode('abc'), false);
});

test('recipes total their ingredients and log per serving or by cooked weight', () => {
  const recipe = { id: 'r1', name: 'Chicken rice bowl', servings: 4, totalGrams: 1600, ingredients: [
    { kcal: 660, protein: 124, carbs: 0, fat: 14 },   // 600 g chicken breast
    { kcal: 520, protein: 10, carbs: 112, fat: 2 },   // rice
    { kcal: 120, protein: 0, carbs: 0, fat: 14 },     // olive oil
  ] };
  assert.deepEqual(L.recipeTotals(recipe.ingredients), { kcal: 1300, protein: 134, carbs: 112, fat: 30 });
  const food = L.recipeFood(recipe);
  assert.equal(food.perServing.kcal, 325);
  assert.equal(food.serving.grams, 400);
  assert.equal(L.foodMacros(food, 200, 'grams').kcal, 163); // half a serving by weight
  assert.equal(L.recipeFood({ ...recipe, totalGrams: null }).per100, null);
});

test('suggested meals carry estimated carbs and fat', () => {

  const m = D.MEALS.follicular.lunch[0];
  assert.ok(m.carbs > 0 && m.fat > 0);
  assert.ok(Math.abs(m.protein * 4 + m.carbs * 4 + m.fat * 9 - m.kcal) <= 15);
});

test('menopause mode: steady bone-density plan, higher protein', () => {
  const p = profile({ cycleMode: 'menopause', age: 54, goal: 'lose' });
  const c = L.cycleInfo(p);
  assert.equal(c.steady, true);
  assert.equal(c.phase, 'menopause');
  const t = L.targets(p, c, {});
  assert.ok(Number.isFinite(t.kcal) && Number.isFinite(t.steps));
  const data = { profile: p, overrides: {} };
  const ids = Array.from({ length: 7 }, (_, i) => L.plannedWorkout(data, L.addDays(T, i)).id);
  assert.ok(ids.includes('mp-strength') && ids.includes('mp-power'));
});

test('menoInsights links hot flashes to readiness', () => {
  const daily = {};
  for (let i = 0; i < 10; i++) {
    const hot = i % 2 === 0;
    daily[k(-i)] = { energy: hot ? 2 : 4, sleep: hot ? 2 : 4, mood: 3, soreness: 2, symptoms: hot ? ['Hot flashes', 'Night sweats'] : [] };
  }
  const out = L.menoInsights(daily);
  assert.ok(out.some((x) => x.startsWith('Hot flashes on 5 of your last 10') && x.includes('lower')));
  assert.ok(out.some((x) => x.startsWith('Night sweats are costing you sleep')));
});

test('check-in day drives when the weekly check-in is due', () => {
  const day = T.getDay();
  const data = { profile: profile(), reviews: [], workouts: [], checkinDay: day };
  assert.equal(L.weeklyDue(data), true);
  data.checkinDay = (day + 3) % 7;
  assert.equal(L.weeklyDue(data), false);
  data.checkinDay = (day + 1) % 7;
  assert.equal(L.checkinTomorrow(data), true);
  data.checkinDay = day; data.reviews = [{ date: k(-2) }];
  assert.equal(L.weeklyDue(data), false);
});

test('grocery list combines ideas, recipes and own items by aisle', () => {
  const data = { profile: profile(), mealSwaps: {} };
  const recipe = { ingredients: [{ name: 'Chicken breast, raw' }, { name: 'Jasmine Rice, uncooked' }, { name: 'Baby spinach' }] };
  const list = L.groceryList(data, T, 7, { ideas: false, recipes: [recipe], custom: ['Oat milk', 'Paper towels'] });
  const find = (n) => Object.entries(list).find(([, items]) => items.some((i) => i.name === n));
  assert.equal(find('Chicken breast')[0], 'Protein');
  assert.equal(find('Baby spinach')[0], 'Produce');
  assert.equal(find('Oat milk')[0], 'Dairy and eggs');
  assert.equal(find('Paper towels')[0], 'Pantry and grains');
  assert.ok(find('Jasmine Rice'));
});

test('store links and restaurant bowl builder', () => {

  assert.equal(L.storeLink(D.STORES[0], 'greek yogurt'), 'https://www.walmart.com/search?q=greek%20yogurt');
  const chip = D.RESTAURANTS.find((r) => r.id === 'chipotle');
  const sec = (id) => chip.build.sections.findIndex((x) => x.id === id);
  const { totals, names } = L.buildTotals(chip, { base: [0], protein: [0], rice: [0], beans: [0], toppings: [1, 9] });
  assert.deepEqual(totals, { kcal: 550, protein: 44, carbs: 67, fat: 12.5 }); // bowl, chicken, white rice, black beans, tomato salsa, romaine
  assert.deepEqual(names, ['Chicken', 'White rice', 'Black beans', 'Fresh tomato salsa', 'Romaine lettuce']);
  assert.ok(sec('protein') > 0);
});

test('talk to log: parses everyday foods, amounts and the meal', () => {
  const r = L.parseFoodText('I had two eggs and toast with half an avocado for breakfast', D.BASIC_FOODS);
  assert.equal(r.slot, 'breakfast');
  assert.deepEqual(r.items.map((i) => i.name), ['Eggs', 'Toast', 'Avocado']);
  assert.equal(r.items[0].kcal, 144);
  assert.equal(r.items[2].kcal, 114); // half an avocado is one serving
  const g = L.parseFoodText('150 g chicken breast, 2 tbsp hummus and pizza', D.BASIC_FOODS);
  assert.equal(g.items[0].portion, '150 g');
  assert.equal(g.items[0].kcal, 249); // 150 g of a 113 g serving (servings rounded to 1.33)
  assert.equal(g.items[1].kcal, 70); // 2 tbsp is one serving of hummus
  assert.deepEqual(g.unknown, ['pizza']);
});

test('talk to log: usual meal is the most repeated set of foods', () => {
  const now = new Date(2026, 5, 20);
  const day = (i) => L.dateKey(L.addDays(now, -i));
  const e = (name, label, kcal) => ({ id: 'x' + Math.random(), slot: 'breakfast', name, label, kcal, protein: 1, carbs: 1, fat: 1 });
  const data = { foodLog: {
    [day(1)]: [e('Bagel', '1 bagel', 280)],
    [day(2)]: [e('Oats', '1/2 cup', 150), e('Banana', '1 medium', 105)],
    [day(4)]: [e('Banana', '1 medium', 105), e('Oats', '1/2 cup', 150)],
  } };
  assert.ok(L.usualRequest('log my usual breakfast'));
  assert.equal(L.usualRequest('two eggs'), null);
  const usual = L.usualMeal(data, 'breakfast', now);
  assert.deepEqual(usual.map((x) => x.name).sort(), ['Banana', 'Oats']);
  assert.equal(usual[0].id, undefined);
  assert.deepEqual(L.usualMeal(data, 'breakfast', now, { yesterday: true }).map((x) => x.name), ['Bagel']);
  assert.equal(L.usualMeal(data, 'dinner', now), null);
});

test('plate estimates are cleaned and become loggable foods', () => {
  const items = L.cleanEstimates([{ name: ' Salmon ', portion: '5 oz', grams: 142, kcal: 290, protein: 32, carbs: -4, fat: 17, confidence: 'sure' }, { name: '' }, null]);
  assert.equal(items.length, 1);
  assert.equal(items[0].name, 'Salmon');
  assert.equal(items[0].carbs, 0);
  assert.equal(items[0].confidence, 'medium');
  const f = L.estimateFood(items[0], 'photo');
  assert.equal(L.foodMacros(f, 1.5, 'servings').kcal, 435);
  assert.equal(Math.round(L.foodMacros(f, 71, 'grams').kcal), 145);
});

test('programs: sessions rotate on her days, missed days roll forward, weeks progress', () => {
  const start = new Date(2026, 8, 7); // a Monday
  const day = (n) => L.addDays(start, n);
  const data = { profile: profile(), workouts: [], overrides: {}, program: { id: 'glutes', start: L.dateKey(start), days: [1, 3, 5] } };
  assert.equal(L.workoutFor(data, day(0)).id, 'gb-1a');
  assert.equal(L.workoutFor(data, day(1)).id, 'rest'); // off day
  // Missed Monday: Wednesday still gets session A.
  assert.equal(L.workoutFor(data, day(2)).id, 'gb-1a');
  data.workouts.push({ date: L.dateKey(day(2)), templateId: 'gb-1a' });
  assert.equal(L.programDay(data, day(2)).doneToday, true);
  assert.equal(L.workoutFor(data, day(4)).id, 'gb-1b');
  // Week 4 is the strength block.
  assert.equal(L.programDay(data, day(21)).block.title, 'Strength');
  assert.equal(L.workoutFor(data, day(21)).id, 'gb-2a');
  // After 8 weeks the program is complete and the normal plan returns.
  assert.equal(L.programDay(data, day(56)).complete, true);
  assert.notEqual(L.workoutFor(data, day(56)).phase, 'program');
  // Overrides still win.
  data.overrides[L.dateKey(day(7))] = 'f-upper';
  assert.equal(L.workoutFor(data, day(7)).id, 'f-upper');
  assert.deepEqual(L.programProgress(data).weeks.slice(0, 2), [1, 0]);
});

test('postpartum program uses a daily reset on off days', () => {
  const start = new Date(2026, 8, 7);
  const data = { profile: profile(), workouts: [], program: { id: 'postpartum', start: L.dateKey(start), days: [1, 3, 5] } };
  assert.equal(L.workoutFor(data, start).id, 'pp-1a');
  assert.equal(L.workoutFor(data, L.addDays(start, 1)).id, 'pp-daily');
  assert.equal(L.programDay(data, L.addDays(start, 49)).block.title, 'Strengthen');
});

test('workout logger: rest times, barbell detection and plate math', () => {
  assert.equal(L.parseRest('90s'), 90);
  assert.equal(L.parseRest('2 min'), 120);
  assert.equal(L.parseRest('2-3 min'), 120);
  assert.equal(L.parseRest('45s / side'), 45);
  assert.equal(L.parseRest('-'), 0);
  assert.equal(L.isBarbell('Barbell hip thrust'), true);
  assert.equal(L.isBarbell('Back squat'), true);
  assert.equal(L.isBarbell('Dumbbell Romanian deadlift'), false);
  assert.equal(L.isBarbell('Goblet squat'), false);
  assert.deepEqual(L.platesFor(135, 'lb', 45).perSide, [45]);
  assert.deepEqual(L.platesFor(185, 'lb', 45).perSide, [45, 25]);
  assert.deepEqual(L.platesFor(100, 'kg', 20).perSide, [25, 15]);
  const odd = L.platesFor(137, 'lb', 45);
  assert.deepEqual(odd.perSide, [45]);
  assert.equal(odd.leftover, 2);
  assert.equal(L.platesFor(40, 'lb', 45).belowBar, true);
  assert.equal(L.defaultBar('Trap bar deadlift', 'lb'), 60);
});
