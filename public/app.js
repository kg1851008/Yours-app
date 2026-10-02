/* YOURS - cycle-synced fitness coaching. Single-page app, data stored on this device. */
(function () {
  'use strict';

  const D = window.YOURS_DATA;
  const root = document.getElementById('app');

  // ---------- utilities ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const round = (n, step) => Math.round(n / step) * step;
  const pad = (n) => String(n).padStart(2, '0');
  const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const todayKey = () => dateKey(today());
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const daysBetween = (a, b) => Math.round((b - a) / 86400000);
  const fmtDate = (d, opts) => d.toLocaleDateString(undefined, opts || { weekday: 'long', month: 'long', day: 'numeric' });
  const firstName = (n) => (n || '').trim().split(/\s+/)[0] || '';
  const initials = (n) => (n || '?').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';
  const timeAgo = (ts) => {
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return 'now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { toast('Storage is full or unavailable on this device'); return false; }
    },
    del(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
  };

  // ---------- icons ----------
  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    workouts: '<path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/>',
    meals: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7.5c0-1.5 1-2 1-3.5M12 7.5c0-1.5 1-2 1-3.5M16 7.5c0-1.5 1-2 1-3.5"/>',
    advisor: '<path d="M21 12a8.5 8.5 0 0 1-12.3 7.6L3.5 21l1.4-5A8.5 8.5 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
    community: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.7a3.5 3.5 0 0 1 0 6.6M18 14.3A6.5 6.5 0 0 1 21.5 20"/>',
    send: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    heart: '<path d="M12 20s-7.5-4.6-9.3-9.2C1.4 7.4 3.6 4 7 4c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8C19.5 15.4 12 20 12 20z"/>',
    comment: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    shield: '<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
    swap: '<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  };
  const icon = (name, size = 22, sw = 1.8) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  // ---------- state ----------
  const S = {
    session: store.get('yours.session', null), // { kind: 'user', email } | { kind: 'guest' }
    data: null,
    screen: 'welcome', // welcome | login
    tab: 'home',
    advisorView: 'coach',
    communityView: 'feed',
    openThread: null,
    openComments: {},
    modal: null,
    ai: null,
    typing: false,
    vaultUnlocked: false,
    photos: [],
    revealed: {},
    compare: [],
    analyzing: false,
    authError: '',
  };

  const dataKey = () => (S.session && S.session.kind === 'user' ? `yours.data.${S.session.email}` : 'yours.data.guest');
  const isGuest = () => !S.session || S.session.kind === 'guest';
  const users = () => store.get('yours.users', {});
  const currentUser = () => (isGuest() ? null : users()[S.session.email] || null);
  const myName = () => (currentUser() ? currentUser().name : '');

  function blankData() {
    return {
      onboarded: false, planSeen: false, obStep: 0,
      profile: { units: 'metric', cycleLength: 28, periodLength: 5, favorites: [], avoid: [], foodNotes: '' },
      workouts: [], steps: {}, water: {}, checkins: [], chat: [], overrides: {}, mealSwaps: {}, activeWorkout: null, pinHash: null, pinSalt: null,
    };
  }

  function loadData() {
    S.data = Object.assign(blankData(), store.get(dataKey(), {}));
  }
  function save() { if (S.session) store.set(dataKey(), S.data); }

  // ---------- crypto ----------
  const hex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  async function hashSecret(secret, salt) {
    if (window.crypto && crypto.subtle) {
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 120000 }, key, 256);
      return hex(bits);
    }
    // Insecure-context fallback (plain http on a LAN address). Weaker, but keeps the MVP usable.
    let h = 2166136261;
    const s = salt + secret;
    for (let r = 0; r < 2000; r++) for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i) + r; h = Math.imul(h, 16777619) >>> 0; }
    return 'f' + h.toString(16);
  }
  const newSalt = () => (window.crypto && crypto.getRandomValues ? hex(crypto.getRandomValues(new Uint8Array(16))) : uid());

  // ---------- cycle + targets ----------
  function cycleInfo(profile, date) {
    const len = clamp(Number(profile.cycleLength) || 28, 21, 45);
    const periodLen = clamp(Number(profile.periodLength) || 5, 2, 8);
    const start = profile.periodStart ? parseKey(profile.periodStart) : today();
    const diff = daysBetween(start, date || today());
    const day = (((diff % len) + len) % len) + 1;
    const ov = len - 14;
    const ranges = {
      menstrual: [1, periodLen],
      follicular: [periodLen + 1, Math.max(periodLen, ov - 2)],
      ovulation: [Math.max(periodLen + 1, ov - 1), ov + 1],
      luteal: [ov + 2, len],
    };
    let phase = 'luteal';
    for (const p of D.PHASE_ORDER) if (day >= ranges[p][0] && day <= ranges[p][1]) { phase = p; break; }
    const idx = D.PHASE_ORDER.indexOf(phase);
    const next = D.PHASE_ORDER[(idx + 1) % 4];
    const daysToNext = next === 'menstrual' ? len - day + 1 : ranges[next][0] - day;
    return { day, len, phase, dayInPhase: day - ranges[phase][0], ranges, next, daysToNext, daysToPeriod: len - day + 1 };
  }

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

  function targets(profile, cyc) {
    const w = Number(profile.weightKg) || 65;
    const h = Number(profile.heightCm) || 165;
    const age = Number(profile.age) || 28;
    const goal = goalOf(profile);
    const act = activityOf(profile);
    const bmr = 10 * w + 6.25 * h - 5 * age - 161;
    const phaseKcal = { menstrual: 50, follicular: 0, ovulation: 0, luteal: 150 }[cyc.phase];
    const kcal = round(Math.max(bmr * 1.1, bmr * act.mult * goal.kcal) + phaseKcal, 10);
    const protein = round(w * goal.protein + (cyc.phase === 'luteal' ? 5 : 0), 5);
    const fat = round(w * 0.9, 5);
    const carbs = Math.max(80, round((kcal - protein * 4 - fat * 9) / 4, 5));
    const waterMl = w * 35 + act.water + (cyc.phase === 'luteal' || cyc.phase === 'menstrual' ? 250 : 0);
    const stepPhase = { menstrual: -1500, follicular: 1000, ovulation: 1500, luteal: 0 }[cyc.phase];
    const steps = round(act.steps + (profile.goal === 'lose' || profile.goal === 'recomp' ? 2000 : 0) + stepPhase, 500);
    return { kcal, protein, fat, carbs, water: Math.round(waterMl / 100) / 10, waterMl: round(waterMl, 50), steps, bmr: Math.round(bmr) };
  }

  // ---------- workouts ----------
  const workoutById = (id) => D.WORKOUTS.find((w) => w.id === id);
  function todaysWorkout() {
    const ov = S.data.overrides[todayKey()];
    if (ov && workoutById(ov)) return workoutById(ov);
    const cyc = cycleInfo(S.data.profile);
    const rot = D.ROTATION[cyc.phase];
    return workoutById(rot[cyc.dayInPhase % rot.length]);
  }
  function adjustSets(ex) {
    const level = S.data.profile.level;
    if (level === 'beginner') return Math.max(2, ex.sets - 1);
    if (level === 'advanced' && ex.main) return ex.sets + 1;
    return ex.sets;
  }
  const loggedOn = (key) => S.data.workouts.filter((w) => w.date === key);
  function weekDays() {
    const t = today();
    const mon = addDays(t, -((t.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  }

  // ---------- meals ----------
  function avoidTags() {
    const set = new Set();
    (S.data.profile.avoid || []).forEach((label) => {
      const opt = D.AVOID_OPTIONS.find((o) => o.label === label);
      if (opt) opt.tags.forEach((t) => set.add(t));
    });
    return set;
  }
  function mealOptions(phase, slot) {
    const avoid = avoidTags();
    const favs = (S.data.profile.favorites || []).map((f) => f.toLowerCase());
    const extra = (S.data.profile.foodNotes || '').toLowerCase();
    const all = D.MEALS[phase][slot];
    const scored = all.map((meal, i) => {
      const text = (meal.name + ' ' + meal.desc).toLowerCase();
      const conflicts = meal.tags.filter((t) => avoid.has(t)).length;
      let score = favs.filter((f) => text.includes(f.toLowerCase().split(' ')[0])).length * 2 - conflicts * 10;
      if (extra && extra.split(/[,\n]/).some((w) => w.trim().length > 2 && text.includes(w.trim()))) score -= 3;
      return { meal, i, conflicts, score };
    });
    const ok = scored.filter((s) => s.conflicts === 0);
    const list = (ok.length ? ok : scored).sort((a, b) => b.score - a.score || a.i - b.i);
    return { list: list.map((s) => s.meal), compromised: !ok.length };
  }
  function mealFor(phase, slot) {
    const { list, compromised } = mealOptions(phase, slot);
    const swaps = (S.data.mealSwaps[todayKey()] || {})[slot] || 0;
    return { meal: list[swaps % list.length], count: list.length, compromised };
  }

  // ---------- AI ----------
  async function checkAI() {
    try {
      const r = await fetch('/api/coach', { method: 'GET' });
      const j = await r.json();
      S.ai = !!j.ai;
    } catch { S.ai = false; }
    render();
  }

  function buildContext() {
    const p = S.data.profile;
    const cyc = cycleInfo(p);
    const t = targets(p, cyc);
    const wk = todaysWorkout();
    const last14 = Array.from({ length: 14 }, (_, i) => dateKey(addDays(today(), -i)));
    return {
      name: firstName(myName()) || null,
      today: todayKey(),
      profile: { level: p.level, goal: goalOf(p).label, heightCm: p.heightCm, weightKg: p.weightKg, age: p.age, activity: activityOf(p).label, favoriteFoods: p.favorites, avoidFoods: p.avoid, foodNotes: p.foodNotes },
      cycle: { day: cyc.day, length: cyc.len, phase: cyc.phase, nextPhase: cyc.next, daysToNextPhase: cyc.daysToNext, daysToNextPeriod: cyc.daysToPeriod },
      targets: { calories: t.kcal, proteinG: t.protein, carbsG: t.carbs, fatG: t.fat, waterL: t.water, steps: t.steps },
      todaysWorkout: { id: wk.id, name: wk.name, completed: loggedOn(todayKey()).length > 0 },
      workoutCatalog: D.WORKOUTS.map((w) => ({ id: w.id, name: w.name, phase: w.phase, intensity: w.intensity })),
      recentWorkouts: S.data.workouts.slice(-10).map((w) => ({ date: w.date, name: w.name, minutes: w.minutes })),
      stepsLast14Days: last14.map((k) => ({ date: k, steps: S.data.steps[k] || 0 })),
      waterTodayMl: S.data.water[todayKey()] || 0,
      weightCheckins: S.data.checkins.slice(-12),
    };
  }

  const ACTION_RE = /\[\[action:(swap_workout|log_water|open):([a-z0-9_-]+)\]\]/gi;
  const TABS = ['home', 'workouts', 'meals', 'advisor', 'community', 'progress'];
  function extractActions(text) {
    const actions = [];
    const clean = text.replace(ACTION_RE, (_, type, value) => {
      type = type.toLowerCase();
      value = value.toLowerCase();
      if (type === 'swap_workout' && workoutById(value)) actions.push({ type, value });
      if (type === 'log_water' && Number(value) >= 100 && Number(value) <= 1000) actions.push({ type, value: Number(value) });
      if (type === 'open' && TABS.includes(value)) actions.push({ type, value });
      return '';
    }).trim();
    return { text: clean, actions };
  }
  function actionLabel(a) {
    if (a.type === 'swap_workout') return `Switch today to ${workoutById(a.value).name}`;
    if (a.type === 'log_water') return `Log ${a.value} ml water`;
    return `Open ${a.value[0].toUpperCase() + a.value.slice(1)}`;
  }

  // On-device coach used when the live AI is not configured or unreachable.
  function localCoach(input) {
    const q = input.toLowerCase();
    const p = S.data.profile;
    const cyc = cycleInfo(p);
    const ph = D.PHASES[cyc.phase];
    const t = targets(p, cyc);
    const wk = todaysWorkout();
    const name = firstName(myName());
    const hi = name ? `${name}, ` : '';
    const has = (...words) => words.some((w) => q.includes(w));
    const lighter = { menstrual: 'm-restore', follicular: 'rest', ovulation: 'rest', luteal: 'l-pilates' }[cyc.phase];
    const last14 = Array.from({ length: 14 }, (_, i) => S.data.steps[dateKey(addDays(today(), -i))] || 0);
    const stepDays = last14.filter((s) => s >= t.steps).length;
    const recent = S.data.workouts.filter((w) => daysBetween(parseKey(w.date), today()) < 14).length;

    if (has('cramp', 'pain', 'hurt', 'bloat')) {
      return `${hi}that is really common${cyc.phase === 'menstrual' ? ' in the first days of your period' : ''}. A few things that help most women:\n\n- Gentle movement: a 20-minute walk or the Restore session increases blood flow and often eases cramps.\n- Heat on your lower belly and slow breathing (inhale 4, exhale 6).\n- Magnesium-rich food: dark chocolate, pumpkin seeds, leafy greens.\n- Stay on top of water today: ${t.water} L.\n\nIf pain is severe, stops you functioning, or comes with very heavy bleeding, please check in with a doctor.\n[[action:swap_workout:m-restore]]\n[[action:log_water:500]]`;
    }
    if (has('tired', 'energy', 'exhaust', 'fatigue', 'sleepy', 'drained')) {
      return `${hi}you are in your ${ph.name.toLowerCase()} phase (day ${cyc.day}), where energy is typically ${ph.energy.toLowerCase()}. ${cyc.phase === 'menstrual' || cyc.phase === 'luteal' ? 'Low energy here is physiology, not a lack of discipline.' : 'If you are this tired in a high-energy phase, look at sleep, food and stress first.'}\n\nMy recommendation: keep the habit, lower the dose. Do a shorter or lighter session, hit at least ${round(t.steps * 0.8, 500).toLocaleString()} steps, and get ${t.protein} g of protein in.\n[[action:swap_workout:${lighter}]]`;
    }
    if (has('crav', 'sugar', 'chocolate', 'hungry', 'snack', 'binge')) {
      const snack = mealFor(cyc.phase, 'snack').meal;
      return `${hi}${cyc.phase === 'luteal' ? 'cravings in the luteal phase are expected. Your metabolism runs slightly higher, so you genuinely need about 100-200 more calories. I have already built that into your target.' : 'cravings usually mean a meal was light on protein or fiber, or sleep was short.'}\n\nTry this:\n- Lead every meal with protein (aim for about ${Math.round(t.protein / 4)} g per meal).\n- Add complex carbs at dinner, which also helps sleep.\n- Plan a satisfying snack instead of fighting it: ${snack.name}.\n\nToday's target is ${t.kcal.toLocaleString()} kcal.\n[[action:open:meals]]`;
    }
    if (has('protein')) {
      const favs = (p.favorites || []).slice(0, 4).join(', ');
      return `${hi}your protein target is ${t.protein} g a day (about ${goalOf(p).protein} g per kg for your goal${cyc.phase === 'luteal' ? ', plus a little extra this phase' : ''}).\n\nSplit it across 4 feedings of about ${Math.round(t.protein / 4)} g:\n- Breakfast: eggs, Greek yogurt or a protein smoothie\n- Lunch and dinner: a palm-and-a-half of lean protein\n- Snack: cottage cheese, edamame or a shake\n${favs ? `\nBuild around foods you already like: ${favs}.` : ''}\n[[action:open:meals]]`;
    }
    if (has('water', 'hydrat', 'drink')) {
      const had = S.data.water[todayKey()] || 0;
      return `${hi}aim for ${t.water} L today. You have logged ${(had / 1000).toFixed(1)} L so far. ${cyc.phase === 'luteal' || cyc.phase === 'menstrual' ? 'I added a little extra because this phase raises your needs.' : ''}\n\nEasy wins: a large glass on waking, one with every meal, and 500 ml around training. Add electrolytes on heavy sweat days.\n[[action:log_water:500]]`;
    }
    if (has('step', 'walk', 'cardio', 'neat')) {
      return `${hi}today's step target is ${t.steps.toLocaleString()}. You hit it on ${stepDays} of the last 14 days.\n\nSteps are the most underrated fat-loss and recovery tool: low stress on the body and easy to recover from. Ideas:\n- A 10-minute walk after each meal (about 3,000 steps)\n- Walking calls or meetings\n- Park further away and take the stairs\n\nIn your ${ph.name.toLowerCase()} phase I ${cyc.phase === 'menstrual' ? 'lowered the target slightly, so keep it gentle.' : cyc.phase === 'luteal' ? 'kept the target steady. Steady walking helps with bloating and mood.' : 'raised the target because your energy supports it.'}`;
    }
    if (has('glute', 'booty', 'bum', 'butt', 'hip thrust')) {
      return `${hi}for glute growth, focus on three things:\n\n- Progressive overload on hip thrusts, RDLs and split squats. Add load or reps every week in your follicular and ovulation phases.\n- 10-20 hard sets for glutes per week, spread over 2-3 sessions.\n- Eat enough: ${t.protein} g of protein and do not under-eat calories.\n\n${cyc.phase === 'ovulation' || cyc.phase === 'follicular' ? 'You are in a high-output phase, so this is the time to push your glute day.' : 'You are in a lower-output phase, so keep the weights steady and focus on mind-muscle connection.'}${cyc.phase !== 'menstrual' ? '\n[[action:swap_workout:o-glute]]' : ''}`;
    }
    if (has('sleep', 'insomnia', 'rest day', 'recover')) {
      return `${hi}recovery is where the results happen. Aim for 7-9 hours.\n\n- Keep a consistent wake time, even on weekends\n- Get daylight within an hour of waking\n- Have complex carbs and magnesium at dinner${cyc.phase === 'luteal' ? ' (especially now, when progesterone raises body temperature)' : ''}\n- Keep a cool, dark room and no screens for the last 30 minutes\n\nOn a poor-sleep day, lower the weights by about 10% instead of skipping.`;
    }
    if (has('skip', 'miss', 'motivat', 'lazy', 'cant be bothered', "can't be bothered", 'give up', 'quit')) {
      return `${hi}motivation comes and goes, and that is normal. Systems are what keep you going. Here is the deal: do the first 10 minutes of ${wk.name}. If you still want to stop after that, stop, and it still counts.\n\nYou have trained ${recent} time${recent === 1 ? '' : 's'} in the last two weeks. ${recent >= 6 ? 'That is real consistency, so be proud of it.' : 'Let us aim for 3 sessions this week, plus your steps.'}\n[[action:open:workouts]]`;
    }
    if (has('plateau', 'stuck', 'not working', 'no progress', 'on track', 'progress')) {
      const ws = S.data.checkins.slice(-6);
      const change = ws.length > 1 ? (ws[ws.length - 1].kg - ws[0].kg).toFixed(1) : null;
      return `${hi}here is what your data says:\n\n- Workouts in the last 14 days: ${recent}\n- Days hitting your step target: ${stepDays} of 14\n${change !== null ? `- Weight change over your last ${ws.length} check-ins: ${change > 0 ? '+' : ''}${change} kg\n` : '- No weight check-ins yet. Add one in Progress.\n'}\nBefore changing anything, lock in the basics for two weeks: 3-4 sessions a week, ${t.steps.toLocaleString()} steps and ${t.protein} g of protein. If you are still stuck, ${p.goal === 'lose' ? 'we reduce intake by about 100-150 kcal' : 'we add a set to your main lifts'}. Remember that weight in your luteal phase often reads higher because of water retention.\n[[action:open:progress]]`;
    }
    if (has('lose', 'fat', 'weight', 'scale', 'lean', 'deficit')) {
      return `${hi}sustainable fat loss looks like this:\n\n- A moderate deficit. Your target of ${t.kcal.toLocaleString()} kcal already accounts for that, and I never go below what your body needs to function.\n- High protein (${t.protein} g) and lifting to keep your muscle.\n- Steps: ${t.steps.toLocaleString()} a day.\n- Judge progress across a full cycle, not day to day. Luteal water retention can hide fat loss for a week.`;
    }
    if (has('muscle', 'build', 'gain', 'tone', 'bigger', 'shape', 'stronger', 'strength')) {
      return `${hi}building muscle comes down to progressive overload plus enough food.\n\n- Track your main lifts and beat last time by a rep or a little weight, especially in the follicular and ovulation phases.\n- Train each muscle about twice a week.\n- Eat ${t.kcal.toLocaleString()} kcal with ${t.protein} g of protein.\n- In the luteal and menstrual phases, hold the weights and focus on quality reps. That is still progress.\n\nToday's session is ${wk.name}.\n[[action:open:workouts]]`;
    }
    if (has('meal', 'eat', 'food', 'breakfast', 'lunch', 'dinner', 'recipe', 'diet')) {
      const b = mealFor(cyc.phase, 'breakfast').meal, l = mealFor(cyc.phase, 'lunch').meal, d = mealFor(cyc.phase, 'dinner').meal;
      return `${hi}today's ${ph.name.toLowerCase()}-phase plan:\n\n- Breakfast: ${b.name}\n- Lunch: ${l.name}\n- Dinner: ${d.name}\n\nFocus this phase: ${ph.nutrition}\n[[action:open:meals]]`;
    }
    if (has('workout', 'train', 'session', 'gym', 'exercise', 'lift', 'today')) {
      return `${hi}today is ${wk.name} (${wk.minutes} min, ${wk.intensity.toLowerCase()} intensity). ${wk.summary}\n\nWhy it fits: ${ph.training}\n\nIf you are not feeling it, I can swap to something lighter.\n[[action:open:workouts]]\n[[action:swap_workout:${lighter}]]`;
    }
    if (has('phase', 'cycle', 'period', 'ovulat', 'luteal', 'follicular', 'menstrual', 'hormone')) {
      return `${hi}you are on day ${cyc.day} of ${cyc.len}, in your ${ph.name.toLowerCase()} phase. ${ph.hormones}\n\n- Training: ${ph.training}\n- Nutrition: ${ph.nutrition}\n\nNext up: ${D.PHASES[cyc.next].name} in ${cyc.daysToNext} day${cyc.daysToNext === 1 ? '' : 's'}.`;
    }
    return `${hi}here is your snapshot for today:\n\n- Phase: ${ph.name}, day ${cyc.day}. ${ph.short}.\n- Workout: ${wk.name}\n- Targets: ${t.protein} g protein, ${t.water} L water, ${t.steps.toLocaleString()} steps\n\nAsk me about training, cravings, protein, steps, plateaus or how to adjust for how you feel today.`;
  }

  async function sendChat(text) {
    text = text.trim();
    if (!text || S.typing) return;
    S.data.chat.push({ role: 'user', content: text, ts: Date.now() });
    S.typing = true;
    save();
    render();
    scrollChat();
    let reply = null;
    if (S.ai) {
      try {
        const r = await fetch('/api/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'chat', context: buildContext(), messages: S.data.chat.slice(-20).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })) }),
        });
        if (r.ok) reply = (await r.json()).text;
      } catch { /* fall back */ }
    } else {
      await new Promise((res) => setTimeout(res, 650));
    }
    if (!reply) { reply = localCoach(text); reply = reply.charAt(0).toUpperCase() + reply.slice(1); }
    const { text: clean, actions } = extractActions(reply);
    S.data.chat.push({ role: 'coach', content: clean, actions, ts: Date.now() });
    S.typing = false;
    save();
    render();
    scrollChat();
  }
  function scrollChat() { requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })); }

  function runAction(a) {
    if (a.type === 'swap_workout') { S.data.overrides[todayKey()] = a.value; save(); toast(`Today is now ${workoutById(a.value).name}`); }
    if (a.type === 'log_water') { addWater(a.value); }
    if (a.type === 'open') {
      if (a.value === 'progress') { S.tab = 'advisor'; S.advisorView = 'progress'; } else S.tab = a.value;
      window.scrollTo(0, 0);
    }
    render();
  }

  function addWater(ml) {
    const k = todayKey();
    S.data.water[k] = Math.max(0, (S.data.water[k] || 0) + ml);
    save();
    toast(`${ml > 0 ? 'Added' : 'Removed'} ${Math.abs(ml)} ml`);
  }

  // ---------- simple markdown for coach output ----------
  function rich(text) {
    const lines = esc(text).split('\n');
    let html = '';
    let inList = false;
    for (const raw of lines) {
      const line = raw.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      const li = /^\s*[-*]\s+(.*)$/.exec(line);
      if (li) { if (!inList) { html += '<ul>'; inList = true; } html += `<li>${li[1]}</li>`; continue; }
      if (inList) { html += '</ul>'; inList = false; }
      const h = /^#{1,4}\s+(.*)$/.exec(line);
      if (h) html += `<h4>${h[1]}</h4>`;
      else if (line.trim()) html += `<p>${line}</p>`;
    }
    if (inList) html += '</ul>';
    return html;
  }

  // ---------- photos (IndexedDB, device only) ----------
  let dbPromise = null;
  function db() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open('yours-vault', 1);
        req.onupgradeneeded = () => {
          const s = req.result.createObjectStore('photos', { keyPath: 'id' });
          s.createIndex('owner', 'owner');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }
  async function photoTx(mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const tx = d.transaction('photos', mode);
      const result = fn(tx.objectStore('photos'));
      tx.oncomplete = () => resolve(result && result.result !== undefined ? result.result : result);
      tx.onerror = () => reject(tx.error);
    });
  }
  async function loadPhotos() {
    if (isGuest()) { S.photos = []; return; }
    try {
      const list = await photoTx('readonly', (s) => s.index('owner').getAll(S.session.email));
      S.photos = (list || []).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.created - a.created));
    } catch { S.photos = []; }
  }
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const max = 1024;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
      img.src = url;
    });
  }

  function localProgressReview() {
    const p = S.data.profile;
    const t = targets(p, cycleInfo(p));
    const ws = S.data.checkins.slice(-8);
    const change = ws.length > 1 ? ws[ws.length - 1].kg - ws[0].kg : null;
    const weeks = ws.length > 1 ? Math.max(1, daysBetween(parseKey(ws[0].date), parseKey(ws[ws.length - 1].date)) / 7) : null;
    const perWeek = change !== null ? change / weeks : null;
    const sessions = S.data.workouts.filter((w) => daysBetween(parseKey(w.date), today()) < 28).length / 4;
    const last14 = Array.from({ length: 14 }, (_, i) => S.data.steps[dateKey(addDays(today(), -i))] || 0);
    const stepPct = Math.round((last14.filter((s) => s >= t.steps).length / 14) * 100);
    const goal = p.goal;
    let weightOk = true;
    if (perWeek !== null) {
      if (goal === 'lose') weightOk = perWeek <= 0 && perWeek >= -1;
      else if (goal === 'muscle' || goal === 'glutes') weightOk = perWeek >= -0.1 && perWeek <= 0.4;
      else weightOk = Math.abs(perWeek) <= 0.4;
    }
    const habits = (sessions >= 2.5) + (stepPct >= 60);
    const verdict = habits === 2 && weightOk ? 'on_track' : habits >= 1 ? 'progressing' : 'adjust';
    const lines = [
      verdict === 'on_track' ? 'Your habits and trend line up with your goal.' : verdict === 'progressing' ? 'You are moving in the right direction. Tighten one or two habits.' : 'Let us rebuild consistency before judging results.',
      '',
      '### What is working',
      `- ${sessions.toFixed(1)} sessions a week over the last 4 weeks`,
      `- Step target hit on ${stepPct}% of the last 14 days`,
      perWeek !== null ? `- Weight trend: ${perWeek > 0 ? '+' : ''}${perWeek.toFixed(2)} kg per week` : '- Add weekly weight check-ins to see your trend',
      '',
      '### Focus next',
      sessions < 2.5 ? '- Get to 3 sessions a week' : '- Keep adding small amounts of load to main lifts',
      stepPct < 60 ? `- Build up to ${t.steps.toLocaleString()} steps on most days` : '- Keep your steps consistent',
      !weightOk && goal === 'lose' ? '- Trend is flat or too fast. Aim for 0.25-0.75 kg a week' : `- Hit ${t.protein} g protein daily`,
      '',
      '### Next 2 weeks',
      '- Take photos in the same light, pose and cycle phase each time',
      '- Compare photos across the same phase, because luteal bloating is normal',
    ];
    return { verdict, text: lines.join('\n'), local: true };
  }

  async function analyzeProgress() {
    if (S.analyzing) return;
    const chosen = S.compare.map((id) => S.photos.find((p) => p.id === id)).filter(Boolean).slice(0, 4);
    S.analyzing = true;
    render();
    let result = null;
    if (S.ai) {
      try {
        const note = chosen.map((p, i) => `Photo ${i + 1}: ${p.pose} view, taken ${p.date}${p.phase ? ` during ${p.phase} phase` : ''}`).join('. ');
        const r = await fetch('/api/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'progress', context: buildContext(), images: chosen.map((p) => p.data), imageNote: note }),
        });
        if (r.ok) { const j = await r.json(); result = { verdict: j.verdict || 'progressing', text: j.text, photos: chosen.length }; }
      } catch { /* fall back */ }
    }
    if (!result) result = localProgressReview();
    result.date = todayKey();
    S.data.lastReview = result;
    S.analyzing = false;
    save();
    render();
  }

  // ---------- community (shared on this device) ----------
  function community() {
    let c = store.get('yours.community', null);
    if (!c) {
      c = {
        posts: D.SEED_POSTS.map((p) => ({ id: p.id, author: p.author, text: p.text, tag: p.tag, ts: Date.now() - p.hoursAgo * 3600000, baseLikes: p.likes, likedBy: [], comments: p.comments.map((x, i) => ({ author: x.author, text: x.text, ts: Date.now() - p.hoursAgo * 3600000 + (i + 1) * 900000 })) })),
        threads: {},
      };
      store.set('yours.community', c);
    }
    return c;
  }
  const saveCommunity = (c) => store.set('yours.community', c);
  const meId = () => (isGuest() ? null : `u:${S.session.email}`);
  function memberName(id) {
    if (!id) return 'Member';
    if (id.startsWith('u:')) { const u = users()[id.slice(2)]; return u ? u.name : 'Member'; }
    const m = D.MEMBERS.find((x) => x.id === id);
    return m ? m.name : 'Member';
  }
  function members() {
    const me = meId();
    const local = Object.values(users()).map((u) => ({ id: `u:${u.email}`, name: u.name, bio: 'YOURS member' })).filter((u) => u.id !== me);
    return D.MEMBERS.concat(local);
  }
  const threadKey = (a, b) => [a, b].sort().join('|');

  function requireAccount(reason) {
    if (!isGuest()) return true;
    S.modal = { type: 'signup', reason };
    render();
    return false;
  }

  // ---------- toast ----------
  let toastTimer;
  function toast(msg) {
    let el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.remove(), 2200);
  }

  // ---------- views: welcome + auth ----------
  function viewWelcome() {
    return `<div class="welcome">
      <div class="hero">
        <div class="wordmark xl">yours.</div>
        <div class="tagline">For your body.</div>
        <p class="lead">Coaching that moves with your cycle. Training, food and steps that change with you, every phase.</p>
      </div>
      <div class="stack">
        <button class="btn primary block" data-action="start">Get started</button>
        <button class="btn ghost block" data-action="go-login">I have an account</button>
        <button class="btn soft block" data-action="demo">Try the demo</button>
        <p class="tiny muted center" style="margin-top:16px">Your data stays on this device.</p>
      </div>
    </div>`;
  }

  function viewLogin() {
    return `<div class="screen no-nav">
      <div class="top"><button class="icon-btn" data-action="go-welcome" aria-label="Back">${icon('back', 20)}</button><div class="wordmark sm">yours.</div><span style="width:40px"></span></div>
      <h1 style="margin-top:24px">Welcome back</h1>
      <p class="muted" style="margin-top:6px">Sign in to pick up where you left off.</p>
      <form data-form="login" class="card" style="margin-top:24px">
        <label class="field"><span class="label">Email</span><input class="input" type="email" name="email" autocomplete="email" required></label>
        <label class="field"><span class="label">Password</span><input class="input" type="password" name="password" autocomplete="current-password" required></label>
        ${S.authError ? `<p class="error" style="margin-top:12px">${esc(S.authError)}</p>` : ''}
        <button class="btn primary block" style="margin-top:18px" type="submit">Sign in</button>
      </form>
      <p class="center small muted" style="margin-top:20px">New here? <button class="link" data-action="start">Build your plan</button></p>
      <p class="center small" style="margin-top:8px"><button class="link" data-action="demo">Try the demo</button></p>
    </div>`;
  }

  function signupForm(context) {
    return `<form data-form="signup" data-context="${context}">
      <label class="field"><span class="label">First name</span><input class="input" name="name" autocomplete="given-name" required maxlength="40"></label>
      <label class="field"><span class="label">Email</span><input class="input" type="email" name="email" autocomplete="email" required></label>
      <label class="field"><span class="label">Password</span><input class="input" type="password" name="password" autocomplete="new-password" minlength="6" required placeholder="At least 6 characters"></label>
      ${S.authError ? `<p class="error" style="margin-top:12px">${esc(S.authError)}</p>` : ''}
      <button class="btn primary block" style="margin-top:18px" type="submit">Save my plan</button>
    </form>`;
  }

  // ---------- onboarding ----------
  const OB_STEPS = 7;
  function viewOnboarding() {
    const p = S.data.profile;
    const step = S.data.obStep || 0;
    const editing = S.data.editing;
    const opt = (field, o) => `<button type="button" class="option ${p[field] === o.id ? 'selected' : ''}" data-action="ob-pick" data-field="${field}" data-value="${o.id}"><strong>${esc(o.label)}</strong><span>${esc(o.desc)}</span></button>`;
    let body = '';
    let valid = true;

    if (step === 0) {
      body = `<h1>What is your fitness level?</h1><p class="muted" style="margin:8px 0 24px">We use this to set your volume and progression.</p><div class="options">${LEVELS.map((o) => opt('level', o)).join('')}</div>`;
      valid = !!p.level;
    } else if (step === 1) {
      body = `<h1>What is your main goal?</h1><p class="muted" style="margin:8px 0 24px">Your calories, protein and training are built around it.</p><div class="options">${GOALS.map((o) => opt('goal', o)).join('')}</div>`;
      valid = !!p.goal;
    } else if (step === 2) {
      body = `<h1>When did your last period start?</h1><p class="muted" style="margin:8px 0 24px">The first day of bleeding. Your best guess is fine, and you can update it any time.</p>
        <label class="field"><span class="label">Start date</span><input class="input" type="date" data-bind="periodStart" value="${esc(p.periodStart || '')}" max="${todayKey()}"></label>`;
      valid = !!p.periodStart && p.periodStart <= todayKey();
    } else if (step === 3) {
      const imp = p.units === 'imperial';
      const ft = p.heightCm ? Math.floor(p.heightCm / 30.48) : '';
      const inch = p.heightCm ? Math.round((p.heightCm / 2.54) % 12) : '';
      const lb = p.weightKg ? Math.round(p.weightKg * 2.20462) : '';
      body = `<h1>Your height and weight</h1><p class="muted" style="margin:8px 0 20px">Used only to calculate your targets. Stored on this device.</p>
        <div class="segment" style="margin-bottom:20px"><button type="button" class="${!imp ? 'active' : ''}" data-action="ob-units" data-value="metric">Metric</button><button type="button" class="${imp ? 'active' : ''}" data-action="ob-units" data-value="imperial">Imperial</button></div>
        ${imp
          ? `<span class="label">Height</span><div class="input-row"><input class="input" type="number" inputmode="numeric" placeholder="ft" data-bind="ft" value="${ft}"><input class="input" type="number" inputmode="numeric" placeholder="in" data-bind="in" value="${inch}"></div>
             <label class="field" style="margin-top:14px"><span class="label">Weight (lb)</span><input class="input" type="number" inputmode="decimal" data-bind="lb" value="${lb}"></label>`
          : `<label class="field"><span class="label">Height (cm)</span><input class="input" type="number" inputmode="numeric" data-bind="heightCm" value="${p.heightCm || ''}"></label>
             <label class="field"><span class="label">Weight (kg)</span><input class="input" type="number" inputmode="decimal" step="0.1" data-bind="weightKg" value="${p.weightKg || ''}"></label>`}
        <label class="field" style="margin-top:14px"><span class="label">Age</span><input class="input" type="number" inputmode="numeric" data-bind="age" value="${p.age || ''}"></label>`;
      valid = p.heightCm >= 120 && p.heightCm <= 220 && p.weightKg >= 35 && p.weightKg <= 250 && p.age >= 14 && p.age <= 90;
    } else if (step === 4) {
      body = `<h1>How active are you day to day?</h1><p class="muted" style="margin:8px 0 24px">Outside of your workouts.</p><div class="options">${ACTIVITY.map((o) => opt('activity', o)).join('')}</div>`;
      valid = !!p.activity;
    } else if (step === 5) {
      body = `<h1>Your cycle</h1><p class="muted" style="margin:8px 0 28px">Most cycles are 21-35 days. Not sure? Leave it at 28.</p>
        <div class="card center"><div class="eyebrow">Cycle length</div><div class="big-number" style="margin:10px 0 6px" id="cl-out">${p.cycleLength}</div><div class="muted small">days</div>
        <input class="range" type="range" min="21" max="45" value="${p.cycleLength}" data-bind="cycleLength" data-out="cl-out" style="margin-top:16px"></div>
        <div class="card center"><div class="eyebrow">Period length</div><div class="big-number" style="margin:10px 0 6px" id="pl-out">${p.periodLength}</div><div class="muted small">days</div>
        <input class="range" type="range" min="2" max="8" value="${p.periodLength}" data-bind="periodLength" data-out="pl-out" style="margin-top:16px"></div>`;
    } else if (step === 6) {
      body = `<h1>Food you love, and food you avoid</h1><p class="muted" style="margin:8px 0 24px">Your meal plan leans toward your favourites and filters out the rest.</p>
        <div class="label">Favourites</div><div class="chips">${D.FAVORITE_OPTIONS.map((f) => `<button type="button" class="chip ${p.favorites.includes(f) ? 'selected' : ''}" data-action="ob-toggle" data-field="favorites" data-value="${esc(f)}">${esc(f)}</button>`).join('')}</div>
        <div class="label" style="margin-top:24px">Avoid or allergic to</div><div class="chips">${D.AVOID_OPTIONS.map((o) => `<button type="button" class="chip avoid ${p.avoid.includes(o.label) ? 'selected' : ''}" data-action="ob-toggle" data-field="avoid" data-value="${esc(o.label)}">${esc(o.label)}</button>`).join('')}</div>
        <label class="field" style="margin-top:24px"><span class="label">Anything else you dislike? (optional)</span><input class="input" data-bind="foodNotes" value="${esc(p.foodNotes || '')}" placeholder="e.g. coconut, olives" maxlength="200"></label>`;
    }

    return `<div class="screen no-nav">
      <div class="ob-head">
        <button class="icon-btn" data-action="ob-back" aria-label="Back">${icon('back', 20)}</button>
        <div class="progress-bar"><div style="width:${((step + 1) / OB_STEPS) * 100}%"></div></div>
        <span class="small muted">${step + 1}/${OB_STEPS}</span>
      </div>
      ${body}
      <div class="ob-foot"><button class="btn primary block" data-action="ob-next" ${valid ? '' : 'disabled'}>${step === OB_STEPS - 1 ? (editing ? 'Save changes' : 'Build my plan') : 'Continue'}</button></div>
    </div>`;
  }

  // ---------- plan reveal ----------
  function viewReveal() {
    const p = S.data.profile;
    const cyc = cycleInfo(p);
    const ph = D.PHASES[cyc.phase];
    const t = targets(p, cyc);
    const wk = todaysWorkout();
    return `<div class="screen no-nav">
      <div class="wordmark sm">yours.</div>
      <div class="eyebrow" style="margin-top:28px">Your plan is ready</div>
      <h1 style="margin-top:6px">Built for your ${ph.name.toLowerCase()} phase, starting today.</h1>
      <div class="card phase-card" style="margin-top:20px">
        <div class="row" style="gap:16px">${cycleRing(cyc, 96)}<div class="grow"><div class="eyebrow">Day ${cyc.day} of ${cyc.len}</div><div class="phase-name" style="font-size:24px">${ph.name}</div><div class="muted small">${ph.short}</div></div></div>
        <p class="small" style="margin-top:14px">${esc(ph.training)}</p>
      </div>
      <div class="card workout-hero"><div class="eyebrow muted">Today's workout</div><h2 style="margin-top:4px">${esc(wk.name)}</h2><div class="small muted">${wk.minutes} min · ${esc(wk.focus)}</div></div>
      <div class="stats" style="margin-top:12px">
        ${statTile('Protein', t.protein, 'g')}${statTile('Calories', t.kcal.toLocaleString(), 'kcal')}${statTile('Water', t.water, 'L')}${statTile('Steps', t.steps.toLocaleString(), '')}
      </div>
      <div class="card" style="margin-top:24px">
        <h2>Save your plan</h2>
        <p class="muted small" style="margin:4px 0 16px">Create a free account to keep your plan and unlock progress photos and the community.</p>
        ${signupForm('reveal')}
      </div>
      <button class="btn ghost block" style="margin-top:12px" data-action="continue-guest">Continue as guest</button>
      <p class="center small" style="margin-top:14px"><button class="link" data-action="go-login">I already have an account</button></p>
    </div>`;
  }
  const statTile = (label, value, unit) => `<div class="stat"><div class="eyebrow">${label}</div><div class="value">${value}<small>${unit}</small></div></div>`;

  // ---------- cycle ring ----------
  function cycleRing(cyc, size) {
    const r = 42, c = 2 * Math.PI * r, gap = 1.2;
    let offset = 0;
    const arcs = D.PHASE_ORDER.map((p) => {
      const [a, b] = cyc.ranges[p];
      const days = Math.max(0, b - a + 1);
      const len = (days / cyc.len) * c;
      const seg = `<circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--${p})" stroke-width="${p === cyc.phase ? 9 : 5}" stroke-dasharray="${Math.max(0, len - gap)} ${c}" stroke-dashoffset="${-offset}" opacity="${p === cyc.phase ? 1 : 0.35}"/>`;
      offset += len;
      return days ? seg : '';
    }).join('');
    const ang = ((cyc.day - 0.5) / cyc.len) * 2 * Math.PI - Math.PI / 2;
    const mx = 50 + r * Math.cos(ang), my = 50 + r * Math.sin(ang);
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="Cycle day ${cyc.day} of ${cyc.len}">
      <g transform="rotate(-90 50 50)">${arcs}</g>
      <circle cx="${mx}" cy="${my}" r="5.5" fill="var(--surface)" stroke="var(--text)" stroke-width="2"/>
      <text x="50" y="49" text-anchor="middle" font-size="22" font-weight="700" fill="var(--text)">${cyc.day}</text>
      <text x="50" y="63" text-anchor="middle" font-size="8.5" fill="var(--muted)" letter-spacing="1">DAY</text>
    </svg>`;
  }

  // ---------- home ----------
  function header(title, sub) {
    const name = myName();
    return `<div class="top"><div><div class="eyebrow">${esc(sub)}</div><h1 style="margin-top:4px">${title}</h1></div>
      <button class="avatar" data-action="open-settings" aria-label="Profile and settings">${isGuest() ? icon('settings', 18) : esc(initials(name))}</button></div>`;
  }

  function resumeBanner() {
    const a = S.data.activeWorkout;
    if (!a) return '';
    return `<div class="banner" style="background:var(--green-soft)">${icon('workouts', 20)}<div class="grow"><strong>${esc(a.name)}</strong> is in progress.</div><button class="btn primary xs" data-action="resume-workout">Resume</button></div>`;
  }

  function guestBanner() {
    if (!isGuest()) return '';
    return `<div class="banner">${icon('shield', 20)}<div class="grow">You are using YOURS as a guest. Create an account so you do not lose your plan.</div><button class="btn accent xs" data-action="open-signup">Save</button></div>`;
  }

  function viewHome() {
    const p = S.data.profile;
    const cyc = cycleInfo(p);
    const ph = D.PHASES[cyc.phase];
    const t = targets(p, cyc);
    const wk = todaysWorkout();
    const done = loggedOn(todayKey()).length > 0;
    const steps = S.data.steps[todayKey()] || 0;
    const water = S.data.water[todayKey()] || 0;
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const name = firstName(myName());
    return `<div class="screen">
      ${header(`${greet}${name ? `, ${esc(name)}` : ''}`, fmtDate(today()))}
      ${resumeBanner()}${guestBanner()}
      <div class="card phase-card">
        <div class="row" style="gap:16px">
          ${cycleRing(cyc, 116)}
          <div class="grow">
            <span class="tag accent">${ph.energy}</span>
            <div class="phase-name" style="margin-top:8px">${ph.name}</div>
            <div class="muted small">${ph.short}</div>
            <div class="small" style="margin-top:8px">${D.PHASES[cyc.next].name} in ${cyc.daysToNext} day${cyc.daysToNext === 1 ? '' : 's'}</div>
          </div>
        </div>
        <p class="small" style="margin-top:16px">${esc(ph.hormones)}</p>
        <ul class="phase-list">${ph.tips.map((tip) => `<li>${esc(tip)}</li>`).join('')}</ul>
      </div>

      <div class="section-title"><h2>Today's workout</h2><button class="link" data-action="tab" data-tab="workouts">See plan</button></div>
      <div class="card workout-hero">
        <div class="row between"><span class="eyebrow muted">${esc(wk.focus)}</span><span class="small muted">${wk.minutes} min</span></div>
        <h2 style="margin-top:6px;font-size:24px">${esc(wk.name)}</h2>
        <p class="small muted" style="margin-top:6px">${esc(wk.summary)}</p>
        <div class="row" style="margin-top:16px">${done ? `<span class="btn accent sm" style="pointer-events:none">${icon('check', 18)} Completed</span>` : `<button class="btn accent sm" data-action="start-workout" data-id="${wk.id}">Start workout</button>`}<button class="btn sm" style="color:inherit;border:1px solid rgba(255,255,255,0.25)" data-action="view-workout" data-id="${wk.id}">Details</button></div>
      </div>

      <div class="section-title"><h2>Today's targets</h2><span class="small muted">${ph.name} adjusted</span></div>
      <div class="stats">
        <div class="stat"><div class="eyebrow">Protein</div><div class="value">${t.protein}<small>g</small></div><div class="tiny muted" style="margin-top:4px">${Math.round(t.protein / 4)} g x 4 meals</div></div>
        <div class="stat"><div class="eyebrow">Calories</div><div class="value">${t.kcal.toLocaleString()}<small>kcal</small></div><div class="tiny muted" style="margin-top:4px">C ${t.carbs} · F ${t.fat}</div></div>
        <div class="stat"><div class="row between"><div class="eyebrow">Water</div><button class="icon-btn" style="width:30px;height:30px" data-action="water" data-ml="250" aria-label="Add 250 ml">${icon('plus', 16)}</button></div>
          <div class="value">${(water / 1000).toFixed(1)}<small>/ ${t.water} L</small></div><div class="meter"><div style="width:${clamp((water / t.waterMl) * 100, 0, 100)}%"></div></div></div>
        <div class="stat"><div class="row between"><div class="eyebrow">Steps</div><button class="icon-btn" style="width:30px;height:30px" data-action="log-steps" aria-label="Log steps">${icon('plus', 16)}</button></div>
          <div class="value">${steps.toLocaleString()}<small>/ ${round(t.steps / 1000, 0.5)}k</small></div><div class="meter green"><div style="width:${clamp((steps / t.steps) * 100, 0, 100)}%"></div></div></div>
      </div>

      <div class="card accent" style="margin-top:16px">
        <div class="row"><div class="avatar alt sm">${icon('advisor', 16)}</div><div class="grow"><div class="eyebrow">Coach note</div></div></div>
        <p style="margin-top:10px">${esc(coachNote(cyc, t))}</p>
        <button class="link" style="margin-top:10px" data-action="tab" data-tab="advisor">Ask your coach</button>
      </div>
    </div>`;
  }

  function coachNote(cyc, t) {
    const steps = S.data.steps[dateKey(addDays(today(), -1))] || 0;
    if (cyc.daysToPeriod <= 2) return `Your period is likely in ${cyc.daysToPeriod} day${cyc.daysToPeriod === 1 ? '' : 's'}. Keep training, keep steps steady, and expect the scale to read a little higher. That is water, not fat.`;
    if (cyc.phase === 'follicular') return `Estrogen is rising, so this is your strength window. Try to beat last week's numbers on your main lifts by one rep or a small amount of weight.`;
    if (cyc.phase === 'ovulation') return `Peak-strength days. If a lift feels great, go for a rep PR, but warm up thoroughly and keep your knees tracking over your toes.`;
    if (cyc.phase === 'menstrual') return `Lower intensity is still progress. Walk, move and eat iron-rich food. You will come back stronger in a few days.`;
    if (steps && steps < t.steps) return `You were ${(t.steps - steps).toLocaleString()} steps short yesterday. A 15-minute walk after lunch closes most of that gap.`;
    return `Your luteal phase needs about ${t.kcal.toLocaleString()} kcal today, including roughly 150 extra. Eat them on purpose with complex carbs and magnesium-rich foods.`;
  }

  // ---------- workouts ----------
  function exerciseList(wk) {
    return `<ul class="ex-list">${wk.exercises.map((ex, i) => `<li><span class="ex-num">${i + 1}</span><div class="grow"><div class="row between"><strong>${esc(ex.name)}</strong><span class="small muted">${adjustSets(ex)} x ${esc(ex.reps)}</span></div><div class="small muted">${esc(ex.cue)}${ex.rest !== '-' ? ` · Rest ${esc(ex.rest)}` : ''}</div></div></li>`).join('')}</ul>`;
  }

  function viewWorkouts() {
    const cyc = cycleInfo(S.data.profile);
    const ph = D.PHASES[cyc.phase];
    const wk = todaysWorkout();
    const done = loggedOn(todayKey()).length > 0;
    const days = weekDays();
    const weekKeys = days.map(dateKey);
    const thisWeek = S.data.workouts.filter((w) => weekKeys.includes(w.date)).sort((a, b) => (a.date < b.date ? 1 : -1));
    const lib = S.libPhase || cyc.phase;
    const levelNote = { beginner: 'Sets are reduced for your level. Leave 2-3 reps in reserve.', intermediate: 'Leave 1-2 reps in reserve on main lifts.', advanced: 'Main lifts include an extra set for your level.' }[S.data.profile.level] || '';
    return `<div class="screen">
      ${header('Workouts', `${ph.name} phase · day ${cyc.day}`)}
      ${resumeBanner()}
      <div class="week">${days.map((d) => { const k = dateKey(d); return `<div class="day ${k === todayKey() ? 'today' : ''} ${loggedOn(k).length ? 'done' : ''}"><div class="d">${d.toLocaleDateString(undefined, { weekday: 'narrow' })}</div><div class="n">${d.getDate()}</div><div class="mk"></div></div>`; }).join('')}</div>
      <p class="small muted" style="margin-top:10px">${thisWeek.length} session${thisWeek.length === 1 ? '' : 's'} logged this week</p>

      <div class="section-title"><h2>Recommended today</h2><span class="tag">${esc(wk.intensity)}</span></div>
      <div class="card">
        <div class="eyebrow">${esc(wk.focus)} · ${wk.minutes} min</div>
        <h2 style="margin-top:4px;font-size:24px">${esc(wk.name)}</h2>
        <p class="small muted" style="margin-top:6px">${esc(wk.summary)}</p>
        <div class="why">${esc(ph.training)}</div>
        <div class="divider"></div>
        ${exerciseList(wk)}
        <p class="tiny muted" style="margin-top:8px">${levelNote}</p>
        <div class="row" style="margin-top:14px">
          ${done ? `<span class="btn soft block" style="pointer-events:none">${icon('check', 18)} Completed today</span>` : `<button class="btn primary grow" data-action="start-workout" data-id="${wk.id}">Start workout</button>`}
          <button class="btn ghost" data-action="swap-today" aria-label="Choose another workout">${icon('swap', 18)}</button>
        </div>
      </div>

      <div class="section-title"><h2>This week</h2><button class="link" data-action="log-other">Log activity</button></div>
      <div class="card">${thisWeek.length ? thisWeek.map((w) => `<div class="list-item"><div class="ex-num">${icon('check', 14, 2.4)}</div><div class="grow"><strong>${esc(w.name)}</strong><div class="small muted">${fmtDate(parseKey(w.date), { weekday: 'short', month: 'short', day: 'numeric' })} · ${w.minutes} min${w.sets ? ` · ${w.sets} sets` : ''}</div></div></div>`).join('') : '<div class="empty">No sessions logged yet this week. Today is a great day to start.</div>'}</div>

      <div class="section-title"><h2>Workout library</h2></div>
      <div class="chips">${D.PHASE_ORDER.map((p) => `<button class="chip ${lib === p ? 'selected' : ''}" data-action="lib-phase" data-phase="${p}"><span class="dot" style="background:var(--${p})"></span>${D.PHASES[p].name}</button>`).join('')}</div>
      <div class="h-scroll" style="margin-top:14px">${D.WORKOUTS.filter((w) => w.phase === lib).map((w) => `<button class="card flat" style="text-align:left" data-action="view-workout" data-id="${w.id}"><div class="eyebrow">${esc(w.focus)}</div><h3 style="margin-top:4px">${esc(w.name)}</h3><p class="small muted" style="margin-top:4px">${w.minutes} min · ${esc(w.intensity)}</p><p class="small" style="margin-top:8px">${esc(w.summary)}</p></button>`).join('')}</div>
    </div>`;
  }

  function startWorkout(id) {
    const wk = workoutById(id);
    S.data.activeWorkout = {
      templateId: id, name: wk.name, startedAt: Date.now(),
      exercises: wk.exercises.map((ex) => ({ name: ex.name, reps: ex.reps, sets: Array.from({ length: adjustSets(ex) }, () => ({ weight: '', reps: '', done: false })) })),
    };
    save();
    S.modal = { type: 'active' };
    render();
  }

  function viewActive() {
    const a = S.data.activeWorkout;
    if (!a) return '';
    const total = a.exercises.reduce((n, e) => n + e.sets.length, 0);
    const doneSets = a.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
    return `<div class="overlay"><div class="sheet full">
      <div class="sheet-head"><button class="icon-btn" data-action="close-modal" aria-label="Minimise">${icon('back', 20)}</button><div class="center"><div class="eyebrow">In progress</div><strong>${esc(a.name)}</strong></div><button class="link" data-action="discard-workout">Discard</button></div>
      <div class="progress-bar"><div style="width:${(doneSets / total) * 100}%"></div></div>
      <p class="small muted center" style="margin-top:8px">${doneSets} of ${total} sets</p>
      ${a.exercises.map((ex, ei) => `<div class="card" style="margin-top:12px"><div class="row between"><strong>${esc(ex.name)}</strong><span class="small muted">Target ${esc(ex.reps)}</span></div>
        <div class="set-row tiny muted" style="margin-top:10px"><span>Set</span><span class="center">kg</span><span class="center">Reps</span><span></span></div>
        ${ex.sets.map((s, si) => `<div class="set-row"><span class="ex-num">${si + 1}</span><input class="input" type="number" inputmode="decimal" placeholder="-" value="${esc(s.weight)}" data-set="${ei}.${si}.weight"><input class="input" type="number" inputmode="numeric" placeholder="-" value="${esc(s.reps)}" data-set="${ei}.${si}.reps"><button class="check ${s.done ? 'on' : ''}" data-action="toggle-set" data-ei="${ei}" data-si="${si}" aria-label="Mark set done">${icon('check', 18, 2.4)}</button></div>`).join('')}
      </div>`).join('')}
      <button class="btn primary block" style="margin-top:20px" data-action="finish-workout" ${doneSets ? '' : 'disabled'}>Finish workout</button>
    </div></div>`;
  }

  // ---------- meals ----------
  function viewMeals() {
    const p = S.data.profile;
    const cyc = cycleInfo(p);
    const ph = D.PHASES[cyc.phase];
    const t = targets(p, cyc);
    const slots = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snack', 'Snack']];
    const picks = slots.map(([k]) => mealFor(cyc.phase, k));
    const totalP = picks.reduce((n, x) => n + x.meal.protein, 0);
    const totalK = picks.reduce((n, x) => n + x.meal.kcal, 0);
    const portion = clamp(Math.round((t.kcal / totalK) * 10) / 10, 0.7, 1.6);
    return `<div class="screen">
      ${header('Meals', `${ph.name} phase · ${fmtDate(today(), { month: 'short', day: 'numeric' })}`)}
      <div class="card soft"><div class="eyebrow">Nutrition focus</div><p style="margin-top:6px">${esc(ph.nutrition)}</p>
        <div class="chips" style="margin-top:12px">${ph.foods.map((f) => `<span class="tag">${esc(f)}</span>`).join('')}</div></div>
      <div class="stats" style="margin-top:12px">${statTile('Protein target', t.protein, 'g')}${statTile('Calories', t.kcal.toLocaleString(), 'kcal')}</div>
      <p class="small muted" style="margin-top:10px">This plan gives about ${Math.round(totalP * portion)} g protein at a portion size of x${portion}. ${totalP * portion < t.protein ? `Add a shake or extra protein serving to close the ${Math.round(t.protein - totalP * portion)} g gap.` : 'You hit your protein target.'}</p>
      ${slots.map(([k, label], i) => { const { meal, count, compromised } = picks[i]; return `
        <div class="section-title"><h2>${label}</h2>${count > 1 ? `<button class="link row" style="gap:4px" data-action="swap-meal" data-slot="${k}">${icon('swap', 16)} Swap</button>` : ''}</div>
        <div class="card meal"><h3>${esc(meal.name)}</h3><p class="small muted">${esc(meal.desc)}</p>
          <div class="macro"><span><strong>${Math.round(meal.protein * portion)} g</strong> protein</span><span><strong>${Math.round(meal.kcal * portion)}</strong> kcal</span></div>
          <div class="why">${esc(meal.why)}</div>
          ${compromised ? '<p class="tiny error">No option fully matches your food filters here. Swap ingredients as needed.</p>' : ''}
        </div>`; }).join('')}
      <p class="tiny muted center" style="margin-top:20px">Filtering out: ${esc((p.avoid || []).join(', ') || 'nothing')}. Edit in your profile.</p>
    </div>`;
  }

  // ---------- advisor ----------
  const PROMPTS = ['What should I train today?', 'I have cramps', 'Help with cravings', 'How much protein?', 'Am I on track?', 'I feel tired', 'Grow my glutes'];

  function viewAdvisor() {
    const cyc = cycleInfo(S.data.profile);
    return `<div class="screen" ${S.advisorView === 'coach' ? 'style="padding-bottom:calc(var(--nav-h) + 110px)"' : ''}>
      ${header('Advisor', S.ai ? 'AI coach · live' : 'Coach · on-device')}
      <div class="segment" style="margin-bottom:20px"><button class="${S.advisorView === 'coach' ? 'active' : ''}" data-action="advisor-view" data-value="coach">Coach</button><button class="${S.advisorView === 'progress' ? 'active' : ''}" data-action="advisor-view" data-value="progress">Progress</button></div>
      ${S.advisorView === 'coach' ? viewChat(cyc) : viewProgress()}
    </div>`;
  }

  function viewChat(cyc) {
    const ph = D.PHASES[cyc.phase];
    const name = firstName(myName());
    const intro = `${name ? `Hi ${name}. ` : 'Hi. '}I am your YOURS coach. You are on day ${cyc.day}, in your ${ph.name.toLowerCase()} phase. Ask me anything about training, food, steps or recovery and I will adapt it to where you are in your cycle.${S.ai ? '' : '\n\nI am running on this device right now. Connect the live AI coach for open-ended conversation and photo reviews.'}`;
    const msgs = S.data.chat;
    return `<div class="chat">
      <div class="bubble coach rich">${rich(intro)}</div>
      ${msgs.map((m, mi) => m.role === 'user'
        ? `<div class="bubble user">${esc(m.content)}</div>`
        : `<div class="bubble coach rich">${rich(m.content)}${m.actions && m.actions.length ? `<div class="actions">${m.actions.map((a, ai) => `<button class="btn ${a.used ? 'soft' : 'accent'} xs" data-action="chat-action" data-mi="${mi}" data-ai="${ai}" ${a.used ? 'disabled' : ''}>${a.used ? icon('check', 14, 2.4) + ' ' : ''}${esc(actionLabel(a))}</button>`).join('')}</div>` : ''}</div>`).join('')}
      ${S.typing ? '<div class="bubble coach typing" aria-label="Coach is typing"><span></span><span></span><span></span></div>' : ''}
    </div>
    ${msgs.length < 2 ? `<div class="prompts" style="margin-top:16px">${PROMPTS.map((q) => `<button class="chip" data-action="prompt" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>` : ''}
    <form class="composer" data-form="chat"><div class="composer-inner">
      <textarea name="msg" rows="1" placeholder="Ask your coach" aria-label="Message your coach" maxlength="2000"></textarea>
      <button class="send" type="submit" aria-label="Send" ${S.typing ? 'disabled' : ''}>${icon('send', 20, 2.2)}</button>
    </div></form>`;
  }

  // ---------- progress ----------
  function viewProgress() {
    if (isGuest()) {
      return `<div class="card lock">${icon('lock', 32)}<h2 style="margin-top:14px">Progress photos need an account</h2><p class="muted small" style="margin:8px 0 18px">Photos are private, stored only on this device and protected by your optional PIN. Create a free account to start your photo vault.</p><button class="btn primary" data-action="open-signup" data-reason="progress">Create account</button></div>`;
    }
    if (S.data.pinHash && !S.vaultUnlocked) {
      return `<form class="card lock" data-form="unlock">${icon('lock', 32)}<h2 style="margin-top:14px">Photo vault locked</h2><p class="muted small" style="margin:8px 0 18px">Enter your 4-digit PIN.</p>
        <input class="input pin-input" name="pin" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="off" required>
        ${S.authError ? `<p class="error" style="margin-top:10px">${esc(S.authError)}</p>` : ''}
        <button class="btn primary" style="margin-top:16px" type="submit">Unlock</button></form>`;
    }
    const p = S.data.profile;
    const imp = p.units === 'imperial';
    const ws = S.data.checkins.slice(-12);
    const review = S.data.lastReview;
    const verdictLabel = { on_track: 'On track', progressing: 'Making progress', adjust: 'Needs adjustment' };
    return `
      <div class="banner" style="background:var(--green-soft)">${icon('shield', 20)}<div class="grow">Photos stay on this device. They are only sent to your coach when you tap Analyze, and they are not stored anywhere else.</div></div>
      <div class="row" style="gap:10px">
        <label class="btn primary grow" style="cursor:pointer">${icon('camera', 18)} Add photo<input type="file" accept="image/*" data-upload hidden></label>
        <select class="select" style="width:auto;height:50px" data-bind-ui="pose" aria-label="Pose">${['front', 'side', 'back'].map((x) => `<option value="${x}" ${S.pose === x ? 'selected' : ''}>${x[0].toUpperCase() + x.slice(1)}</option>`).join('')}</select>
      </div>

      <div class="section-title"><h2>Photo vault</h2><span class="small muted">${S.photos.length} photo${S.photos.length === 1 ? '' : 's'}</span></div>
      ${S.photos.length ? `<p class="small muted" style="margin:-4px 0 10px">Tap to reveal. Select up to 4 to analyze or compare.</p>
        <div class="photo-grid">${S.photos.map((ph) => { const sel = S.compare.indexOf(ph.id); return `<div class="photo ${S.revealed[ph.id] ? '' : 'blur'} ${sel > -1 ? 'selected' : ''}">
          <button style="display:block;width:100%;height:100%" data-action="photo-tap" data-id="${ph.id}" aria-label="${S.revealed[ph.id] ? 'Select photo' : 'Reveal photo'}"><img src="${ph.data}" alt="${esc(ph.pose)} progress photo from ${esc(ph.date)}"></button>
          ${sel > -1 ? `<span class="sel">${sel + 1}</span>` : ''}
          <div class="meta">${esc(ph.pose)} · ${fmtDate(parseKey(ph.date), { month: 'short', day: 'numeric' })}</div></div>`; }).join('')}</div>
        <div class="row" style="margin-top:12px"><button class="btn accent grow" data-action="analyze" ${S.analyzing ? 'disabled' : ''}>${S.analyzing ? 'Analyzing...' : S.compare.length ? `Analyze ${S.compare.length} photo${S.compare.length === 1 ? '' : 's'}` : 'Analyze my data'}</button>${S.compare.length ? `<button class="btn ghost" data-action="delete-photos" aria-label="Delete selected">${icon('trash', 18)}</button>` : ''}</div>`
        : `<div class="card empty">Take your first photo in good light, front, side and back, wearing the same outfit each time. Retake every 2-4 weeks in the same cycle phase.</div>
           <button class="btn accent block" style="margin-top:12px" data-action="analyze" ${S.analyzing ? 'disabled' : ''}>${S.analyzing ? 'Analyzing...' : 'Analyze my data'}</button>`}
      ${S.compare.length === 2 ? compareView() : ''}

      ${review ? `<div class="card" style="margin-top:16px"><div class="row between"><span class="verdict ${review.verdict}">${verdictLabel[review.verdict] || 'Review'}</span><span class="tiny muted">${fmtDate(parseKey(review.date), { month: 'short', day: 'numeric' })}</span></div>
        <div class="rich small" style="margin-top:12px">${rich(review.text)}</div>
        ${review.local ? `<p class="tiny muted" style="margin-top:10px">Based on your logged data. ${S.ai ? '' : 'Visual photo review needs the live AI coach.'}</p>` : ''}</div>` : ''}

      <div class="section-title"><h2>Weight check-ins</h2></div>
      <div class="card">
        ${ws.length > 1 ? sparkline(ws.map((w) => w.kg)) : ''}
        <form class="row" data-form="checkin" style="margin-top:${ws.length > 1 ? 12 : 0}px"><input class="input grow" type="number" step="0.1" inputmode="decimal" name="w" placeholder="Today's weight (${imp ? 'lb' : 'kg'})" required><button class="btn primary sm" type="submit">Log</button></form>
        ${ws.slice(-4).reverse().map((w) => `<div class="list-item"><div class="grow small">${fmtDate(parseKey(w.date), { weekday: 'short', month: 'short', day: 'numeric' })}</div><strong>${imp ? Math.round(w.kg * 2.20462 * 10) / 10 + ' lb' : w.kg + ' kg'}</strong></div>`).join('')}
        <p class="tiny muted" style="margin-top:8px">Weigh in at the same time of day. Compare across the same cycle phase.</p>
      </div>
      <div class="row" style="margin-top:16px"><button class="btn ghost sm grow" data-action="pin-settings">${icon('lock', 16)} ${S.data.pinHash ? 'Change or remove PIN' : 'Set a vault PIN'}</button>${S.data.pinHash ? '<button class="btn ghost sm" data-action="lock-vault">Lock</button>' : ''}</div>`;
  }

  function compareView() {
    const [a, b] = S.compare.map((id) => S.photos.find((p) => p.id === id));
    if (!a || !b) return '';
    const [older, newer] = a.date <= b.date ? [a, b] : [b, a];
    return `<div class="card" style="margin-top:12px"><div class="eyebrow">Side by side</div><div class="row" style="margin-top:10px;align-items:flex-start">
      ${[older, newer].map((p) => `<div class="grow"><div class="photo" style="border:none"><img src="${p.data}" alt="${esc(p.pose)} photo from ${esc(p.date)}"></div><div class="tiny muted center" style="margin-top:6px">${fmtDate(parseKey(p.date), { month: 'short', day: 'numeric', year: 'numeric' })}</div></div>`).join('')}
    </div><p class="small muted center" style="margin-top:8px">${daysBetween(parseKey(older.date), parseKey(newer.date))} days apart</p></div>`;
  }

  function sparkline(values) {
    const min = Math.min(...values), max = Math.max(...values);
    const span = max - min || 1;
    const pts = values.map((v, i) => `${(i / (values.length - 1)) * 300},${62 - ((v - min) / span) * 52}`).join(' ');
    const last = pts.split(' ').pop().split(',');
    return `<svg class="spark" viewBox="-6 0 312 70" preserveAspectRatio="none" role="img" aria-label="Weight trend"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/><circle cx="${last[0]}" cy="${last[1]}" r="4" fill="var(--accent)"/></svg>`;
  }

  // ---------- community ----------
  function viewCommunity() {
    return `<div class="screen">
      ${header('Community', 'Wins, questions and support')}
      <div class="segment" style="margin-bottom:20px"><button class="${S.communityView === 'feed' ? 'active' : ''}" data-action="community-view" data-value="feed">Feed</button><button class="${S.communityView === 'messages' ? 'active' : ''}" data-action="community-view" data-value="messages">Messages</button></div>
      ${S.communityView === 'feed' ? viewFeed() : S.openThread ? viewThread() : viewThreads()}
    </div>`;
  }

  function viewFeed() {
    const c = community();
    const me = meId();
    const cyc = cycleInfo(S.data.profile);
    const posts = c.posts.slice().sort((a, b) => b.ts - a.ts);
    return `<form class="card" data-form="post">
        <textarea class="textarea" name="text" placeholder="${isGuest() ? 'Create an account to share your wins' : 'Share a win, a question or a check-in'}" maxlength="600" style="border:none;padding:0;min-height:64px;background:transparent"></textarea>
        <div class="row between" style="margin-top:8px"><div class="chips">${['Win', 'Question', 'Tip'].map((tg) => `<button type="button" class="chip ${(S.postTag || 'Win') === tg ? 'selected' : ''}" data-action="post-tag" data-value="${tg}">${tg}</button>`).join('')}</div>
        <button class="btn accent sm" type="submit">Post</button></div>
      </form>
      ${posts.map((p) => { const liked = me && p.likedBy.includes(me); const open = S.openComments[p.id]; return `<div class="card post">
        <div class="head"><div class="avatar sm ${p.author.startsWith('u:') ? '' : 'alt'}">${esc(initials(memberName(p.author)))}</div><div class="grow"><strong>${esc(memberName(p.author))}</strong><div class="tiny muted">${timeAgo(p.ts)}${p.phase ? ` · ${esc(D.PHASES[p.phase] ? D.PHASES[p.phase].name : '')} phase` : ''}</div></div><span class="tag ${p.tag === 'Win' ? 'accent' : ''}">${esc(p.tag)}</span></div>
        <div class="body">${esc(p.text)}</div>
        <div class="foot"><button class="${liked ? 'on' : ''}" data-action="like" data-id="${p.id}" aria-label="Like">${icon('heart', 18)} ${p.baseLikes + p.likedBy.length}</button><button data-action="toggle-comments" data-id="${p.id}">${icon('comment', 18)} ${p.comments.length}</button>${p.author !== me ? `<button data-action="message" data-id="${esc(p.author)}">Message</button>` : ''}</div>
        ${open ? `${p.comments.map((cm) => `<div class="comment"><div class="avatar sm ${cm.author.startsWith('u:') ? '' : 'alt'}">${esc(initials(memberName(cm.author)))}</div><div class="c"><strong class="small">${esc(memberName(cm.author))}</strong><div class="small">${esc(cm.text)}</div></div></div>`).join('')}
          <form class="row" style="margin-top:10px" data-form="comment" data-id="${p.id}"><input class="input grow" style="height:42px" name="text" placeholder="Add a comment" maxlength="300" required><button class="btn primary sm" type="submit">Reply</button></form>` : ''}
      </div>`; }).join('')}
      <p class="tiny muted center" style="margin-top:16px">Community posts are shared between accounts on this device in this preview. Cycle day ${cyc.day}.</p>`;
  }

  function viewThreads() {
    if (isGuest()) {
      return `<div class="card lock">${icon('comment', 32)}<h2 style="margin-top:14px">Message other members</h2><p class="muted small" style="margin:8px 0 18px">Create a free account to send messages and find accountability partners.</p><button class="btn primary" data-action="open-signup" data-reason="community">Create account</button></div>`;
    }
    const c = community();
    const me = meId();
    return `<div class="card">${members().map((m) => {
      const msgs = c.threads[threadKey(me, m.id)] || [];
      const last = msgs[msgs.length - 1];
      return `<button class="list-item" style="width:100%;text-align:left" data-action="open-thread" data-id="${esc(m.id)}"><div class="avatar ${m.id.startsWith('u:') ? '' : 'alt'}">${esc(initials(m.name))}</div><div class="grow"><div class="row between"><strong>${esc(m.name)}</strong>${last ? `<span class="tiny muted">${timeAgo(last.ts)}</span>` : ''}</div><div class="small muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${last ? esc((last.from === me ? 'You: ' : '') + last.text) : esc(m.bio)}</div></div></button>`;
    }).join('')}</div>`;
  }

  function viewThread() {
    const c = community();
    const me = meId();
    const other = S.openThread;
    const msgs = c.threads[threadKey(me, other)] || [];
    return `<div class="row" style="margin-bottom:16px"><button class="icon-btn" data-action="close-thread" aria-label="Back to messages">${icon('back', 20)}</button><div class="avatar alt sm">${esc(initials(memberName(other)))}</div><strong>${esc(memberName(other))}</strong></div>
      <div class="chat" style="padding-bottom:110px">${msgs.length ? msgs.map((m) => `<div class="bubble ${m.from === me ? 'user' : 'coach'}">${esc(m.text)}</div>`).join('') : '<div class="empty">Say hello and share what you are working on.</div>'}</div>
      <form class="composer" data-form="dm"><div class="composer-inner"><textarea name="msg" rows="1" placeholder="Message ${esc(firstName(memberName(other)))}" maxlength="1000" aria-label="Message"></textarea><button class="send" type="submit" aria-label="Send">${icon('send', 20, 2.2)}</button></div></form>`;
  }

  // ---------- modals ----------
  function viewModal() {
    const m = S.modal;
    if (!m) return '';
    if (m.type === 'active') return viewActive();
    const sheet = (title, body) => `<div class="overlay" data-action="overlay"><div class="sheet" role="dialog" aria-label="${esc(title)}"><div class="grab"></div><div class="sheet-head"><h2>${title}</h2><button class="icon-btn" data-action="close-modal" aria-label="Close">${icon('x', 18)}</button></div>${body}</div></div>`;

    if (m.type === 'signup') {
      const why = { progress: 'Progress photos are private to your account.', community: 'You need an account to post and message.', default: 'Keep your plan, history and coach chats safe.' }[m.reason] || 'Keep your plan, history and coach chats safe.';
      return sheet('Save your plan', `<p class="muted small" style="margin-bottom:16px">${why} Everything you have done as a guest moves to your new account.</p>${signupForm('sheet')}<p class="center small" style="margin-top:14px"><button class="link" data-action="go-login">I already have an account</button></p>`);
    }
    if (m.type === 'workout') {
      const wk = workoutById(m.id);
      const isToday = todaysWorkout().id === wk.id;
      return sheet(esc(wk.name), `<div class="eyebrow">${esc(wk.focus)} · ${wk.minutes} min · ${esc(wk.intensity)}</div><p class="small" style="margin-top:8px">${esc(wk.summary)}</p><div class="divider"></div>${exerciseList(wk)}
        <div class="row" style="margin-top:16px"><button class="btn primary grow" data-action="start-workout" data-id="${wk.id}">Start now</button>${isToday ? '' : `<button class="btn ghost" data-action="set-today" data-id="${wk.id}">Make today's</button>`}</div>`);
    }
    if (m.type === 'swap') {
      const cyc = cycleInfo(S.data.profile);
      const list = D.WORKOUTS.filter((w) => w.phase === cyc.phase || w.phase === 'any');
      return sheet('Choose today\'s workout', `<p class="small muted" style="margin-bottom:14px">Options that suit your ${D.PHASES[cyc.phase].name.toLowerCase()} phase.</p><div class="options">${list.map((w) => `<button class="option ${todaysWorkout().id === w.id ? 'selected' : ''}" data-action="set-today" data-id="${w.id}"><strong>${esc(w.name)}</strong><span>${w.minutes} min · ${esc(w.intensity)} · ${esc(w.focus)}</span></button>`).join('')}</div>
        <button class="btn ghost block" style="margin-top:12px" data-action="reset-today">Use the recommended plan</button>`);
    }
    if (m.type === 'steps') {
      const v = S.data.steps[todayKey()] || '';
      return sheet('Log steps', `<form data-form="steps"><label class="field"><span class="label">Total steps today</span><input class="input" name="steps" type="number" inputmode="numeric" min="0" max="100000" value="${v}" required autofocus></label><p class="tiny muted" style="margin-top:8px">Copy the number from your phone or watch.</p><button class="btn primary block" style="margin-top:16px" type="submit">Save</button></form>`);
    }
    if (m.type === 'other') {
      return sheet('Log activity', `<form data-form="other"><label class="field"><span class="label">Activity</span><input class="input" name="name" placeholder="e.g. Pilates class, run, hike" required maxlength="60"></label><label class="field"><span class="label">Minutes</span><input class="input" name="minutes" type="number" inputmode="numeric" min="5" max="600" value="45" required></label><button class="btn primary block" style="margin-top:16px" type="submit">Log it</button></form>`);
    }
    if (m.type === 'pin') {
      return sheet('Vault PIN', `<form data-form="pin"><p class="small muted" style="margin-bottom:14px">A 4-digit PIN locks your progress photos on this device.</p><label class="field"><span class="label">New PIN</span><input class="input pin-input" style="max-width:none" name="pin" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" required autocomplete="off"></label><button class="btn primary block" style="margin-top:16px" type="submit">Save PIN</button></form>${S.data.pinHash ? '<button class="btn ghost block" style="margin-top:10px" data-action="remove-pin">Remove PIN</button>' : ''}`);
    }
    if (m.type === 'settings') {
      const p = S.data.profile;
      const theme = store.get('yours.theme', 'system');
      const u = currentUser();
      return sheet('Profile', `
        <div class="card flat row"><div class="avatar">${isGuest() ? icon('settings', 18) : esc(initials(u && u.name))}</div><div class="grow"><strong>${isGuest() ? 'Guest' : esc(u && u.name)}</strong><div class="small muted">${isGuest() ? 'Not saved to an account' : esc(u && u.email)}</div></div>${isGuest() ? '<button class="btn accent xs" data-action="open-signup">Save</button>' : ''}</div>
        <div class="card flat small"><div class="row between"><span class="muted">Goal</span><strong>${esc(goalOf(p).label)}</strong></div><div class="row between" style="margin-top:6px"><span class="muted">Level</span><strong>${esc((LEVELS.find((l) => l.id === p.level) || {}).label || '')}</strong></div><div class="row between" style="margin-top:6px"><span class="muted">Cycle</span><strong>${p.cycleLength} days</strong></div><div class="row between" style="margin-top:6px"><span class="muted">Last period</span><strong>${esc(p.periodStart)}</strong></div>
          <button class="btn ghost sm block" style="margin-top:14px" data-action="edit-plan">Edit my plan</button></div>
        <form class="card flat" data-form="period"><div class="label">My period started</div><div class="row"><input class="input grow" type="date" name="date" value="${todayKey()}" max="${todayKey()}" required><button class="btn primary sm" type="submit">Update</button></div></form>
        <div class="card flat"><div class="label">Appearance</div><div class="segment">${['system', 'light', 'dark'].map((x) => `<button class="${theme === x ? 'active' : ''}" data-action="theme" data-value="${x}">${x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div></div>
        <div class="card flat small"><div class="label">Coach</div><p class="muted">${S.ai ? 'Live AI coach is connected.' : 'Running the on-device coach. Set ANTHROPIC_API_KEY on the server to enable the live AI coach and photo reviews.'}</p></div>
        <button class="btn ghost block" style="margin-top:12px" data-action="logout">${isGuest() ? 'Start over' : 'Sign out'}</button>
        <button class="btn block" style="margin-top:8px;color:var(--danger)" data-action="delete-data">Delete my data</button>`);
    }
    return '';
  }

  // ---------- nav + render ----------
  function nav() {
    const tabs = [['home', 'Home'], ['workouts', 'Workouts'], ['meals', 'Meals'], ['advisor', 'Advisor'], ['community', 'Community']];
    return `<nav class="nav" aria-label="Main"><div class="nav-inner">${tabs.map(([id, label]) => `<button class="${S.tab === id ? 'active' : ''}" data-action="tab" data-tab="${id}" ${S.tab === id ? 'aria-current="page"' : ''}>${icon(id, 23)}<span>${label}</span></button>`).join('')}</div></nav>`;
  }

  function render() {
    let html;
    if (!S.session) html = S.screen === 'login' ? viewLogin() : viewWelcome();
    else if (!S.data.onboarded) html = viewOnboarding();
    else if (!S.data.planSeen) html = viewReveal();
    else {
      const views = { home: viewHome, workouts: viewWorkouts, meals: viewMeals, advisor: viewAdvisor, community: viewCommunity };
      html = (views[S.tab] || viewHome)() + nav();
    }
    const focusedName = document.activeElement && document.activeElement.name;
    root.innerHTML = html + viewModal();
    if (focusedName === 'msg') { const ta = root.querySelector('textarea[name="msg"]'); if (ta && !S.typing) ta.focus(); }
  }

  // ---------- session handling ----------
  async function startSession(session) {
    S.session = session;
    store.set('yours.session', session);
    loadData();
    S.vaultUnlocked = false;
    S.revealed = {};
    S.compare = [];
    S.tab = 'home';
    await loadPhotos();
  }

  async function signup(form) {
    const name = form.name.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { S.authError = 'Enter your name and a valid email.'; return render(); }
    if (password.length < 6) { S.authError = 'Use at least 6 characters for your password.'; return render(); }
    const all = users();
    if (all[email]) { S.authError = 'An account with that email already exists on this device. Sign in instead.'; return render(); }
    const salt = newSalt();
    all[email] = { email, name, salt, hash: await hashSecret(password, salt), createdAt: Date.now() };
    store.set('yours.users', all);
    // Move guest progress into the new account.
    const guest = S.data;
    guest.planSeen = true;
    store.set(`yours.data.${email}`, guest);
    store.del('yours.data.guest');
    S.authError = '';
    S.modal = null;
    await startSession({ kind: 'user', email });
    render();
    toast(`Welcome to YOURS, ${firstName(name)}`);
  }

  async function login(form) {
    const email = form.email.value.trim().toLowerCase();
    const u = users()[email];
    if (!u || (await hashSecret(form.password.value, u.salt)) !== u.hash) { S.authError = 'That email and password do not match.'; return render(); }
    S.authError = '';
    S.modal = null;
    await startSession({ kind: 'user', email });
    render();
  }

  async function demo() {
    const email = 'demo@yours.app';
    const all = users();
    if (!all[email]) {
      const salt = newSalt();
      all[email] = { email, name: 'Ava Demo', salt, hash: await hashSecret('demo1234', salt), createdAt: Date.now() };
      store.set('yours.users', all);
    }
    const t = today();
    const d = blankData();
    d.onboarded = true;
    d.planSeen = true;
    d.profile = { units: 'metric', level: 'intermediate', goal: 'glutes', periodStart: dateKey(addDays(t, -9)), heightCm: 168, weightKg: 63.5, age: 29, activity: 'moderate', cycleLength: 28, periodLength: 5, favorites: ['Chicken', 'Salmon', 'Greek yogurt', 'Sweet potato', 'Berries'], avoid: ['Shellfish'], foodNotes: '' };
    const names = { 'm-light': 'Light Full Body', 'm-restore': 'Restore and Mobility', 'f-lower': 'Lower Body Strength', 'f-upper': 'Upper Body Push and Pull', 'l-steady': 'Steady Strength', 'l-upper': 'Upper Body Sculpt' };
    [[1, 'f-upper'], [2, 'f-lower'], [4, 'f-upper'], [6, 'm-light'], [8, 'm-restore'], [10, 'm-light'], [11, 'l-steady'], [13, 'l-upper'], [15, 'l-steady'], [17, 'l-upper'], [18, 'f-lower'], [20, 'f-upper'], [23, 'f-lower'], [25, 'f-upper']].forEach(([ago, id]) => {
      d.workouts.push({ id: uid(), date: dateKey(addDays(t, -ago)), templateId: id, name: names[id], minutes: workoutById(id).minutes, sets: 18 });
    });
    d.workouts.reverse();
    for (let i = 1; i <= 14; i++) d.steps[dateKey(addDays(t, -i))] = 8800 + ((i * 2731) % 4200);
    d.steps[todayKey()] = 4210;
    d.water[todayKey()] = 1000;
    [65.2, 64.9, 65.1, 64.6, 64.2, 64.4, 63.8, 63.5].forEach((kg, i) => d.checkins.push({ date: dateKey(addDays(t, -(7 - i) * 7)), kg }));
    store.set(`yours.data.${email}`, d);
    await startSession({ kind: 'user', email });
    render();
    toast('Demo account loaded');
  }

  async function logout() {
    if (isGuest()) {
      if (!confirm('Start over? Your guest plan and history on this device will be deleted.')) return;
      store.del('yours.data.guest');
    }
    S.session = null;
    S.data = null;
    S.modal = null;
    S.screen = 'welcome';
    S.photos = [];
    store.del('yours.session');
    render();
  }

  async function deleteData() {
    if (!confirm('Delete all of your YOURS data on this device? This cannot be undone.')) return;
    if (!isGuest()) {
      const email = S.session.email;
      const all = users();
      delete all[email];
      store.set('yours.users', all);
      store.del(`yours.data.${email}`);
      try { await photoTx('readwrite', (s) => { S.photos.forEach((p) => s.delete(p.id)); }); } catch { /* ignore */ }
      const c = community();
      c.posts = c.posts.filter((p) => p.author !== `u:${email}`);
      Object.keys(c.threads).forEach((k) => { if (k.split('|').includes(`u:${email}`)) delete c.threads[k]; });
      saveCommunity(c);
    } else store.del('yours.data.guest');
    S.session = null;
    store.del('yours.session');
    S.modal = null;
    S.screen = 'welcome';
    render();
    toast('Your data has been deleted');
  }

  function applyTheme(t) {
    store.set('yours.theme', t);
    if (t === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
  }

  // ---------- events ----------
  const actions = {
    start: () => { S.authError = ''; startSession({ kind: 'guest' }).then(render); },
    'go-login': () => {
      // Guest progress stays saved on the device; signing in to an existing account switches to that account's data.
      S.authError = ''; S.modal = null; S.screen = 'login';
      if (S.session && isGuest()) { S.session = null; store.del('yours.session'); }
      render(); window.scrollTo(0, 0);
    },
    'go-welcome': () => { S.screen = 'welcome'; S.authError = ''; render(); },
    demo: () => demo(),
    'continue-guest': () => { S.data.planSeen = true; save(); render(); window.scrollTo(0, 0); },
    'open-signup': (el) => { S.authError = ''; S.modal = { type: 'signup', reason: el.dataset.reason }; render(); },

    'ob-pick': (el) => { S.data.profile[el.dataset.field] = el.dataset.value; save(); render(); },
    'ob-toggle': (el) => {
      const list = S.data.profile[el.dataset.field];
      const i = list.indexOf(el.dataset.value);
      if (i > -1) list.splice(i, 1); else list.push(el.dataset.value);
      save(); render();
    },
    'ob-units': (el) => { S.data.profile.units = el.dataset.value; save(); render(); },
    'ob-back': () => {
      if (S.data.obStep > 0) { S.data.obStep--; save(); render(); return; }
      if (S.data.editing) { S.data.editing = false; S.data.onboarded = true; save(); render(); return; }
      if (isGuest()) { store.del('yours.data.guest'); S.session = null; store.del('yours.session'); S.screen = 'welcome'; render(); }
    },
    'ob-next': () => {
      if (S.data.obStep < OB_STEPS - 1) { S.data.obStep++; save(); render(); window.scrollTo(0, 0); return; }
      S.data.onboarded = true;
      S.data.obStep = 0;
      if (S.data.editing) { S.data.editing = false; S.data.planSeen = true; toast('Plan updated'); }
      save(); render(); window.scrollTo(0, 0);
    },

    tab: (el) => { S.tab = el.dataset.tab; S.modal = null; render(); window.scrollTo(0, 0); if (S.tab === 'advisor' && S.advisorView === 'coach') scrollChat(); },
    'open-settings': () => { S.modal = { type: 'settings' }; render(); },
    'close-modal': () => { S.modal = null; render(); },
    overlay: (el, ev) => { if (ev.target === el) { S.modal = null; render(); } },
    water: (el) => { addWater(Number(el.dataset.ml)); render(); },
    'log-steps': () => { S.modal = { type: 'steps' }; render(); },

    'view-workout': (el) => { S.modal = { type: 'workout', id: el.dataset.id }; render(); },
    'start-workout': (el) => {
      if (S.data.activeWorkout && S.data.activeWorkout.templateId === el.dataset.id) { S.modal = { type: 'active' }; return render(); }
      if (S.data.activeWorkout && !confirm('You have a workout in progress. Replace it?')) return;
      startWorkout(el.dataset.id);
    },
    'resume-workout': () => { S.modal = { type: 'active' }; render(); },
    'toggle-set': (el) => { const s = S.data.activeWorkout.exercises[el.dataset.ei].sets[el.dataset.si]; s.done = !s.done; save(); render(); },
    'finish-workout': () => {
      const a = S.data.activeWorkout;
      const sets = a.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
      const minutes = Math.max(5, Math.round((Date.now() - a.startedAt) / 60000)) || workoutById(a.templateId).minutes;
      S.data.workouts.push({ id: uid(), date: todayKey(), templateId: a.templateId, name: a.name, minutes: Math.min(minutes, 240), sets, detail: a.exercises.map((e) => ({ name: e.name, sets: e.sets.filter((s) => s.done).map((s) => ({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 0 })) })) });
      S.data.activeWorkout = null;
      S.modal = null;
      save(); render();
      toast(`Workout logged. ${sets} set${sets === 1 ? '' : 's'} done.`);
    },
    'discard-workout': () => { if (!confirm('Discard this workout?')) return; S.data.activeWorkout = null; S.modal = null; save(); render(); },
    'swap-today': () => { S.modal = { type: 'swap' }; render(); },
    'set-today': (el) => { S.data.overrides[todayKey()] = el.dataset.id; S.modal = null; save(); render(); toast(`Today is now ${workoutById(el.dataset.id).name}`); },
    'reset-today': () => { delete S.data.overrides[todayKey()]; S.modal = null; save(); render(); },
    'lib-phase': (el) => { S.libPhase = el.dataset.phase; render(); },
    'log-other': () => { S.modal = { type: 'other' }; render(); },

    'swap-meal': (el) => {
      const k = todayKey();
      S.data.mealSwaps[k] = S.data.mealSwaps[k] || {};
      S.data.mealSwaps[k][el.dataset.slot] = (S.data.mealSwaps[k][el.dataset.slot] || 0) + 1;
      save(); render();
    },

    'advisor-view': (el) => { S.advisorView = el.dataset.value; S.authError = ''; render(); if (S.advisorView === 'coach') scrollChat(); },
    prompt: (el) => sendChat(el.dataset.q),
    'chat-action': (el) => {
      const a = S.data.chat[el.dataset.mi].actions[el.dataset.ai];
      a.used = true;
      save();
      runAction(a);
    },

    'photo-tap': (el) => {
      const id = el.dataset.id;
      if (!S.revealed[id]) { S.revealed[id] = true; return render(); }
      const i = S.compare.indexOf(id);
      if (i > -1) S.compare.splice(i, 1);
      else if (S.compare.length < 4) S.compare.push(id);
      else toast('Select up to 4 photos');
      render();
    },
    analyze: () => analyzeProgress(),
    'delete-photos': async () => {
      if (!confirm(`Delete ${S.compare.length} photo${S.compare.length === 1 ? '' : 's'}? This cannot be undone.`)) return;
      const ids = S.compare.slice();
      await photoTx('readwrite', (s) => ids.forEach((id) => s.delete(id)));
      S.compare = [];
      await loadPhotos();
      render();
      toast('Deleted');
    },
    'pin-settings': () => { S.modal = { type: 'pin' }; render(); },
    'remove-pin': () => { S.data.pinHash = null; S.data.pinSalt = null; S.modal = null; save(); render(); toast('PIN removed'); },
    'lock-vault': () => { S.vaultUnlocked = false; S.revealed = {}; S.compare = []; render(); },

    'community-view': (el) => { S.communityView = el.dataset.value; S.openThread = null; render(); },
    'post-tag': (el) => { S.postTag = el.dataset.value; const ta = root.querySelector('[data-form="post"] textarea'); const keep = ta ? ta.value : ''; render(); const nt = root.querySelector('[data-form="post"] textarea'); if (nt) nt.value = keep; },
    like: (el) => {
      if (!requireAccount('community')) return;
      const c = community();
      const p = c.posts.find((x) => x.id === el.dataset.id);
      const me = meId();
      const i = p.likedBy.indexOf(me);
      if (i > -1) p.likedBy.splice(i, 1); else p.likedBy.push(me);
      saveCommunity(c); render();
    },
    'toggle-comments': (el) => { S.openComments[el.dataset.id] = !S.openComments[el.dataset.id]; render(); },
    message: (el) => {
      if (!requireAccount('community')) return;
      if (el.dataset.id === meId()) return;
      S.communityView = 'messages'; S.openThread = el.dataset.id; render(); window.scrollTo(0, 0);
    },
    'open-thread': (el) => { S.openThread = el.dataset.id; render(); scrollChat(); },
    'close-thread': () => { S.openThread = null; render(); },

    theme: (el) => { applyTheme(el.dataset.value); render(); },
    'edit-plan': () => { S.data.editing = true; S.data.onboarded = false; S.data.obStep = 0; S.modal = null; save(); render(); window.scrollTo(0, 0); },
    logout: () => logout(),
    'delete-data': () => deleteData(),
  };

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const fn = actions[el.dataset.action];
    if (!fn) return;
    if (el.dataset.action === 'overlay' && ev.target !== el) return;
    ev.preventDefault();
    fn(el, ev);
  });

  // Live inputs that should not trigger a full re-render.
  document.addEventListener('input', (ev) => {
    const el = ev.target;
    if (el.dataset.bind && S.data) {
      const p = S.data.profile;
      const k = el.dataset.bind;
      const v = el.value;
      if (k === 'ft' || k === 'in') {
        const ft = Number((root.querySelector('[data-bind="ft"]') || {}).value) || 0;
        const inch = Number((root.querySelector('[data-bind="in"]') || {}).value) || 0;
        p.heightCm = Math.round((ft * 12 + inch) * 2.54);
      } else if (k === 'lb') p.weightKg = Math.round((Number(v) / 2.20462) * 10) / 10;
      else if (['heightCm', 'weightKg', 'age', 'cycleLength', 'periodLength'].includes(k)) p[k] = Number(v);
      else p[k] = v;
      if (el.dataset.out) document.getElementById(el.dataset.out).textContent = v;
      save();
      const btn = root.querySelector('[data-action="ob-next"]');
      if (btn) {
        const step = S.data.obStep;
        const ok = step === 2 ? !!p.periodStart && p.periodStart <= todayKey()
          : step === 3 ? p.heightCm >= 120 && p.heightCm <= 220 && p.weightKg >= 35 && p.weightKg <= 250 && p.age >= 14 && p.age <= 90
          : true;
        btn.disabled = !ok;
      }
    }
    if (el.dataset.set && S.data.activeWorkout) {
      const [ei, si, field] = el.dataset.set.split('.');
      S.data.activeWorkout.exercises[ei].sets[si][field] = el.value;
      save();
    }
    if (el.tagName === 'TEXTAREA' && el.name === 'msg') { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }
  });

  document.addEventListener('change', async (ev) => {
    const el = ev.target;
    if (el.dataset.bindUi === 'pose') { S.pose = el.value; return; }
    if (el.matches('[data-upload]') && el.files && el.files[0]) {
      const file = el.files[0];
      if (!file.type.startsWith('image/')) return toast('Choose an image file');
      try {
        const data = await compressImage(file);
        const photo = { id: uid(), owner: S.session.email, date: todayKey(), created: Date.now(), pose: S.pose || 'front', phase: cycleInfo(S.data.profile).phase, data };
        await photoTx('readwrite', (s) => s.put(photo));
        await loadPhotos();
        S.revealed[photo.id] = true;
        render();
        toast('Photo saved to your private vault');
      } catch { toast('Could not save that photo'); }
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && !ev.shiftKey && ev.target.tagName === 'TEXTAREA' && ev.target.name === 'msg') {
      ev.preventDefault();
      ev.target.form.requestSubmit();
    }
    if (ev.key === 'Escape' && S.modal && S.modal.type !== 'active') { S.modal = null; render(); }
  });

  document.addEventListener('submit', async (ev) => {
    const form = ev.target;
    const type = form.dataset.form;
    if (!type) return;
    ev.preventDefault();
    if (type === 'login') return login(form);
    if (type === 'signup') return signup(form);
    if (type === 'chat') { const v = form.msg.value; form.msg.value = ''; return sendChat(v); }
    if (type === 'steps') { S.data.steps[todayKey()] = clamp(Number(form.steps.value) || 0, 0, 100000); S.modal = null; save(); render(); return toast('Steps updated'); }
    if (type === 'other') {
      S.data.workouts.push({ id: uid(), date: todayKey(), templateId: 'other', name: form.name.value.trim().slice(0, 60), minutes: clamp(Number(form.minutes.value) || 30, 5, 600) });
      S.modal = null; save(); render(); return toast('Activity logged');
    }
    if (type === 'period') {
      const d = form.date.value;
      if (!d || d > todayKey()) return toast('Choose a date that is not in the future');
      S.data.profile.periodStart = d; S.modal = null; save(); render(); return toast('Cycle updated');
    }
    if (type === 'checkin') {
      let kg = Number(form.w.value);
      if (S.data.profile.units === 'imperial') kg = kg / 2.20462;
      kg = Math.round(kg * 10) / 10;
      if (!(kg >= 30 && kg <= 300)) return toast('Enter a realistic weight');
      S.data.checkins = S.data.checkins.filter((c) => c.date !== todayKey());
      S.data.checkins.push({ date: todayKey(), kg });
      S.data.checkins.sort((a, b) => (a.date < b.date ? -1 : 1));
      S.data.profile.weightKg = kg;
      save(); render(); return toast('Check-in saved');
    }
    if (type === 'pin') {
      const pin = form.pin.value;
      if (!/^\d{4}$/.test(pin)) return toast('Use 4 digits');
      S.data.pinSalt = newSalt();
      S.data.pinHash = await hashSecret(pin, S.data.pinSalt);
      S.vaultUnlocked = true;
      S.modal = null; save(); render(); return toast('PIN set');
    }
    if (type === 'unlock') {
      const ok = (await hashSecret(form.pin.value, S.data.pinSalt)) === S.data.pinHash;
      S.authError = ok ? '' : 'Incorrect PIN';
      S.vaultUnlocked = ok;
      return render();
    }
    if (type === 'post') {
      if (!requireAccount('community')) return;
      const text = form.text.value.trim();
      if (!text) return;
      const c = community();
      c.posts.push({ id: uid(), author: meId(), text: text.slice(0, 600), tag: S.postTag || 'Win', phase: cycleInfo(S.data.profile).phase, ts: Date.now(), baseLikes: 0, likedBy: [], comments: [] });
      saveCommunity(c); render(); return toast('Shared with the community');
    }
    if (type === 'comment') {
      if (!requireAccount('community')) return;
      const text = form.text.value.trim();
      if (!text) return;
      const c = community();
      c.posts.find((p) => p.id === form.dataset.id).comments.push({ author: meId(), text: text.slice(0, 300), ts: Date.now() });
      saveCommunity(c); return render();
    }
    if (type === 'dm') {
      const text = form.msg.value.trim();
      if (!text) return;
      const me = meId();
      const other = S.openThread;
      const key = threadKey(me, other);
      const c = community();
      (c.threads[key] = c.threads[key] || []).push({ from: me, text: text.slice(0, 1000), ts: Date.now() });
      saveCommunity(c); render(); scrollChat();
      if (!other.startsWith('u:')) {
        setTimeout(() => {
          const c2 = community();
          const reply = D.AUTO_REPLIES[Math.floor(Math.random() * D.AUTO_REPLIES.length)];
          (c2.threads[key] = c2.threads[key] || []).push({ from: other, text: reply, ts: Date.now() });
          saveCommunity(c2);
          if (S.openThread === other) { render(); scrollChat(); }
        }, 1400 + Math.random() * 1200);
      }
    }
  });

  // Keep the dark-mode browser chrome in sync with the system setting.
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => render());

  // ---------- boot ----------
  (async function boot() {
    if (S.session) {
      if (S.session.kind === 'user' && !users()[S.session.email]) { S.session = null; store.del('yours.session'); }
      else { loadData(); await loadPhotos(); }
    }
    render();
    checkAI();
  })();
})();
