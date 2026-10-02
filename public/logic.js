// YOURS coaching logic. Pure functions over the user's data so they can be tested in Node.
(function () {
  const D = typeof window !== 'undefined' ? window.YOURS_DATA : require('./data.js');

  // ---------- dates ----------
  const pad = (n) => String(n).padStart(2, '0');
  const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const daysBetween = (a, b) => Math.round((b - a) / 86400000);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const round = (n, step) => Math.round(n / step) * step;
  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const weekdayIndex = (d) => (d.getDay() + 6) % 7; // Monday = 0

  // ---------- cycle ----------
  const STEADY_MODES = ['hormonal', 'none'];
  const ESTIMATE_MODES = ['irregular', 'pcos', 'perimenopause'];

  // Average of recent gaps between logged period starts.
  function learnCycle(periods) {
    const sorted = Array.from(new Set(periods || [])).sort();
    const gaps = [];
    for (let i = 1; i < sorted.length; i++) {
      const g = daysBetween(parseKey(sorted[i - 1]), parseKey(sorted[i]));
      if (g >= 18 && g <= 50) gaps.push(g);
    }
    const recent = gaps.slice(-6);
    if (!recent.length) return null;
    const min = Math.min(...recent), max = Math.max(...recent);
    return { length: Math.round(mean(recent)), samples: recent.length, min, max, regular: max - min <= 7 };
  }

  // Record a period start. Entries within a week of each other are the same period being corrected.
  function addPeriod(data, key) {
    const list = (data.periods || []).filter((p) => Math.abs(daysBetween(parseKey(p), parseKey(key))) > 7);
    list.push(key);
    list.sort();
    data.periods = list;
    data.profile.periodStart = list[list.length - 1];
    const learned = learnCycle(list);
    data.profile.learnedLength = learned ? learned.length : null;
    return learned;
  }

  function cycleInfo(profile, date) {
    date = date || today();
    const mode = profile.cycleMode || 'natural';
    if (STEADY_MODES.includes(mode) || !profile.periodStart) {
      return { steady: true, phase: 'steady', mode, day: null, len: null, dayInPhase: weekdayIndex(date), next: null, daysToNext: null, daysToPeriod: null, estimate: false, late: false, ranges: null };
    }
    const len = clamp(Number(profile.learnedLength || profile.cycleLength) || 28, 21, 45);
    const periodLen = clamp(Number(profile.periodLength) || 5, 2, 8);
    const ov = len - 14;
    const ranges = {
      menstrual: [1, periodLen],
      follicular: [periodLen + 1, Math.max(periodLen, ov - 2)],
      ovulation: [Math.max(periodLen + 1, ov - 1), ov + 1],
      luteal: [ov + 2, len],
    };
    const diff = daysBetween(parseKey(profile.periodStart), date);
    const isPastOrToday = date <= today();
    let day, late = false, daysLate = 0;
    if (diff >= 0 && diff < len) day = diff + 1;
    else if (diff >= len && diff < len + 10 && isPastOrToday) { day = diff + 1; late = true; daysLate = diff + 1 - len; }
    else day = (((diff % len) + len) % len) + 1;

    let phase = 'luteal';
    if (!late) for (const p of D.PHASE_ORDER) if (day >= ranges[p][0] && day <= ranges[p][1]) { phase = p; break; }
    const next = D.PHASE_ORDER[(D.PHASE_ORDER.indexOf(phase) + 1) % 4];
    const daysToNext = late ? 0 : next === 'menstrual' ? len - day + 1 : ranges[next][0] - day;
    return { steady: false, mode, day, len, phase, dayInPhase: day - ranges[phase][0], ranges, next, daysToNext, daysToPeriod: late ? 0 : len - day + 1, late, daysLate, estimate: ESTIMATE_MODES.includes(mode) || !profile.learnedLength };
  }

  // ---------- targets ----------
  const GOALS = [
    { id: 'lose', label: 'Lose body fat', desc: 'Lean out while keeping muscle', kcal: 0.82, protein: 2.2 },
    { id: 'muscle', label: 'Build muscle', desc: 'Add lean size and shape', kcal: 1.08, protein: 2.0 },
    { id: 'glutes', label: 'Grow my glutes', desc: 'Lower-body and glute focus', kcal: 1.05, protein: 2.0 },
    { id: 'recomp', label: 'Tone and recomp', desc: 'Lose fat and build muscle together', kcal: 0.95, protein: 2.2 },
    { id: 'strength', label: 'Get stronger', desc: 'Lift heavier on the big lifts', kcal: 1.05, protein: 1.8 },
    { id: 'health', label: 'Feel healthier', desc: 'Energy, mood and consistency', kcal: 1.0, protein: 1.6 },
  ];
  const LEVELS = [
    { id: 'beginner', label: 'Beginner', desc: 'New to lifting or returning after a long break' },
    { id: 'intermediate', label: 'Intermediate', desc: 'Training consistently for 6+ months' },
    { id: 'advanced', label: 'Advanced', desc: 'Years of structured strength training' },
  ];
  const ACTIVITY = [
    { id: 'sedentary', label: 'Mostly sitting', desc: 'Desk job, under 5,000 steps a day', mult: 1.2, steps: 7000, water: 0 },
    { id: 'light', label: 'Lightly active', desc: 'Some walking, 5,000-8,000 steps', mult: 1.375, steps: 8000, water: 250 },
    { id: 'moderate', label: 'Active', desc: 'On your feet a lot, 8,000-11,000 steps', mult: 1.55, steps: 9000, water: 500 },
    { id: 'very', label: 'Very active', desc: 'Physical job or 11,000+ steps', mult: 1.725, steps: 10000, water: 750 },
  ];
  const goalOf = (p) => GOALS.find((g) => g.id === p.goal) || GOALS[5];
  const activityOf = (p) => ACTIVITY.find((a) => a.id === p.activity) || ACTIVITY[1];

  function targets(profile, cyc, plan) {
    plan = plan || {};
    const w = Number(profile.weightKg) || 65;
    const h = Number(profile.heightCm) || 165;
    const age = Number(profile.age) || 28;
    const goal = goalOf(profile);
    const act = activityOf(profile);
    const bmr = 10 * w + 6.25 * h - 5 * age - 161;
    const phaseKcal = { menstrual: 50, follicular: 0, ovulation: 0, luteal: 150, steady: 0 }[cyc.phase];
    const kcal = round(Math.max(bmr * 1.1, bmr * act.mult * goal.kcal + (plan.kcalAdjust || 0)) + phaseKcal, 10);
    const perKg = profile.cycleMode === 'perimenopause' ? Math.max(goal.protein, 2.0) : goal.protein;
    const protein = round(Math.min(w * perKg, (kcal * 0.35) / 4) + (cyc.phase === 'luteal' ? 5 : 0), 5);
    const fat = round(w * 0.9, 5);
    const carbs = Math.max(80, round((kcal - protein * 4 - fat * 9) / 4, 5));
    const waterMl = w * 35 + act.water + (cyc.phase === 'luteal' || cyc.phase === 'menstrual' ? 250 : 0);
    const stepPhase = { menstrual: -1500, follicular: 1000, ovulation: 1500, luteal: 0, steady: 0 }[cyc.phase];
    const steps = Math.max(4000, round(act.steps + (profile.goal === 'lose' || profile.goal === 'recomp' ? 2000 : 0) + stepPhase + (plan.stepBonus || 0), 500));
    return { kcal, protein, fat, carbs, water: Math.round(waterMl / 100) / 10, waterMl: round(waterMl, 50), steps, bmr: Math.round(bmr) };
  }

  // ---------- readiness + check-ins ----------
  function readiness(c) {
    if (!c) return null;
    const s = ((c.energy - 1) / 4) * 35 + ((c.sleep - 1) / 4) * 30 + ((c.mood - 1) / 4) * 15 + ((5 - c.soreness) / 4) * 20;
    const sym = c.symptoms || [];
    const penalty = (sym.includes('Cramps') ? 8 : 0) + (sym.includes('Headache') ? 5 : 0) + (sym.includes('Poor sleep') ? 3 : 0);
    return clamp(Math.round(s - penalty), 0, 100);
  }
  const readinessLabel = (r) => (r == null ? 'Not checked in' : r >= 75 ? 'High' : r >= 50 ? 'Moderate' : 'Low');

  // Patterns across cycles from daily check-ins (each stores its cycle day and phase).
  function patterns(daily) {
    const entries = Object.entries(daily || {}).map(([date, c]) => ({ date, ...c })).filter((c) => c.cycleDay && c.phase && c.phase !== 'steady');
    const out = { insights: [], dipDays: [], byPhase: {} };
    if (entries.length < 6) return out;

    for (const p of D.PHASE_ORDER) {
      const es = entries.filter((e) => e.phase === p);
      if (es.length >= 2) out.byPhase[p] = { energy: mean(es.map((e) => e.energy)), readiness: mean(es.map((e) => readiness(e))), n: es.length };
    }
    const phases = Object.keys(out.byPhase);
    if (phases.length >= 2) {
      const hi = phases.reduce((a, b) => (out.byPhase[a].energy >= out.byPhase[b].energy ? a : b));
      const lo = phases.reduce((a, b) => (out.byPhase[a].energy <= out.byPhase[b].energy ? a : b));
      if (out.byPhase[hi].energy - out.byPhase[lo].energy >= 0.8) {
        out.insights.push(`Your energy is highest in your ${D.PHASES[hi].name.toLowerCase()} phase (${out.byPhase[hi].energy.toFixed(1)}/5) and lowest in your ${D.PHASES[lo].name.toLowerCase()} phase (${out.byPhase[lo].energy.toFixed(1)}/5).`);
      }
    }

    const byDay = {};
    entries.forEach((e) => { (byDay[e.cycleDay] = byDay[e.cycleDay] || []).push(e.energy); });
    out.dipDays = Object.keys(byDay).map(Number).filter((d) => byDay[d].length >= 2 && mean(byDay[d]) <= 2.5).sort((a, b) => a - b);
    if (out.dipDays.length) {
      const runs = [];
      out.dipDays.forEach((d) => { const r = runs[runs.length - 1]; if (r && d - r[1] <= 1) r[1] = d; else runs.push([d, d]); });
      const text = runs.map(([a, b]) => (a === b ? `day ${a}` : `days ${a}-${b}`)).join(' and ');
      out.insights.push(`Your energy usually dips around ${text} of your cycle. I plan lighter sessions for those days.`);
    }

    D.SYMPTOMS.forEach((sym) => {
      const hits = entries.filter((e) => (e.symptoms || []).includes(sym));
      if (hits.length < 3) return;
      const count = {};
      hits.forEach((h) => { count[h.phase] = (count[h.phase] || 0) + 1; });
      const top = Object.keys(count).reduce((a, b) => (count[a] >= count[b] ? a : b));
      if (count[top] / hits.length >= 0.6) {
        const days = hits.filter((h) => h.phase === top).map((h) => h.cycleDay);
        out.insights.push(`${sym} mostly shows up in your ${D.PHASES[top].name.toLowerCase()} phase (${count[top]} of ${hits.length} times, around days ${Math.min(...days)}-${Math.max(...days)}).`);
      }
    });
    return out;
  }

  // ---------- workouts ----------
  const workoutById = (id) => D.WORKOUTS.find((w) => w.id === id);
  function plannedWorkout(data, date) {
    const cyc = cycleInfo(data.profile, date);
    const rot = D.ROTATION[cyc.phase];
    return workoutById(rot[cyc.dayInPhase % rot.length]);
  }
  function workoutFor(data, date) {
    const ov = (data.overrides || {})[dateKey(date)];
    return (ov && workoutById(ov)) || plannedWorkout(data, date);
  }
  function adjustSets(ex, level, plan) {
    let sets = ex.sets;
    if (level === 'beginner') sets = Math.max(2, sets - 1);
    if (level === 'advanced' && ex.main) sets += 1;
    if (ex.main && plan && plan.volume) sets += plan.volume;
    return Math.max(2, Math.min(sets, 6));
  }

  function parseReps(str) {
    const m = /^(\d+)(?:\s*-\s*(\d+))?(?:\s*\/\s*(?:leg|side))?$/.exec(String(str || '').trim());
    if (!m) return null;
    const lo = Number(m[1]);
    return { lo, hi: m[2] ? Number(m[2]) : lo };
  }
  const e1rm = (w, r) => (r > 0 && w > 0 ? (r === 1 ? w : w * (1 + r / 30)) : 0);
  const toKg = (w, unit) => (unit === 'lb' ? w / 2.20462 : w);
  const fromKg = (w, unit) => (unit === 'lb' ? w * 2.20462 : w);
  const roundLoad = (x, inc) => Math.max(inc, Number((Math.round(x / inc) * inc).toFixed(2)));

  function increment(name, top, unit) {
    if (/raise|curl|fly|pushdown|kickback|abduction|face pull|extension|calf|arnold/i.test(name)) return unit === 'lb' ? 2.5 : 1;
    const big = /squat|deadlift|hip thrust|leg press|sled/i.test(name);
    if (unit === 'lb') return big && top >= 130 ? 10 : 5;
    return big && top >= 60 ? 5 : 2.5;
  }

  function exerciseHistory(workouts, name) {
    return (workouts || [])
      .filter((w) => w.detail)
      .map((w) => ({ date: w.date, phase: w.phase, unit: w.unit || 'kg', ex: w.detail.find((e) => e.name === name) }))
      .filter((x) => x.ex && x.ex.sets.some((s) => s.weight > 0 && s.reps > 0))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  // Double progression, adjusted for cycle phase and readiness.
  function suggestLoad(name, repsStr, workouts, ctx) {
    const target = parseReps(repsStr);
    if (!target) return null;
    const unit = ctx.unit || 'kg';
    const hist = exerciseHistory(workouts, name);
    if (!hist.length) return { first: true, unit, reps: target.lo, reason: 'First time logging this lift. Pick a weight you could lift for 2-3 more reps.' };
    const last = hist[hist.length - 1];
    const sets = last.ex.sets.filter((s) => s.weight > 0 && s.reps > 0);
    let top = Math.max(...sets.map((s) => s.weight));
    const minReps = Math.min(...sets.filter((s) => s.weight === top).map((s) => s.reps));
    const converted = last.unit !== unit;
    if (converted) top = fromKg(toKg(top, last.unit), unit);
    const inc = increment(name, top, unit);
    if (converted) top = roundLoad(top, inc); // only snap to the plate grid when switching units

    let weight = top, reps, reason;
    if (minReps >= target.hi) { weight = top + inc; reps = target.lo; reason = 'You hit the top of the rep range last time, so add weight.'; }
    else if (minReps >= target.lo) { reps = Math.min(minReps + 1, target.hi); reason = 'Same weight, beat last time by a rep.'; }
    else {
      const prev = hist[hist.length - 2];
      const missedTwice = prev && Math.min(...prev.ex.sets.filter((s) => s.weight > 0).map((s) => s.reps)) < target.lo;
      reps = target.lo;
      if (missedTwice) { weight = roundLoad(top * 0.9, inc); reason = 'Two sessions short of target, so reset 10% and build back.'; }
      else reason = 'Same weight. Own the target reps first.';
    }

    const low = ctx.readiness != null && ctx.readiness < 45;
    if (ctx.phase === 'menstrual' || low) {
      weight = Math.min(weight, roundLoad(top * 0.9, inc));
      reps = target.lo;
      reason = low ? 'Readiness is low today, so about 10% lighter. Quality reps only.' : 'About 10% lighter for your menstrual phase. Smooth, controlled reps.';
    } else if (ctx.phase === 'luteal' && weight > top) {
      weight = top;
      reps = Math.min(minReps + 1, target.hi);
      reason = 'Holding the weight in your luteal phase. Chase clean reps instead.';
    }
    return { weight: Number(weight.toFixed(2)), reps, unit, reason, last: { weight: roundLoad(top, 0.5), reps: minReps, date: last.date } };
  }

  function bestE1rm(ex, unit) {
    return Math.max(0, ...ex.sets.filter((s) => s.weight > 0 && s.reps > 0 && s.reps <= 20).map((s) => e1rm(toKg(s.weight, unit), s.reps)));
  }

  function detectPRs(workout, prior) {
    const prs = [];
    (workout.detail || []).forEach((ex) => {
      const now = bestE1rm(ex, workout.unit);
      if (!now) return;
      const before = exerciseHistory(prior, ex.name).map((h) => bestE1rm(h.ex, h.unit));
      if (before.length && now > Math.max(...before) * 1.001) {
        const best = ex.sets.filter((s) => s.weight > 0 && s.reps > 0).reduce((a, b) => (e1rm(b.weight, b.reps) > e1rm(a.weight, a.reps) ? b : a));
        prs.push({ name: ex.name, weight: best.weight, reps: best.reps, unit: workout.unit || 'kg' });
      }
    });
    return prs;
  }

  // Relative strength by phase, normalised per exercise.
  function strengthByPhase(workouts) {
    const byEx = {};
    (workouts || []).forEach((w) => {
      if (!w.detail || !w.phase || w.phase === 'steady') return;
      w.detail.forEach((ex) => { const v = bestE1rm(ex, w.unit); if (v) (byEx[ex.name] = byEx[ex.name] || []).push({ phase: w.phase, v }); });
    });
    const ratios = {};
    Object.values(byEx).forEach((list) => {
      if (list.length < 3 || new Set(list.map((x) => x.phase)).size < 2) return;
      const m = mean(list.map((x) => x.v));
      list.forEach((x) => (ratios[x.phase] = ratios[x.phase] || []).push(x.v / m));
    });
    const byPhase = {};
    Object.keys(ratios).forEach((p) => { if (ratios[p].length >= 2) byPhase[p] = { pct: (mean(ratios[p]) - 1) * 100, n: ratios[p].length }; });
    const ps = Object.keys(byPhase);
    if (ps.length < 2) return null;
    const best = ps.reduce((a, b) => (byPhase[a].pct >= byPhase[b].pct ? a : b));
    const low = ps.reduce((a, b) => (byPhase[a].pct <= byPhase[b].pct ? a : b));
    const diff = ((1 + byPhase[best].pct / 100) / (1 + byPhase[low].pct / 100) - 1) * 100;
    return { byPhase, best, low, diff };
  }

  // ---------- nutrition ----------
  function avoidTags(profile) {
    const set = new Set();
    (profile.avoid || []).forEach((label) => { const o = D.AVOID_OPTIONS.find((x) => x.label === label); if (o) o.tags.forEach((t) => set.add(t)); });
    return set;
  }
  function mealOptions(profile, phase, slot) {
    const avoid = avoidTags(profile);
    const favs = (profile.favorites || []).map((f) => f.toLowerCase().split(' ')[0]);
    const dislikes = (profile.foodNotes || '').toLowerCase().split(/[,\n]/).map((x) => x.trim()).filter((x) => x.length > 2);
    const scored = D.MEALS[phase][slot].map((meal, i) => {
      const text = (meal.name + ' ' + meal.desc).toLowerCase();
      const conflicts = meal.tags.filter((t) => avoid.has(t)).length;
      const score = favs.filter((f) => text.includes(f)).length * 2 - conflicts * 10 - (dislikes.some((d) => text.includes(d)) ? 3 : 0);
      return { meal, i, conflicts, score };
    });
    const ok = scored.filter((s) => s.conflicts === 0);
    const list = (ok.length ? ok : scored).sort((a, b) => b.score - a.score || a.i - b.i);
    return { list: list.map((s) => s.meal), compromised: !ok.length };
  }
  function mealFor(data, date, slot) {
    const phase = cycleInfo(data.profile, date).phase;
    const { list, compromised } = mealOptions(data.profile, phase, slot);
    const swaps = ((data.mealSwaps || {})[dateKey(date)] || {})[slot] || 0;
    return { meal: list[swaps % list.length], count: list.length, compromised, phase };
  }
  // ---------- food log (barcode scans, search, manual entries) ----------
  const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) && n >= 0 ? n : null; };

  // Normalise an Open Food Facts product into per-serving and per-100 g macros.
  function parseOFF(product, barcode) {
    if (!product) return null;
    const n = product.nutriments || {};
    const kcal100 = num(n['energy-kcal_100g']) ?? (num(n.energy_100g) != null ? num(n.energy_100g) / 4.184 : null);
    const per100 = { kcal: kcal100, protein: num(n.proteins_100g), carbs: num(n.carbohydrates_100g), fat: num(n.fat_100g) };
    const grams = num(product.serving_quantity);
    let perServing = { kcal: num(n['energy-kcal_serving']), protein: num(n.proteins_serving), carbs: num(n.carbohydrates_serving), fat: num(n.fat_serving) };
    if (perServing.kcal == null && grams && per100.kcal != null) {
      perServing = Object.fromEntries(Object.entries(per100).map(([k, v]) => [k, v == null ? null : (v * grams) / 100]));
    }
    const hasServing = perServing.kcal != null;
    const hasPer100 = per100.kcal != null;
    if (!hasServing && !hasPer100) return null;
    const name = (product.product_name || product.generic_name || '').trim() || 'Unnamed product';
    const round1 = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v == null ? 0 : Math.round(v * 10) / 10]));
    return {
      barcode: barcode || product.code || null,
      name,
      brand: (product.brands || '').split(',')[0].trim(),
      image: product.image_front_small_url || null,
      serving: hasServing ? { label: product.serving_size || (grams ? `${grams} g` : '1 serving'), grams: grams || null } : { label: '100 g', grams: 100 },
      perServing: round1(hasServing ? perServing : per100),
      per100: hasPer100 ? round1(per100) : null,
    };
  }

  // Macros for an amount: servings of the label serving, or grams when per-100 g data exists.
  function foodMacros(food, amount, mode) {
    const base = mode === 'grams' && food.per100 ? food.per100 : food.perServing;
    const factor = mode === 'grams' && food.per100 ? amount / 100 : amount;
    return { kcal: Math.round(base.kcal * factor), protein: Math.round(base.protein * factor * 10) / 10, carbs: Math.round(base.carbs * factor * 10) / 10, fat: Math.round(base.fat * factor * 10) / 10 };
  }

  function macrosFor(data, key) {
    const total = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    Object.values((data.eaten || {})[key] || {}).forEach((m) => { total.kcal += m.kcal || 0; total.protein += m.protein || 0; total.carbs += m.carbs || 0; total.fat += m.fat || 0; });
    ((data.foodLog || {})[key] || []).forEach((f) => { total.kcal += f.kcal; total.protein += f.protein; total.carbs += f.carbs; total.fat += f.fat; });
    total.protein += (data.proteinExtra || {})[key] || 0;
    return { kcal: Math.round(total.kcal), protein: Math.round(total.protein), carbs: Math.round(total.carbs), fat: Math.round(total.fat) };
  }
  const proteinFor = (data, key) => macrosFor(data, key).protein;

  // EAN-13 / UPC-A / EAN-8 check digit validation, so a misread scan is rejected before lookup.
  function validBarcode(code) {
    if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;
    const digits = code.split('').map(Number);
    const check = digits.pop();
    const sum = digits.reverse().reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
    return (10 - (sum % 10)) % 10 === check;
  }

  const CATS = { p: 'Protein', v: 'Produce', g: 'Pantry and grains', d: 'Dairy and eggs' };
  function groceryList(data, start, days) {
    const items = {};
    for (let i = 0; i < (days || 7); i++) {
      const date = addDays(start, i);
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach((slot) => {
        const { meal } = mealFor(data, date, slot);
        (D.GROCERY[meal.name] || []).forEach((code) => {
          const [c, name] = code.split(':');
          const k = name.toLowerCase();
          items[k] = items[k] || { name, cat: CATS[c] || 'Other', count: 0 };
          items[k].count++;
        });
      });
    }
    const out = {};
    Object.values(items).sort((a, b) => a.name.localeCompare(b.name)).forEach((it) => { (out[it.cat] = out[it.cat] || []).push(it); });
    return out;
  }

  // ---------- streak ----------
  // A day counts if she trained, walked at least 60% of her steps, or checked in.
  // One missed day per week is forgiven so a rest day never breaks the streak.
  function streak(data) {
    const active = (d) => {
      const k = dateKey(d);
      if ((data.workouts || []).some((w) => w.date === k)) return true;
      if ((data.daily || {})[k]) return true;
      const t = targets(data.profile, cycleInfo(data.profile, d), data.plan);
      return ((data.steps || {})[k] || 0) >= t.steps * 0.6;
    };
    let d = today();
    const todayDone = active(d);
    if (!todayDone) d = addDays(d, -1);
    let count = 0, sinceGrace = 7;
    for (let i = 0; i < 366; i++) {
      if (active(d)) { count++; sinceGrace++; }
      else if (sinceGrace >= 6 && count > 0 && active(addDays(d, -1))) { sinceGrace = 0; }
      else break;
      d = addDays(d, -1);
    }
    return { count, todayDone };
  }

  // ---------- weekly check-in ----------
  function weeklyStats(data, now) {
    now = now || today();
    const days = Array.from({ length: 7 }, (_, i) => addDays(now, i - 6));
    const keys = days.map(dateKey);
    const sessions = (data.workouts || []).filter((w) => keys.includes(w.date)).length;
    const planned = days.filter((d) => plannedWorkout(data, d).id !== 'rest').length;
    let stepDays = 0, stepTotal = 0, proteinDays = 0, proteinLogged = false;
    days.forEach((d) => {
      const k = dateKey(d);
      const t = targets(data.profile, cycleInfo(data.profile, d), data.plan);
      const s = (data.steps || {})[k] || 0;
      stepTotal += s;
      if (s >= t.steps) stepDays++;
      const p = proteinFor(data, k);
      if (p > 0) proteinLogged = true;
      if (p >= t.protein * 0.9) proteinDays++;
    });
    const ready = keys.map((k) => readiness((data.daily || {})[k])).filter((r) => r != null);
    const checks = (data.checkins || []).slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    const recent = checks.filter((c) => daysBetween(parseKey(c.date), now) <= 7);
    const before = checks.filter((c) => { const g = daysBetween(parseKey(c.date), now); return g > 7 && g <= 21; });
    let weightChange = null;
    if (recent.length && before.length) {
      const span = Math.max(7, daysBetween(parseKey(before[before.length - 1].date), parseKey(recent[recent.length - 1].date)));
      weightChange = ((mean(recent.map((c) => c.kg)) - mean(before.map((c) => c.kg))) / span) * 7;
    }
    const phaseDays = {};
    days.forEach((d) => { const p = cycleInfo(data.profile, d).phase; phaseDays[p] = (phaseDays[p] || 0) + 1; });
    const upcoming = [];
    let prev = cycleInfo(data.profile, now).phase;
    for (let i = 1; i <= 7; i++) {
      const d = addDays(now, i);
      const c = cycleInfo(data.profile, d);
      if (c.phase !== prev) upcoming.push({ phase: c.phase, date: dateKey(d) });
      prev = c.phase;
    }
    const prs = (data.prs || []).filter((p) => keys.includes(p.date));
    return { from: keys[0], to: keys[6], sessions, planned, stepDays, stepAvg: Math.round(stepTotal / 7), proteinDays: proteinLogged ? proteinDays : null, readinessAvg: ready.length ? Math.round(mean(ready)) : null, checkinDays: ready.length, weightChange, phaseDays, upcoming, prs: prs.length };
  }

  // Answers: feel (easy|right|hard), hunger (low|ok|high), next (normal|busy|travel|push).
  function weeklyAdjust(stats, answers, data) {
    const p = data.profile;
    const plan = data.plan || {};
    const adj = [];
    const notes = [];
    const bw = Number(p.weightKg) || 65;
    const consistent = stats.sessions >= Math.max(2, stats.planned - 1);
    const mostlyLuteal = (stats.phaseDays.luteal || 0) >= 4;

    if ((answers.feel === 'easy' || answers.next === 'push') && consistent && (stats.readinessAvg == null || stats.readinessAvg >= 55) && (plan.volume || 0) < 1) {
      adj.push({ key: 'volume', delta: 1, label: 'Add a set to your main lifts', why: 'Training felt easy and you were consistent.' });
    } else if ((answers.feel === 'hard' || (stats.readinessAvg != null && stats.readinessAvg < 50)) && (plan.volume || 0) > -1) {
      adj.push({ key: 'volume', delta: -1, label: 'Remove a set from your main lifts', why: answers.feel === 'hard' ? 'Training felt too hard. Recover, then build back.' : 'Your readiness averaged under 50 this week.' });
    }

    if (stats.stepDays <= 2 && (plan.stepBonus || 0) > -2000) {
      adj.push({ key: 'stepBonus', delta: -1000, label: 'Lower your step target by 1,000', why: `You hit it on ${stats.stepDays} of 7 days. A target you can win builds the habit.` });
    } else if (stats.stepDays >= 6 && ['lose', 'recomp'].includes(p.goal) && (plan.stepBonus || 0) < 3000) {
      adj.push({ key: 'stepBonus', delta: 500, label: 'Raise your step target by 500', why: 'You hit your steps 6 or more days. Time for a small step up.' });
    }

    const w = stats.weightChange;
    const k = plan.kcalAdjust || 0;
    if (['lose', 'recomp'].includes(p.goal)) {
      if ((w != null && w < -0.01 * bw) || answers.hunger === 'high') {
        if (k < 300) adj.push({ key: 'kcalAdjust', delta: 100, label: 'Add 100 kcal a day', why: answers.hunger === 'high' ? 'Hunger was high, so a small increase keeps this sustainable.' : 'You are losing faster than 1% of body weight a week.' });
      } else if (w != null && w > -0.1 && consistent && !mostlyLuteal && k > -300) {
        adj.push({ key: 'kcalAdjust', delta: -100, label: 'Trim 100 kcal a day', why: 'Your weight trend is flat even though you were consistent.' });
      } else if (w != null && w > -0.1 && mostlyLuteal) {
        notes.push('Your weight trend is flat, but you spent most of the week in your luteal phase, when water retention is common. Holding calories steady.');
      }
    } else if (['muscle', 'glutes', 'strength'].includes(p.goal)) {
      if (w != null && w < 0.05 && k < 300) adj.push({ key: 'kcalAdjust', delta: 100, label: 'Add 100 kcal a day', why: 'Your weight is not moving up, and muscle needs fuel.' });
      else if (w != null && w > 0.5 && k > -300) adj.push({ key: 'kcalAdjust', delta: -100, label: 'Trim 100 kcal a day', why: `You are gaining faster than about ${p.units === 'metric' ? '0.5 kg' : '1 lb'} a week.` });
    } else if (answers.hunger === 'high' && k < 300) {
      adj.push({ key: 'kcalAdjust', delta: 100, label: 'Add 100 kcal a day', why: 'Hunger was high this week.' });
    }

    if (answers.next === 'busy') notes.push('Busy week ahead: prioritise your 2-3 most important sessions and keep walking. Short and done beats perfect.');
    if (answers.next === 'travel') notes.push('Travelling: use hotel-gym or bodyweight versions, hit your steps exploring, and pack protein snacks.');
    stats.upcoming.forEach((u) => notes.push(`${D.PHASES[u.phase].name} starts ${parseKey(u.date).toLocaleDateString(undefined, { weekday: 'long' })}. ${D.PHASES[u.phase].training}`));
    return { adjustments: adj, notes };
  }

  function applyAdjustments(plan, adjustments) {
    const lim = { volume: [-1, 1], stepBonus: [-3000, 3000], kcalAdjust: [-300, 300] };
    adjustments.forEach((a) => { plan[a.key] = clamp((plan[a.key] || 0) + a.delta, lim[a.key][0], lim[a.key][1]); });
    return plan;
  }

  function weeklyDue(data, now) {
    now = now || today();
    const last = (data.reviews || [])[data.reviews ? data.reviews.length - 1 : 0];
    if (last && daysBetween(parseKey(last.date), now) < 6) return false;
    const wd = now.getDay();
    if (wd === 0 || wd === 1) return true;
    const dates = (data.workouts || []).map((w) => w.date).sort();
    return !last && dates.length > 0 && daysBetween(parseKey(dates[0]), now) >= 7;
  }

  const api = {
    dateKey, parseKey, today, addDays, daysBetween, clamp, round, mean, weekdayIndex,
    GOALS, LEVELS, ACTIVITY, goalOf, activityOf, STEADY_MODES,
    learnCycle, addPeriod, cycleInfo, targets, readiness, readinessLabel, patterns,
    workoutById, plannedWorkout, workoutFor, adjustSets, parseReps, e1rm, suggestLoad, detectPRs, strengthByPhase, exerciseHistory,
    mealOptions, mealFor, proteinFor, macrosFor, parseOFF, foodMacros, validBarcode, groceryList, streak, weeklyStats, weeklyAdjust, applyAdjustments, weeklyDue,
  };
  if (typeof window !== 'undefined') window.YOURS_LOGIC = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
