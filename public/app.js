/* YOURS - cycle-synced fitness coaching. Single-page app, data stored on this device. */
(function () {
  'use strict';

  const D = window.YOURS_DATA;
  const L = window.YOURS_LOGIC;
  const root = document.getElementById('app');
  const { dateKey, parseKey, today, addDays, daysBetween, clamp, round, GOALS, LEVELS, ACTIVITY, goalOf, activityOf, workoutById } = L;

  // ---------- utilities ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const todayKey = () => dateKey(today());
  const fmtDate = (d, opts) => d.toLocaleDateString(undefined, opts || { weekday: 'long', month: 'long', day: 'numeric' });
  const shortDate = (k) => fmtDate(parseKey(k), { month: 'short', day: 'numeric' });
  const firstName = (n) => (n || '').trim().split(/\s+/)[0] || '';
  const initials = (n) => (n || '?').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
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
    share: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    flame: '<path d="M12 21c-3.9 0-7-2.9-7-6.6 0-3.1 2-5.3 3.6-7 .3 1.9 1.4 3.2 2.6 3.6C11 7.6 12.4 5 15 3c.4 3 4 5.4 4 10.6C19 18 15.9 21 12 21z"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 19h14"/>',
    barcode: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8v8M10 8v8M13 8v8M16 8v8"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 18 5-5 4 4 3-3 4 4"/>',
  };
  const icon = (name, size = 22, sw = 1.8) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  // ---------- state ----------
  const S = {
    session: store.get('yours.session', null), // { kind: 'user', email } | { kind: 'guest' }
    data: null,
    screen: 'welcome',
    tab: 'home',
    advisorView: 'coach',
    communityView: 'feed',
    openThread: null,
    openComments: {},
    modal: null,
    ai: null,
    typing: false,
    vaultUnlocked: false,
    photoKey: null,
    photos: [],
    revealed: {},
    compare: [],
    analyzing: false,
    authError: '',
    installPrompt: null,
  };

  const dataKey = () => (S.session && S.session.kind === 'user' ? `yours.data.${S.session.email}` : 'yours.data.guest');
  const isGuest = () => !S.session || S.session.kind === 'guest';
  const users = () => store.get('yours.users', {});
  const currentUser = () => (isGuest() ? null : users()[S.session.email] || null);
  const myName = () => (currentUser() ? currentUser().name : '');

  function blankData() {
    return {
      onboarded: false, planSeen: false, obStep: 0,
      profile: { units: 'imperial', cycleMode: 'natural', cycleLength: 28, periodLength: 5, favorites: [], avoid: [], foodNotes: '' },
      periods: [], daily: {}, plan: { volume: 0, stepBonus: 0, kcalAdjust: 0 }, reviews: [], prs: [],
      workouts: [], steps: {}, water: {}, eaten: {}, proteinExtra: {}, foodLog: {}, recentFoods: [], customFoods: {}, recipes: {}, tips: {}, checkins: [], chat: [], overrides: {}, mealSwaps: {}, grocery: { checked: {} },
      activeWorkout: null, pinHash: null, pinSalt: null,
    };
  }

  function loadData() {
    S.data = Object.assign(blankData(), store.get(dataKey(), {}));
    const d = S.data;
    // Migrate older saves.
    d.profile.cycleMode = d.profile.cycleMode || 'natural';
    if (!d.periods.length && d.profile.periodStart) d.periods = [d.profile.periodStart];
    d.plan = Object.assign({ volume: 0, stepBonus: 0, kcalAdjust: 0 }, d.plan);
  }
  function save() { if (S.session) store.set(dataKey(), S.data); }

  // Derived values used across views.
  const cyc = (date) => L.cycleInfo(S.data.profile, date);
  const tgt = (c) => L.targets(S.data.profile, c || cyc(), S.data.plan);
  const todaysWorkout = () => L.workoutFor(S.data, today());
  const adjustSets = (ex) => L.adjustSets(ex, S.data.profile.level, S.data.plan);
  const loggedOn = (key) => S.data.workouts.filter((w) => w.date === key);
  const readinessToday = () => L.readiness(S.data.daily[todayKey()]);
  const unit = () => (S.data.profile.units === 'metric' ? 'kg' : 'lb');
  // US labels say Calories; metric users expect kcal.
  const calU = () => (S.data.profile.units === 'metric' ? 'kcal' : 'cal');
  const calWord = () => (S.data.profile.units === 'metric' ? 'kcal' : 'calories');
  // Body weight is stored in kg; show it in her units.
  const bw = (kg) => (unit() === 'lb' ? `${Math.round(kg * 2.20462 * 10) / 10} lb` : `${kg} kg`);
  const rate = (kgPerWeek) => { const v = unit() === 'lb' ? kgPerWeek * 2.20462 : kgPerWeek; return `${v > 0 ? '+' : ''}${v.toFixed(unit() === 'lb' ? 1 : 2)} ${unit()} a week`; };
  let patternCache = { n: -1, value: null };
  function pats() {
    const n = Object.keys(S.data.daily).length;
    if (patternCache.n !== n || patternCache.owner !== dataKey()) patternCache = { n, owner: dataKey(), value: L.patterns(S.data.daily) };
    return patternCache.value;
  }
  function weekDays() {
    const t = today();
    const mon = addDays(t, -L.weekdayIndex(t));
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  }
  const phaseName = (p) => D.PHASES[p].name;
  function phaseLine(c) {
    if (c.steady) return 'You are in steady mode';
    if (c.late) return `Your period is ${plural(c.daysLate, 'day')} later than predicted`;
    return `You are on day ${c.day} of ${c.len}, in your ${phaseName(c.phase).toLowerCase()} phase`;
  }

  // ---------- crypto ----------
  const hex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  const hasSubtle = () => !!(window.crypto && crypto.subtle);
  async function hashSecret(secret, salt) {
    if (hasSubtle()) {
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

  // Photo encryption: AES-GCM with a key derived from the vault PIN.
  async function photoKeyFrom(pin, salt) {
    if (!hasSubtle()) return null;
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt + ':photos'), iterations: 200000 }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  const toB64 = (buf) => { const b = new Uint8Array(buf); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
  const fromB64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  async function encryptText(key, text) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
    return { iv: toB64(iv), ct: toB64(ct) };
  }
  async function decryptText(key, enc) {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(enc.iv) }, key, fromB64(enc.ct));
    return new TextDecoder().decode(pt);
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

  function todaysLoads() {
    const c = cyc();
    const wk = todaysWorkout();
    return wk.exercises.filter((ex) => ex.main).map((ex) => {
      const s = L.suggestLoad(ex.name, ex.reps, S.data.workouts, { phase: c.phase, readiness: readinessToday(), unit: unit() });
      return s && !s.first ? { exercise: ex.name, weight: s.weight, unit: s.unit, reps: s.reps, why: s.reason } : null;
    }).filter(Boolean);
  }

  function buildContext() {
    const p = S.data.profile;
    const c = cyc();
    const t = tgt(c);
    const wk = todaysWorkout();
    const last14 = Array.from({ length: 14 }, (_, i) => dateKey(addDays(today(), -i)));
    const learned = L.learnCycle(S.data.periods);
    const pt = pats();
    const lastReview = S.data.reviews[S.data.reviews.length - 1];
    return {
      name: firstName(myName()) || null,
      today: todayKey(),
      profile: { level: p.level, goal: goalOf(p).label, heightCm: p.heightCm, weightKg: p.weightKg, age: p.age, activity: activityOf(p).label, cycleType: (D.CYCLE_MODES.find((m) => m.id === p.cycleMode) || {}).label, favoriteFoods: p.favorites, avoidFoods: p.avoid, foodNotes: p.foodNotes, units: p.units },
      cycle: c.steady ? { mode: 'steady (no phase-based plan)' } : { day: c.day, length: c.len, phase: c.phase, nextPhase: c.next, daysToNextPhase: c.daysToNext, daysToNextPeriod: c.daysToPeriod, periodLate: c.late ? c.daysLate : 0, learnedFromCycles: learned ? learned.samples : 0, cycleRange: learned ? `${learned.min}-${learned.max}` : null },
      readinessToday: readinessToday(),
      todaysCheckin: S.data.daily[todayKey()] || null,
      patterns: pt.insights,
      targets: { calories: t.kcal, proteinG: t.protein, carbsG: t.carbs, fatG: t.fat, waterL: t.water, steps: t.steps },
      planAdjustments: S.data.plan,
      todaysWorkout: { id: wk.id, name: wk.name, completed: loggedOn(todayKey()).length > 0, suggestedLoads: todaysLoads() },
      workoutCatalog: D.WORKOUTS.map((w) => ({ id: w.id, name: w.name, phase: w.phase, intensity: w.intensity })),
      recentWorkouts: S.data.workouts.slice(-10).map((w) => ({ date: w.date, name: w.name, minutes: w.minutes, phase: w.phase })),
      recentPRs: S.data.prs.slice(-5),
      proteinTodayG: L.proteinFor(S.data, todayKey()),
      eatenToday: L.macrosFor(S.data, todayKey()),
      foodLogToday: (S.data.foodLog[todayKey()] || []).map((f) => ({ name: f.name, amount: f.label, kcal: f.kcal, protein: f.protein })),
      stepsLast14Days: last14.map((k) => ({ date: k, steps: S.data.steps[k] || 0 })),
      waterTodayMl: S.data.water[todayKey()] || 0,
      weightCheckins: S.data.checkins.slice(-12),
      lastWeeklyReview: lastReview ? { date: lastReview.date, adjustments: lastReview.adjustments.map((a) => a.label) } : null,
    };
  }

  const ACTION_RE = /\[\[action:(swap_workout|log_water|open):([a-z0-9_-]+)\]\]/gi;
  const TABS = ['home', 'workouts', 'meals', 'advisor', 'community', 'progress', 'insights', 'checkin'];
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
    if (a.value === 'checkin') return 'Do my daily check-in';
    return `Open ${a.value[0].toUpperCase() + a.value.slice(1)}`;
  }
  const lighterOption = (c) => (readinessToday() != null && readinessToday() < 30 ? 'm-restore' : { menstrual: 'm-restore', luteal: 'l-pilates', menopause: 'mp-mobility' }[c.phase] || 'm-light');

  // On-device coach used when the live AI is not configured or unreachable.
  function localCoach(input) {
    const q = input.toLowerCase();
    const p = S.data.profile;
    const c = cyc();
    const ph = D.PHASES[c.phase];
    const t = tgt(c);
    const wk = todaysWorkout();
    const name = firstName(myName());
    const hi = name ? `${name}, ` : '';
    const has = (...words) => words.some((w) => q.includes(w));
    const lighter = lighterOption(c);
    const ready = readinessToday();
    const last14 = Array.from({ length: 14 }, (_, i) => S.data.steps[dateKey(addDays(today(), -i))] || 0);
    const stepDays = last14.filter((s) => s >= t.steps).length;
    const recent = S.data.workouts.filter((w) => daysBetween(parseKey(w.date), today()) < 14).length;
    const pt = pats();

    if (has('how heavy', 'how much weight', 'what weight', 'progressive overload', 'add weight', 'increase weight', 'load', 'kg', 'lbs')) {
      const loads = todaysLoads();
      if (!loads.length) return `${hi}log a session with weights and reps and I will suggest your exact numbers from then on. Double progression works like this: stay at a weight until you hit the top of the rep range on every set, then add the smallest jump available. ${c.phase === 'luteal' ? 'In your luteal phase I hold weights steady.' : c.phase === 'menstrual' ? 'In your menstrual phase I take about 10% off.' : 'Your current phase is a great time to push.'}`;
      return `${hi}here are today's numbers for ${wk.name}:\n\n${loads.map((l) => `- ${l.exercise}: ${l.weight} ${l.unit} x ${l.reps}. ${l.why}`).join('\n')}\n\nThey are pre-filled when you start the workout.\n[[action:open:workouts]]`;
    }
    if (has('menopaus', 'hot flash', 'night sweat', 'hot flush', 'bone', 'osteo', 'brain fog')) {
      const mi = L.menoInsights(S.data.daily);
      return `${hi}${L.MENO_MODES.includes(p.cycleMode) ? 'here is what matters most at this stage' : 'for perimenopause and menopause, the priorities are'}:\n\n- Lift heavy 2-3 times a week. It is the most effective training for bone density and muscle.\n- Add a little impact or power work (step-up hops, swings) if your joints and pelvic floor are happy.\n- Protein at every meal: about ${Math.round(t.protein / 4)} g, four times a day.\n- Calcium, vitamin D and fiber. Soy or flax may ease hot flashes for some women.\n- Hot flashes and night sweats: a cool bedroom, layers, and watch alcohol, caffeine and spicy food as triggers.\n${mi.length ? `\nFrom your check-ins: ${mi[0]}` : '\nLog hot flashes, night sweats and sleep in your daily check-in and I will spot your patterns.'}\n\nYour doctor can talk you through hormone therapy and other options if symptoms are hard to live with.\n[[action:open:checkin]]`;
    }
    if (has('cramp', 'pain', 'hurt', 'bloat')) {
      return `${hi}that is really common${c.phase === 'menstrual' ? ' in the first days of your period' : ''}. What helps most women:\n\n- Gentle movement: a 20-minute walk or the Restore session increases blood flow and often eases cramps.\n- Heat on your lower belly and slow breathing (inhale 4, exhale 6).\n- Magnesium-rich food: dark chocolate, pumpkin seeds, leafy greens.\n- Stay on top of water today: ${t.water} L.\n\nIf pain is severe, stops you functioning, or comes with very heavy bleeding, please check in with a doctor.\n[[action:swap_workout:m-restore]]\n[[action:log_water:500]]`;
    }
    if (has('tired', 'energy', 'exhaust', 'fatigue', 'sleepy', 'drained', 'readiness')) {
      const dip = pt.insights.find((s) => s.includes('dips'));
      return `${hi}${ready != null ? `your readiness today is ${ready}/100 (${L.readinessLabel(ready).toLowerCase()}). ` : ''}${c.steady ? '' : `In your ${ph.name.toLowerCase()} phase, energy is typically ${ph.energy.toLowerCase()}. `}${c.phase === 'menstrual' || c.phase === 'luteal' ? 'Low energy here is physiology, not a lack of discipline.' : 'If you are this tired in a high-energy phase, look at sleep, food and stress first.'}${dip ? `\n\nFrom your check-ins: ${dip}` : ''}\n\nMy recommendation: keep the habit, lower the dose. Do a shorter or lighter session, get at least ${round(t.steps * 0.8, 500).toLocaleString()} steps, and eat ${t.protein} g of protein.\n[[action:swap_workout:${lighter}]]${ready == null ? '\n[[action:open:checkin]]' : ''}`;
    }
    if (has('crav', 'sugar', 'chocolate', 'hungry', 'snack', 'binge')) {
      const snack = L.mealFor(S.data, today(), 'snack').meal;
      return `${hi}${c.phase === 'luteal' ? 'cravings in the luteal phase are expected. Your metabolism runs slightly higher, so you genuinely need about 100-200 more calories. That is already built into your target.' : 'cravings usually mean a meal was light on protein or fiber, or sleep was short.'}\n\nTry this:\n- Lead every meal with protein (about ${Math.round(t.protein / 4)} g per meal).\n- Add complex carbs at dinner, which also helps sleep.\n- Plan a satisfying snack instead of fighting it: ${snack.name}.\n\nToday's target is ${t.kcal.toLocaleString()} ${calWord()}.\n[[action:open:meals]]`;
    }
    if (has('protein')) {
      const had = L.proteinFor(S.data, todayKey());
      const favs = (p.favorites || []).slice(0, 4).join(', ');
      return `${hi}your protein target is ${t.protein} g a day. ${had ? `You have logged ${had} g so far today.` : ''}\n\nSplit it across 4 feedings of about ${Math.round(t.protein / 4)} g:\n- Breakfast: eggs, Greek yogurt or a protein smoothie\n- Lunch and dinner: a palm-and-a-half of lean protein\n- Snack: cottage cheese, edamame or a shake\n${favs ? `\nBuild around foods you already like: ${favs}.` : ''}\n[[action:open:meals]]`;
    }
    if (has('water', 'hydrat', 'drink')) {
      const had = S.data.water[todayKey()] || 0;
      return `${hi}aim for ${t.water} L today. You have logged ${(had / 1000).toFixed(1)} L so far.\n\nEasy wins: a large glass on waking, one with every meal, and 500 ml around training. Add electrolytes on heavy sweat days.\n[[action:log_water:500]]`;
    }
    if (has('step', 'walk', 'cardio', 'neat')) {
      return `${hi}today's step target is ${t.steps.toLocaleString()}. You hit it on ${stepDays} of the last 14 days.\n\nSteps are the most underrated fat-loss and recovery tool: low stress on the body and easy to recover from.\n- A 10-minute walk after each meal (about 3,000 steps)\n- Walking calls or meetings\n- Park further away and take the stairs${S.data.plan.stepBonus ? `\n\nYour weekly check-in set your target ${S.data.plan.stepBonus > 0 ? 'up' : 'down'} by ${Math.abs(S.data.plan.stepBonus).toLocaleString()} steps.` : ''}`;
    }
    if (has('glute', 'booty', 'bum', 'butt', 'hip thrust')) {
      return `${hi}for glute growth, focus on three things:\n\n- Progressive overload on hip thrusts, RDLs and split squats. I suggest your exact weights each session.\n- 10-20 hard sets for glutes per week, spread over 2-3 sessions.\n- Eat enough: ${t.protein} g of protein and do not under-eat calories.\n\n${c.phase === 'ovulation' || c.phase === 'follicular' ? 'You are in a high-output phase, so this is the time to push your glute day.' : 'Keep the weights steady and focus on the mind-muscle connection.'}${c.phase !== 'menstrual' ? '\n[[action:swap_workout:o-glute]]' : ''}`;
    }
    if (has('sleep', 'insomnia', 'rest day', 'recover')) {
      return `${hi}recovery is where the results happen. Aim for 7-9 hours.\n\n- Keep a consistent wake time, even on weekends\n- Get daylight within an hour of waking\n- Have complex carbs and magnesium at dinner${c.phase === 'luteal' ? ' (especially now, when progesterone raises body temperature)' : ''}\n- Keep a cool, dark room and no screens for the last 30 minutes\n\nOn a poor-sleep day, lower the weights by about 10% instead of skipping.`;
    }
    if (has('skip', 'miss', 'motivat', 'lazy', 'cant be bothered', "can't be bothered", 'give up', 'quit')) {
      const st = L.streak(S.data);
      return `${hi}motivation comes and goes, and that is normal. Systems are what keep you going. Here is the deal: do the first 10 minutes of ${wk.name}. If you still want to stop after that, stop, and it still counts.\n\n${st.count ? `You are on a ${st.count}-day streak. Walking or a check-in keeps it alive today.` : `You have trained ${plural(recent, 'time')} in the last two weeks.`}\n[[action:open:workouts]]`;
    }
    if (has('plateau', 'stuck', 'not working', 'no progress', 'on track', 'progress', 'week')) {
      const s = L.weeklyStats(S.data);
      return `${hi}here is your last 7 days:\n\n- Sessions: ${s.sessions} of ${s.planned} planned\n- Step target hit: ${s.stepDays} of 7 days\n${s.readinessAvg != null ? `- Average readiness: ${s.readinessAvg}/100\n` : ''}${s.weightChange != null ? `- Weight trend: ${rate(s.weightChange)}\n` : '- No weight trend yet. Add check-ins in Progress.\n'}\nYour weekly check-in turns this into concrete changes to next week's plan.\n[[action:open:insights]]`;
    }
    if (has('lose', 'fat', 'weight', 'scale', 'lean', 'deficit')) {
      return `${hi}sustainable fat loss looks like this:\n\n- A moderate deficit. Your target of ${t.kcal.toLocaleString()} ${calWord()} already accounts for that, and I never go below what your body needs to function.\n- High protein (${t.protein} g) and lifting to keep your muscle.\n- Steps: ${t.steps.toLocaleString()} a day.\n- Judge progress across a full cycle, not day to day. Luteal water retention can hide fat loss for a week.`;
    }
    if (has('muscle', 'build', 'gain', 'tone', 'bigger', 'shape', 'stronger', 'strength')) {
      const sbp = L.strengthByPhase(S.data.workouts);
      return `${hi}building muscle comes down to progressive overload plus enough food.\n\n- I suggest your weight for every main lift based on your last session.\n- Train each muscle about twice a week.\n- Eat ${t.kcal.toLocaleString()} ${calWord()} with ${t.protein} g of protein.\n${sbp ? `\nFrom your logs: you lift about ${Math.round(sbp.diff)}% more in your ${phaseName(sbp.best).toLowerCase()} phase than your ${phaseName(sbp.low).toLowerCase()} phase. Plan your heaviest work there.` : ''}\n[[action:open:workouts]]`;
    }
    if (has('meal', 'eat', 'food', 'breakfast', 'lunch', 'dinner', 'recipe', 'diet', 'grocer', 'shop')) {
      const pick = (s) => L.mealFor(S.data, today(), s).meal.name;
      return `${hi}today's ${ph.name.toLowerCase()} plan:\n\n- Breakfast: ${pick('breakfast')}\n- Lunch: ${pick('lunch')}\n- Dinner: ${pick('dinner')}\n\nFocus: ${ph.nutrition} Your grocery list for the week is in the Meals tab.\n[[action:open:meals]]`;
    }
    if (has('workout', 'train', 'session', 'gym', 'exercise', 'lift', 'today')) {
      return `${hi}today is ${wk.name} (${wk.minutes} min, ${wk.intensity.toLowerCase()} intensity). ${wk.summary}\n\nWhy it fits: ${ph.training}${ready != null && ready < 45 ? `\n\nYour readiness is ${ready}/100 today, so I would go lighter.` : ''}\n[[action:open:workouts]]\n[[action:swap_workout:${lighter}]]`;
    }
    if (has('phase', 'cycle', 'period', 'ovulat', 'luteal', 'follicular', 'menstrual', 'hormone', 'late')) {
      const learned = L.learnCycle(S.data.periods);
      if (c.steady) return `${hi}your plan is in steady mode, so it follows a weekly rhythm and your daily readiness rather than cycle phases. ${ph.hormones}`;
      return `${hi}${phaseLine(c)}. ${ph.hormones}\n\n- Training: ${ph.training}\n- Nutrition: ${ph.nutrition}\n\n${learned ? `I predict your cycle from your last ${plural(learned.samples, 'cycle')} (average ${learned.length} days, range ${learned.min}-${learned.max}).` : 'Log your next period start and I will start learning your real cycle length.'}`;
    }
    return `${hi}here is your snapshot for today:\n\n- ${phaseLine(c)}. ${ph.short}.\n- Workout: ${wk.name}\n- Targets: ${t.protein} g protein, ${t.water} L water, ${t.steps.toLocaleString()} steps${ready != null ? `\n- Readiness: ${ready}/100` : ''}\n\nAsk me about training weights, cravings, protein, steps, plateaus or how to adjust for how you feel today.`;
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

  function goTab(tab) {
    if (tab === 'progress' || tab === 'insights') { S.tab = 'advisor'; S.advisorView = tab; }
    else if (tab === 'checkin') { openCheckin(); return; }
    else S.tab = tab;
    if (tab !== 'meals') S.diaryDate = null;
    S.modal = null;
    window.scrollTo(0, 0);
  }

  function runAction(a) {
    if (a.type === 'swap_workout') { S.data.overrides[todayKey()] = a.value; save(); toast(`Today is now ${workoutById(a.value).name}`); }
    if (a.type === 'log_water') addWater(a.value);
    if (a.type === 'open') goTab(a.value);
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

  // ---------- photos (IndexedDB, device only, encrypted when a PIN is set) ----------
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
    S.photos = [];
    if (isGuest() || (S.data.pinHash && !S.vaultUnlocked)) return;
    try {
      const list = await photoTx('readonly', (s) => s.index('owner').getAll(S.session.email));
      const out = [];
      for (const rec of list || []) {
        let data = rec.data || null;
        if (rec.enc) { try { data = S.photoKey ? await decryptText(S.photoKey, rec.enc) : null; } catch { data = null; } }
        if (data) out.push({ ...rec, data, enc: undefined });
      }
      S.photos = out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.created - a.created));
    } catch { S.photos = []; }
  }
  async function storePhoto(photo) {
    const rec = { id: photo.id, owner: photo.owner, date: photo.date, created: photo.created, pose: photo.pose, phase: photo.phase, checkin: !!photo.checkin };
    if (S.photoKey) rec.enc = await encryptText(S.photoKey, photo.data);
    else rec.data = photo.data;
    await photoTx('readwrite', (s) => s.put(rec));
  }
  async function rewriteAllPhotos() {
    for (const p of S.photos) await storePhoto(p);
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
    const t = tgt();
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
    const prs = S.data.prs.filter((x) => daysBetween(parseKey(x.date), today()) < 28).length;
    const habits = (sessions >= 2.5) + (stepPct >= 60);
    const verdict = habits === 2 && weightOk ? 'on_track' : habits >= 1 ? 'progressing' : 'adjust';
    const lines = [
      verdict === 'on_track' ? 'Your habits and trend line up with your goal.' : verdict === 'progressing' ? 'You are moving in the right direction. Tighten one or two habits.' : 'Let us rebuild consistency before judging results.',
      '',
      '### What is working',
      `- ${sessions.toFixed(1)} sessions a week over the last 4 weeks`,
      `- Step target hit on ${stepPct}% of the last 14 days`,
      perWeek !== null ? `- Weight trend: ${rate(perWeek)}` : '- Add weekly weight check-ins to see your trend',
      prs ? `- ${plural(prs, 'personal record')} in the last 4 weeks` : '',
      '',
      '### Focus next',
      sessions < 2.5 ? '- Get to 3 sessions a week' : '- Keep following your suggested weights on main lifts',
      stepPct < 60 ? `- Build up to ${t.steps.toLocaleString()} steps on most days` : '- Keep your steps consistent',
      !weightOk && goal === 'lose' ? `- Trend is flat or too fast. Aim for ${unit() === 'lb' ? '0.5-1.5 lb' : '0.25-0.75 kg'} a week` : `- Hit ${t.protein} g protein daily`,
      '',
      '### Next 2 weeks',
      '- Take photos in the same light, pose and cycle phase each time',
      '- Compare photos across the same phase, because luteal bloating is normal',
    ].filter((x) => x !== '');
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

  // ---------- weekly check-in ----------
  function localWeeklyText(stats, result) {
    const name = firstName(myName());
    const parts = [];
    const ratio = stats.planned ? stats.sessions / stats.planned : 1;
    parts.push(`${name ? `${name}, ` : ''}${ratio >= 1 ? 'you showed up for every planned session this week. That is how results are built.' : ratio >= 0.6 ? `you completed ${stats.sessions} of ${stats.planned} planned sessions. Solid. Consistency beats perfection.` : `you got ${plural(stats.sessions, 'session')} in this week. Let us make next week easier to win.`}`);
    parts.push(`You averaged ${stats.stepAvg.toLocaleString()} steps and hit your target on ${stats.stepDays} of 7 days.${stats.readinessAvg != null ? ` Average readiness was ${stats.readinessAvg}/100.` : ''}${stats.prs ? ` You set ${plural(stats.prs, 'new personal record')}.` : ''}`);
    if (result.adjustments.length) parts.push(`For next week I recommend ${result.adjustments.length === 1 ? 'one change' : `${result.adjustments.length} changes`}. Untick anything you do not want.`);
    else parts.push('No changes needed. Your plan is working, so we keep it.');
    return parts.join('\n\n');
  }

  // Last check-in that had photos, for side-by-side comparison.
  function previousCheckinPhotos() {
    const prev = S.data.reviews.slice().reverse().find((r) => r.photos && Object.keys(r.photos).length);
    return prev ? { date: prev.date, photos: prev.photos } : null;
  }

  async function runWeekly(answers, photos) {
    photos = photos || {};
    const stats = L.weeklyStats(S.data);
    const result = L.weeklyAdjust(stats, answers, S.data);
    const hasPhotos = Object.keys(photos).length > 0;
    const prev = previousCheckinPhotos();
    S.modal = { type: 'weeklyResult', stats, answers, result, photos, prev, selected: result.adjustments.map(() => true), text: localWeeklyText(stats, result) + (hasPhotos ? `\n\nPhotos saved to your vault.${prev ? ' Compare them with your last check-in below. Judge the trend over a few weeks, not one set of photos.' : ' Next week you will see them side by side.'}` : ''), loading: !!S.ai };
    render();
    if (!S.ai) return;
    if (hasPhotos) {
      // Advisor reviews this week's photos (and last check-in's, same poses) together with the week's data.
      const byId = (id) => S.photos.find((p) => p.id === id);
      const imgs = [];
      const notes = [];
      ['front', 'side', 'back'].forEach((pose) => {
        const now = byId(photos[pose]);
        const before = prev && byId(prev.photos[pose]);
        if (before && imgs.length < 6) { imgs.push(before.data); notes.push(`Photo ${imgs.length}: ${pose}, last check-in ${prev.date}`); }
        if (now && imgs.length < 6) { imgs.push(now.data); notes.push(`Photo ${imgs.length}: ${pose}, this check-in ${todayKey()}`); }
      });
      try {
        const r = await fetch('/api/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'progress', context: { ...buildContext(), weekly: stats, answers, proposedChanges: result.adjustments.map((a) => a.label) }, images: imgs, imageNote: notes.join('. ') + '. This is her weekly check-in: compare matching poses and connect what you see to her week.' }),
        });
        if (r.ok && S.modal && S.modal.type === 'weeklyResult') { const j = await r.json(); S.modal.text = j.text; S.modal.verdict = j.verdict; }
      } catch { /* keep local text */ }
      if (S.modal && S.modal.type === 'weeklyResult') { S.modal.loading = false; render(); }
      return;
    }
    try {
      const r = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'chat',
          context: buildContext(),
          messages: [{ role: 'user', content: `Write my weekly check-in summary in 80-130 words: celebrate one specific win, name the one thing to focus on, and briefly explain the plan changes below. Do not include any [[action]] lines. Do not list the numbers back as a table.\n\nThis week: ${JSON.stringify(stats)}\nMy answers: ${JSON.stringify(answers)}\nProposed changes: ${JSON.stringify(result.adjustments.map((a) => a.label + ' - ' + a.why))}\nNotes: ${JSON.stringify(result.notes)}` }],
        }),
      });
      if (r.ok && S.modal && S.modal.type === 'weeklyResult') { S.modal.text = extractActions((await r.json()).text).text; }
    } catch { /* keep local text */ }
    if (S.modal && S.modal.type === 'weeklyResult') { S.modal.loading = false; render(); }
  }

  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // Average weigh-in over a 7-day window ending `offset` days ago (kg), or null.
  function weekAvg(offset) {
    const end = addDays(today(), -offset);
    const vals = S.data.checkins.filter((c) => { const g = daysBetween(parseKey(c.date), end); return g >= 0 && g < 7; }).map((c) => c.kg);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  }

  function blurThumb(id, label) {
    const ph = S.photos.find((p) => p.id === id);
    if (!ph) return `<div class="photo" style="display:flex;align-items:center;justify-content:center"><span class="tiny muted">${esc(label)}</span></div>`;
    return `<div class="photo ${S.revealed[id] ? '' : 'blur'}"><button style="display:block;width:100%;height:100%" data-action="reveal" data-id="${id}" aria-label="Reveal ${esc(label)} photo"><img src="${ph.data}" alt="${esc(label)} check-in photo"></button><div class="meta">${esc(label)}</div></div>`;
  }

  function checkinCompare(photos, prev) {
    const poses = ['front', 'side', 'back'].filter((p) => photos[p]);
    if (!poses.length) return '';
    return `<div class="card" style="margin-top:12px"><div class="row between"><div class="eyebrow">${prev ? `Last check-in vs today` : 'Today'}</div><span class="tiny muted">Tap to reveal</span></div>
      ${poses.map((p) => `<div style="display:grid;grid-template-columns:${prev ? '1fr 1fr' : '1fr'};gap:6px;margin-top:10px">${prev ? blurThumb(prev.photos[p], `${p} · ${shortDate(prev.date)}`) : ''}${blurThumb(photos[p], `${p} · today`)}</div>`).join('')}</div>`;
  }

  // ---------- share cards ----------
  // Poster-style share card: motion art, grain, condensed headline.
  const CARD_ART = {
    menstrual: ['#6E3A2C', '#2A1C17', '#C9765A'], follicular: ['#6F7D45', '#2C331D', '#D3DC94'], ovulation: ['#E89A5F', '#8E4524', '#FFD6A8'],
    luteal: ['#9A8466', '#3E3127', '#CDB89A'], steady: ['#B9AD9C', '#5C5145', '#EDE6DA'], menopause: ['#8B7A8C', '#3A2F3B', '#D9C6D3'], session: ['#2F3720', '#121409', '#6A7A48'],
  };
  async function makeCard(card) {
    const W = 1080, H = 1350;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    try { await Promise.all(['400 200px Anton', 'italic 400 80px "Instrument Serif"', '500 30px "DM Mono"', '900 100px Archivo'].map((f) => document.fonts.load(f))); } catch { /* fallback fonts */ }
    const [base, deep, glow] = CARD_ART[card.art] || CARD_ART.session;
    const bg = g.createLinearGradient(0, 0, W * 0.4, H);
    bg.addColorStop(0, base); bg.addColorStop(1, deep);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.save();
    g.filter = 'blur(70px)';
    const r1 = g.createRadialGradient(W * 0.3, H * 0.28, 0, W * 0.3, H * 0.28, W * 0.6);
    r1.addColorStop(0, glow); r1.addColorStop(1, 'transparent');
    g.fillStyle = r1; g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.18; g.fillStyle = '#FFFFFF';
    for (let i = -4; i < 30; i++) { g.save(); g.translate(i * 60, 0); g.rotate(0.18); g.fillRect(0, -200, 6, H + 400); g.restore(); }
    g.restore();
    // Grain
    const tile = document.createElement('canvas'); tile.width = tile.height = 256;
    const tg = tile.getContext('2d'); const img = tg.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 34; }
    tg.putImageData(img, 0, 0);
    g.fillStyle = g.createPattern(tile, 'repeat'); g.fillRect(0, 0, W, H);
    // Darken bottom for legibility
    const sh = g.createLinearGradient(0, H * 0.45, 0, H);
    sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = sh; g.fillRect(0, 0, W, H);

    const cream = '#F7F2EA';
    g.fillStyle = cream;
    g.font = '500 26px "DM Mono", monospace';
    const spaced = (t) => t.toUpperCase().split('').join(String.fromCharCode(8202));
    g.fillText(spaced(card.eyebrow), 70, 100);
    const right = spaced(card.foot || '');
    g.fillText(right, W - 70 - g.measureText(right).width, 100);
    g.font = 'italic 400 76px "Instrument Serif", Georgia, serif';
    const words = card.sub.split(' ');
    let line = '', lines = [];
    words.forEach((w) => { if (g.measureText(line + w).width > W - 140) { lines.push(line.trim()); line = ''; } line += w + ' '; });
    lines.push(line.trim());
    let size = 280;
    g.font = `400 ${size}px Anton, Impact, sans-serif`;
    while (g.measureText(card.big.toUpperCase()).width > W - 140 && size > 110) { size -= 10; g.font = `400 ${size}px Anton, Impact, sans-serif`; }
    const titleY = H - 230;
    g.fillStyle = '#D8E0A2';
    g.fillText(card.big.toUpperCase(), 64, titleY);
    g.fillStyle = cream;
    g.font = 'italic 400 76px "Instrument Serif", Georgia, serif';
    lines.slice(-3).reverse().forEach((l, i) => g.fillText(l, 70, titleY - size * 0.95 - 46 - i * 78));
    g.font = '500 24px "DM Mono", monospace';
    g.globalAlpha = 0.85;
    g.fillText(spaced('Strength . Cycle . Discipline'), 70, H - 150);
    g.globalAlpha = 1;
    g.font = '900 64px Archivo, "Arial Black", sans-serif';
    g.fillText('yours.', 64, H - 64);
    return c.toDataURL('image/png');
  }
  async function openShare(card) {
    S.modal = { type: 'share', card, url: null };
    render();
    S.modal.url = await makeCard(card);
    render();
  }
  async function shareCard() {
    const url = S.modal && S.modal.url;
    if (!url) return;
    const blob = await (await fetch(url)).blob();
    const file = new File([blob], 'yours-progress.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'My YOURS progress' }); return; } catch { /* cancelled */ }
    }
    const a = document.createElement('a');
    a.href = url; a.download = 'yours-progress.png';
    document.body.appendChild(a); a.click(); a.remove();
  }
  const fmtLoad = (w, u) => `${Number(w.toFixed(1))} ${u}`;

  // ---------- barcode scanning + food lookup ----------
  // Native BarcodeDetector where available (Chrome on Android); ZXing everywhere else (iPhone Safari).
  const OFF_FIELDS = 'code,product_name,generic_name,brands,nutriments,serving_size,serving_quantity,image_front_small_url';
  let scanSession = null;
  let zxingPromise = null;
  function loadZXing() {
    if (window.ZXingBrowser) return Promise.resolve();
    if (!zxingPromise) zxingPromise = new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = '/vendor/zxing-browser.min.js';
      el.onload = resolve;
      el.onerror = () => { zxingPromise = null; reject(new Error('Scanner failed to load')); };
      document.head.appendChild(el);
    });
    return zxingPromise;
  }
  const setScanStatus = (text) => { const el = document.getElementById('scan-status'); if (el) el.textContent = text; };

  async function nativeDetector() {
    if (!('BarcodeDetector' in window)) return null;
    try {
      const formats = await window.BarcodeDetector.getSupportedFormats();
      if (!formats.includes('ean_13')) return null;
      return new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'].filter((f) => formats.includes(f)) });
    } catch { return null; }
  }

  async function startScanner() {
    const video = document.getElementById('scan-video');
    if (!video) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setScanStatus('Camera is not available here. Type the barcode or scan from a photo.'); return; }
    let done = false;
    const found = (code) => { if (done) return; code = String(code).trim(); if (!L.validBarcode(code)) return; done = true; stopScanner(); if (navigator.vibrate) navigator.vibrate(40); lookupBarcode(code); };
    try {
      setScanStatus('Starting camera...');
      const detector = await nativeDetector();
      if (detector) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        video.srcObject = stream;
        await video.play();
        let active = true;
        scanSession = { stop: () => { active = false; stream.getTracks().forEach((t) => t.stop()); } };
        const tick = async () => {
          if (!active) return;
          try { const codes = await detector.detect(video); if (codes.length) return found(codes[0].rawValue); } catch { /* keep trying */ }
          setTimeout(tick, 160);
        };
        tick();
      } else {
        await loadZXing();
        const reader = new window.ZXingBrowser.BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints({ video: { facingMode: 'environment' }, audio: false }, video, (result) => { if (result) found(result.getText()); });
        scanSession = { stop: () => controls.stop() };
      }
      if (!done) setScanStatus('Line the barcode up inside the frame');
    } catch (e) {
      stopScanner();
      setScanStatus(e && e.name === 'NotAllowedError' ? 'Camera access is blocked. Allow it in your browser settings, or scan from a photo.' : 'Could not start the camera. Type the barcode or scan from a photo.');
    }
  }
  function stopScanner() { if (scanSession) { try { scanSession.stop(); } catch { /* already stopped */ } scanSession = null; } }

  async function scanPhoto(file) {
    setScanStatus('Reading barcode...');
    const url = URL.createObjectURL(file);
    try {
      let code = null;
      const detector = await nativeDetector();
      if (detector) { try { const codes = await detector.detect(await createImageBitmap(file)); if (codes.length) code = codes[0].rawValue; } catch { /* fall through */ } }
      if (!code) { await loadZXing(); code = (await new window.ZXingBrowser.BrowserMultiFormatReader().decodeFromImageUrl(url)).getText(); }
      if (!L.validBarcode(code)) throw new Error('invalid');
      stopScanner();
      lookupBarcode(code);
    } catch { setScanStatus('No barcode found in that photo. Try a closer, sharper shot, or type the number.'); }
    finally { URL.revokeObjectURL(url); }
  }

  async function fetchOFF(code) {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${OFF_FIELDS}`);
    if (!r.ok && r.status !== 404) throw new Error('network');
    const j = await r.json();
    return j && j.status === 1 ? L.parseOFF(j.product, code) : null;
  }

  async function lookupBarcode(code) {
    const custom = S.data.customFoods[code];
    if (custom) { openFood(custom); return; }
    S.modal = { type: 'food', loading: true, barcode: code };
    render();
    try {
      let food = await fetchOFF(code);
      if (!food && code.length === 12) food = await fetchOFF('0' + code); // UPC-A stored as EAN-13
      if (S.modal && S.modal.barcode !== code) return;
      if (food) openFood(food);
      else { S.modal = { type: 'foodManual', barcode: code, notFound: true }; render(); }
    } catch {
      S.modal = { type: 'foodManual', barcode: code, offline: true };
      render();
    }
  }

  // Where a picked food goes: a meal in the diary (on the selected day) or the recipe being built.
  const diaryKey = () => S.diaryDate || todayKey();
  const foodTarget = () => S.foodTarget || { kind: 'log', slot: slotNow() };
  function openFood(food, amount, mode, editId) {
    const t = foodTarget();
    S.modal = { type: 'food', food, amount: amount || 1, mode: mode || 'servings', slot: t.slot || slotNow(), target: t.kind, editId: editId || null };
    render();
  }

  function foodLabel(food, amount, mode) {
    if (mode === 'grams') return `${amount} g`;
    const s = food.serving.label;
    return amount === 1 ? s : `${amount} x ${s}`;
  }

  const foodMacroTiles = (mac) => [[calU() === 'cal' ? 'Calories' : 'kcal', mac.kcal, ''], ['Protein', mac.protein, 'g'], ['Carbs', mac.carbs, 'g'], ['Fat', mac.fat, 'g']].map(([l, v, u]) => `<div class="stat" style="padding:10px"><div class="eyebrow" style="font-size:9px">${l}</div><div class="value" style="font-size:24px">${Math.round(v)}<small>${u}</small></div></div>`).join('');

  function rememberFood(f, amount, mode) {
    if (f.recipeId || f.serving.label === 'Quick add') return; // recipes have their own list; quick adds are one-offs
    const keyOf = (x) => x.food.barcode || x.food.name.toLowerCase();
    S.data.recentFoods = [{ food: f, amount, mode }].concat((S.data.recentFoods || []).filter((x) => keyOf(x) !== keyOf({ food: f }))).slice(0, 15);
  }

  function logFood() {
    const m = S.modal;
    const f = m.food;
    const mac = L.foodMacros(f, m.amount, m.mode);
    const item = { name: f.name, brand: f.brand || '', barcode: f.barcode || null, food: f, amount: m.amount, mode: m.mode, label: foodLabel(f, m.amount, m.mode), ...mac };
    rememberFood(f, m.amount, m.mode);
    if (m.target === 'recipe' && S.recipeDraft) {
      S.recipeDraft.ingredients.push({ id: uid(), ...item });
      S.modal = { type: 'recipe' };
      save(); render();
      return;
    }
    const k = diaryKey();
    const list = (S.data.foodLog[k] = S.data.foodLog[k] || []);
    if (m.editId) { const i = list.findIndex((x) => x.id === m.editId); if (i > -1) list[i] = { ...list[i], ...item, slot: m.slot }; }
    else list.push({ id: uid(), slot: m.slot, ...item, ts: Date.now() });
    S.modal = null;
    S.foodTarget = null;
    save();
    render();
    toast(m.editId ? 'Entry updated' : `Logged to ${SLOT_LABEL[m.slot]} · ${mac.kcal} ${calU()}, ${Math.round(mac.protein)} g protein`);
  }

  // Leaving any food screen returns to the recipe being built, otherwise closes.
  function closeFoodFlow() {
    stopScanner();
    if (S.foodTarget && S.foodTarget.kind === 'recipe' && S.recipeDraft) S.modal = { type: 'recipe' };
    else { S.modal = null; S.foodTarget = null; }
    render();
  }

  // A suggested meal as a loggable food (portion-scaled, macros estimated).
  function suggestionFood(meal, portion) {
    const r = (v) => Math.round(v * portion * 10) / 10;
    return { barcode: null, name: meal.name, brand: 'YOURS suggestion', image: null, custom: true, serving: { label: '1 portion', grams: null }, perServing: { kcal: Math.round(meal.kcal * portion), protein: r(meal.protein), carbs: r(meal.carbs), fat: r(meal.fat) }, per100: null, estimated: true };
  }

  async function searchFoods(q) {
    S.modal = { type: 'foodSearch', q, loading: true, results: [] };
    render();
    const ql = q.toLowerCase();
    const local = Object.values(S.data.recipes || {}).filter((r) => r.name.toLowerCase().includes(ql)).map(L.recipeFood)
      .concat(Object.values(S.data.customFoods).filter((f) => f.name.toLowerCase().includes(ql)));
    try {
      const r = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&fields=${OFF_FIELDS}`);
      const j = await r.json();
      const remote = (j.products || []).map((p) => L.parseOFF(p, p.code)).filter(Boolean);
      if (S.modal && S.modal.type === 'foodSearch' && S.modal.q === q) { S.modal.results = local.concat(remote); S.modal.loading = false; render(); }
    } catch {
      if (S.modal && S.modal.type === 'foodSearch') { S.modal.results = local; S.modal.loading = false; S.modal.error = true; render(); }
    }
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
    toastTimer = setTimeout(() => el.remove(), 2400);
  }

  // ---------- posters ----------
  function backdrop(kind) {
    const img = D.IMAGERY[kind];
    return img ? `<img class="poster-img" src="${esc(img)}" alt=""><div class="shade"></div>` : `<div class="art art-${kind}"></div><div class="shade"></div>`;
  }
  const poster = (kind, inner, cls) => `<div class="poster ${cls || ''}">${backdrop(kind)}${inner}</div>`;
  // Light studio poster tinted with a phase colour.
  const studio = (phase, inner, cls) => `<div class="poster light ${cls || ''}">${D.IMAGERY[phase] ? backdrop(phase) : `<div class="art art-studio"></div><div class="tint tint-${phase}"></div>`}${inner}</div>`;
  const corners = (tl, tr, bl, br) => `<div class="corners"><span class="tl">${tl || ''}</span><span class="tr">${tr || ''}</span><span class="bl">${bl || ''}</span><span class="br">${br || ''}</span></div>`;
  // Small badge with a caption running around it.
  function orbit(text, inner) {
    const id = 'o' + Math.random().toString(36).slice(2, 7);
    return `<div class="orbit"><svg class="ring-text" viewBox="0 0 100 100" aria-hidden="true"><defs><path id="${id}" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"/></defs><text font-family="DM Mono, monospace" font-size="9.6" letter-spacing="2.4" fill="currentColor"><textPath href="#${id}">${esc(text.toUpperCase())}</textPath></text></svg><div class="core">${inner}</div></div>`;
  }
  const copyFor = (phase) => D.PHASE_COPY[phase] || D.PHASE_COPY.steady;

  // ---------- views: welcome + auth ----------
  function viewWelcome() {
    return `<div class="welcome light">${D.IMAGERY.welcome ? backdrop('welcome') : '<div class="art art-studio"></div><div class="tint tint-ovulation" style="top:30%;right:-20%"></div><div class="tint tint-follicular" style="top:6%;left:-30%;right:auto;width:60%;opacity:.35"></div>'}
      <div class="p-row"><span>Health</span><span>Strength</span></div>
      <div class="hero">
        <p class="lead">Train with your cycle, not against it.</p>
        <div class="wordmark xl">yours.</div>
        <div class="script-sig">for your body</div>
      </div>
      <div class="stack">
        <button class="btn primary block" data-action="start">Get started</button>
        <button class="btn ghost block" data-action="go-login">I have an account</button>
        <button class="btn soft block" data-action="demo">Try the demo</button>
        <div class="p-row" style="margin-top:18px;opacity:.7"><span>Cycle</span><span>Vol. 01</span></div>
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
  function stepValid(step, p) {
    if (step === 0) return !!p.level;
    if (step === 1) return !!p.goal;
    if (step === 2) return ['none', 'menopause'].includes(p.cycleMode) || (!!p.periodStart && p.periodStart <= todayKey()) || (p.cycleMode === 'hormonal');
    if (step === 3) return p.heightCm >= 120 && p.heightCm <= 220 && p.weightKg >= 35 && p.weightKg <= 250 && p.age >= 14 && p.age <= 90;
    if (step === 4) return !!p.activity;
    return true;
  }

  function viewOnboarding() {
    const p = S.data.profile;
    const step = S.data.obStep || 0;
    const editing = S.data.editing;
    const opt = (field, o) => `<button type="button" class="option ${p[field] === o.id ? 'selected' : ''}" data-action="ob-pick" data-field="${field}" data-value="${o.id}"><strong>${esc(o.label)}</strong><span>${esc(o.desc)}</span></button>`;
    const steadyMode = L.STEADY_MODES.includes(p.cycleMode);
    let body = '';

    if (step === 0) {
      body = `<h1>What is your fitness level?</h1><p class="muted" style="margin:8px 0 24px">We use this to set your volume and progression.</p><div class="options">${LEVELS.map((o) => opt('level', o)).join('')}</div>`;
    } else if (step === 1) {
      body = `<h1>What is your main goal?</h1><p class="muted" style="margin:8px 0 24px">Your calories, protein and training are built around it.</p><div class="options">${GOALS.map((o) => opt('goal', o)).join('')}</div>`;
    } else if (step === 2) {
      body = `<h1>Your cycle</h1><p class="muted" style="margin:8px 0 20px">Which describes you best? Every body is supported.</p>
        <div class="chips">${D.CYCLE_MODES.map((m) => `<button type="button" class="chip ${p.cycleMode === m.id ? 'selected' : ''}" data-action="ob-pick" data-field="cycleMode" data-value="${m.id}">${esc(m.label)}</button>`).join('')}</div>
        <p class="small muted" style="margin-top:10px">${esc((D.CYCLE_MODES.find((m) => m.id === p.cycleMode) || {}).desc || '')}</p>
        ${p.cycleMode === 'menopause' ? '<div class="card soft" style="margin-top:20px"><p class="small">Your plan is built for this stage: heavy strength and impact work for bone density, balance, higher protein, and check-ins that track hot flashes, sleep and joint aches. Any bleeding after menopause should be checked by a doctor.</p></div>'
          : p.cycleMode === 'none' ? '<div class="card soft" style="margin-top:20px"><p class="small">Your plan will follow a steady weekly rhythm and your daily check-in instead of cycle phases.</p></div>'
          : `<label class="field" style="margin-top:22px"><span class="label">${p.cycleMode === 'hormonal' ? 'Start of your last bleed (optional)' : 'When did your last period start?'}</span><input class="input" type="date" data-bind="periodStart" value="${esc(p.periodStart || '')}" max="${todayKey()}"></label>
             <p class="tiny muted" style="margin-top:8px">${p.cycleMode === 'hormonal' ? 'Hormonal contraception keeps hormones fairly steady, so your plan follows your daily readiness rather than phases.' : 'The first day of bleeding. Your best guess is fine. YOURS learns your real cycle as you log periods.'}</p>`}`;
    } else if (step === 3) {
      const imp = p.units !== 'metric';
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
    } else if (step === 4) {
      body = `<h1>How active are you day to day?</h1><p class="muted" style="margin:8px 0 24px">Outside of your workouts.</p><div class="options">${ACTIVITY.map((o) => opt('activity', o)).join('')}</div>`;
    } else if (step === 5) {
      body = p.cycleMode === 'menopause'
        ? `<h1>Your rhythm</h1><p class="muted" style="margin:8px 0 24px">After menopause, muscle and bone respond best to heavy lifting, a little impact, and balance work. Your week is built around that, and adjusts each day to your check-in.</p>
           <div class="card soft"><div class="eyebrow">Your week</div><p style="margin-top:8px">Bone-building strength, walk, power and impact, mobility and balance, strength, then two easier days.</p></div>`
        : steadyMode
        ? `<h1>Your rhythm</h1><p class="muted" style="margin:8px 0 24px">Without a natural cycle to follow, YOURS plans a steady week of strength, conditioning and recovery, and adjusts each day to your check-in.</p>
           <div class="card soft"><div class="eyebrow">Your week</div><p style="margin-top:8px">Lower strength, upper strength, rest, glutes, upper sculpt, conditioning, rest.</p></div>`
        : `<h1>Cycle and period length</h1><p class="muted" style="margin:8px 0 28px">Most cycles are 21-35 days. Not sure? Leave it at 28. YOURS replaces this with your real average once you log a couple of periods.</p>
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
      <div class="ob-foot"><button class="btn primary block" data-action="ob-next" ${stepValid(step, p) ? '' : 'disabled'}>${step === OB_STEPS - 1 ? (editing ? 'Save changes' : 'Build my plan') : 'Continue'}</button></div>
    </div>`;
  }

  // ---------- plan reveal ----------
  function viewReveal() {
    const c = cyc();
    const ph = D.PHASES[c.phase];
    const t = tgt(c);
    const wk = todaysWorkout();
    return `<div class="screen no-nav">
      <div class="row between"><div class="wordmark sm">yours.</div><span class="eyebrow">${fmtDate(today(), { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
      <div class="paper" style="margin-top:20px">
        <div class="extra"><span>Extra!</span><span>Extra!</span><span>Extra!</span></div>
        <div class="rule"></div>
        <div class="headline">Your plan is ready</div>
        <div class="dek">The cycle-synced plan built for your body</div>
        <div class="center"><span class="stamp">Edition of one · ${fmtDate(today(), { month: 'short', day: 'numeric' })}</span></div>
        <div class="rule" style="height:3px"></div>
        <p class="lede">${c.steady ? 'Built around your week and your daily readiness, starting today.' : `You are on day ${c.day} of your cycle, in your ${ph.name.toLowerCase()} phase. ${esc(ph.training)}`}</p>
        <div class="cols">
          <div><div class="k">Phase</div><div class="v">${ph.name}</div></div>
          <div><div class="k">Today</div><div class="v" style="font-size:22px">${esc(wk.name)}</div></div>
          <div><div class="k">Protein</div><div class="v">${t.protein}<small>g</small></div></div>
          <div><div class="k">Calories</div><div class="v">${t.kcal.toLocaleString()}<small>${calU()}</small></div></div>
          <div><div class="k">Water</div><div class="v">${t.water}<small>L</small></div></div>
          <div><div class="k">Steps</div><div class="v">${t.steps.toLocaleString()}</div></div>
        </div>
        <div class="rule" style="height:3px;margin-top:12px"></div>
        <ul class="phase-list" style="--line:#1F1F1A33"><li>Learns your real cycle and energy patterns from 20-second daily check-ins</li><li>Suggests the exact weight for every lift, adjusted for your phase</li><li>Reviews your week every Sunday and adjusts next week's plan</li></ul>
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
  const statTile = (label, value, unitLabel) => `<div class="stat"><div class="eyebrow">${label}</div><div class="value">${value}<small>${unitLabel}</small></div></div>`;

  // ---------- rings ----------
  function phaseRing(c, size) {
    if (c.steady) return readinessRing(readinessToday(), size);
    const r = 42, circ = 2 * Math.PI * r, gap = 1.2;
    let offset = 0;
    const arcs = D.PHASE_ORDER.map((p) => {
      const [a, b] = c.ranges[p];
      const days = Math.max(0, b - a + 1);
      const len = (days / c.len) * circ;
      const seg = `<circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--${p})" stroke-width="${p === c.phase ? 9 : 5}" stroke-dasharray="${Math.max(0, len - gap)} ${circ}" stroke-dashoffset="${-offset}" opacity="${p === c.phase ? 1 : 0.35}"/>`;
      offset += len;
      return days ? seg : '';
    }).join('');
    const ang = ((Math.min(c.day, c.len) - 0.5) / c.len) * 2 * Math.PI - Math.PI / 2;
    const mx = 50 + r * Math.cos(ang), my = 50 + r * Math.sin(ang);
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="Cycle day ${c.day} of ${c.len}">
      <g transform="rotate(-90 50 50)">${arcs}</g>
      <circle cx="${mx}" cy="${my}" r="5.5" fill="var(--surface)" stroke="var(--text)" stroke-width="2"/>
      <text x="50" y="49" text-anchor="middle" font-size="22" font-weight="700" fill="var(--text)">${c.day}</text>
      <text x="50" y="63" text-anchor="middle" font-size="8.5" fill="var(--muted)" letter-spacing="1">${c.late ? 'LATE' : 'DAY'}</text>
    </svg>`;
  }
  function readinessRing(score, size) {
    const r = 42, circ = 2 * Math.PI * r;
    const pct = score == null ? 0 : score / 100;
    const color = score == null ? 'var(--line)' : score >= 75 ? 'var(--follicular)' : score >= 50 ? 'var(--accent)' : 'var(--menstrual)';
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="Readiness ${score == null ? 'not checked in' : score}">
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="8"/>
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${pct * circ} ${circ}" transform="rotate(-90 50 50)"/>
      <text x="50" y="50" text-anchor="middle" font-size="24" font-weight="700" fill="var(--text)">${score == null ? '-' : score}</text>
      <text x="50" y="64" text-anchor="middle" font-size="8" fill="var(--muted)" letter-spacing="1">READY</text>
    </svg>`;
  }

  // ---------- home ----------
  function header(title, sub, style) {
    const name = myName();
    const t = style === 'serif' ? `<div class="serif-tight" style="font-size:76px;margin-top:10px">${title}</div>`
      : style === 'caps' ? `<div class="stack-caps" style="font-size:44px;margin-top:10px">${title}</div>`
      : style ? `<div class="masthead" style="margin-top:8px">${title}</div>` : `<h1 class="serif" style="margin-top:6px">${title}</h1>`;
    return `<div class="top"><div class="grow"><div class="eyebrow">${esc(sub)}</div>${t}</div>
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

  function checkinDayBanner() {
    if (!L.weeklyDue(S.data)) return '';
    const onDay = today().getDay() === L.checkinDay(S.data);
    return `<div class="taped" style="margin:20px 6px 18px;transform:rotate(-.8deg)"><div class="eyebrow">${onDay ? `${WEEKDAYS[L.checkinDay(S.data)]} · weekly` : `Weekly check-in · your day is ${WEEKDAYS[L.checkinDay(S.data)]}`}</div>
      <div class="stack-caps" style="font-size:38px;margin-top:8px;color:#F7F2EA">${onDay ? "It's check-in day." : 'Time for your check-in.'}</div>
      <p class="small" style="margin-top:8px;opacity:.85">Photos, weigh-in and your weekly review. About 3 minutes, and your coach updates next week's plan.</p>
      <button class="btn sm" style="margin-top:14px;background:#F7F2EA;color:#1E2114" data-action="open-weekly">Start check-in</button></div>`;
  }

  function weighInCard() {
    if (S.data.weighDaily === false || S.data.checkins.some((c) => c.date === todayKey()) || (S.data.tips || {})['weigh-' + todayKey()]) return '';
    const avg = weekAvg(1);
    return `<form class="card" style="margin-top:12px" data-form="checkin"><div class="row between"><div class="serif" style="font-size:24px;line-height:1">Morning weigh-in</div><button type="button" class="icon-btn" style="width:30px;height:30px" data-action="dismiss-tip" data-tip="weigh-${todayKey()}" aria-label="Skip today">${icon('x', 14)}</button></div>
      <p class="small muted" style="margin-top:6px">After the bathroom, before food. Daily weigh-ins plus a weekly average tell the real story, so one high day is just water.${avg ? ` Last 7 days: ${bw(avg)}.` : ''}</p>
      <div class="row" style="margin-top:12px"><input class="input grow" type="number" step="0.1" inputmode="decimal" name="w" placeholder="Weight (${unit()})" required aria-label="Today's weight"><button class="btn primary sm" type="submit">Log</button></div></form>`;
  }

  function checkinCard() {
    const ci = S.data.daily[todayKey()];
    if (!ci) {
      return `<button class="card accent" style="width:100%;text-align:left;margin-top:12px" data-action="open-checkin">
        <div class="row" style="gap:14px">${orbit('Check in . Tune in . Show up . ', icon('check', 18, 2.4))}<div class="grow"><div class="serif" style="font-size:24px;line-height:1">Daily check-in</div><div class="small muted" style="margin-top:4px">20 seconds. Energy, sleep, mood and symptoms tune today's plan.</div></div></div></button>`;
    }
    const r = L.readiness(ci);
    return `<div class="card" style="margin-top:12px"><div class="row" style="gap:14px">${readinessRing(r, 64)}<div class="grow"><div class="eyebrow">Readiness</div><strong>${L.readinessLabel(r)}</strong><div class="small muted">${r >= 75 ? 'Green light. Push your main lifts.' : r >= 50 ? 'Train as planned. Listen to your body.' : 'Go lighter today. Movement still counts.'}</div></div><button class="link" data-action="open-checkin">Edit</button></div>
      ${(ci.symptoms || []).length ? `<div class="chips" style="margin-top:10px">${ci.symptoms.map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</div>` : ''}</div>`;
  }

  // Proactive suggestions: low readiness or a known low-energy day.
  function smartSuggestion(c, wk) {
    if (S.data.overrides[todayKey()] || loggedOn(todayKey()).length || wk.id === 'rest') return '';
    const hard = ['High', 'Very high'].includes(wk.intensity);
    const ready = readinessToday();
    const lighter = workoutById(lighterOption(c));
    if (ready != null && ready < 45 && wk.intensity !== 'Low' && wk.intensity !== 'Very low') {
      return `<div class="banner" style="margin-top:12px">${icon('trend', 20)}<div class="grow">Readiness is ${ready} today. I suggest <strong>${esc(lighter.name)}</strong> instead.</div><button class="btn accent xs" data-action="set-today" data-id="${lighter.id}">Swap</button></div>`;
    }
    if (!c.steady && hard && pats().dipDays.includes(c.day)) {
      return `<div class="banner" style="margin-top:12px">${icon('trend', 20)}<div class="grow">Your energy usually dips on day ${c.day}. Want <strong>${esc(lighter.name)}</strong> instead?</div><button class="btn accent xs" data-action="set-today" data-id="${lighter.id}">Swap</button></div>`;
    }
    return '';
  }

  function comingUp(c) {
    const items = [];
    if (!L.weeklyDue(S.data) && L.checkinTomorrow(S.data)) items.push(`<div class="list-item">${icon('camera', 20)}<div class="grow"><strong>Check-in tomorrow</strong><div class="small muted">Photos, weigh-in and your weekly review. Same spot and light as last time.</div></div></div>`);
    if (!c.steady) {
      if (c.late) items.push(`<button class="list-item" style="width:100%;text-align:left" data-action="log-period-today">${icon('calendar', 20)}<div class="grow"><strong>Period ${plural(c.daysLate, 'day')} later than predicted</strong><div class="small muted">Tap when it starts to keep predictions accurate</div></div></button>`);
      else if (c.daysToPeriod <= 3) items.push(`<div class="list-item">${icon('calendar', 20)}<div class="grow"><strong>Period expected in ${plural(c.daysToPeriod, 'day')}</strong><div class="small muted">Expect the scale to read higher. That is water, not fat.</div></div></div>`);
      else if (c.daysToNext <= 2) items.push(`<div class="list-item">${icon('calendar', 20)}<div class="grow"><strong>${phaseName(c.next)} starts ${c.daysToNext === 1 ? 'tomorrow' : `in ${c.daysToNext} days`}</strong><div class="small muted">${esc(D.PHASES[c.next].short)}. ${c.next === 'ovulation' ? 'PR day is planned.' : c.next === 'luteal' ? 'Calories go up about 150 a day.' : ''}</div></div></div>`);
    }
    if (!items.length) return '';
    return `<div class="section-title"><h2>Coming up</h2></div><div class="card">${items.join('')}</div>`;
  }

  function viewHome() {
    const c = cyc();
    const ph = D.PHASES[c.phase];
    const t = tgt(c);
    const wk = todaysWorkout();
    const done = loggedOn(todayKey()).length > 0;
    const steps = S.data.steps[todayKey()] || 0;
    const water = S.data.water[todayKey()] || 0;
    const protein = L.proteinFor(S.data, todayKey());
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const name = firstName(myName());
    const st = L.streak(S.data);
    return `<div class="screen">
      ${header(`${greet}${name ? `, ${esc(name)}` : ''}`, fmtDate(today()))}
      ${st.count >= 2 ? `<button class="tag accent" style="margin:-8px 0 16px;height:30px;gap:6px" data-action="share-streak">${icon('flame', 15)} ${st.count}-day streak${st.todayDone ? '' : ' · keep it alive today'}</button>` : ''}
      ${resumeBanner()}${guestBanner()}${checkinDayBanner()}
      ${studio(c.phase, `
        ${corners(c.phase === 'menopause' ? 'Life stage' : c.steady ? 'Steady mode' : `Day ${c.day} / ${c.len}${c.estimate ? ' · est.' : ''}`, c.steady ? 'Readiness' : c.late ? 'Period late' : `${esc(phaseName(c.next))} in ${plural(c.daysToNext, 'day')}`, '', '')}
        <div class="p-body">
          <div class="p-serif">${esc(copyFor(c.phase).serif)}</div>
          <div class="serif-tight ph-${c.phase}" style="font-size:${ph.name.length > 8 ? 84 : 104}px;margin:8px 0 4px -4px">${ph.name.toLowerCase()}</div>
          <div class="row between" style="margin-top:14px;align-items:flex-end"><div><span class="tag glass">${c.late ? 'Period late' : esc(ph.energy)}</span><div class="p-cap">${esc(copyFor(c.phase).cap)}</div></div>${phaseRing(c, 78)}</div>
        </div>`)}
      <div class="card" style="margin-top:12px">
        <div class="eyebrow">The science</div>
        <p class="small" style="margin-top:6px">${esc(ph.hormones)}</p>
        <ul class="phase-list">${ph.tips.map((tip) => `<li>${esc(tip)}</li>`).join('')}</ul>
        ${c.late ? '<button class="btn primary sm" style="margin-top:10px" data-action="log-period-today">My period started</button>' : ''}
      </div>
      ${checkinCard()}
      ${weighInCard()}
      ${smartSuggestion(c, wk)}

      <div class="section-title"><h2>Today's workout</h2><button class="link" data-action="tab" data-tab="workouts">See plan</button></div>
      ${poster('session', `
        <div class="p-row"><span>${esc(wk.focus)}</span><span>${wk.minutes} min · ${esc(wk.intensity)}</span></div>
        <div class="p-body">
          <div class="p-serif">${esc(wk.summary.split('.')[0])}.</div>
          <div class="p-title cream" style="margin-top:34px"><span class="over"><span class="script">today</span>${esc(wk.name)}</span></div>
          <div class="row" style="margin-top:18px">${done ? `<span class="btn cream sm" style="pointer-events:none">${icon('check', 16)} Completed</span>` : `<button class="btn cream sm" data-action="start-workout" data-id="${wk.id}">Start workout</button>`}<button class="btn outline sm" data-action="view-workout" data-id="${wk.id}">Details</button></div>
        </div>`, 'short')}

      <div class="section-title"><h2>Today's targets</h2><span class="small muted">${c.steady ? 'Steady plan' : `${ph.name} adjusted`}</span></div>
      <div class="stats">
        <div class="stat"><div class="row between"><div class="eyebrow">Protein</div><button class="icon-btn" style="width:30px;height:30px" data-action="log-protein" aria-label="Log protein">${icon('plus', 16)}</button></div>
          <div class="value">${protein}<small>/ ${t.protein} g</small></div><div class="meter"><div style="width:${clamp((protein / t.protein) * 100, 0, 100)}%"></div></div></div>
        <div class="stat"><div class="row between"><div class="eyebrow">Calories</div><button class="icon-btn" style="width:30px;height:30px" data-action="open-scanner" aria-label="Scan food barcode">${icon('barcode', 16)}</button></div><div class="value">${L.macrosFor(S.data, todayKey()).kcal.toLocaleString()}<small>/ ${t.kcal.toLocaleString()}</small></div><div class="meter green"><div style="width:${clamp((L.macrosFor(S.data, todayKey()).kcal / t.kcal) * 100, 0, 100)}%"></div></div></div>
        <div class="stat"><div class="row between"><div class="eyebrow">Water</div><button class="icon-btn" style="width:30px;height:30px" data-action="water" data-ml="250" aria-label="Add 250 ml">${icon('plus', 16)}</button></div>
          <div class="value">${(water / 1000).toFixed(1)}<small>/ ${t.water} L</small></div><div class="meter"><div style="width:${clamp((water / t.waterMl) * 100, 0, 100)}%"></div></div></div>
        <div class="stat"><div class="row between"><div class="eyebrow">Steps</div><button class="icon-btn" style="width:30px;height:30px" data-action="log-steps" aria-label="Log steps">${icon('plus', 16)}</button></div>
          <div class="value">${steps.toLocaleString()}<small>/ ${round(t.steps / 1000, 0.5)}k</small></div><div class="meter green"><div style="width:${clamp((steps / t.steps) * 100, 0, 100)}%"></div></div></div>
      </div>
      ${comingUp(c)}

      <div class="taped">
        <div class="row between"><div class="eyebrow">Coach note</div><div class="eyebrow" style="color:#EFEAE0;opacity:.6">${fmtDate(today(), { month: 'short', day: 'numeric' })}</div></div>
        <p class="serif" style="margin-top:10px">${esc(coachNote(c, t))}</p>
        <button class="link" style="margin-top:12px;font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase" data-action="tab" data-tab="advisor">Ask your coach</button>
      </div>
    </div>`;
  }

  function coachNote(c, t) {
    const pt = pats();
    const loads = todaysLoads();
    if (c.late) return `Your period is ${plural(c.daysLate, 'day')} later than I predicted. Cycles vary with stress, sleep and training. If it is more than a week late or this keeps happening, check in with a doctor.`;
    if (!c.steady && c.daysToPeriod <= 2) return `Your period is likely in ${plural(c.daysToPeriod, 'day')}. Keep training, keep steps steady, and expect the scale to read a little higher. That is water, not fat.`;
    if (loads.length && !loggedOn(todayKey()).length) { const l = loads[0]; return `Today's top lift: ${l.exercise} at ${fmtLoad(l.weight, l.unit)} for ${l.reps} reps. ${l.why}`; }
    if (pt.insights.length) return `From your check-ins: ${pt.insights[0]}`;
    if (c.phase === 'follicular') return 'Estrogen is rising, so this is your strength window. Try to beat last week\'s numbers on your main lifts by one rep or a small amount of weight.';
    if (c.phase === 'ovulation') return 'Peak-strength days. If a lift feels great, go for a rep PR, but warm up thoroughly and keep your knees tracking over your toes.';
    if (c.phase === 'menstrual') return 'Lower intensity is still progress. Walk, move and eat iron-rich food. You will come back stronger in a few days.';
    if (c.phase === 'menopause') return 'Lift heavy enough that the last two reps are hard. That signal is what keeps bone and muscle strong. Log hot flashes and sleep in your check-in and I will adjust around them.';
    if (c.steady) return 'Check in daily so I can match today\'s session to how you actually feel. Consistency is what wins here.';
    return `Your luteal phase needs about ${t.kcal.toLocaleString()} ${calWord()} today, including roughly 150 extra. Eat them on purpose with complex carbs and magnesium-rich foods.`;
  }

  // ---------- workouts ----------
  function loadHint(ex) {
    const s = L.suggestLoad(ex.name, ex.reps, S.data.workouts, { phase: cyc().phase, readiness: readinessToday(), unit: unit() });
    if (!s) return '';
    if (s.first) return '<div class="tiny" style="margin-top:4px;color:var(--accent)">First time: pick a weight with 2-3 reps left in the tank</div>';
    return `<div class="tiny" style="margin-top:4px"><strong style="color:var(--accent)">Today: ${fmtLoad(s.weight, s.unit)} x ${s.reps}</strong> <span class="muted">· last ${fmtLoad(s.last.weight, s.unit)} x ${s.last.reps}</span></div>`;
  }

  function exerciseList(wk, withLoads) {
    return `<ul class="ex-list">${wk.exercises.map((ex, i) => `<li><span class="ex-num">${i + 1}</span><div class="grow"><div class="row between"><strong>${esc(ex.name)}</strong><span class="small muted">${adjustSets(ex)} x ${esc(ex.reps)}</span></div><div class="small muted">${esc(ex.cue)}${ex.rest !== '-' ? ` · Rest ${esc(ex.rest)}` : ''}</div>${withLoads ? loadHint(ex) : ''}</div></li>`).join('')}</ul>`;
  }

  function viewWorkouts() {
    const c = cyc();
    const ph = D.PHASES[c.phase];
    const wk = todaysWorkout();
    const done = loggedOn(todayKey()).length > 0;
    const days = weekDays();
    const weekKeys = days.map(dateKey);
    const thisWeek = S.data.workouts.filter((w) => weekKeys.includes(w.date)).sort((a, b) => (a.date < b.date ? 1 : -1));
    const lib = S.libPhase || (c.phase === 'menopause' ? 'menopause' : c.steady ? 'follicular' : c.phase);
    const levelNote = { beginner: 'Sets are reduced for your level. Leave 2-3 reps in reserve.', intermediate: 'Leave 1-2 reps in reserve on main lifts.', advanced: 'Main lifts include an extra set for your level.' }[S.data.profile.level] || '';
    const vol = S.data.plan.volume;
    return `<div class="screen">
      ${header('Workouts', c.steady ? 'Steady plan' : `${ph.name} phase · day ${c.day}`, true)}
      ${resumeBanner()}
      <div class="week">${days.map((d) => { const k = dateKey(d); return `<div class="day ${k === todayKey() ? 'today' : ''} ${loggedOn(k).length ? 'done' : ''}"><div class="d">${d.toLocaleDateString(undefined, { weekday: 'narrow' })}</div><div class="n">${d.getDate()}</div><div class="mk"></div></div>`; }).join('')}</div>
      <p class="small muted" style="margin-top:10px">${plural(thisWeek.length, 'session')} logged this week</p>
      ${smartSuggestion(c, wk)}

      <div class="section-title"><h2>Recommended today</h2><span class="tag">${esc(wk.intensity)}</span></div>
      ${poster(wk.phase === 'any' ? 'steady' : wk.phase, `
        <div class="p-row"><span>${esc(wk.focus)}</span><span>${wk.minutes} min</span></div>
        <div class="p-body"><div class="p-serif">${esc(wk.summary.split('.')[0])}.</div><div class="p-title">${esc(wk.name)}</div><div class="p-cap">${esc(copyFor(c.phase).cap)}</div></div>`, 'short')}
      <div class="card" style="margin-top:12px">
        <div class="why" style="margin-top:0">${esc(ph.training)}</div>
        ${exerciseList(wk, true)}
        <p class="tiny muted" style="margin-top:8px">${levelNote}${vol ? ` Your weekly check-in ${vol > 0 ? 'added' : 'removed'} a set on main lifts.` : ''} Suggested weights adjust for your phase and readiness.</p>
        <div class="row" style="margin-top:14px">
          ${done ? `<span class="btn soft block" style="pointer-events:none">${icon('check', 18)} Completed today</span>` : `<button class="btn primary grow" data-action="start-workout" data-id="${wk.id}">Start workout</button>`}
          <button class="btn ghost" data-action="swap-today" aria-label="Choose another workout">${icon('swap', 18)}</button>
        </div>
      </div>

      <div class="section-title"><h2>This week</h2><button class="link" data-action="log-other">Log activity</button></div>
      <div class="card">${thisWeek.length ? thisWeek.map((w) => `<div class="list-item"><div class="ex-num">${icon('check', 14, 2.4)}</div><div class="grow"><strong>${esc(w.name)}</strong><div class="small muted">${fmtDate(parseKey(w.date), { weekday: 'short', month: 'short', day: 'numeric' })} · ${w.minutes} min${w.sets ? ` · ${w.sets} sets` : ''}</div></div>${(S.data.prs || []).some((p) => p.workoutId === w.id) ? '<span class="tag accent">PR</span>' : ''}</div>`).join('') : '<div class="empty">No sessions logged yet this week. Today is a great day to start.</div>'}</div>

      <div class="section-title"><h2>Workout library</h2></div>
      <div class="chips">${D.PHASE_ORDER.concat(['menopause']).map((p) => `<button class="chip ${lib === p ? 'selected' : ''}" data-action="lib-phase" data-phase="${p}"><span class="dot" style="background:var(--${p})"></span>${phaseName(p)}</button>`).join('')}</div>
      <div class="h-scroll" style="margin-top:14px">${D.WORKOUTS.filter((w) => w.phase === lib).map((w) => `<button class="poster mini" data-action="view-workout" data-id="${w.id}">${backdrop(lib)}<div class="p-row"><span>${w.minutes} min</span><span>${esc(w.intensity)}</span></div><div class="p-body"><div class="p-title">${esc(w.name)}</div><div class="p-cap" style="letter-spacing:.2em">${esc(w.focus)}</div></div></button>`).join('')}</div>
    </div>`;
  }

  function startWorkout(id) {
    const wk = workoutById(id);
    const c = cyc();
    const u = unit();
    S.data.activeWorkout = {
      templateId: id, name: wk.name, startedAt: Date.now(), unit: u, phase: c.phase,
      exercises: wk.exercises.map((ex) => {
        const s = L.suggestLoad(ex.name, ex.reps, S.data.workouts, { phase: c.phase, readiness: readinessToday(), unit: u });
        const weighted = !!L.parseReps(ex.reps);
        return { name: ex.name, reps: ex.reps, weighted, suggestion: s && !s.first ? s : null, sets: Array.from({ length: adjustSets(ex) }, () => ({ weight: s && !s.first ? String(s.weight) : '', reps: '', target: s ? s.reps : '', done: false })) };
      }),
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
        ${ex.suggestion ? `<div class="why" style="margin-top:8px"><strong>${fmtLoad(ex.suggestion.weight, ex.suggestion.unit)} x ${ex.suggestion.reps}</strong> · ${esc(ex.suggestion.reason)}</div>` : ''}
        <div class="set-row tiny muted" style="margin-top:10px"><span>Set</span><span class="center">${ex.weighted ? a.unit : '-'}</span><span class="center">Reps</span><span></span></div>
        ${ex.sets.map((s, si) => `<div class="set-row"><span class="ex-num">${si + 1}</span><input class="input" type="number" inputmode="decimal" placeholder="-" value="${esc(s.weight)}" data-set="${ei}.${si}.weight" aria-label="Weight set ${si + 1}"><input class="input" type="number" inputmode="numeric" placeholder="${esc(s.target || '-')}" value="${esc(s.reps)}" data-set="${ei}.${si}.reps" aria-label="Reps set ${si + 1}"><button class="check ${s.done ? 'on' : ''}" data-action="toggle-set" data-ei="${ei}" data-si="${si}" aria-label="Mark set done">${icon('check', 18, 2.4)}</button></div>`).join('')}
      </div>`).join('')}
      <button class="btn primary block" style="margin-top:20px" data-action="finish-workout" ${doneSets ? '' : 'disabled'}>Finish workout</button>
    </div></div>`;
  }

  function finishWorkout() {
    const a = S.data.activeWorkout;
    const sets = a.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
    const minutes = clamp(Math.round((Date.now() - a.startedAt) / 60000), 5, 240);
    const record = {
      id: uid(), date: todayKey(), templateId: a.templateId, name: a.name, minutes, sets, unit: a.unit, phase: a.phase,
      detail: a.exercises.map((e) => ({ name: e.name, sets: e.sets.filter((s) => s.done).map((s) => ({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 0 })) })).filter((e) => e.sets.length),
    };
    const prs = L.detectPRs(record, S.data.workouts).map((p) => ({ ...p, date: record.date, workoutId: record.id, phase: record.phase }));
    const volume = record.detail.reduce((n, e) => n + e.sets.reduce((m, s) => m + s.weight * s.reps, 0), 0);
    S.data.workouts.push(record);
    S.data.prs.push(...prs);
    S.data.activeWorkout = null;
    save();
    S.modal = { type: 'summary', record, prs, volume };
    render();
  }

  // ---------- meals ----------
  const SLOT_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };
  const slotNow = () => { const h = new Date().getHours(); return h < 11 ? 'breakfast' : h < 15 ? 'lunch' : h < 21 ? 'dinner' : 'snack'; };

  function diaryDateLabel() {
    const d = parseKey(diaryKey());
    const diff = daysBetween(d, today());
    return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : fmtDate(d, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function entryRow(f) {
    return `<div class="list-item" style="padding:10px 0"><button class="grow" style="text-align:left" data-action="food-edit" data-id="${f.id}" aria-label="Edit ${esc(f.name)}"><strong class="small">${esc(f.name)}</strong><div class="tiny muted">${esc(f.label)}${f.brand ? ` · ${esc(f.brand)}` : ''}</div></button><div class="tiny" style="font-family:var(--mono);text-align:right">${f.kcal} ${calU()}<br>${Math.round(f.protein)} g P</div><button class="icon-btn" style="width:30px;height:30px" data-action="food-del" data-id="${f.id}" aria-label="Remove ${esc(f.name)}">${icon('x', 14)}</button></div>`;
  }

  function viewMeals() {
    const c = cyc();
    const ph = D.PHASES[c.phase];
    const k = diaryKey();
    const t = tgt(cyc(parseKey(k)));
    const m = L.macrosFor(S.data, k);
    const log = S.data.foodLog[k] || [];
    const remaining = t.kcal - m.kcal;
    const isToday = k === todayKey();
    const line = (label, v, target, color) => `<div style="margin-top:10px"><div class="row between"><span class="eyebrow" style="color:var(--text)">${label}</span><span class="tiny" style="font-family:var(--mono)">${v} / ${target} g</span></div><div class="meter" style="margin-top:6px"><div style="width:${clamp((v / target) * 100, 0, 100)}%;background:${color}"></div></div></div>`;
    const slots = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snack', 'Snacks']];
    const picks = slots.map(([sl]) => L.mealFor(S.data, today(), sl));
    const totalK = picks.reduce((n, x) => n + x.meal.kcal, 0);
    const portion = clamp(Math.round((tgt(c).kcal / totalK) * 10) / 10, 0.7, 1.6);
    const scaleTip = !(S.data.tips || {}).scale;
    return `<div class="screen">
      ${header('the food diary', `${ph.name} ${c.steady ? 'plan' : 'phase'}`, 'serif')}
      <div class="row between" style="margin:-6px 0 14px"><button class="icon-btn" data-action="diary-day" data-d="-1" aria-label="Previous day">${icon('back', 18)}</button><div class="eyebrow" style="color:var(--text)">${esc(diaryDateLabel())}</div><button class="icon-btn" data-action="diary-day" data-d="1" aria-label="Next day" ${isToday ? 'disabled style="opacity:.3"' : ''}><span style="transform:rotate(180deg);display:inline-flex">${icon('back', 18)}</span></button></div>
      <div class="card">
        <div class="eyebrow">${remaining >= 0 ? 'Remaining' : 'Over'}</div>
        <div class="big-number" style="font-size:56px;margin-top:6px">${Math.abs(remaining).toLocaleString()}<span class="eyebrow" style="font-size:11px;margin-left:6px">${calU()}</span></div>
        <div class="tiny" style="font-family:var(--mono);letter-spacing:.06em;margin-top:6px">${t.kcal.toLocaleString()} goal − ${m.kcal.toLocaleString()} food = ${remaining.toLocaleString()}</div>
        ${line('Protein', m.protein, t.protein, 'var(--accent)')}${line('Carbs', m.carbs, t.carbs, 'var(--follicular)')}${line('Fat', m.fat, t.fat, 'var(--luteal)')}
        <div class="row" style="margin-top:16px"><button class="btn primary grow" data-action="open-scanner">${icon('barcode', 18)} Scan</button><button class="btn ghost" data-action="open-food-search" aria-label="Search foods">${icon('search', 18)}</button><button class="btn ghost" data-action="open-recipes" aria-label="My recipes">${icon('list', 18)}</button><button class="btn ghost" data-action="open-quick-add" aria-label="Quick add calories">${icon('plus', 18)}</button></div>
      </div>
      ${scaleTip ? `<div class="banner" style="margin-top:12px;background:var(--green-soft)">${icon('trend', 20)}<div class="grow"><strong>Tip: a food scale.</strong> Not required, but weighing food, especially ingredients for recipes, gives the most accurate numbers.</div><button class="icon-btn" style="width:30px;height:30px" data-action="dismiss-tip" data-tip="scale" aria-label="Dismiss tip">${icon('x', 14)}</button></div>` : ''}
      ${slots.map(([sl, label]) => { const items = log.filter((f) => (f.slot === 'snack' ? 'snack' : f.slot) === sl); const sum = items.reduce((n, f) => n + f.kcal, 0); return `
        <div class="section-title"><div class="slot">${label}</div><span>${sum ? `${sum.toLocaleString()} ${calU()}` : ''}</span></div>
        <div class="card" style="padding-top:${items.length ? 8 : 14}px">${items.map(entryRow).join('')}
          <button class="link row" style="gap:6px;margin-top:${items.length ? 10 : 0}px;font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase" data-action="add-food" data-slot="${sl}">${icon('plus', 15)} Add food</button></div>`; }).join('')}

      <div class="section-title" style="margin-top:44px"><div class="serif-tight" style="font-size:44px">ideas for your phase</div></div>
      <p class="small muted">Suggestions only. Eat what works for you and log it. These fit your ${ph.name.toLowerCase()} ${c.steady ? 'plan' : 'phase'}: ${esc(ph.nutrition.charAt(0).toLowerCase() + ph.nutrition.slice(1))}</p>
      <div class="h-scroll" style="margin-top:14px">${picks.map(({ meal, count }, i) => { const sl = slots[i][0]; return `<div class="card meal" style="margin:0">
        <div class="row between"><span class="eyebrow">${slots[i][1]}</span>${count > 1 ? `<button class="link" style="font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase" data-action="swap-meal" data-slot="${sl}">Swap</button>` : ''}</div>
        <h3 style="font-size:22px">${esc(meal.name)}</h3><p class="tiny muted">${esc(meal.desc)}</p>
        <div class="macro"><span><strong>${Math.round(meal.protein * portion)} g</strong> P</span><span><strong>${Math.round(meal.kcal * portion)}</strong> ${calU()}</span></div>
        <p class="tiny" style="margin-top:4px">${esc(meal.why)}</p>
        <button class="btn ghost sm" style="margin-top:8px;align-self:flex-start" data-action="log-suggestion" data-slot="${sl}" data-i="${i}">Log this</button></div>`; }).join('')}</div>
      <button class="btn ghost block" style="margin-top:12px" data-action="open-grocery">${icon('list', 18)} Grocery list for these ideas</button>
      <p class="tiny muted center" style="margin-top:16px">Ideas skip: ${esc((S.data.profile.avoid || []).join(', ') || 'nothing')}. Edit in your profile.</p>
    </div>`;
  }

  // ---------- advisor ----------
  const PROMPTS = ['What weight should I lift today?', 'I have cramps', 'Help with cravings', 'How was my week?', 'I feel tired', 'Grow my glutes', 'How much protein?'];

  function viewAdvisor() {
    const c = cyc();
    const v = S.advisorView;
    return `<div class="screen" ${v === 'coach' ? 'style="padding-bottom:calc(var(--nav-h) + 110px)"' : ''}>
      ${header('Advisor', S.ai ? 'AI coach · live' : 'Coach · on-device', true)}
      <div class="segment" style="margin-bottom:20px">${[['coach', 'Coach'], ['insights', 'Insights'], ['progress', 'Progress']].map(([id, label]) => `<button class="${v === id ? 'active' : ''}" data-action="advisor-view" data-value="${id}">${label}</button>`).join('')}</div>
      ${v === 'coach' ? viewChat(c) : v === 'insights' ? viewInsights(c) : viewProgress()}
    </div>`;
  }

  function viewChat(c) {
    const name = firstName(myName());
    const intro = `${name ? `Hi ${name}. ` : 'Hi. '}I am your YOURS coach. ${phaseLine(c)}. Ask me anything about training, weights, food, steps or recovery and I will adapt it to you.${S.ai ? '' : '\n\nI am running on this device right now. Connect the live AI coach for open-ended conversation and photo reviews.'}`;
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

  // ---------- insights ----------
  function bar(label, value, max, color, right) {
    return `<div style="margin-top:10px"><div class="row between small"><span>${label}</span><strong>${right}</strong></div><div class="meter" style="height:8px"><div style="width:${clamp((value / max) * 100, 2, 100)}%;background:${color}"></div></div></div>`;
  }

  function viewInsights(c) {
    const d = S.data;
    const learned = L.learnCycle(d.periods);
    const pt = pats();
    const sbp = L.strengthByPhase(d.workouts);
    const st = L.streak(d);
    const due = L.weeklyDue(d);
    const last = d.reviews[d.reviews.length - 1];
    const plan = d.plan;
    const planBits = [];
    if (plan.volume) planBits.push(`Main lifts ${plan.volume > 0 ? '+1 set' : '-1 set'}`);
    if (plan.stepBonus) planBits.push(`Steps ${plan.stepBonus > 0 ? '+' : ''}${plan.stepBonus.toLocaleString()}`);
    if (plan.kcalAdjust) planBits.push(`Calories ${plan.kcalAdjust > 0 ? '+' : ''}${plan.kcalAdjust}`);
    const days14 = Array.from({ length: 14 }, (_, i) => addDays(today(), i - 13));
    const checkCount = Object.keys(d.daily).length;
    const nextPeriod = !c.steady && d.profile.periodStart ? addDays(parseKey(d.profile.periodStart), c.len) : null;

    return `
      <div class="card ${due ? 'accent' : ''}">
        <div class="row between"><div class="eyebrow">Weekly check-in</div>${last ? `<span class="tiny muted">Last: ${shortDate(last.date)}</span>` : ''}</div>
        ${due ? `<div class="stack-caps" style="font-size:38px;margin-top:10px">${today().getDay() === L.checkinDay(d) ? 'It\'s check-in day.' : 'Time for your check-in.'}</div>` : `<h2 style="margin-top:6px">${last ? 'Plan updated' : 'Every Sunday'}</h2>`}
        <p class="small muted" style="margin-top:4px">${due ? 'Photos, weigh-in and three quick questions. Then I review it all and adjust next week\'s training, steps and calories.' : last ? esc(last.text.split('\n')[0]).slice(0, 180) : 'I review your sessions, steps, readiness and weight trend and adjust next week\'s plan.'}</p>
        ${planBits.length ? `<div class="chips" style="margin-top:10px">${planBits.map((b) => `<span class="tag">${esc(b)}</span>`).join('')}</div>` : ''}
        <div class="row wrap" style="margin-top:12px;gap:6px"><span class="eyebrow" style="margin-right:4px">Your day</span>${WEEKDAYS.map((w, i) => `<button class="chip ${L.checkinDay(d) === i ? 'selected' : ''}" style="height:30px;padding:0 10px;font-size:12px" data-action="set-checkin-day" data-value="${i}">${w.slice(0, 3)}</button>`).join('')}</div>
        <button class="btn ${due ? 'primary' : 'ghost'} sm" style="margin-top:14px" data-action="open-weekly">${due ? 'Start check-in' : 'Check in now'}</button>
      </div>

      <div class="section-title"><h2>Readiness</h2><button class="link" data-action="open-checkin">${d.daily[todayKey()] ? 'Edit today' : 'Check in'}</button></div>
      <div class="card">
        <div style="display:grid;grid-template-columns:repeat(14,1fr);gap:4px;align-items:end;height:80px">${days14.map((day) => { const r = L.readiness(d.daily[dateKey(day)]); return `<div title="${shortDate(dateKey(day))}: ${r == null ? 'no check-in' : r}" style="height:${r == null ? 4 : Math.max(6, r * 0.8)}px;border-radius:4px;background:${r == null ? 'var(--surface-2)' : r >= 75 ? 'var(--follicular)' : r >= 50 ? 'var(--accent)' : 'var(--menstrual)'}"></div>`; }).join('')}</div>
        <div class="row between tiny muted" style="margin-top:6px"><span>${shortDate(dateKey(days14[0]))}</span><span>Today</span></div>
      </div>

      ${c.steady ? '' : `<div class="section-title"><h2>Your cycle</h2><button class="link" data-action="open-period">Log period</button></div>
      <div class="card">
        ${learned ? `<div class="row" style="gap:16px"><div class="big-number" style="font-size:44px">${learned.length}</div><div class="grow"><strong>day average cycle</strong><div class="small muted">Learned from ${plural(learned.samples, 'cycle')} · range ${learned.min}-${learned.max} days · ${learned.regular ? 'regular' : 'variable'}</div></div></div>`
          : `<p class="small">Log your next period start and YOURS will start learning your real cycle length. Until then, predictions use ${d.profile.cycleLength} days.</p>`}
        ${nextPeriod ? `<div class="divider"></div><div class="row between small"><span class="muted">Next period predicted</span><strong>${c.late ? `${plural(c.daysLate, 'day')} late` : fmtDate(nextPeriod, { weekday: 'short', month: 'short', day: 'numeric' })}</strong></div>` : ''}
        ${d.periods.length ? `<div class="row between small" style="margin-top:6px"><span class="muted">Logged periods</span><span>${d.periods.slice(-4).reverse().map(shortDate).join(', ')}</span></div>` : ''}
      </div>`}

      <div class="section-title"><h2>Your patterns</h2></div>
      <div class="card">${pt.insights.concat(L.MENO_MODES.includes(d.profile.cycleMode) ? L.menoInsights(d.daily) : []).length ? `<ul class="phase-list" style="margin-top:0">${pt.insights.concat(L.MENO_MODES.includes(d.profile.cycleMode) ? L.menoInsights(d.daily) : []).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`
        : `<p class="small">Check in daily and YOURS will spot your patterns: when your energy dips, when cramps or cravings show up, and how it changes across your cycle.</p><div class="meter" style="margin-top:12px"><div style="width:${clamp((checkCount / 14) * 100, 4, 100)}%"></div></div><p class="tiny muted" style="margin-top:6px">${checkCount} of 14 check-ins to unlock your first patterns</p>`}</div>

      <div class="section-title"><h2>Strength by phase</h2>${sbp ? `<button class="link" data-action="share-strength">Share</button>` : ''}</div>
      <div class="card">${sbp ? `<p><strong>You lift about ${Math.round(sbp.diff)}% more in your ${phaseName(sbp.best).toLowerCase()} phase than your ${phaseName(sbp.low).toLowerCase()} phase.</strong></p>
          ${D.PHASE_ORDER.filter((p) => sbp.byPhase[p]).map((p) => bar(phaseName(p), 100 + sbp.byPhase[p].pct, 100 + Math.max(...Object.values(sbp.byPhase).map((x) => x.pct)), `var(--${p})`, `${sbp.byPhase[p].pct >= 0 ? '+' : ''}${sbp.byPhase[p].pct.toFixed(1)}%`)).join('')}
          <p class="tiny muted" style="margin-top:10px">Estimated strength relative to your average on the same lifts. Includes the lighter loads your plan schedules in some phases.</p>`
        : '<p class="small">Log weights on your main lifts across a full cycle and YOURS will show where your strength peaks, so you can plan your heaviest work there.</p>'}</div>

      <div class="section-title"><h2>Streak</h2>${st.count >= 2 ? '<button class="link" data-action="share-streak">Share</button>' : ''}</div>
      <div class="card row" style="gap:14px"><div class="avatar alt">${icon('flame', 20)}</div><div class="grow"><strong>${plural(st.count, 'day')}</strong><div class="small muted">Training, a check-in, or 60% of your steps all count. One missed day a week is forgiven, because rest is part of the plan.</div></div></div>
      ${d.prs.length ? `<div class="section-title"><h2>Personal records</h2></div><div class="card">${d.prs.slice(-5).reverse().map((p) => `<div class="list-item"><div class="grow"><strong>${esc(p.name)}</strong><div class="small muted">${shortDate(p.date)}</div></div><strong>${fmtLoad(p.weight, p.unit)} x ${p.reps}</strong><button class="icon-btn" style="width:32px;height:32px" data-action="share-pr" data-date="${p.date}" data-name="${esc(p.name)}" aria-label="Share">${icon('share', 15)}</button></div>`).join('')}</div>` : ''}`;
  }

  // ---------- progress ----------
  function viewProgress() {
    if (isGuest()) {
      return `<div class="card lock">${icon('lock', 32)}<h2 style="margin-top:14px">Progress photos need an account</h2><p class="muted small" style="margin:8px 0 18px">Photos are private, stored only on this device and encrypted with your PIN. Create a free account to start your photo vault.</p><button class="btn primary" data-action="open-signup" data-reason="progress">Create account</button></div>`;
    }
    if (S.data.pinHash && !S.vaultUnlocked) {
      return `<form class="card lock" data-form="unlock">${icon('lock', 32)}<h2 style="margin-top:14px">Photo vault locked</h2><p class="muted small" style="margin:8px 0 18px">Enter your 4-digit PIN.</p>
        <input class="input pin-input" name="pin" type="password" inputmode="numeric" maxlength="6" pattern="[0-9]{4,6}" autocomplete="off" required>
        ${S.authError ? `<p class="error" style="margin-top:10px">${esc(S.authError)}</p>` : ''}
        <button class="btn primary" style="margin-top:16px" type="submit">Unlock</button></form>`;
    }
    const p = S.data.profile;
    const ws = S.data.checkins.slice(-12);
    const review = S.data.lastReview;
    const verdictLabel = { on_track: 'On track', progressing: 'Making progress', adjust: 'Needs adjustment' };
    const encrypted = !!S.photoKey;
    return `
      <div class="banner" style="background:var(--green-soft)">${icon('shield', 20)}<div class="grow">${encrypted ? 'Photos are encrypted with your PIN and' : 'Photos'} stay on this device. They are only sent to your coach when you tap Analyze, and are not stored anywhere else.${encrypted ? '' : ' Set a PIN to encrypt them.'}</div></div>
      <div class="row" style="gap:10px">
        <label class="btn primary grow" style="cursor:pointer">${icon('camera', 18)} Add photo<input type="file" accept="image/*" data-upload hidden></label>
        <select class="select" style="width:auto;height:50px" data-bind-ui="pose" aria-label="Pose">${['front', 'side', 'back'].map((x) => `<option value="${x}" ${S.pose === x ? 'selected' : ''}>${x[0].toUpperCase() + x.slice(1)}</option>`).join('')}</select>
      </div>
      <p class="tiny muted" style="margin-top:8px">For fair comparisons: same light, same outfit, same time of day, and ideally the same cycle phase${cyc().steady ? '' : ` (you are in ${phaseName(cyc().phase).toLowerCase()} now)`}.</p>

      <div class="section-title"><h2>Photo vault</h2><span class="small muted">${plural(S.photos.length, 'photo')}</span></div>
      ${S.photos.length ? `<p class="small muted" style="margin:-4px 0 10px">Tap to reveal. Select up to 4 to analyze or compare.</p>
        <div class="photo-grid">${S.photos.map((ph) => { const sel = S.compare.indexOf(ph.id); return `<div class="photo ${S.revealed[ph.id] ? '' : 'blur'} ${sel > -1 ? 'selected' : ''}">
          <button style="display:block;width:100%;height:100%" data-action="photo-tap" data-id="${ph.id}" aria-label="${S.revealed[ph.id] ? 'Select photo' : 'Reveal photo'}"><img src="${ph.data}" alt="${esc(ph.pose)} progress photo from ${esc(ph.date)}"></button>
          ${sel > -1 ? `<span class="sel">${sel + 1}</span>` : ''}
          <div class="meta">${esc(ph.pose)} · ${shortDate(ph.date)}${ph.phase && ph.phase !== 'steady' ? ` · ${esc(phaseName(ph.phase))}` : ''}</div></div>`; }).join('')}</div>
        <div class="row" style="margin-top:12px"><button class="btn accent grow" data-action="analyze" ${S.analyzing ? 'disabled' : ''}>${S.analyzing ? 'Analyzing...' : S.compare.length ? `Analyze ${plural(S.compare.length, 'photo')}` : 'Analyze my data'}</button>${S.compare.length ? `<button class="btn ghost" data-action="delete-photos" aria-label="Delete selected">${icon('trash', 18)}</button>` : ''}</div>`
        : `<div class="card empty">Take your first photos front, side and back. Retake every 2-4 weeks in the same cycle phase.</div>
           <button class="btn accent block" style="margin-top:12px" data-action="analyze" ${S.analyzing ? 'disabled' : ''}>${S.analyzing ? 'Analyzing...' : 'Analyze my data'}</button>`}
      ${S.compare.length === 2 ? compareView() : ''}

      ${review ? `<div class="card" style="margin-top:16px"><div class="row between"><span class="verdict ${review.verdict}">${verdictLabel[review.verdict] || 'Review'}</span><span class="tiny muted">${shortDate(review.date)}</span></div>
        <div class="rich small" style="margin-top:12px">${rich(review.text)}</div>
        ${review.local ? `<p class="tiny muted" style="margin-top:10px">Based on your logged data. ${S.ai ? '' : 'Visual photo review needs the live AI coach.'}</p>` : ''}</div>` : ''}

      ${checkinHistory()}
      <div class="section-title"><h2>Weight check-ins</h2>${weekAvg(0) ? `<span>7-day avg ${bw(weekAvg(0))}${weekAvg(7) ? ` · ${(() => { const dlt = (weekAvg(0) - weekAvg(7)) * (unit() === 'lb' ? 2.20462 : 1); return `${dlt > 0 ? '+' : ''}${dlt.toFixed(1)}`; })()}` : ''}</span>` : ''}</div>
      <div class="card">
        ${ws.length > 1 ? sparkline(ws.map((w) => w.kg)) : ''}
        <form class="row" data-form="checkin" style="margin-top:${ws.length > 1 ? 12 : 0}px"><input class="input grow" type="number" step="0.1" inputmode="decimal" name="w" placeholder="Today's weight (${unit()})" required><button class="btn primary sm" type="submit">Log</button></form>
        ${ws.slice(-4).reverse().map((w) => `<div class="list-item"><div class="grow small">${fmtDate(parseKey(w.date), { weekday: 'short', month: 'short', day: 'numeric' })}</div><strong>${bw(w.kg)}</strong></div>`).join('')}
        <p class="tiny muted" style="margin-top:8px">Weigh in at the same time of day. Compare across the same cycle phase.</p>
      </div>
      <div class="row" style="margin-top:16px"><button class="btn ghost sm grow" data-action="pin-settings">${icon('lock', 16)} ${S.data.pinHash ? 'Change or remove PIN' : 'Set a PIN and encrypt photos'}</button>${S.data.pinHash ? '<button class="btn ghost sm" data-action="lock-vault">Lock</button>' : ''}</div>`;
  }

  function checkinHistory() {
    const list = S.data.reviews.filter((r) => r.photos && Object.keys(r.photos).length).slice(-6).reverse();
    if (!list.length) return '';
    return `<div class="section-title"><h2>Check-ins</h2><span>${plural(list.length, 'week')}</span></div>
      <div class="card">${list.map((r) => `<div style="padding:10px 0;border-bottom:1px solid var(--line)"><div class="row between"><strong class="small">${fmtDate(parseKey(r.date), { month: 'short', day: 'numeric' })}</strong><span class="tiny muted">${r.weightAvg ? `7-day avg ${bw(r.weightAvg)}` : ''}</span></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px">${['front', 'side', 'back'].map((p) => r.photos[p] ? blurThumb(r.photos[p], p) : '<div></div>').join('')}</div>
        ${r.text ? `<p class="tiny muted" style="margin-top:8px">${esc(r.text.split('\n')[0]).slice(0, 160)}</p>` : ''}</div>`).join('')}</div>`;
  }

  function compareView() {
    const [a, b] = S.compare.map((id) => S.photos.find((p) => p.id === id));
    if (!a || !b) return '';
    const [older, newer] = a.date <= b.date ? [a, b] : [b, a];
    return `<div class="card" style="margin-top:12px"><div class="eyebrow">Side by side</div><div class="row" style="margin-top:10px;align-items:flex-start">
      ${[older, newer].map((p) => `<div class="grow"><div class="photo" style="border:none"><img src="${p.data}" alt="${esc(p.pose)} photo from ${esc(p.date)}"></div><div class="tiny muted center" style="margin-top:6px">${fmtDate(parseKey(p.date), { month: 'short', day: 'numeric', year: 'numeric' })}</div></div>`).join('')}
    </div><p class="small muted center" style="margin-top:8px">${plural(daysBetween(parseKey(older.date), parseKey(newer.date)), 'day')} apart</p></div>`;
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
      ${header('Your<br>people.', 'Community · wins and support', 'caps')}
      <div class="segment" style="margin-bottom:20px"><button class="${S.communityView === 'feed' ? 'active' : ''}" data-action="community-view" data-value="feed">Feed</button><button class="${S.communityView === 'messages' ? 'active' : ''}" data-action="community-view" data-value="messages">Messages</button></div>
      ${S.communityView === 'feed' ? viewFeed() : S.openThread ? viewThread() : viewThreads()}
    </div>`;
  }

  function viewFeed() {
    const c = community();
    const me = meId();
    const posts = c.posts.slice().sort((a, b) => b.ts - a.ts);
    return `<form class="card" data-form="post">
        <textarea class="textarea" name="text" placeholder="${isGuest() ? 'Create an account to share your wins' : 'Share a win, a question or a check-in'}" maxlength="600" style="border:none;padding:0;min-height:64px;background:transparent"></textarea>
        <div class="row between" style="margin-top:8px"><div class="chips">${['Win', 'Question', 'Tip'].map((tg) => `<button type="button" class="chip ${(S.postTag || 'Win') === tg ? 'selected' : ''}" data-action="post-tag" data-value="${tg}">${tg}</button>`).join('')}</div>
        <button class="btn accent sm" type="submit">Post</button></div>
      </form>
      ${posts.map((p) => { const liked = me && p.likedBy.includes(me); const open = S.openComments[p.id]; return `<div class="card post">
        <div class="head"><div class="avatar sm ${p.author.startsWith('u:') ? '' : 'alt'}">${esc(initials(memberName(p.author)))}</div><div class="grow"><strong>${esc(memberName(p.author))}</strong><div class="tiny muted">${timeAgo(p.ts)}${p.phase && D.PHASES[p.phase] && p.phase !== 'steady' ? ` · ${esc(phaseName(p.phase))} phase` : ''}</div></div><span class="tag ${p.tag === 'Win' ? 'accent' : ''}">${esc(p.tag)}</span></div>
        <div class="body">${esc(p.text)}</div>
        <div class="foot"><button class="${liked ? 'on' : ''}" data-action="like" data-id="${p.id}" aria-label="Like">${icon('heart', 18)} ${p.baseLikes + p.likedBy.length}</button><button data-action="toggle-comments" data-id="${p.id}">${icon('comment', 18)} ${p.comments.length}</button>${p.author !== me ? `<button data-action="message" data-id="${esc(p.author)}">Message</button>` : ''}</div>
        ${open ? `${p.comments.map((cm) => `<div class="comment"><div class="avatar sm ${cm.author.startsWith('u:') ? '' : 'alt'}">${esc(initials(memberName(cm.author)))}</div><div class="c"><strong class="small">${esc(memberName(cm.author))}</strong><div class="small">${esc(cm.text)}</div></div></div>`).join('')}
          <form class="row" style="margin-top:10px" data-form="comment" data-id="${p.id}"><input class="input grow" style="height:42px" name="text" placeholder="Add a comment" maxlength="300" required><button class="btn primary sm" type="submit">Reply</button></form>` : ''}
      </div>`; }).join('')}
      <p class="tiny muted center" style="margin-top:16px">Community posts are shared between accounts on this device in this preview.</p>`;
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
  function openCheckin() {
    const ex = S.data.daily[todayKey()];
    S.modal = { type: 'checkin', form: ex ? { energy: ex.energy, sleep: ex.sleep, mood: ex.mood, soreness: ex.soreness, symptoms: (ex.symptoms || []).slice(), flow: ex.flow || 'none' } : { energy: 3, sleep: 3, mood: 3, soreness: 2, symptoms: [], flow: 'none' } };
    render();
  }

  function scale(field, label, lo, hi, value) {
    return `<div style="margin-top:16px"><div class="row between"><span class="label" style="margin:0">${label}</span><span class="tiny muted">${lo} to ${hi}</span></div>
      <div class="segment" style="margin-top:8px">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="${value === n ? 'active' : ''}" data-action="ci-set" data-field="${field}" data-value="${n}" aria-label="${label} ${n}">${n}</button>`).join('')}</div></div>`;
  }

  function viewModal() {
    const m = S.modal;
    if (!m) return '';
    if (m.type === 'active') return viewActive();
    const sheet = (title, body) => `<div class="overlay" data-action="overlay"><div class="sheet" role="dialog" aria-label="${esc(title.replace(/<[^>]+>/g, ''))}"><div class="grab"></div><div class="sheet-head"><h2>${title}</h2><button class="icon-btn" data-action="close-modal" aria-label="Close">${icon('x', 18)}</button></div>${body}</div></div>`;

    if (m.type === 'signup') {
      const why = { progress: 'Progress photos are private to your account.', community: 'You need an account to post and message.' }[m.reason] || 'Keep your plan, history and coach chats safe.';
      return sheet('Save your plan', `<p class="muted small" style="margin-bottom:16px">${why} Everything you have done as a guest moves to your new account.</p>${signupForm('sheet')}<p class="center small" style="margin-top:14px"><button class="link" data-action="go-login">I already have an account</button></p>`);
    }
    if (m.type === 'checkin') {
      const f = m.form;
      const c = cyc();
      const r = L.readiness(f);
      return sheet('Daily check-in', `<div class="row" style="gap:14px">${readinessRing(r, 64)}<div class="grow small muted">Your readiness score sets today's training and suggested weights.</div></div>
        ${scale('energy', 'Energy', 'drained', 'full of energy', f.energy)}
        ${scale('sleep', 'Sleep', 'awful', 'great', f.sleep)}
        ${scale('mood', 'Mood', 'low', 'great', f.mood)}
        ${scale('soreness', 'Soreness', 'none', 'very sore', f.soreness)}
        <div class="label" style="margin-top:18px">Symptoms</div>
        <div class="chips">${(L.MENO_MODES.includes(c.mode) ? D.MENO_SYMPTOMS : D.SYMPTOMS).map((s) => `<button type="button" class="chip ${f.symptoms.includes(s) ? 'selected' : ''}" data-action="ci-symptom" data-value="${esc(s)}">${esc(s)}</button>`).join('')}</div>
        ${c.mode === 'none' ? '' : `<div class="label" style="margin-top:18px">Bleeding</div><div class="chips">${['none', 'spotting', 'light', 'medium', 'heavy'].map((x) => `<button type="button" class="chip ${f.flow === x ? 'selected' : ''}" data-action="ci-set" data-field="flow" data-value="${x}">${x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div>`}
        <button class="btn primary block" style="margin-top:22px" data-action="ci-save">Save check-in</button>`);
    }
    if (m.type === 'menoBleed') {
      return sheet('Please check in with your doctor', `<p class="small">Bleeding after menopause is usually not serious, but it should always be checked by a doctor. Please book an appointment soon.</p><p class="small muted" style="margin-top:10px">Your check-in is saved. Train lightly or rest until you have spoken to someone.</p><button class="btn primary block" style="margin-top:18px" data-action="close-modal">Got it</button>`);
    }
    if (m.type === 'periodConfirm') {
      return sheet('Did your period start today?', `<p class="small muted">You logged bleeding${cyc().late ? ' and your period was due' : ' outside your predicted period'}. If this is day 1 of your period, I will update your cycle and learn from it.</p>
        <div class="row" style="margin-top:18px"><button class="btn primary grow" data-action="log-period-today">Yes, it started today</button><button class="btn ghost" data-action="close-modal">Not yet</button></div>`);
    }
    if (m.type === 'period') {
      return sheet('Log your period', `<form data-form="period"><label class="field"><span class="label">First day of bleeding</span><input class="input" type="date" name="date" value="${todayKey()}" max="${todayKey()}" required></label>
        <p class="tiny muted" style="margin-top:8px">Logging a date within a week of an existing entry corrects that period.</p><button class="btn primary block" style="margin-top:16px" type="submit">Save</button></form>`);
    }
    if (m.type === 'ciPhotos') {
      const intro = `<p class="small">Front, side and back. Wear whatever you are comfortable in: a bikini, or shorts and a sports bra. Same spot, same light and same time of day each week makes the comparison fair.</p>`;
      if (isGuest()) {
        return sheet('Check-in photos', `${intro}<p class="small muted" style="margin-top:12px">Check-in photos are private to your account. Create a free account to add them, or skip photos this week.</p>
          <button class="btn primary block" style="margin-top:16px" data-action="open-signup" data-reason="progress">Create account</button><button class="btn ghost block" style="margin-top:10px" data-action="ci-skip-photos">Skip photos this week</button>`);
      }
      if (!S.data.pinHash) {
        return sheet('Secure your photos first', `${intro}
          <div class="banner" style="margin-top:14px;background:var(--green-soft)">${icon('shield', 20)}<div class="grow small">Check-in photos need a vault PIN. Photos are encrypted on this phone with your PIN, the vault locks whenever you leave the app, and photos are never shared or exported. Only you can open them.</div></div>
          <form data-form="pin" style="margin-top:12px"><label class="field"><span class="label">Choose a 4 to 6 digit PIN (6 is more secure)</span><input class="input pin-input" style="max-width:none" name="pin" type="password" inputmode="numeric" maxlength="6" pattern="[0-9]{4,6}" required autocomplete="off"></label><p class="tiny muted" style="margin-top:6px">If you forget it, encrypted photos cannot be recovered.</p><button class="btn primary block" style="margin-top:14px" type="submit">Set PIN and continue</button></form>
          <button class="btn ghost block" style="margin-top:10px" data-action="ci-skip-photos">Skip photos this week</button>`);
      }
      if (!S.vaultUnlocked) {
        return sheet('Unlock your vault', `<form data-form="unlock">${intro}<label class="field" style="margin-top:14px"><span class="label">Vault PIN</span><input class="input pin-input" style="max-width:none" name="pin" type="password" inputmode="numeric" maxlength="6" pattern="[0-9]{4,6}" autocomplete="off" required></label>${S.authError ? `<p class="error" style="margin-top:8px">${esc(S.authError)}</p>` : ''}<button class="btn primary block" style="margin-top:14px" type="submit">Unlock</button></form><button class="btn ghost block" style="margin-top:10px" data-action="ci-skip-photos">Skip photos this week</button>`);
      }
      const todayW = S.data.checkins.find((x) => x.date === todayKey());
      return sheet('Check-in photos', `${intro}
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px">${['front', 'side', 'back'].map((pose) => `<label style="cursor:pointer">${m.photos[pose] ? blurThumb(m.photos[pose], pose) : `<div class="photo" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;border:1.5px dashed var(--line)">${icon('camera', 22)}<span class="eyebrow">${pose}</span></div>`}<input type="file" accept="image/*" data-ci-photo="${pose}" hidden></label>`).join('')}</div>
        <p class="tiny muted" style="margin-top:8px">Encrypted with your PIN and stored only on this phone.${S.ai ? ' Your coach reviews them when you finish, and they are not stored anywhere else.' : ''}</p>
        <form data-form="ci-continue" style="margin-top:16px"><label class="field"><span class="label">This morning's weight (${unit()})</span><input class="input" name="w" type="number" step="0.1" inputmode="decimal" value="${todayW ? (unit() === 'lb' ? Math.round(todayW.kg * 22.0462) / 10 : todayW.kg) : ''}" placeholder="Optional"></label>
          <button class="btn primary block" style="margin-top:16px" type="submit">Continue</button></form>
        <button class="btn ghost block" style="margin-top:10px" data-action="ci-skip-photos">Skip photos this week</button>`);
    }
    if (m.type === 'weekly') {
      const a = m.answers;
      const group = (field, label, opts) => `<div class="label" style="margin-top:18px">${label}</div><div class="options">${opts.map(([v, l]) => `<button type="button" class="option ${a[field] === v ? 'selected' : ''}" style="padding:12px 16px" data-action="wk-set" data-field="${field}" data-value="${v}"><strong>${l}</strong></button>`).join('')}</div>`;
      return sheet('Weekly check-in', `<p class="small muted">${m.photos && Object.keys(m.photos).length ? `${plural(Object.keys(m.photos).length, 'photo')} saved. ` : ''}Three quick questions, then I review your week and update next week's plan.</p>
        ${group('feel', 'How did training feel this week?', [['easy', 'Too easy'], ['right', 'Just right'], ['hard', 'Too hard']])}
        ${group('hunger', 'How was your hunger?', [['low', 'Low'], ['ok', 'Normal'], ['high', 'Very hungry']])}
        ${group('next', 'What does next week look like?', [['normal', 'A normal week'], ['busy', 'Busy'], ['travel', 'Travelling'], ['push', 'I want to push']])}
        <button class="btn primary block" style="margin-top:22px" data-action="wk-run" ${a.feel && a.hunger && a.next ? '' : 'disabled'}>Review my week</button>`);
    }
    if (m.type === 'weeklyResult') {
      const s = m.stats;
      return sheet('Your week', `
        <div class="stats">
          ${statTile('Sessions', `${s.sessions}/${s.planned}`, '')}${statTile('Avg steps', s.stepAvg.toLocaleString(), '')}
          ${statTile('Readiness', s.readinessAvg == null ? '-' : s.readinessAvg, s.readinessAvg == null ? '' : '/100')}${statTile('Weight', s.weightChange == null ? '-' : rate(s.weightChange).split(' ')[0], s.weightChange == null ? '' : `${unit()}/wk`)}
        </div>
        ${m.photos && Object.keys(m.photos).length ? checkinCompare(m.photos, m.prev) : ''}
        <div class="card accent" style="margin-top:12px"><div class="row between"><div class="eyebrow">Coach</div>${m.verdict ? `<span class="verdict ${m.verdict}">${{ on_track: 'On track', progressing: 'Making progress', adjust: 'Needs adjustment' }[m.verdict] || ''}</span>` : ''}</div><div class="rich small" style="margin-top:6px">${rich(m.text)}</div>${m.loading ? `<p class="tiny muted" style="margin-top:6px">${m.photos && Object.keys(m.photos).length ? 'Your coach is reviewing your photos and your week...' : 'Your coach is writing a personal note...'}</p>` : ''}</div>
        ${m.result.adjustments.length ? `<div class="label" style="margin-top:16px">Changes for next week</div>${m.result.adjustments.map((a, i) => `<button class="option ${m.selected[i] ? 'selected' : ''}" style="margin-top:8px" data-action="wk-toggle" data-i="${i}"><strong>${m.selected[i] ? 'Apply: ' : 'Skip: '}${esc(a.label)}</strong><span>${esc(a.why)}</span></button>`).join('')}` : ''}
        ${m.result.notes.length ? `<ul class="phase-list">${m.result.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
        <button class="btn primary block" style="margin-top:18px" data-action="wk-apply">${m.result.adjustments.length ? 'Update next week\'s plan' : 'Done'}</button>`);
    }
    if (m.type === 'summary') {
      const r = m.record;
      return sheet('Workout complete', `<div class="stats">${statTile('Sets', r.sets, '')}${statTile('Minutes', r.minutes, '')}</div>
        ${m.volume ? `<p class="small muted" style="margin-top:10px">Total volume: ${Math.round(m.volume).toLocaleString()} ${r.unit}</p>` : ''}
        ${m.prs.length ? `<div class="card accent" style="margin-top:12px"><div class="eyebrow">New personal records</div>${m.prs.map((p) => `<div class="row between" style="margin-top:8px"><strong>${esc(p.name)}</strong><span>${fmtLoad(p.weight, p.unit)} x ${p.reps}</span></div>`).join('')}</div>` : '<p class="small" style="margin-top:12px">Logged. Your suggested weights for next time are already updated.</p>'}
        <div class="row" style="margin-top:18px"><button class="btn ghost grow" data-action="share-workout">${icon('share', 18)} Share</button><button class="btn primary grow" data-action="close-modal">Done</button></div>`);
    }
    if (m.type === 'share') {
      return sheet('Share your progress', `${m.url ? `<img src="${m.url}" alt="Progress card" style="border-radius:16px;border:1px solid var(--line)">` : '<div class="empty">Creating your card...</div>'}
        <button class="btn primary block" style="margin-top:14px" data-action="share-card" ${m.url ? '' : 'disabled'}>${icon('share', 18)} Share or save</button>`);
    }
    if (m.type === 'scanner') {
      const recent = S.data.recentFoods || [];
      return `<div class="overlay"><div class="sheet full scanner-sheet" role="dialog" aria-label="Scan a barcode">
        <div class="sheet-head"><button class="icon-btn" data-action="close-scanner" aria-label="Close scanner">${icon('x', 18)}</button><div class="eyebrow" style="color:#F7F2EA">Scan barcode</div><button class="icon-btn" data-action="open-food-search" aria-label="Search foods">${icon('search', 18)}</button></div>
        <div class="scan-frame"><video id="scan-video" playsinline muted></video><div class="scan-box"><span></span></div></div>
        <p id="scan-status" class="mono center" style="margin-top:14px;color:#F7F2EA;opacity:.85">Starting camera...</p>
        <div class="row" style="margin-top:16px"><label class="btn outline grow" style="cursor:pointer">${icon('image', 18)} Scan from photo<input type="file" accept="image/*" capture="environment" data-scan-photo hidden></label></div>
        <form class="row" data-form="barcode" style="margin-top:10px"><input class="input grow" name="code" inputmode="numeric" pattern="[0-9]*" maxlength="14" placeholder="Or type the barcode number" aria-label="Barcode number" style="background:rgba(247,242,234,.08);border-color:rgba(247,242,234,.25);color:#F7F2EA"><button class="btn cream sm" type="submit">Look up</button></form>
        ${recent.length ? `<div class="eyebrow" style="margin-top:24px;color:#F7F2EA;opacity:.7">Recent</div>${recent.slice(0, 5).map((r, i) => `<button class="list-item" style="width:100%;text-align:left;color:#F7F2EA;border-color:rgba(247,242,234,.15)" data-action="recent-food" data-i="${i}"><div class="grow"><strong class="small">${esc(r.food.name)}</strong><div class="tiny" style="opacity:.7">${esc(foodLabel(r.food, r.amount, r.mode))}</div></div><span class="tiny" style="font-family:var(--mono)">${L.foodMacros(r.food, r.amount, r.mode).kcal} ${calU()}</span></button>`).join('')}` : ''}
        <p class="tiny center" style="margin-top:20px;color:#F7F2EA;opacity:.55">Only the barcode number is sent to Open Food Facts, an open food database.</p>
      </div></div>`;
    }
    if (m.type === 'food') {
      if (m.loading) return sheet('Looking it up', `<div class="empty">Finding barcode ${esc(m.barcode)}...</div>`);
      const f = m.food;
      const mac = L.foodMacros(f, m.amount, m.mode);
      return sheet(m.target === 'recipe' ? 'Add ingredient' : m.editId ? 'Edit entry' : 'Log food', `<div class="row" style="gap:14px;align-items:flex-start">${f.image ? `<img src="${esc(f.image)}" alt="" style="width:64px;height:64px;object-fit:contain;border-radius:12px;background:#fff;flex-shrink:0" referrerpolicy="no-referrer">` : ''}<div class="grow"><div class="serif" style="font-size:26px;line-height:1.05">${esc(f.name)}</div><div class="eyebrow" style="margin-top:6px">${esc(f.brand || 'Food')}${f.barcode ? ` · ${esc(f.barcode)}` : ''}</div></div></div>
        ${f.per100 && f.serving.grams !== 100 ? `<div class="segment" style="margin-top:16px">${[['servings', 'Servings'], ['grams', 'Grams']].map(([v, l]) => `<button class="${m.mode === v ? 'active' : ''}" data-action="food-mode" data-value="${v}">${l}</button>`).join('')}</div>` : ''}
        ${m.mode === 'grams'
          ? `<label class="field" style="margin-top:14px"><span class="label">Amount in grams</span><input class="input" type="number" inputmode="decimal" min="1" max="2000" value="${m.amount}" data-food-grams></label><p class="tiny muted" style="margin-top:6px">A food scale gives the most accurate number here. Optional.</p>`
          : `<div class="row between" style="margin-top:16px"><button class="icon-btn" data-action="food-step" data-d="-0.5" aria-label="Less">${icon('x', 14)}</button><div class="center"><div class="big-number" style="font-size:48px">${m.amount}</div><div class="tiny muted">x ${esc(f.serving.label)}</div></div><button class="icon-btn" data-action="food-step" data-d="0.5" aria-label="More">${icon('plus', 16)}</button></div>`}
        <div class="stats" id="food-macros" style="margin-top:16px;grid-template-columns:repeat(4,1fr)">${foodMacroTiles(mac)}</div>
        ${m.target === 'recipe' ? '' : `<div class="label" style="margin-top:16px">Meal</div><div class="chips">${Object.entries(SLOT_LABEL).map(([v, l]) => `<button class="chip ${m.slot === v ? 'selected' : ''}" data-action="food-slot" data-value="${v}">${l}</button>`).join('')}</div>`}
        <button class="btn primary block" style="margin-top:20px" data-action="food-log">${m.target === 'recipe' ? 'Add to recipe' : m.editId ? 'Save changes' : `Log to ${diaryDateLabel().toLowerCase() === 'today' ? SLOT_LABEL[m.slot].toLowerCase() : `${SLOT_LABEL[m.slot].toLowerCase()}, ${diaryDateLabel()}`}`}</button>
        <p class="tiny muted center" style="margin-top:10px">${f.recipeId ? 'Your recipe.' : f.estimated ? 'Suggested meal. Macros are estimates, so adjust the portion to what you ate.' : f.custom ? 'Your saved food.' : 'Nutrition from Open Food Facts. Check the label if anything looks off.'}</p>`);
    }
    if (m.type === 'foodManual') {
      const pre = m.prefill || {};
      return sheet(foodTarget().kind === 'recipe' ? 'New ingredient' : 'Create a food', `${m.notFound ? `<p class="small" style="margin-bottom:12px">Barcode ${esc(m.barcode)} is not in the database yet. Add it once from the label and it will be saved for next time.</p>` : m.offline ? '<p class="small" style="margin-bottom:12px">Could not reach the food database. Check your connection, or add it from the label.</p>' : ''}
        <form data-form="food-manual">
          <label class="field"><span class="label">Food name</span><input class="input" name="name" required maxlength="80" value="${esc(pre.name || '')}"></label>
          <label class="field"><span class="label">Serving</span><input class="input" name="serving" maxlength="40" placeholder="e.g. 1 bar, 150 g, 1 cup" value="${esc(pre.serving || '')}"></label>
          <div class="input-row" style="margin-top:14px"><label class="field"><span class="label">Calories</span><input class="input" name="kcal" type="number" inputmode="decimal" min="0" max="3000" required></label><label class="field" style="margin-top:0"><span class="label">Protein g</span><input class="input" name="protein" type="number" inputmode="decimal" min="0" max="300" step="0.1" required></label></div>
          <div class="input-row" style="margin-top:14px"><label class="field"><span class="label">Carbs g</span><input class="input" name="carbs" type="number" inputmode="decimal" min="0" max="500" step="0.1" value="0"></label><label class="field" style="margin-top:0"><span class="label">Fat g</span><input class="input" name="fat" type="number" inputmode="decimal" min="0" max="300" step="0.1" value="0"></label></div>
          <p class="tiny muted" style="margin-top:8px">Enter the values for one serving.</p>
          <button class="btn primary block" style="margin-top:18px" type="submit">${foodTarget().kind === 'recipe' ? 'Add to recipe' : m.barcode ? 'Save and log' : 'Log it'}</button>
        </form>`);
    }
    if (m.type === 'foodSearch') {
      return sheet('Search foods', `<form class="row" data-form="food-search"><input class="input grow" name="q" value="${esc(m.q || '')}" placeholder="e.g. greek yogurt, protein bar" maxlength="80" aria-label="Search foods" autofocus><button class="btn primary sm" type="submit">Search</button></form>
        ${m.loading ? '<div class="empty">Searching...</div>' : ''}
        ${m.error ? '<p class="tiny error" style="margin-top:10px">Could not reach the food database. Showing your saved foods.</p>' : ''}
        ${(m.results || []).map((f, i) => `<button class="list-item" style="width:100%;text-align:left" data-action="search-pick" data-i="${i}">${f.image ? `<img src="${esc(f.image)}" alt="" style="width:40px;height:40px;object-fit:contain;border-radius:8px;background:#fff" referrerpolicy="no-referrer" loading="lazy">` : ''}<div class="grow"><strong class="small">${esc(f.name)}</strong><div class="tiny muted">${esc(f.brand || '')}${f.brand ? ' · ' : ''}${esc(f.serving.label)}</div></div><span class="tiny" style="font-family:var(--mono);text-align:right">${Math.round(f.perServing.kcal)} ${calU()}<br>${Math.round(f.perServing.protein)} g P</span></button>`).join('')}
        ${!m.loading && m.q && !(m.results || []).length ? `<div class="empty">Nothing found. <button class="link" data-action="open-food-manual">Add it manually</button></div>` : ''}`);
    }
    if (m.type === 'addFood') {
      const t = foodTarget();
      const recipes = Object.values(S.data.recipes || {});
      const recent = S.data.recentFoods || [];
      const tile = (action, ic, label) => `<button class="card" style="margin:0;text-align:left;padding:16px" data-action="${action}">${icon(ic, 22)}<div class="eyebrow" style="color:var(--text);margin-top:10px">${label}</div></button>`;
      return sheet(t.kind === 'recipe' ? 'Add ingredient' : `Add to ${SLOT_LABEL[t.slot].toLowerCase()}`, `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${tile('open-scanner', 'barcode', 'Scan barcode')}${tile('open-food-search', 'search', 'Search foods')}${t.kind === 'recipe' ? '' : tile('open-quick-add', 'plus', 'Quick add')}${tile('open-food-manual', 'list', 'Create a food')}</div>
        ${t.kind !== 'recipe' && recipes.length ? `<div class="label" style="margin-top:20px">My recipes</div>${recipes.map((r) => { const f = L.recipeFood(r); return `<button class="list-item" style="width:100%;text-align:left" data-action="recipe-log" data-id="${r.id}"><div class="grow"><strong class="small">${esc(r.name)}</strong><div class="tiny muted">${esc(f.serving.label)}</div></div><span class="tiny" style="font-family:var(--mono);text-align:right">${Math.round(f.perServing.kcal)} ${calU()}<br>${Math.round(f.perServing.protein)} g P</span></button>`; }).join('')}` : ''}
        ${recent.length ? `<div class="label" style="margin-top:20px">Recent</div>${recent.slice(0, 8).map((r, i) => `<button class="list-item" style="width:100%;text-align:left" data-action="recent-food" data-i="${i}"><div class="grow"><strong class="small">${esc(r.food.name)}</strong><div class="tiny muted">${esc(foodLabel(r.food, r.amount, r.mode))}</div></div><span class="tiny" style="font-family:var(--mono)">${L.foodMacros(r.food, r.amount, r.mode).kcal} ${calU()}</span></button>`).join('')}` : ''}
        ${t.kind !== 'recipe' ? '<button class="btn ghost block" style="margin-top:18px" data-action="new-recipe">Build a recipe from ingredients</button>' : ''}`);
    }
    if (m.type === 'quickAdd') {
      return sheet('Quick add', `<p class="small muted" style="margin-bottom:12px">For when you just know the numbers. Adds to ${SLOT_LABEL[foodTarget().slot].toLowerCase()}.</p>
        <form data-form="quick-add">
          <label class="field"><span class="label">Calories</span><input class="input" name="kcal" type="number" inputmode="decimal" min="1" max="5000" required autofocus></label>
          <div class="input-row" style="margin-top:14px"><label class="field"><span class="label">Protein g</span><input class="input" name="protein" type="number" inputmode="decimal" min="0" max="300" step="0.1"></label><label class="field" style="margin-top:0"><span class="label">Carbs g</span><input class="input" name="carbs" type="number" inputmode="decimal" min="0" max="500" step="0.1"></label><label class="field" style="margin-top:0"><span class="label">Fat g</span><input class="input" name="fat" type="number" inputmode="decimal" min="0" max="300" step="0.1"></label></div>
          <label class="field" style="margin-top:14px"><span class="label">Name (optional)</span><input class="input" name="name" maxlength="60" placeholder="e.g. Dinner out"></label>
          <button class="btn primary block" style="margin-top:18px" type="submit">Add</button>
        </form>`);
    }
    if (m.type === 'recipe') {
      const r = S.recipeDraft;
      const tot = L.recipeTotals(r.ingredients);
      const per = L.recipeFood(r).perServing;
      return sheet(r.id ? 'Edit recipe' : 'New recipe', `
        <label class="field"><span class="label">Recipe name</span><input class="input" data-recipe-field="name" value="${esc(r.name)}" maxlength="60" placeholder="e.g. Turkey chili"></label>
        <div class="input-row" style="margin-top:14px"><label class="field"><span class="label">Servings it makes</span><input class="input" type="number" inputmode="numeric" min="1" max="50" data-recipe-field="servings" value="${r.servings}"></label><label class="field" style="margin-top:0"><span class="label">Cooked weight g</span><input class="input" type="number" inputmode="numeric" min="0" max="20000" data-recipe-field="totalGrams" value="${r.totalGrams || ''}" placeholder="Optional"></label></div>
        <div class="banner" style="margin-top:14px;background:var(--green-soft)">${icon('trend', 18)}<div class="grow tiny">Most accurate with a food scale (optional): weigh each ingredient raw, then weigh the finished dish and enter the cooked weight. You can then log any portion by grams.</div></div>
        <div class="label" style="margin-top:16px">Ingredients</div>
        ${r.ingredients.length ? r.ingredients.map((g) => `<div class="list-item" style="padding:10px 0"><div class="grow"><strong class="small">${esc(g.name)}</strong><div class="tiny muted">${esc(g.label)}</div></div><div class="tiny" style="font-family:var(--mono);text-align:right">${g.kcal} ${calU()}<br>${Math.round(g.protein)} g P</div><button class="icon-btn" style="width:30px;height:30px" data-action="recipe-del-ing" data-id="${g.id}" aria-label="Remove ${esc(g.name)}">${icon('x', 14)}</button></div>`).join('') : '<p class="small muted">Add everything that goes in: scan packages, search, or create foods.</p>'}
        <button class="btn ghost block" style="margin-top:12px" data-action="recipe-add-ing">${icon('plus', 16)} Add ingredient</button>
        <div class="row between" style="margin-top:18px"><span class="eyebrow">Whole recipe</span><span class="tiny" style="font-family:var(--mono)">${tot.kcal} ${calU()} · ${Math.round(tot.protein)} g P · ${Math.round(tot.carbs)} g C · ${Math.round(tot.fat)} g F</span></div>
        <div class="eyebrow" style="margin-top:14px">Per serving</div>
        <div class="stats" id="recipe-per" style="margin-top:8px;grid-template-columns:repeat(4,1fr)">${foodMacroTiles(per)}</div>
        <div class="row" style="margin-top:18px"><button class="btn ghost grow" data-action="recipe-save" ${r.ingredients.length ? '' : 'disabled'}>Save</button><button class="btn primary grow" data-action="recipe-save" data-log="1" ${r.ingredients.length ? '' : 'disabled'}>Save and log</button></div>`);
    }
    if (m.type === 'recipes') {
      const list = Object.values(S.data.recipes || {}).sort((a, b) => b.updated - a.updated);
      return sheet('My recipes', `${list.length ? list.map((r) => { const f = L.recipeFood(r); return `<div class="list-item"><button class="grow" style="text-align:left" data-action="recipe-log" data-id="${r.id}"><strong class="small">${esc(r.name)}</strong><div class="tiny muted">${r.ingredients.length} ingredients · ${esc(f.serving.label)} · ${Math.round(f.perServing.kcal)} ${calU()}, ${Math.round(f.perServing.protein)} g P</div></button><button class="btn ghost xs" data-action="recipe-edit" data-id="${r.id}">Edit</button><button class="icon-btn" style="width:30px;height:30px" data-action="recipe-delete" data-id="${r.id}" aria-label="Delete ${esc(r.name)}">${icon('trash', 14)}</button></div>`; }).join('') : '<p class="small muted">Make something at home? Add its ingredients once, say how many servings it makes, and log a serving any time.</p>'}
        <button class="btn primary block" style="margin-top:16px" data-action="new-recipe">${icon('plus', 16)} New recipe</button>`);
    }
    if (m.type === 'protein') {
      const k = todayKey();
      const eaten = Object.entries(S.data.eaten[k] || {});
      return sheet('Log protein', `<p class="small muted">Today: ${L.proteinFor(S.data, k)} of ${tgt().protein} g. Log foods in your diary, or add a quick amount.</p>
        <button class="btn primary block" style="margin-top:14px" data-action="open-scanner">${icon('barcode', 18)} Scan a barcode</button>
        <div class="row" style="margin-top:14px">${[10, 20, 30].map((g) => `<button class="btn soft grow" data-action="add-protein" data-g="${g}">+${g} g</button>`).join('')}</div>
        ${eaten.length ? `<div class="divider"></div>${eaten.map(([slot, x]) => `<div class="row between small" style="margin-top:6px"><span>${esc(x.name)}</span><strong>${x.protein} g</strong></div>`).join('')}` : ''}
        ${(S.data.proteinExtra[k] || 0) ? `<div class="row between small" style="margin-top:6px"><span>Extra</span><strong>${S.data.proteinExtra[k]} g</strong></div><button class="link small" style="margin-top:8px" data-action="add-protein" data-g="${-S.data.proteinExtra[k]}">Clear extra</button>` : ''}`);
    }
    if (m.type === 'grocery') {
      const start = today();
      const list = L.groceryList(S.data, start, 7);
      const checked = S.data.grocery.checked || {};
      const cats = Object.keys(list);
      return sheet('<span class="serif-tight" style="font-size:44px">the grocery edit</span>', `<p class="small muted">Everything for your next 7 days of meals, matched to your phases and food preferences.</p>
        ${cats.map((cat) => `<div class="label" style="margin-top:16px">${esc(cat)}</div>${list[cat].map((it) => `<button class="list-item" style="width:100%;text-align:left;padding:10px 0" data-action="grocery-check" data-item="${esc(it.name)}"><span class="check ${checked[it.name] ? 'on' : ''}" style="width:28px;height:28px;border-radius:8px">${checked[it.name] ? icon('check', 14, 2.6) : ''}</span><span class="grow" style="${checked[it.name] ? 'text-decoration:line-through;opacity:.5' : ''}">${esc(it.name)}</span><span class="tiny muted">${it.count > 1 ? `x${it.count}` : ''}</span></button>`).join('')}`).join('')}
        <div class="row" style="margin-top:18px"><button class="btn ghost grow" data-action="grocery-clear">Clear ticks</button><button class="btn primary grow" data-action="grocery-share">${icon('share', 18)} Share list</button></div>`);
    }
    if (m.type === 'workout') {
      const wk = workoutById(m.id);
      const isToday = todaysWorkout().id === wk.id;
      return sheet(esc(wk.name), `<div class="eyebrow">${esc(wk.focus)} · ${wk.minutes} min · ${esc(wk.intensity)}</div><p class="small" style="margin-top:8px">${esc(wk.summary)}</p><div class="divider"></div>${exerciseList(wk, true)}
        <div class="row" style="margin-top:16px"><button class="btn primary grow" data-action="start-workout" data-id="${wk.id}">Start now</button>${isToday ? '' : `<button class="btn ghost" data-action="set-today" data-id="${wk.id}">Make today's</button>`}</div>`);
    }
    if (m.type === 'swap') {
      const c = cyc();
      const list = D.WORKOUTS.filter((w) => c.steady || w.phase === c.phase || w.phase === 'any');
      return sheet('Choose today\'s workout', `<p class="small muted" style="margin-bottom:14px">${c.steady ? 'Any session works in steady mode.' : `Options that suit your ${phaseName(c.phase).toLowerCase()} phase.`}</p><div class="options">${list.map((w) => `<button class="option ${todaysWorkout().id === w.id ? 'selected' : ''}" data-action="set-today" data-id="${w.id}"><strong>${esc(w.name)}</strong><span>${w.minutes} min · ${esc(w.intensity)} · ${esc(w.focus)}</span></button>`).join('')}</div>
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
      return sheet('Vault PIN', `<form data-form="pin"><p class="small muted" style="margin-bottom:14px">A 4 to 6 digit PIN (6 is more secure) locks your vault${hasSubtle() ? ' and encrypts your photos on this device. If you forget it, encrypted photos cannot be recovered.' : '. Encryption needs a secure (https) connection, which this page does not have.'}</p><label class="field"><span class="label">New PIN</span><input class="input pin-input" style="max-width:none" name="pin" type="password" inputmode="numeric" maxlength="6" pattern="[0-9]{4,6}" required autocomplete="off"></label><button class="btn primary block" style="margin-top:16px" type="submit">Save PIN</button></form>${S.data.pinHash ? '<button class="btn ghost block" style="margin-top:10px" data-action="remove-pin">Remove PIN and decrypt photos</button>' : ''}`);
    }
    if (m.type === 'settings') {
      const p = S.data.profile;
      const theme = store.get('yours.theme', 'system');
      const u = currentUser();
      const c = cyc();
      const learned = L.learnCycle(S.data.periods);
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
      return sheet('Profile', `
        <div class="card flat row"><div class="avatar">${isGuest() ? icon('settings', 18) : esc(initials(u && u.name))}</div><div class="grow"><strong>${isGuest() ? 'Guest' : esc(u && u.name)}</strong><div class="small muted">${isGuest() ? 'Not saved to an account' : esc(u && u.email)}</div></div>${isGuest() ? '<button class="btn accent xs" data-action="open-signup">Save</button>' : ''}</div>
        <div class="card flat small"><div class="row between"><span class="muted">Goal</span><strong>${esc(goalOf(p).label)}</strong></div><div class="row between" style="margin-top:6px"><span class="muted">Level</span><strong>${esc((LEVELS.find((l) => l.id === p.level) || {}).label || '')}</strong></div><div class="row between" style="margin-top:6px"><span class="muted">Cycle type</span><strong>${esc((D.CYCLE_MODES.find((x) => x.id === p.cycleMode) || {}).label || '')}</strong></div>${c.steady ? '' : `<div class="row between" style="margin-top:6px"><span class="muted">Cycle length</span><strong>${learned ? `${learned.length} days (learned)` : `${p.cycleLength} days`}</strong></div><div class="row between" style="margin-top:6px"><span class="muted">Last period</span><strong>${esc(shortDate(p.periodStart))}</strong></div>`}
          <button class="btn ghost sm block" style="margin-top:14px" data-action="edit-plan">Edit my plan</button></div>
        ${c.steady ? '' : '<button class="btn soft block" style="margin-top:12px" data-action="open-period">Log a period start</button>'}
        <div class="card flat"><div class="label">Weekly check-in day</div><div class="chips">${WEEKDAYS.map((w, i) => `<button class="chip ${L.checkinDay(S.data) === i ? 'selected' : ''}" data-action="set-checkin-day" data-value="${i}">${w.slice(0, 3)}</button>`).join('')}</div>
          <div class="row between" style="margin-top:14px"><span class="small">Daily weigh-in prompt</span><button class="chip ${S.data.weighDaily === false ? '' : 'selected'}" data-action="toggle-weigh">${S.data.weighDaily === false ? 'Off' : 'On'}</button></div></div>
        <div class="card flat"><div class="label">Units</div><div class="segment">${[['imperial', 'lb · ft'], ['metric', 'kg · cm']].map(([v, l]) => `<button class="${(p.units === 'metric' ? 'metric' : 'imperial') === v ? 'active' : ''}" data-action="set-units" data-value="${v}">${l}</button>`).join('')}</div><p class="tiny muted" style="margin-top:8px">Past workouts keep the unit they were logged in. Suggested weights convert automatically.</p></div>
        <div class="card flat"><div class="label">Appearance</div><div class="segment">${['system', 'light', 'dark'].map((x) => `<button class="${theme === x ? 'active' : ''}" data-action="theme" data-value="${x}">${x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div></div>
        ${S.installPrompt ? '<button class="btn primary block" style="margin-top:12px" data-action="install">Install YOURS on this device</button>' : ios ? '<div class="card flat small"><div class="label">Install on iPhone</div><p class="muted">Tap the Share button in Safari, then Add to Home Screen.</p></div>' : ''}
        <div class="card flat small"><div class="label">Coach</div><p class="muted">${S.ai ? 'Live AI coach is connected.' : 'Running the on-device coach. Set ANTHROPIC_API_KEY on the server to enable the live AI coach and photo reviews.'}</p></div>
        <div class="card flat small"><div class="label">Your data</div><p class="muted">Everything is stored on this device. Nothing is used to train AI models.</p><button class="btn ghost sm block" style="margin-top:10px" data-action="export-data">${icon('download', 16)} Export my data</button></div>
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
    const sheetEl = root.querySelector('.sheet');
    const sheetScroll = sheetEl ? sheetEl.scrollTop : 0;
    root.innerHTML = html + viewModal();
    const newSheet = root.querySelector('.sheet');
    if (newSheet && sheetScroll) newSheet.scrollTop = sheetScroll;
    if (focusedName === 'msg') { const ta = root.querySelector('textarea[name="msg"]'); if (ta && !S.typing) ta.focus(); }
  }

  // ---------- session handling ----------
  async function startSession(session) {
    S.session = session;
    store.set('yours.session', session);
    loadData();
    S.vaultUnlocked = false;
    S.photoKey = null;
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

  // Demo account with two months of realistic history.
  const DEMO_LOADS = {
    'Back squat': 45, 'Romanian deadlift': 50, 'Bulgarian split squat': 12, 'Barbell hip thrust': 70, 'Lying leg curl': 25, 'Standing calf raise': 40,
    'Lat pulldown': 35, 'Dumbbell bench press': 14, 'Chest-supported row': 12, 'Seated dumbbell shoulder press': 9, 'Cable lateral raise': 5, 'Face pull': 15,
    'Kettlebell swing': 16, 'Reverse lunge': 10, 'Sumo deadlift': 60, 'Walking lunge': 10, 'Cable kickback': 10, 'Hip abduction': 40, '45-degree back extension': 10,
    'Trap bar deadlift': 75, 'Push press': 30, 'Goblet squat': 20, 'Hip thrust': 65, 'Single-leg Romanian deadlift': 12, 'Leg press': 100, 'Seated leg curl': 30,
    'One-arm dumbbell row': 14, 'Incline dumbbell press': 12, 'Arnold press': 8, 'Cable fly': 8, 'Dumbbell curl': 8, 'Triceps rope pushdown': 15,
    'Dumbbell Romanian deadlift': 16, 'Seated cable row': 30,
  };
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
    d.profile = { units: 'imperial', cycleMode: 'natural', level: 'intermediate', goal: 'glutes', heightCm: 168, weightKg: 63.5, age: 29, activity: 'moderate', cycleLength: 28, periodLength: 5, favorites: ['Chicken', 'Salmon', 'Greek yogurt', 'Sweet potato', 'Berries'], avoid: ['Shellfish'], foodNotes: '' };
    [-66, -37, -9].forEach((n) => L.addPeriod(d, dateKey(addDays(t, n))));
    const starts = d.periods.map(parseKey);
    const len = d.profile.learnedLength;
    const phaseOf = (day) => (day <= 5 ? 'menstrual' : day <= len - 16 ? 'follicular' : day <= len - 13 ? 'ovulation' : 'luteal');
    const rnd = (i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
    for (let i = 60; i >= 1; i--) {
      const date = addDays(t, -i);
      const start = starts.filter((s) => s <= date).pop();
      if (!start) continue;
      const day = daysBetween(start, date) + 1;
      const phase = phaseOf(day);
      const key = dateKey(date);
      if (rnd(i) < 0.85) {
        const dip = day >= 24 && day <= 26;
        const symptoms = [];
        if (day <= 2) symptoms.push('Cramps');
        if (day >= 22 && rnd(i + 7) < 0.7) symptoms.push('Cravings');
        if (day >= 25 && rnd(i + 3) < 0.5) symptoms.push('Bloating');
        d.daily[key] = { energy: dip ? 2 : phase === 'menstrual' ? 3 : phase === 'luteal' ? 3 + (rnd(i) < 0.5 ? 1 : 0) : 4 + (rnd(i + 1) < 0.4 ? 1 : 0), sleep: dip ? 3 : 4, mood: dip ? 2 : 4, soreness: 2, symptoms, flow: day <= 4 ? (day <= 2 ? 'medium' : 'light') : 'none', cycleDay: day, phase };
      }
      d.steps[key] = 8600 + Math.round(rnd(i + 11) * 4800);
      // Training on planned days, skipping about one in six.
      const rot = D.ROTATION[phase];
      const ranges = { menstrual: 1, follicular: 6, ovulation: len - 15, luteal: len - 12 };
      const wk = workoutById(rot[(day - ranges[phase]) % rot.length]);
      if (wk.id === 'rest' || rnd(i + 5) < 0.17) continue;
      const factor = { menstrual: 0.9, follicular: 1, ovulation: 1.04, luteal: 0.95 }[phase] * (1 + (60 - i) * 0.0025);
      const detail = wk.exercises.filter((ex) => L.parseReps(ex.reps) && DEMO_LOADS[ex.name]).map((ex) => {
        const target = L.parseReps(ex.reps);
        const iso = /raise|curl|fly|pushdown|kickback|abduction|face pull|extension|calf|arnold/i.test(ex.name);
        const inc = iso ? 2.5 : 5;
        const weight = Math.round((DEMO_LOADS[ex.name] * 2.20462 * factor) / inc) * inc;
        const reps = phase === 'follicular' || phase === 'ovulation' ? target.hi : target.lo;
        return { name: ex.name, sets: Array.from({ length: L.adjustSets(ex, 'intermediate', {}) }, () => ({ weight, reps })) };
      });
      d.workouts.push({ id: uid(), date: key, templateId: wk.id, name: wk.name, minutes: wk.minutes, sets: detail.reduce((n, e) => n + e.sets.length, 0), unit: 'lb', phase, detail });
    }
    d.steps[dateKey(t)] = 4210;
    d.water[dateKey(t)] = 1000;
    const bf = suggestionFood(L.mealFor(d, t, 'breakfast').meal, 1);
    const yog = { barcode: null, name: 'Greek yogurt, plain nonfat', brand: '', image: null, custom: true, serving: { label: '1 cup (227 g)', grams: 227 }, perServing: { kcal: 130, protein: 23, carbs: 9, fat: 0 }, per100: { kcal: 57, protein: 10.1, carbs: 4, fat: 0 } };
    d.foodLog[dateKey(t)] = [
      { id: uid(), slot: 'breakfast', name: bf.name, brand: bf.brand, barcode: null, food: bf, amount: 1, mode: 'servings', label: '1 portion', ...L.foodMacros(bf, 1, 'servings'), ts: Date.now() },
      { id: uid(), slot: 'snack', name: yog.name, brand: '', barcode: null, food: yog, amount: 1, mode: 'servings', label: yog.serving.label, ...L.foodMacros(yog, 1, 'servings'), ts: Date.now() },
    ];
    d.recentFoods = [{ food: yog, amount: 1, mode: 'servings' }];
    d.recipes = { demo1: { id: 'demo1', name: 'Turkey sweet potato chili', servings: 4, totalGrams: 1800, updated: Date.now(), ingredients: [
      { id: 'i1', name: 'Lean ground turkey 93/7', label: '454 g', kcal: 680, protein: 86, carbs: 0, fat: 36 },
      { id: 'i2', name: 'Sweet potato', label: '400 g', kcal: 344, protein: 6, carbs: 80, fat: 0 },
      { id: 'i3', name: 'Black beans, canned, drained', label: '1 can (250 g)', kcal: 228, protein: 15, carbs: 41, fat: 1 },
      { id: 'i4', name: 'Crushed tomatoes', label: '400 g', kcal: 128, protein: 6, carbs: 28, fat: 1 },
      { id: 'i5', name: 'Olive oil', label: '1 tbsp', kcal: 119, protein: 0, carbs: 0, fat: 14 },
    ] } };
    // Weekly weigh-ins for two months, then daily for the last two weeks (water noise included), none yet today.
    [65.4, 65.2, 64.9, 65.1, 64.6, 64.4].forEach((kg, i) => d.checkins.push({ date: dateKey(addDays(t, -(8 - i) * 7)), kg }));
    for (let i = 14; i >= 1; i--) d.checkins.push({ date: dateKey(addDays(t, -i)), kg: Math.round((64.3 - (14 - i) * 0.05 + (rnd(i + 21) - 0.5) * 0.8) * 10) / 10 });
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
    S.photoKey = null;
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
      try {
        const recs = await photoTx('readonly', (s) => s.index('owner').getAllKeys(email));
        await photoTx('readwrite', (s) => (recs || []).forEach((id) => s.delete(id)));
      } catch { /* ignore */ }
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

  function exportData() {
    const u = currentUser();
    const payload = { exportedAt: new Date().toISOString(), account: u ? { name: u.name, email: u.email } : null, data: { ...S.data, pinHash: undefined, pinSalt: undefined }, note: 'Progress photos are not included. They stay in your private vault.' };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `yours-export-${todayKey()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function applyTheme(t) {
    store.set('yours.theme', t);
    if (t === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
  }

  function logPeriod(key) {
    const learned = L.addPeriod(S.data, key);
    S.modal = null;
    save();
    render();
    toast(learned ? `Cycle updated. Your average is ${learned.length} days.` : 'Period logged. Log the next one and I will learn your cycle.');
  }

  // ---------- events ----------
  const actions = {
    start: () => { S.authError = ''; startSession({ kind: 'guest' }).then(render); },
    'go-login': () => {
      // Guest progress stays saved on the device; signing in switches to that account's data.
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
      const p = S.data.profile;
      if (p.periodStart && !L.STEADY_MODES.includes(p.cycleMode) && !S.data.periods.includes(p.periodStart)) L.addPeriod(S.data, p.periodStart);
      S.data.onboarded = true;
      S.data.obStep = 0;
      if (S.data.editing) { S.data.editing = false; S.data.planSeen = true; toast('Plan updated'); }
      save(); render(); window.scrollTo(0, 0);
    },

    tab: (el) => { goTab(el.dataset.tab); render(); if (S.tab === 'advisor' && S.advisorView === 'coach') scrollChat(); },
    'open-settings': () => { S.modal = { type: 'settings' }; render(); },
    'close-modal': () => { if (S.modal && ['addFood', 'food', 'foodSearch', 'foodManual', 'quickAdd', 'scanner'].includes(S.modal.type)) return closeFoodFlow(); if (S.modal && S.modal.type === 'recipe') { S.recipeDraft = null; S.foodTarget = null; } stopScanner(); S.modal = null; render(); },
    overlay: (el, ev) => { if (ev.target === el) actions['close-modal'](); },
    water: (el) => { addWater(Number(el.dataset.ml)); render(); },
    'log-steps': () => { S.modal = { type: 'steps' }; render(); },
    'log-protein': () => { S.modal = { type: 'protein' }; render(); },
    'add-protein': (el) => { const k = todayKey(); S.data.proteinExtra[k] = Math.max(0, (S.data.proteinExtra[k] || 0) + Number(el.dataset.g)); save(); render(); },

    'open-checkin': () => openCheckin(),
    'ci-set': (el) => { const f = S.modal.form; f[el.dataset.field] = el.dataset.field === 'flow' ? el.dataset.value : Number(el.dataset.value); render(); },
    'ci-symptom': (el) => { const s = S.modal.form.symptoms; const i = s.indexOf(el.dataset.value); if (i > -1) s.splice(i, 1); else s.push(el.dataset.value); render(); },
    'ci-save': () => {
      const f = S.modal.form;
      const c = cyc();
      S.data.daily[todayKey()] = { ...f, cycleDay: c.day, phase: c.phase, ts: Date.now() };
      save();
      const bleeding = ['light', 'medium', 'heavy'].includes(f.flow);
      const lastPeriod = S.data.periods[S.data.periods.length - 1];
      const recentlyLogged = lastPeriod && daysBetween(parseKey(lastPeriod), today()) < 10;
      if (bleeding && c.mode === 'menopause') { S.modal = { type: 'menoBleed' }; render(); return; }
      if (bleeding && !c.steady && !recentlyLogged) { S.modal = { type: 'periodConfirm' }; render(); return; }
      S.modal = null;
      render();
      const r = L.readiness(f);
      toast(`Readiness ${r}. ${r < 45 ? 'I have a lighter option for you.' : 'Plan updated for today.'}`);
    },
    'log-period-today': () => logPeriod(todayKey()),
    'open-period': () => { S.modal = { type: 'period' }; render(); },

    'open-weekly': () => { S.modal = { type: 'ciPhotos', photos: {} }; render(); },
    'ci-skip-photos': () => { S.modal = { type: 'weekly', answers: {}, photos: {} }; render(); },
    'reveal': (el) => { S.revealed[el.dataset.id] = true; render(); },
    'set-checkin-day': (el) => { S.data.checkinDay = Number(el.dataset.value); save(); render(); toast(`Check-in day: ${WEEKDAYS[S.data.checkinDay]}`); },
    'toggle-weigh': () => { S.data.weighDaily = S.data.weighDaily === false; save(); render(); },
    'wk-set': (el) => { S.modal.answers[el.dataset.field] = el.dataset.value; render(); },
    'wk-run': () => runWeekly(S.modal.answers, S.modal.photos),
    'wk-toggle': (el) => { S.modal.selected[el.dataset.i] = !S.modal.selected[el.dataset.i]; render(); },
    'wk-apply': () => {
      const m = S.modal;
      const chosen = m.result.adjustments.filter((_, i) => m.selected[i]);
      L.applyAdjustments(S.data.plan, chosen);
      S.data.reviews.push({ date: todayKey(), stats: m.stats, answers: m.answers, adjustments: chosen, notes: m.result.notes, text: m.text, verdict: m.verdict || null, photos: m.photos || {}, weightAvg: weekAvg(0) });
      S.modal = null;
      save(); render();
      toast(chosen.length ? 'Next week\'s plan is updated' : 'Check-in saved');
    },

    'view-workout': (el) => { S.modal = { type: 'workout', id: el.dataset.id }; render(); },
    'start-workout': (el) => {
      if (S.data.activeWorkout && S.data.activeWorkout.templateId === el.dataset.id) { S.modal = { type: 'active' }; return render(); }
      if (S.data.activeWorkout && !confirm('You have a workout in progress. Replace it?')) return;
      startWorkout(el.dataset.id);
    },
    'resume-workout': () => { S.modal = { type: 'active' }; render(); },
    'toggle-set': (el) => {
      const s = S.data.activeWorkout.exercises[el.dataset.ei].sets[el.dataset.si];
      s.done = !s.done;
      if (s.done && !s.reps && s.target) s.reps = String(s.target);
      save(); render();
    },
    'finish-workout': () => finishWorkout(),
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
    'open-grocery': () => { S.modal = { type: 'grocery' }; render(); },
    'open-scanner': () => { stopScanner(); if (!S.foodTarget) S.foodTarget = { kind: 'log', slot: slotNow() }; S.modal = { type: 'scanner' }; render(); startScanner(); },
    'close-scanner': () => closeFoodFlow(),
    'add-food': (el) => { S.foodTarget = { kind: 'log', slot: el.dataset.slot }; S.modal = { type: 'addFood' }; render(); },
    'open-quick-add': () => { if (!S.foodTarget || S.foodTarget.kind !== 'log') S.foodTarget = { kind: 'log', slot: slotNow() }; S.modal = { type: 'quickAdd' }; render(); },
    'open-recipes': () => { S.foodTarget = null; S.modal = { type: 'recipes' }; render(); },
    'new-recipe': () => { S.recipeDraft = { id: null, name: '', servings: 4, totalGrams: null, ingredients: [] }; S.foodTarget = { kind: 'recipe' }; S.modal = { type: 'recipe' }; render(); },
    'recipe-edit': (el) => { const r = S.data.recipes[el.dataset.id]; if (!r) return; S.recipeDraft = JSON.parse(JSON.stringify(r)); S.foodTarget = { kind: 'recipe' }; S.modal = { type: 'recipe' }; render(); },
    'recipe-delete': (el) => { const r = S.data.recipes[el.dataset.id]; if (!r || !confirm(`Delete ${r.name}? Past diary entries stay.`)) return; delete S.data.recipes[el.dataset.id]; save(); render(); },
    'recipe-add-ing': () => { S.foodTarget = { kind: 'recipe' }; S.modal = { type: 'addFood' }; render(); },
    'recipe-del-ing': (el) => { S.recipeDraft.ingredients = S.recipeDraft.ingredients.filter((g) => g.id !== el.dataset.id); render(); },
    'recipe-save': (el) => {
      const r = S.recipeDraft;
      r.name = (r.name || '').trim();
      if (!r.name) return toast('Give your recipe a name');
      r.servings = clamp(Math.round(Number(r.servings) || 1), 1, 50);
      r.totalGrams = Number(r.totalGrams) > 0 ? Math.round(Number(r.totalGrams)) : null;
      r.id = r.id || uid();
      r.updated = Date.now();
      S.data.recipes[r.id] = r;
      S.recipeDraft = null;
      save();
      if (el.dataset.log) { S.foodTarget = { kind: 'log', slot: slotNow() }; openFood(L.recipeFood(r)); }
      else { S.foodTarget = null; S.modal = { type: 'recipes' }; render(); toast('Recipe saved'); }
    },
    'recipe-log': (el) => { const r = S.data.recipes[el.dataset.id]; if (!r) return; if (!S.foodTarget || S.foodTarget.kind !== 'log') S.foodTarget = { kind: 'log', slot: slotNow() }; openFood(L.recipeFood(r)); },
    'log-suggestion': (el) => {
      const { meal } = L.mealFor(S.data, today(), el.dataset.slot);
      const picks = ['breakfast', 'lunch', 'dinner', 'snack'].map((sl) => L.mealFor(S.data, today(), sl).meal);
      const portion = clamp(Math.round((tgt().kcal / picks.reduce((n, x) => n + x.kcal, 0)) * 10) / 10, 0.7, 1.6);
      S.foodTarget = { kind: 'log', slot: el.dataset.slot };
      openFood(suggestionFood(meal, portion));
    },
    'food-edit': (el) => {
      const e = (S.data.foodLog[diaryKey()] || []).find((x) => x.id === el.dataset.id);
      if (!e || !e.food) return toast('This entry cannot be edited. Delete and log it again.');
      S.foodTarget = { kind: 'log', slot: e.slot };
      openFood(e.food, e.amount, e.mode, e.id);
    },
    'diary-day': (el) => { const d = addDays(parseKey(diaryKey()), Number(el.dataset.d)); if (d > today()) return; S.diaryDate = dateKey(d) === todayKey() ? null : dateKey(d); render(); },
    'dismiss-tip': (el) => { S.data.tips = S.data.tips || {}; S.data.tips[el.dataset.tip] = true; save(); render(); },
    'open-food-search': () => { stopScanner(); S.modal = { type: 'foodSearch', q: '', results: [] }; render(); },
    'open-food-manual': () => { stopScanner(); S.modal = { type: 'foodManual' }; render(); },
    'recent-food': (el) => { stopScanner(); const r = S.data.recentFoods[el.dataset.i]; if (r) openFood(r.food, r.amount, r.mode); },
    'search-pick': (el) => { const f = S.modal.results[el.dataset.i]; if (f) openFood(f); },
    'food-step': (el) => { S.modal.amount = clamp(Math.round((S.modal.amount + Number(el.dataset.d)) * 2) / 2, 0.5, 20); render(); },
    'food-mode': (el) => { const m = S.modal; if (m.mode === el.dataset.value) return; m.mode = el.dataset.value; m.amount = m.mode === 'grams' ? (m.food.serving.grams || 100) : 1; render(); },
    'food-slot': (el) => { S.modal.slot = el.dataset.value; render(); },
    'food-log': () => logFood(),
    'food-del': (el) => { const k = diaryKey(); S.data.foodLog[k] = (S.data.foodLog[k] || []).filter((f) => f.id !== el.dataset.id); save(); render(); },
    'grocery-check': (el) => { const c = S.data.grocery.checked; c[el.dataset.item] = !c[el.dataset.item]; save(); render(); },
    'grocery-clear': () => { S.data.grocery.checked = {}; save(); render(); },
    'grocery-share': async () => {
      const list = L.groceryList(S.data, today(), 7);
      const text = 'YOURS grocery list\n' + Object.entries(list).map(([cat, items]) => `\n${cat}\n` + items.map((i) => `- ${i.name}${i.count > 1 ? ` x${i.count}` : ''}`).join('\n')).join('\n');
      if (navigator.share) { try { await navigator.share({ title: 'Grocery list', text }); return; } catch { /* cancelled */ } }
      try { await navigator.clipboard.writeText(text); toast('List copied'); } catch { toast('Could not copy the list'); }
    },

    'advisor-view': (el) => { S.advisorView = el.dataset.value; S.authError = ''; render(); window.scrollTo(0, 0); if (S.advisorView === 'coach') scrollChat(); },
    prompt: (el) => sendChat(el.dataset.q),
    'chat-action': (el) => {
      const a = S.data.chat[el.dataset.mi].actions[el.dataset.ai];
      a.used = true;
      save();
      runAction(a);
    },

    'share-streak': () => { const st = L.streak(S.data); openShare({ art: cyc().phase, eyebrow: 'Streak', big: `${st.count} days`, sub: 'Showing up for my body, every phase.', foot: shortDate(todayKey()) }); },
    'share-strength': () => { const s = L.strengthByPhase(S.data.workouts); if (s) openShare({ art: s.best, eyebrow: 'Strength by phase', big: `+${Math.round(s.diff)}%`, sub: `I lift ${Math.round(s.diff)}% more in my ${phaseName(s.best).toLowerCase()} phase.`, foot: 'Cycle-synced' }); },
    'share-pr': (el) => { const p = S.data.prs.slice().reverse().find((x) => x.date === el.dataset.date && x.name === el.dataset.name); if (p) openShare({ art: p.phase || 'session', eyebrow: 'New personal record', big: fmtLoad(p.weight, p.unit), sub: `${p.name} for ${p.reps} reps.`, foot: shortDate(p.date) }); },
    'share-workout': () => {
      const m = S.modal;
      const pr = m.prs[0];
      openShare(pr ? { art: m.record.phase, eyebrow: 'New personal record', big: fmtLoad(pr.weight, pr.unit), sub: `${pr.name} for ${pr.reps} reps.`, foot: shortDate(m.record.date) } : { art: 'session', eyebrow: 'Session complete', big: `${m.record.sets} sets`, sub: m.record.name, foot: shortDate(m.record.date) });
    },
    'share-card': () => shareCard(),

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
      if (!confirm(`Delete ${plural(S.compare.length, 'photo')}? This cannot be undone.`)) return;
      const ids = S.compare.slice();
      await photoTx('readwrite', (s) => ids.forEach((id) => s.delete(id)));
      S.compare = [];
      await loadPhotos();
      render();
      toast('Deleted');
    },
    'pin-settings': () => { S.modal = { type: 'pin' }; render(); },
    'remove-pin': async () => {
      S.photoKey = null;
      await rewriteAllPhotos();
      S.data.pinHash = null; S.data.pinSalt = null; S.modal = null; save(); render(); toast('PIN removed. Photos are no longer encrypted.');
    },
    'lock-vault': () => { S.vaultUnlocked = false; S.photoKey = null; S.photos = []; S.revealed = {}; S.compare = []; render(); },

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
    'set-units': (el) => { S.data.profile.units = el.dataset.value; save(); render(); toast(`Weights now in ${unit() === 'lb' ? 'pounds' : 'kilograms'}`); },
    install: async () => { const p = S.installPrompt; if (!p) return; p.prompt(); try { await p.userChoice; } catch { /* ignore */ } S.installPrompt = null; render(); },
    'export-data': () => exportData(),
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
      if (btn) btn.disabled = !stepValid(S.data.obStep, p);
    }
    if (el.dataset.recipeField && S.recipeDraft) {
      S.recipeDraft[el.dataset.recipeField] = el.value;
      const box = document.getElementById('recipe-per');
      if (box && el.dataset.recipeField !== 'name') box.innerHTML = foodMacroTiles(L.recipeFood({ ...S.recipeDraft, servings: Number(S.recipeDraft.servings) || 1, totalGrams: Number(S.recipeDraft.totalGrams) || null }).perServing);
    }
    if (el.matches('[data-food-grams]') && S.modal && S.modal.type === 'food') {
      S.modal.amount = clamp(Number(el.value) || 0, 0, 2000);
      const box = document.getElementById('food-macros');
      if (box) box.innerHTML = foodMacroTiles(L.foodMacros(S.modal.food, S.modal.amount, 'grams'));
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
    if (el.matches('[data-scan-photo]') && el.files && el.files[0]) { scanPhoto(el.files[0]); return; }
    if (el.dataset.ciPhoto && el.files && el.files[0] && S.modal && S.modal.type === 'ciPhotos') {
      const pose = el.dataset.ciPhoto;
      try {
        const data = await compressImage(el.files[0]);
        const photo = { id: uid(), owner: S.session.email, date: todayKey(), created: Date.now(), pose, phase: cyc().phase, checkin: true, data };
        await storePhoto(photo);
        await loadPhotos();
        S.modal.photos[pose] = photo.id;
        render();
      } catch { toast('Could not save that photo'); }
      S.pickingFile = 0;
      return;
    }
    if (el.matches('[data-upload]') && el.files && el.files[0]) {
      const file = el.files[0];
      if (!file.type.startsWith('image/')) return toast('Choose an image file');
      try {
        const data = await compressImage(file);
        const c = cyc();
        const photo = { id: uid(), owner: S.session.email, date: todayKey(), created: Date.now(), pose: S.pose || 'front', phase: c.phase, data };
        await storePhoto(photo);
        await loadPhotos();
        S.revealed[photo.id] = true;
        render();
        toast(S.photoKey ? 'Photo encrypted and saved to your vault' : 'Photo saved to your private vault');
      } catch { toast('Could not save that photo'); }
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && !ev.shiftKey && ev.target.tagName === 'TEXTAREA' && ev.target.name === 'msg') {
      ev.preventDefault();
      ev.target.form.requestSubmit();
    }
    if (ev.key === 'Escape' && S.modal && S.modal.type !== 'active') actions['close-modal']();
  });

  document.addEventListener('submit', async (ev) => {
    const form = ev.target;
    const type = form.dataset.form;
    if (!type) return;
    ev.preventDefault();
    if (type === 'login') return login(form);
    if (type === 'signup') return signup(form);
    if (type === 'chat') { const v = form.msg.value; form.msg.value = ''; return sendChat(v); }
    if (type === 'ci-continue') {
      const v = Number(form.w.value);
      if (v) {
        let kg = unit() === 'lb' ? v / 2.20462 : v;
        kg = Math.round(kg * 10) / 10;
        if (!(kg >= 30 && kg <= 300)) return toast('Enter a realistic weight');
        S.data.checkins = S.data.checkins.filter((c) => c.date !== todayKey()).concat([{ date: todayKey(), kg }]).sort((a, b) => (a.date < b.date ? -1 : 1));
        S.data.profile.weightKg = kg;
        save();
      }
      S.modal = { type: 'weekly', answers: {}, photos: { ...S.modal.photos } };
      return render();
    }
    if (type === 'barcode') {
      const code = form.code.value.replace(/\D/g, '');
      if (!L.validBarcode(code)) return toast('That barcode does not look right. Check the digits.');
      stopScanner();
      return lookupBarcode(code);
    }
    if (type === 'food-search') { const q = form.q.value.trim(); if (q.length >= 2) searchFoods(q); return; }
    if (type === 'quick-add') {
      const n = (x) => Math.max(0, Number(form[x].value) || 0);
      const food = { barcode: null, name: form.name.value.trim().slice(0, 60) || 'Quick add', brand: '', image: null, custom: true, serving: { label: 'Quick add', grams: null }, perServing: { kcal: n('kcal'), protein: n('protein'), carbs: n('carbs'), fat: n('fat') }, per100: null };
      S.modal = { type: 'food', food, amount: 1, mode: 'servings', slot: foodTarget().slot || slotNow(), target: 'log' };
      return logFood();
    }
    if (type === 'food-manual') {
      const n = (x) => Math.max(0, Number(form[x].value) || 0);
      const food = { barcode: S.modal.barcode || null, name: form.name.value.trim().slice(0, 80), brand: '', image: null, custom: true, serving: { label: form.serving.value.trim().slice(0, 40) || '1 serving', grams: null }, perServing: { kcal: n('kcal'), protein: n('protein'), carbs: n('carbs'), fat: n('fat') }, per100: null };
      if (food.barcode) S.data.customFoods[food.barcode] = food;
      openFood(food);
      return logFood();
    }
    if (type === 'steps') { S.data.steps[todayKey()] = clamp(Number(form.steps.value) || 0, 0, 100000); S.modal = null; save(); render(); return toast('Steps updated'); }
    if (type === 'other') {
      S.data.workouts.push({ id: uid(), date: todayKey(), templateId: 'other', name: form.name.value.trim().slice(0, 60), minutes: clamp(Number(form.minutes.value) || 30, 5, 600), phase: cyc().phase });
      S.modal = null; save(); render(); return toast('Activity logged');
    }
    if (type === 'period') {
      const d = form.date.value;
      if (!d || d > todayKey()) return toast('Choose a date that is not in the future');
      return logPeriod(d);
    }
    if (type === 'checkin') {
      let kg = Number(form.w.value);
      if (unit() === 'lb') kg = kg / 2.20462;
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
      if (!/^\d{4,6}$/.test(pin)) return toast('Use 4 to 6 digits. 6 is more secure.');
      const salt = newSalt();
      const key = await photoKeyFrom(pin, salt);
      S.data.pinSalt = salt;
      S.data.pinHash = await hashSecret(pin, salt);
      S.photoKey = key;
      S.vaultUnlocked = true;
      await rewriteAllPhotos();
      if (!(S.modal && S.modal.type === 'ciPhotos')) S.modal = null;
      save(); render();
      return toast(key ? 'PIN set. Photos are encrypted.' : 'PIN set');
    }
    if (type === 'unlock') {
      // Slow down guessing: after 5 wrong PINs, wait 30 seconds per further attempt.
      if (S.pinFails >= 5 && Date.now() - S.pinFailAt < 30000) { S.authError = 'Too many attempts. Wait 30 seconds.'; return render(); }
      const ok = (await hashSecret(form.pin.value, S.data.pinSalt)) === S.data.pinHash;
      S.pinFails = ok ? 0 : (S.pinFails || 0) + 1;
      if (!ok) S.pinFailAt = Date.now();
      S.authError = ok ? '' : 'Incorrect PIN';
      S.vaultUnlocked = ok;
      if (ok) { S.photoKey = await photoKeyFrom(form.pin.value, S.data.pinSalt); await loadPhotos(); }
      return render();
    }
    if (type === 'post') {
      if (!requireAccount('community')) return;
      const text = form.text.value.trim();
      if (!text) return;
      const c = community();
      c.posts.push({ id: uid(), author: meId(), text: text.slice(0, 600), tag: S.postTag || 'Win', phase: cyc().phase, ts: Date.now(), baseLikes: 0, likedBy: [], comments: [] });
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

  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => render());

  // Vault auto-lock: whenever she leaves the app, and after 5 minutes without activity.
  // Opening the camera or photo picker briefly hides the page, so that does not count.
  function lockVault() {
    if (!S.data || !S.data.pinHash || !S.vaultUnlocked) return;
    S.vaultUnlocked = false; S.photoKey = null; S.photos = []; S.revealed = {}; S.compare = [];
  }
  document.addEventListener('click', (ev) => { if (ev.target.closest('label') && ev.target.closest('label').querySelector('input[type=file]')) S.pickingFile = Date.now(); }, true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && !(S.pickingFile && Date.now() - S.pickingFile < 120000)) { lockVault(); }
    if (document.visibilityState === 'visible') render();
  });
  let lastActivity = Date.now();
  ['click', 'keydown', 'touchstart'].forEach((t) => document.addEventListener(t, () => { lastActivity = Date.now(); }, { passive: true }));
  setInterval(() => { if (Date.now() - lastActivity > 5 * 60000 && S.vaultUnlocked) { lockVault(); render(); } }, 30000);

  // ---------- installable app ----------
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); S.installPrompt = e; });
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => { /* offline support unavailable */ }));
  }

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
