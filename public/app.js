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
  const initials = (n) => (n || '?').trim().split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';
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
    flash: '<path d="M13 3 5 13h6l-1 8 8-10h-6z"/>',
    store: '<path d="M4 9h16l-1 11H5z"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    fork: '<path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-2 0-3 2-3 5s1 4 3 4v9"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    arrows: '<path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 21l5-3 5 3-1.5-7"/>',
    gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8c-1.5-3-6-3.5-6-1s4 1 6 1zm0 0c1.5-3 6-3.5 6-1s-4 1-6 1z"/>',
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
    cmp: { pose: null, a: null, b: null, mode: 'slider', pos: 50, shown: false },
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
  function save() {
    if (!S.session) return;
    S.data._updated = Date.now();
    store.set(dataKey(), S.data);
    if (isCloud()) schedulePush();
  }

  // ---------- cloud (Supabase): accounts across devices, sync, photo backup, community ----------
  let cloud = null;
  const isCloud = () => !!(cloud && S.session && S.session.cloud && cloud.user());
  async function initCloud() {
    const cfg = window.YOURS_CONFIG || {};
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || !window.YOURS_CLOUD) return null;
    try {
      if (window.YOURS_TEST_CLIENT) cloud = window.YOURS_CLOUD.create(cfg, window.YOURS_TEST_CLIENT);
      else {
        if (!window.supabase) await new Promise((resolve, reject) => { const el = document.createElement('script'); el.src = '/vendor/supabase.min.js'; el.onload = resolve; el.onerror = reject; document.head.appendChild(el); });
        cloud = window.YOURS_CLOUD.create(cfg, window.supabase.createClient);
      }
      cloud.onAuth((event) => { if (event === 'PASSWORD_RECOVERY') { S.modal = { type: 'newPassword' }; render(); } });
      return cloud;
    } catch { cloud = null; return null; }
  }
  let pushTimer = null;
  function schedulePush() {
    clearTimeout(pushTimer);
    S.syncState = 'saving';
    pushTimer = setTimeout(pushNow, 1500);
  }
  async function pushNow() {
    clearTimeout(pushTimer);
    if (!isCloud()) return false;
    const { activeWorkout, ...rest } = S.data; // an in-progress workout stays on the device it was started on
    try { await cloud.pushData({ ...rest, activeWorkout: null }, S.data._updated || Date.now()); S.syncState = 'synced'; S.syncedAt = Date.now(); return true; }
    catch { S.syncState = 'offline'; return false; }
  }
  // Pull her latest data (another device may have changed it); whichever copy changed last wins.
  async function syncPull() {
    if (!isCloud()) return;
    try {
      const remote = await cloud.pullData();
      const action = window.YOURS_CLOUD.pickNewer(S.data, S.data && S.data._updated, remote);
      if (action === 'pull') {
        const keepWorkout = S.data && S.data.activeWorkout;
        S.data = Object.assign(blankData(), remote.data, { _updated: remote.updated, activeWorkout: keepWorkout || null });
        store.set(dataKey(), S.data);
        S.syncState = 'synced'; S.syncedAt = Date.now();
        render();
      } else if (action === 'push') await pushNow();
      else { S.syncState = 'synced'; S.syncedAt = Date.now(); }
    } catch { S.syncState = 'offline'; }
  }
  window.addEventListener('online', () => { if (isCloud() && S.syncState === 'offline') pushNow(); });
  let lastPull = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isCloud() && Date.now() - lastPull > 30000) { lastPull = Date.now(); syncPull(); refreshSub().then(render); if (S.tab === 'community') refreshCommunity(); }
    if (document.visibilityState === 'hidden' && isCloud() && S.syncState === 'saving') pushNow();
  });

  // Community from the cloud, kept in the same shape as the on-device preview.
  let unsubscribeCommunity = null;
  let communityTimer = null;
  async function refreshCommunity(which) {
    if (!isCloud()) return;
    const blocked = S.data.blocked || [];
    try {
      if (!which || which === 'feed') {
        S.cloudFeed = await cloud.feed(blocked);
        S.cloudFeed.forEach((p) => { S.cloudNames[p.author] = p.authorName; p.comments.forEach((c) => { S.cloudNames[c.author] = c.authorName; }); });
      }
      if (!which || which === 'messages') {
        const t = await cloud.threads(blocked);
        S.cloudThreads = t.threads;
        Object.assign(S.cloudNames, t.names);
      }
      S.communityError = false;
    } catch { S.communityError = true; }
    if (S.tab === 'community' && !(S.modal && S.modal.type !== 'report')) {
      const ta = root.querySelector('[data-form="post"] textarea, [data-form="dm"] textarea');
      const keep = ta ? ta.value : null;
      render();
      if (keep) { const nt = root.querySelector('[data-form="post"] textarea, [data-form="dm"] textarea'); if (nt) nt.value = keep; }
      if (S.openThread && which === 'messages') scrollChat();
    }
  }
  function startCloudCommunity() {
    if (unsubscribeCommunity || !isCloud()) return;
    S.cloudNames = S.cloudNames || {};
    unsubscribeCommunity = cloud.subscribe((which) => { clearTimeout(communityTimer); communityTimer = setTimeout(() => refreshCommunity(which), 400); });
    refreshCommunity();
  }
  function stopCloudCommunity() {
    if (unsubscribeCommunity) unsubscribeCommunity();
    unsubscribeCommunity = null;
    S.cloudFeed = null; S.cloudThreads = null; S.cloudNames = {};
  }
  async function cloudCall(fn, okMsg) {
    try { await fn(); if (okMsg) toast(okMsg); return true; }
    catch (e) { toast(window.YOURS_CLOUD.friendlyError(e)); return false; }
    finally { refreshCommunity(); }
  }

  // ---------- encrypted photo backup ----------
  // Photos are encrypted on the device with a key from her backup passphrase (never sent anywhere) before upload.
  // On this device that key is kept wrapped with her vault PIN key, so unlocking the vault turns backup on.
  const BK_ITER = 600000;
  async function backupKeyFrom(passphrase, salt) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt + ':backup'), iterations: BK_ITER }, base, 256);
    return { raw: toB64(bits), key: await crypto.subtle.importKey('raw', bits, 'AES-GCM', false, ['encrypt', 'decrypt']) };
  }
  const bkStoreKey = () => `yours.bk.${S.session.email}`;
  async function rememberBackupKey(raw) {
    if (S.photoKey) store.set(bkStoreKey(), await encryptText(S.photoKey, raw));
  }
  async function restoreBackupKey() {
    S.backupKey = null;
    const wrapped = !isGuest() && store.get(bkStoreKey(), null);
    if (!wrapped || !S.photoKey || !S.data.backup) return;
    try { const raw = await decryptText(S.photoKey, wrapped); S.backupRaw = raw; S.backupKey = await crypto.subtle.importKey('raw', fromB64(raw), 'AES-GCM', false, ['encrypt', 'decrypt']); } catch { store.del(bkStoreKey()); }
  }
  async function backupPhoto(photo) {
    const payload = JSON.stringify({ id: photo.id, date: photo.date, created: photo.created, pose: photo.pose, phase: photo.phase, checkin: !!photo.checkin, data: photo.data });
    await cloud.uploadBackup(`${photo.id}.bin`, JSON.stringify(await encryptText(S.backupKey, payload)));
  }
  async function refreshBackupList() {
    if (!isCloud()) return;
    try { S.backupNames = await cloud.listBackups(); } catch { S.backupNames = null; }
    render();
  }
  async function backupAll() {
    if (!isCloud() || !S.backupKey) return;
    S.backingUp = true; render();
    let done = 0;
    try {
      const have = new Set(await cloud.listBackups());
      for (const ph of S.photos) if (!have.has(`${ph.id}.bin`)) { await backupPhoto(ph); done++; }
      toast(done ? `Backed up ${plural(done, 'photo')}` : 'Everything is already backed up');
    } catch { toast('Backup paused. Check your connection and try again.'); }
    S.backingUp = false;
    await refreshBackupList();
  }
  async function restoreAll() {
    if (!isCloud() || !S.backupKey) return;
    S.backingUp = true; render();
    let done = 0;
    try {
      const local = new Set(S.photos.map((p) => `${p.id}.bin`));
      for (const name of await cloud.listBackups()) {
        if (local.has(name)) continue;
        const ph = JSON.parse(await decryptText(S.backupKey, JSON.parse(await cloud.downloadBackup(name))));
        await storePhoto({ ...ph, owner: S.session.email, noBackup: true });
        done++;
      }
      await loadPhotos();
      toast(done ? `Restored ${plural(done, 'photo')}` : 'This device already has every backed-up photo');
    } catch { toast('Could not restore. Check your connection and try again.'); }
    S.backingUp = false;
    render();
  }
  function backupCard() {
    if (!isCloud()) return '';
    const b = S.data.backup;
    const names = S.backupNames;
    let body;
    if (!S.data.pinHash) body = `<p class="small muted">Set a vault PIN first, so photos are encrypted on this device too.</p><button class="btn ghost sm block" style="margin-top:10px" data-action="pin-settings">Set a PIN</button>`;
    else if (!b) body = `<p class="small muted">Keep an encrypted copy of your photos in your YOURS account, so a lost or new phone does not lose them. Only you can open it, with a backup passphrase that never leaves your device.</p><button class="btn primary sm block" style="margin-top:10px" data-action="backup-setup">Turn on backup</button>`;
    else if (!S.backupKey) body = `<p class="small muted">Backup is on for your account. Enter your backup passphrase once on this device to back up and restore photos here.</p><button class="btn primary sm block" style="margin-top:10px" data-action="backup-unlock">Enter backup passphrase</button>`;
    else {
      const local = new Set(S.photos.map((p) => `${p.id}.bin`));
      const backed = names ? S.photos.filter((p) => names.includes(`${p.id}.bin`)).length : null;
      const remoteOnly = names ? names.filter((n) => !local.has(n)).length : 0;
      body = `<p class="small">${names == null ? 'Checking your backup...' : `${backed} of ${plural(S.photos.length, 'photo')} on this device backed up${remoteOnly ? ` · ${remoteOnly} more in your backup` : ''}.`} New photos back up automatically.</p>
        <div class="row" style="margin-top:10px"><button class="btn ghost sm grow" data-action="backup-now" ${S.backingUp ? 'disabled' : ''}>${S.backingUp ? 'Working...' : 'Back up now'}</button>${remoteOnly ? `<button class="btn primary sm grow" data-action="backup-restore" ${S.backingUp ? 'disabled' : ''}>Restore ${remoteOnly}</button>` : ''}</div>`;
    }
    return `<div class="card" style="margin-top:12px"><div class="row between"><span class="eyebrow" style="color:var(--text)">Encrypted backup</span>${icon('shield', 18)}</div><div style="margin-top:8px">${body}</div></div>`;
  }

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
  // The AI endpoints only serve signed-in members (and, with payments on, members with access).
  async function coachHeaders() {
    const h = { 'Content-Type': 'application/json' };
    if (isCloud()) { try { const t = await cloud.accessToken(); if (t) h.Authorization = `Bearer ${t}`; } catch { /* falls back to the on-device coach */ } }
    return h;
  }
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
      program: programContext(),
      workoutCatalog: D.WORKOUTS.filter((w) => w.phase !== 'program' || (S.data.program && w.program === S.data.program.id)).concat(L.setCustomWorkouts(S.data.customWorkouts)).map((w) => ({ id: w.id, name: w.name, phase: w.phase, intensity: w.intensity })),
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
    // "I had two eggs and toast" / "log my usual breakfast" in chat goes straight to the food review sheet.
    const logIntent = /^(?:(?:so\s+|ok\s+)?i\s+(?:just\s+)?(?:had|ate)\b|log\b|ate\b|had\b)/i.test(text) && !text.includes('?');
    if (logIntent && (/^log\b/i.test(text) && S.ai || L.usualRequest(text) || L.parseFoodText(text, talkFoods()).items.length)) {
      S.data.chat.push({ role: 'user', content: text, ts: Date.now() }, { role: 'coach', content: 'Got it. Check the portions and tap Log when it looks right.', actions: [], ts: Date.now() });
      save();
      S.foodTarget = null;
      S.diaryDate = null;
      return processTalk(text);
    }
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
          headers: await coachHeaders(),
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
    if (S.backupKey && isCloud() && !photo.noBackup) backupPhoto(photo).then(() => { if (S.backupNames && !S.backupNames.includes(`${photo.id}.bin`)) S.backupNames.push(`${photo.id}.bin`); }).catch(() => { /* retried by Back up now */ });
  }
  async function rewriteAllPhotos() {
    for (const p of S.photos) await storePhoto({ ...p, noBackup: true });
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
          headers: await coachHeaders(),
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
          headers: await coachHeaders(),
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
        headers: await coachHeaders(),
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
    const W = 1080, H = card.story ? 1920 : 1350;
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
    // Where to find YOURS (and her invite code, when she has one).
    g.font = '500 24px "DM Mono", monospace';
    g.globalAlpha = 0.85;
    const where = card.invite ? `${location.host} · code ${card.invite}` : location.host;
    g.fillText(where, W - 70 - g.measureText(where).width, H - 76);
    g.globalAlpha = 1;
    return c.toDataURL('image/png');
  }
  async function openShare(card) {
    card = { ...card, invite: card.invite || myInviteCode() };
    S.modal = { type: 'share', card, url: null };
    render();
    const url = await makeCard(card);
    if (S.modal && S.modal.type === 'share' && S.modal.card === card) { S.modal.url = url; render(); }
    logEvent('share_card');
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

  // Camera choice: ask for the back camera; if the browser hands us a front or ultra-wide lens, move to the
  // main back lens once. She can switch cameras by hand, and the choice is remembered.
  let camDevices = [];
  let scanTrack = null;
  function videoConstraints() {
    const saved = store.get('yours.camera', null);
    return { ...(saved ? { deviceId: { exact: saved } } : { facingMode: { ideal: 'environment' } }), width: { ideal: 1920 }, height: { ideal: 1080 } };
  }
  function restartScanner() { stopScanner(); startScanner(); }
  async function afterCameraStart(video) {
    const stream = video.srcObject;
    const track = stream && stream.getVideoTracks ? stream.getVideoTracks()[0] : null;
    if (!track) return;
    scanTrack = track;
    try { camDevices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput'); } catch { camDevices = []; }
    const settings = track.getSettings ? track.getSettings() : {};
    const label = (track.label || '').toLowerCase();
    if (!store.get('yours.camera', null) && camDevices.length > 1) {
      const isFront = settings.facingMode === 'user' || /front|user|facetime/.test(label);
      const isWide = /ultra|0\.5/.test(label);
      if (isFront || isWide) {
        const backs = camDevices.filter((d) => /back|rear|environment/i.test(d.label));
        const better = backs.find((d) => !/ultra|wide|0\.5|tele/i.test(d.label)) || backs[0];
        if (better && better.deviceId !== settings.deviceId) { store.set('yours.camera', better.deviceId); restartScanner(); return; }
      }
    }
    const caps = track.getCapabilities ? track.getCapabilities() : {};
    try { if (caps.focusMode && caps.focusMode.includes('continuous')) await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }); } catch { /* optional */ }
    const sw = document.getElementById('cam-switch');
    const torch = document.getElementById('cam-torch');
    const name = document.getElementById('cam-label');
    if (sw) sw.hidden = camDevices.length < 2;
    if (torch) { torch.hidden = !caps.torch; torch.classList.toggle('on', !!S.torch); }
    if (name) name.textContent = settings.facingMode === 'user' || /front|user|facetime/.test(label) ? 'Front camera' : settings.facingMode === 'environment' || /back|rear|environment/.test(label) ? 'Back camera' : camDevices.length > 1 ? `Camera ${Math.max(1, camDevices.findIndex((d) => d.deviceId === settings.deviceId) + 1)} of ${camDevices.length}` : '';
    if (S.torch && caps.torch) { try { await track.applyConstraints({ advanced: [{ torch: true }] }); } catch { /* unsupported */ } }
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
        const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints(), audio: false });
        video.srcObject = stream;
        await video.play();
        await afterCameraStart(video);
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
        const controls = await reader.decodeFromConstraints({ video: videoConstraints(), audio: false }, video, (result) => { if (result) found(result.getText()); });
        scanSession = { stop: () => controls.stop() };
        await afterCameraStart(video);
      }
      if (!done) setScanStatus('Line the barcode up inside the frame');
    } catch (e) {
      stopScanner();
      // A remembered camera can disappear (new phone, unplugged webcam): forget it and try again.
      if (e && (e.name === 'OverconstrainedError' || e.name === 'NotFoundError') && store.get('yours.camera', null)) { store.del('yours.camera'); return startScanner(); }
      setScanStatus(e && e.name === 'NotAllowedError' ? 'Camera access is blocked. Allow it in your browser settings, or scan from a photo.' : 'Could not start the camera. Type the barcode or scan from a photo.');
    }
  }
  function stopScanner() {
    if (scanSession) { try { scanSession.stop(); } catch { /* already stopped */ } scanSession = null; }
    if (scanTrack) { try { scanTrack.stop(); } catch { /* already stopped */ } scanTrack = null; }
  }

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

  // ---------- snap your plate / talk to log ----------
  // Both end in the same review sheet: she checks each item, adjusts portions, and only then logs.
  const estItem = (x, extra) => ({ id: uid(), on: true, scale: 1, edit: false, ...x, ...(extra || {}) });
  function openEstimate(source, extra) {
    const t = foodTarget();
    S.modal = { type: 'estimate', source, slot: t.slot || slotNow(), items: [], note: '', loading: true, ...extra };
    render();
  }
  function myFoodHints() {
    const recent = (S.data.recentFoods || []).map((r) => { const mac = L.foodMacros(r.food, r.amount, r.mode); return { name: r.food.name, portion: foodLabel(r.food, r.amount, r.mode), ...mac }; });
    const recipes = Object.values(S.data.recipes || {}).map((r) => { const f = L.recipeFood(r); return { name: r.name, portion: f.serving.label, ...f.perServing }; });
    return recent.concat(recipes).slice(0, 20);
  }
  async function aiEstimate(payload) {
    const r = await fetch('/api/coach', { method: 'POST', headers: await coachHeaders(), body: JSON.stringify({ mode: 'food', units: S.data.profile.units === 'metric' ? 'metric' : 'imperial', myFoods: myFoodHints(), ...payload }) });
    if (r.status === 401 || r.status === 402) throw Object.assign(new Error('members only'), { members: true });
    if (!r.ok) throw new Error('estimate failed');
    return r.json();
  }

  async function handlePlate(file) {
    S.pickingFile = 0;
    if (!file.type.startsWith('image/')) return toast('Choose a photo of your food');
    let thumb;
    try { thumb = await compressImage(file); } catch { return toast('Could not read that photo'); }
    openEstimate('photo', { thumb });
    if (!S.ai) { S.modal.loading = false; S.modal.noAi = true; return render(); }
    try {
      const j = await aiEstimate({ image: thumb });
      if (!S.modal || S.modal.type !== 'estimate' || S.modal.thumb !== thumb) return;
      S.modal.items = L.cleanEstimates(j.items).map((x) => estItem(x));
      S.modal.note = j.note || '';
      if (j.slot) S.modal.slot = j.slot;
    } catch (e) {
      if (S.modal && S.modal.type === 'estimate') S.modal.error = e && e.members ? 'Plate photos are for members. Sign in, or describe it instead.' : 'Could not reach the coach. Check your connection, or describe it instead.';
    }
    if (S.modal && S.modal.type === 'estimate') { S.modal.loading = false; render(); }
  }

  // Her saved and recent foods count as known foods for the offline parser, ahead of the built-in list.
  function talkFoods() {
    const mine = (S.data.recentFoods || []).map((r) => ({ id: 'r', names: [r.food.name.toLowerCase()], unit: foodLabel(r.food, r.amount, r.mode), grams: (r.food.serving.grams || 100) * (r.mode === 'grams' ? r.amount / (r.food.serving.grams || 100) : r.amount), ...L.foodMacros(r.food, r.amount, r.mode) }));
    return mine.concat(D.BASIC_FOODS);
  }

  async function processTalk(text) {
    text = (text || '').trim().slice(0, 600);
    if (!text) return;
    const usual = L.usualRequest(text);
    if (usual) {
      const slot = usual.slot || (S.foodTarget && S.foodTarget.slot) || slotNow();
      const entries = L.usualMeal(S.data, slot, parseKey(diaryKey()), usual);
      openEstimate('usual', { said: text, slot, loading: false });
      if (!entries) { S.modal.error = `No ${usual.yesterday ? `${SLOT_LABEL[slot].toLowerCase()} logged yesterday` : `usual ${SLOT_LABEL[slot].toLowerCase()} yet. Log it a couple of times and I will remember it`}.`; return render(); }
      S.modal.items = entries.map((e) => estItem({ name: e.name, portion: e.label, grams: null, kcal: e.kcal, protein: e.protein, carbs: e.carbs, fat: e.fat, confidence: 'high' }, { entry: e }));
      S.modal.note = usual.yesterday ? `Same as yesterday's ${SLOT_LABEL[slot].toLowerCase()}.` : `Your usual ${SLOT_LABEL[slot].toLowerCase()}, from your diary.`;
      return render();
    }
    openEstimate('text', { said: text });
    const local = L.parseFoodText(text, talkFoods());
    if (local.slot) S.modal.slot = local.slot;
    let done = false;
    if (S.ai) {
      try {
        const j = await aiEstimate({ text });
        if (!S.modal || S.modal.type !== 'estimate' || S.modal.said !== text) return;
        const items = L.cleanEstimates(j.items);
        if (items.length) { S.modal.items = items.map((x) => estItem(x)); S.modal.note = j.note || ''; if (j.slot) S.modal.slot = j.slot; done = true; }
      } catch { /* fall back to the on-device parser */ }
    }
    if (!S.modal || S.modal.type !== 'estimate') return;
    if (!done) {
      S.modal.items = local.items.map((x) => estItem(x));
      S.modal.note = local.unknown.length ? `I could not match: ${local.unknown.join(', ')}. Add ${local.unknown.length > 1 ? 'those' : 'it'} with search or quick add.` : 'Estimated from typical portions. Adjust anything that looks off.';
      if (!local.items.length) S.modal.error = 'I could not pick out any foods there. Try something like "two eggs and toast" or "150 g chicken and a cup of rice".';
    }
    S.modal.loading = false;
    render();
  }

  function logEstimate() {
    const m = S.modal;
    const picked = m.items.filter((x) => x.on);
    if (!picked.length) return toast('Pick at least one item');
    const k = diaryKey();
    const list = (S.data.foodLog[k] = S.data.foodLog[k] || []);
    let kcal = 0;
    picked.forEach((x) => {
      let entry;
      if (x.entry && !x.edited) {
        const e = x.entry;
        const amount = Math.round(e.amount * x.scale * 100) / 100;
        const mac = x.scale === 1 ? { kcal: e.kcal, protein: e.protein, carbs: e.carbs, fat: e.fat } : L.foodMacros(e.food, amount, e.mode);
        entry = { ...e, amount, label: x.scale === 1 ? e.label : foodLabel(e.food, amount, e.mode), ...mac };
      } else {
        const food = L.estimateFood(x, m.source);
        const mac = L.foodMacros(food, x.scale, 'servings');
        entry = { name: food.name, brand: food.brand, barcode: null, food, amount: x.scale, mode: 'servings', label: foodLabel(food, x.scale, 'servings'), ...mac };
        if (m.source === 'text') rememberFood(food, x.scale, 'servings');
      }
      kcal += entry.kcal;
      list.push({ id: uid(), slot: m.slot, ...entry, ts: Date.now() });
    });
    S.modal = null;
    S.foodTarget = null;
    save();
    render();
    toast(`Logged ${plural(picked.length, 'item')} to ${SLOT_LABEL[m.slot]} · ${kcal} ${calU()}`);
  }

  const SpeechRec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  function startDictation() {
    if (!SpeechRec || S.dictation) return;
    const rec = new SpeechRec();
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    S.dictation = rec;
    S.modal.listening = true;
    render();
    rec.onresult = (e) => {
      const txt = Array.from(e.results).map((r) => r[0].transcript).join(' ').trim();
      if (S.modal && S.modal.type === 'talk') { S.modal.text = txt; const ta = root.querySelector('[data-talk-text]'); if (ta) ta.value = txt; }
    };
    rec.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('Microphone access is off. You can type it instead.'); else if (e.error !== 'aborted') toast('I did not catch that. Try again or type it.'); };
    rec.onend = () => {
      S.dictation = null;
      if (!S.modal || S.modal.type !== 'talk') return;
      S.modal.listening = false;
      if (S.modal.text && S.modal.text.trim()) processTalk(S.modal.text);
      else render();
    };
    try { rec.start(); } catch { S.dictation = null; S.modal.listening = false; render(); }
  }
  function stopDictation() { if (S.dictation) { try { S.dictation.abort(); } catch { /* already stopped */ } S.dictation = null; } }

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

  // ---------- restaurants ----------
  const slug = (x) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  function restaurantFood(r, item, approx) {
    return { barcode: null, name: item.name, brand: r.name, image: null, custom: true, restaurant: true, approx: !!approx, serving: { label: item.serving || '1 item', grams: null }, perServing: { kcal: item.kcal, protein: item.protein, carbs: item.carbs, fat: item.fat }, per100: null };
  }
  function allRestaurants() {
    const mine = Object.values(S.data.myRestaurants || {});
    const merged = D.RESTAURANTS.map((r) => ({ ...r, mine: (S.data.myRestaurants || {})[r.id] }));
    mine.filter((m) => !D.RESTAURANTS.some((r) => r.id === m.id)).forEach((m) => merged.push({ id: m.id, name: m.name, cuisine: 'Your saved items', items: [], mine: m }));
    return merged.sort((a, b) => a.name.localeCompare(b.name));
  }
  const findRestaurant = (id) => allRestaurants().find((r) => r.id === id);
  async function searchRestaurantsOnline(q) {
    S.modal = { type: 'restaurantSearch', q, loading: true, results: [] };
    render();
    try {
      const r = await fetch(`/api/food?q=${encodeURIComponent(q)}`);
      const j = await r.json();
      if (S.modal && S.modal.type === 'restaurantSearch' && S.modal.q === q) { S.modal.results = j.results || []; S.modal.error = !!j.error; S.modal.loading = false; render(); }
    } catch { if (S.modal && S.modal.type === 'restaurantSearch') { S.modal.loading = false; S.modal.error = true; render(); } }
  }

  // ---------- grocery ----------
  function groceryState() {
    const g = (S.data.grocery = Object.assign({ checked: {}, store: 'walmart', ideas: true, recipes: {}, custom: [] }, S.data.grocery));
    return g;
  }
  function groceryOpts() {
    const g = groceryState();
    return { ideas: g.ideas !== false, recipes: Object.keys(g.recipes).filter((id) => g.recipes[id]).map((id) => S.data.recipes[id]).filter(Boolean), custom: g.custom };
  }
  const currentStore = () => D.STORES.find((x) => x.id === groceryState().store) || D.STORES[0];

  // ---------- community (shared on this device) ----------
  function community() {
    if (isCloud()) return { posts: S.cloudFeed || [], threads: S.cloudThreads || {} };
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
  const meId = () => (isGuest() ? null : isCloud() ? cloud.myId() : `u:${S.session.email}`);
  function memberName(id) {
    if (!id) return 'Member';
    if (id.startsWith('c:')) return id === meId() ? myName() || 'You' : (S.cloudNames || {})[id] || 'Member';
    if (id.startsWith('u:')) { const u = users()[id.slice(2)]; return u ? u.name : 'Member'; }
    const m = D.MEMBERS.find((x) => x.id === id);
    return m ? m.name : 'Member';
  }
  function members() {
    const me = meId();
    if (isCloud()) {
      // People she has talked to, then people active in the feed. There is no public member directory.
      const ids = [];
      Object.keys(S.cloudThreads || {}).forEach((k) => k.split('|').forEach((x) => { if (x !== me && !ids.includes(x)) ids.push(x); }));
      (S.cloudFeed || []).forEach((p) => { if (p.author !== me && !ids.includes(p.author)) ids.push(p.author); });
      return ids.map((id) => ({ id, name: memberName(id), bio: 'YOURS member' }));
    }
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
  // Anonymous usage counts (see logEventNow below). Never blocks or throws.
  function logEvent(name) { try { logEventNow(name); } catch { /* analytics never breaks the app */ } }
  // Anonymous counts only: an event name, nothing about her. Views are counted once a day per device,
  // funnel steps once per device. Browsers set to Do Not Track or Global Privacy Control send nothing.
  const ONCE_A_DAY = ['app_open', 'landing_view'];
  const ONCE_EVER = ['signup_start', 'onboarding_done', 'account_created', 'checkout_start', 'invite_opened', 'invite_claimed', 'install_done'];
  function logEventNow(name) {
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl) return;
    if (/^(localhost|127\.)/.test(location.hostname) && !window.YOURS_TRACK_LOCAL) return;
    const sent = store.get('yours.ev', {});
    const key = ONCE_A_DAY.includes(name) ? `${name}:${todayKey()}` : ONCE_EVER.includes(name) ? name : null;
    if (key && sent[key]) return;
    if (key) { sent[key] = 1; Object.keys(sent).forEach((k) => { if (k.includes(':') && !k.endsWith(todayKey())) delete sent[k]; }); store.set('yours.ev', sent); }
    const body = new Blob([JSON.stringify({ name })], { type: 'application/json' });
    if (!(navigator.sendBeacon && navigator.sendBeacon('/api/event', body))) fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }), keepalive: true }).catch(() => {});
  }

  // Record newly reached badges (earned once, kept forever). Returns the new ones.
  function awardBadges(announce) {
    if (!S.data || !S.data.onboarded) return [];
    let fresh = [];
    try { fresh = L.newBadges(S.data); } catch { return []; }
    if (!fresh.length) return [];
    S.data.badges = { ...(S.data.badges || {}) };
    fresh.forEach((b) => { S.data.badges[b.id] = todayKey(); logEvent('badge_earned'); });
    save();
    if (announce) toast(`Badge unlocked: ${fresh[fresh.length - 1].title}`);
    return fresh;
  }

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
        ${pendingInvite() && !regionBlocked() ? `<div class="banner" style="margin-bottom:12px">${icon('gift', 18)}<div class="grow small"><strong>A friend invited you.</strong> Your free trial is 3 weeks instead of 1.</div></div>` : ''}
        <button class="btn primary block" data-action="start">Get started</button>
        <button class="btn ghost block" data-action="go-login">I have an account</button>
        ${billingOn() ? '' : '<button class="btn soft block" data-action="demo">Try the demo</button>'}
        ${regionBlocked() ? '<p class="tiny center" style="margin-top:14px"><strong>YOURS is only available in the United States right now. We hope to come to you soon.</strong></p>' : ''}
        <p class="tiny center" style="margin-top:14px">We never sell your data. <button class="link tiny" data-action="open-privacy">Privacy</button> · <button class="link tiny" data-action="open-legal" data-doc="terms">Terms</button> · <button class="link tiny" data-action="open-legal" data-doc="health">Health data policy</button></p>
        <div class="p-row" style="margin-top:12px;opacity:.7"><span>Cycle</span><span>Vol. 01</span></div>
      </div>
    </div>`;
  }

  // ---------- landing page (first visit in a browser; the installed app opens straight to the welcome screen) ----------
  const showLanding = () => !S.session && S.screen !== 'login' && !isStandalone();
  function viewLanding() {
    logEvent('landing_view');
    const paid = billingOn();
    const days = trialDays();
    const m = priceFor('monthly'), y = priceFor('yearly');
    const save = m && y ? Math.round((1 - y.amount / (m.amount * 12)) * 100) : 0;
    const cta = (cls) => `<button class="btn primary ${cls || ''}" data-action="start">${paid ? `Start your ${days}-day free trial` : 'Build my plan'}</button>`;
    const phone = (img, alt) => `<div class="lp-phone"><img src="img/landing/${img}.jpg" alt="${esc(alt)}" width="390" height="844" loading="lazy"></div>`;
    const phases = [
      ['menstrual', 'Period week', 'Lighter lifts, mobility and more rest. Iron-rich meals and gentle movement for cramps.'],
      ['follicular', 'Follicular', 'Energy climbs. Your best window to add weight and learn new lifts.'],
      ['ovulation', 'Ovulation', 'Peak strength. Heavy days, personal records and power work.'],
      ['luteal', 'Luteal', 'Steady weights, quality reps and a little more food, on purpose.'],
    ];
    const features = [
      ['workouts', 'Every weight, suggested', 'YOURS tells you what to lift for every set, lighter on period days and low-energy days, heavier when you are ready.'],
      ['calendar', 'Plans for every life stage', 'Natural cycle, the pill, PCOS, perimenopause, menopause and after baby. No regular cycle needed.'],
      ['meals', 'Food in seconds', 'Snap your plate, say what you ate or scan a barcode. Calories and protein set for your phase.'],
      ['list', 'A weekly check-in', 'Photos, weigh-in and three questions. Next week\'s training, steps and calories adjust to you.'],
      ['image', 'Before and after', 'A private photo vault, locked with your PIN, with a slider to see the change.'],
      ['trend', 'Strength by phase', 'See how your cycle affects your lifts, with badges and personal records along the way.'],
      ['advisor', 'A coach in your pocket', 'Ask anything about training, food or recovery and get answers built around your data.'],
      ['community', 'Women who lift', 'Share wins, ask questions and message other members.'],
    ];
    const faqs = [
      ['Do I need a regular cycle?', 'No. YOURS has plans for irregular cycles, PCOS, hormonal birth control, perimenopause, menopause and postpartum. Without a natural cycle, your week follows your daily check-in instead.'],
      ['I have never lifted. Is it for me?', 'Yes. Beginner foundations teaches the basic movements in 8 weeks, and every exercise comes with simple cues and a suggested starting weight.'],
      ['Gym or home?', 'Both. Home strength needs only dumbbells and a band, and any exercise can be swapped if a machine is taken.'],
      ['What happens after the free trial?', `It becomes ${money(m)} a month or ${money(y)} a year. Cancel anytime before the trial ends in Profile and you won't be charged.`],
      ['Is my data private?', 'Yes. We never sell your data or use it for ads. Progress photos stay on your phone, locked with your PIN.'],
      ['Is this medical advice?', 'No. YOURS is a fitness and nutrition coach. Talk to your doctor before starting, especially if you are pregnant, postpartum or managing a condition.'],
    ];
    return `<div class="lp">
      <header class="lp-top"><div class="wordmark sm">yours.</div><div class="row" style="gap:10px"><button class="link small" data-action="go-login">Sign in</button>${paid ? '' : '<button class="btn soft xs" data-action="demo">Demo</button>'}</div></header>
      ${regionBlocked() ? `<div class="banner lp-wrap" style="margin-top:8px" role="status">${icon('shield', 18)}<div class="grow small"><strong>YOURS is only available in the United States right now.</strong> We hope to come to you soon.</div></div>` : ''}
      ${pendingInvite() && !regionBlocked() ? `<div class="banner lp-wrap" style="margin-top:8px">${icon('gift', 18)}<div class="grow small"><strong>A friend invited you.</strong> Your free trial is 3 weeks instead of 1.</div></div>` : ''}
      <section class="lp-hero lp-wrap">
        <div class="lp-hero-copy">
          <div class="eyebrow">Strength training for women</div>
          <h1 class="lp-h1">Train with your cycle, not against&nbsp;it.</h1>
          <p class="lp-lead">YOURS plans your workouts, food and steps around your cycle or life stage, suggests the weight for every lift, and adapts every week.</p>
          <div class="lp-cta">${cta()}<button class="btn ghost" data-action="go-login">I have an account</button></div>
          <p class="tiny muted" style="margin-top:12px">${paid ? `${days} days free, then ${money(m)} a month or ${money(y)} a year. Cancel anytime.` : 'Your plan in about 2 minutes.'}</p>
        </div>
        <div class="lp-hero-phone">${phone('home', 'YOURS home screen: day 10 of the cycle, follicular phase, rising energy')}</div>
      </section>

      <section class="lp-wrap lp-sec">
        <h2 class="lp-h2">Four phases. One plan that moves with them.</h2>
        <div class="lp-phases">${phases.map(([k, t, d]) => `<div class="lp-phase"><span class="lp-dot" style="background:var(--${k})"></span><h3>${esc(t)}</h3><p class="small muted">${esc(d)}</p></div>`).join('')}</div>
        <p class="small muted" style="margin-top:14px">No regular cycle? On the pill, PCOS, perimenopause, menopause or after baby, YOURS follows your stage and your daily check-in.</p>
      </section>

      <section class="lp-sec">
        <h2 class="lp-h2 lp-wrap">See it in action</h2>
        <div class="lp-screens" tabindex="0" role="region" aria-label="App screenshots, scroll sideways">${[['workout', 'The weight for every set', 'Workout logger with a suggested 175 lb x 9 on hip thrusts'], ['meals', 'Snap, say or scan your food', 'Food diary with calories and protein remaining'], ['insights', 'Your strength by phase', 'Chart showing strength is highest in the ovulation phase']].map(([img, cap, alt]) => `<figure>${phone(img, alt)}<figcaption class="small">${esc(cap)}</figcaption></figure>`).join('')}</div>
        <p class="tiny muted lp-wrap" style="margin-top:8px">Screens from the YOURS demo account.</p>
      </section>

      <section class="lp-wrap lp-sec">
        <h2 class="lp-h2">How it works</h2>
        <ol class="lp-steps">${[['Tell us about you', 'Your cycle or life stage, goal, experience and how active you are. About two minutes.'], ['Get your plan', 'Workouts, weights, calories, protein and steps for today and every phase.'], ['It learns from you', 'Log lifts, food and a 20-second daily check-in. Your plan adjusts every week.']].map(([t, d], i) => `<li><span class="lp-num">0${i + 1}</span><div><h3>${esc(t)}</h3><p class="small muted">${esc(d)}</p></div></li>`).join('')}</ol>
      </section>

      <section class="lp-wrap lp-sec">
        <h2 class="lp-h2">Everything in one app</h2>
        <div class="lp-features">${features.map(([ic, t, d]) => `<div class="lp-feature">${icon(ic, 22)}<h3>${esc(t)}</h3><p class="small muted">${esc(d)}</p></div>`).join('')}</div>
      </section>

      <section class="lp-wrap lp-sec">
        <h2 class="lp-h2">8-week programs</h2>
        <div class="chips" style="margin-top:12px">${D.PROGRAMS.map((pr) => `<span class="chip">${esc(pr.name)}</span>`).join('')}</div>
        <p class="small muted" style="margin-top:10px">From your first goblet squat to your first pull-up, a stronger glute build, training at home, after baby or through menopause.</p>
      </section>

      ${D.TESTIMONIALS.length ? `<section class="lp-wrap lp-sec"><h2 class="lp-h2">From members</h2><div class="lp-quotes">${D.TESTIMONIALS.map((t) => `<figure class="lp-quote"><blockquote class="serif">“${esc(t.quote)}”</blockquote><figcaption class="small muted">${esc(t.name)}${t.detail ? ` · ${esc(t.detail)}` : ''}</figcaption></figure>`).join('')}</div></section>` : ''}

      ${paid ? `<section class="lp-wrap lp-sec" id="pricing">
        <h2 class="lp-h2">Simple pricing</h2>
        <div class="lp-prices">
          <div class="lp-price"><div class="row between"><h3>Yearly</h3>${save > 0 ? `<span class="tag accent">Save ${save}%</span>` : ''}</div><div class="serif lp-amount">${money(y)}<span class="small muted"> / year</span></div><p class="tiny muted">${money({ amount: Math.round((y.amount / 12) * 100) / 100, currency: y.currency })} a month, billed yearly</p></div>
          <div class="lp-price"><h3>Monthly</h3><div class="serif lp-amount">${money(m)}<span class="small muted"> / month</span></div><p class="tiny muted">Cancel anytime</p></div>
        </div>
        <p class="small" style="margin-top:12px">Both start with <strong>${days} days free</strong>. Cancel before the trial ends and you won't be charged.</p>
        <div style="margin-top:16px">${cta('block')}</div>
      </section>` : ''}

      <section class="lp-wrap lp-sec">
        <h2 class="lp-h2">Questions</h2>
        <div class="lp-faq">${faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p class="small muted">${esc(a)}</p></details>`).join('')}</div>
      </section>

      <section class="lp-wrap lp-sec lp-final">
        <div class="wordmark xl" style="color:inherit">yours.</div>
        <p class="lp-lead" style="margin:14px 0 18px">Your body changes every week. Your training should too.</p>
        ${cta('cream')}
      </section>

      <footer class="lp-wrap lp-foot">
        <p class="small"><strong>We never sell your data.</strong></p>
        <p class="tiny" style="margin-top:8px"><button class="link tiny" data-action="open-privacy">Privacy</button> · <button class="link tiny" data-action="open-legal" data-doc="terms">Terms</button> · <button class="link tiny" data-action="open-legal" data-doc="health">Health data policy</button> · ${mailLink('YOURS question', 'Contact')}</p>
        <p class="tiny muted" style="margin-top:8px">YOURS is a fitness and nutrition app, not medical advice. Available in the United States. © ${new Date().getFullYear()} YOURS.</p>
      </footer>
    </div>`;
  }

  function viewLogin() {
    return `<div class="screen no-nav">
      <div class="top"><button class="icon-btn" data-action="go-welcome" aria-label="Back">${icon('back', 20)}</button><div class="wordmark sm">yours.</div><span style="width:40px"></span></div>
      <h1 style="margin-top:24px">Welcome back</h1>
      <p class="muted" style="margin-top:6px">Sign in to pick up where you left off.</p>
      <form data-form="login" class="card" style="margin-top:24px">
        <label class="field"><span class="label">Email</span><input class="input" type="email" name="email" autocomplete="email" required value="${esc(S.prefillEmail || '')}"></label>
        <label class="field"><span class="label">Password</span><input class="input" type="password" name="password" autocomplete="current-password" required></label>
        ${S.authError ? `<p class="error" style="margin-top:12px">${esc(S.authError)}</p>` : ''}
        <button class="btn primary block" style="margin-top:18px" type="submit" ${S.authBusy ? 'disabled' : ''}>${S.authBusy ? 'Signing in...' : 'Sign in'}</button>
        ${cloud ? '<p class="center small" style="margin-top:12px"><button type="button" class="link" data-action="forgot-password">Forgot password?</button></p>' : ''}
      </form>
      <p class="center small muted" style="margin-top:20px">New here? <button class="link" data-action="start">Build your plan</button></p>
      ${billingOn() ? '' : '<p class="center small" style="margin-top:8px"><button class="link" data-action="demo">Try the demo</button></p>'}
    </div>`;
  }

  function signupForm(context) {
    return `<form data-form="signup" data-context="${context}">
      <label class="field"><span class="label">First name</span><input class="input" name="name" autocomplete="given-name" required maxlength="40" value="${esc((S.authForm || {}).name || '')}"></label>
      <label class="field"><span class="label">Email</span><input class="input" type="email" name="email" autocomplete="email" required value="${esc((S.authForm || {}).email || '')}"></label>
      <label class="field"><span class="label">Password</span><input class="input" type="password" name="password" autocomplete="new-password" minlength="${cloud ? 8 : 6}" required placeholder="At least ${cloud ? 8 : 6} characters" value="${esc((S.authForm || {}).password || '')}"></label>
      <label class="row" style="gap:10px;align-items:flex-start;margin-top:16px;cursor:pointer"><input type="checkbox" name="agree" required ${(S.authForm || {}).agree ? 'checked' : ''} style="width:20px;height:20px;margin-top:2px;flex:none;accent-color:var(--green)"><span class="small">I am 18 or older and agree to the <button type="button" class="link small" data-action="open-legal" data-doc="terms">Terms of Service</button> and <button type="button" class="link small" data-action="open-legal" data-doc="waiver">Health &amp; Safety Waiver</button>, including that YOURS is not medical advice.</span></label>
      <label class="row" style="gap:10px;align-items:flex-start;margin-top:10px;cursor:pointer"><input type="checkbox" name="health" required ${(S.authForm || {}).health ? 'checked' : ''} style="width:20px;height:20px;margin-top:2px;flex:none;accent-color:var(--green)"><span class="small">I consent to YOURS collecting and using my health data (cycle, symptoms, weight, food, photos) to build my plan, as described in the <button type="button" class="link small" data-action="open-legal" data-doc="health">Consumer Health Data Privacy Policy</button>.</span></label>
      ${S.authError ? `<p class="error" style="margin-top:12px">${esc(S.authError)}</p>` : ''}
      <button class="btn primary block" style="margin-top:18px" type="submit">Save my plan</button>
      <p class="tiny muted center" style="margin-top:10px">We never sell or share your data. <button type="button" class="link tiny" data-action="open-privacy">Privacy</button></p>
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
        ? `<h1>Your rhythm</h1><p class="muted" style="margin:8px 0 24px">Without a natural cycle to follow, YOURS plans a steady week of strength training and recovery, and adjusts each day to your check-in.</p>
           <div class="card soft"><div class="eyebrow">Your week</div><p style="margin-top:8px">Lower strength, upper strength, rest, glutes, upper sculpt, full body strength, rest.</p></div>`
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
      ${isGuest() ? `<div class="card" style="margin-top:24px">
        <h2>Save your plan</h2>
        <p class="muted small" style="margin:4px 0 16px">Create a free account to keep your plan and unlock progress photos and the community.</p>
        ${signupForm('reveal')}
      </div>
      ${billingOn() ? `<p class="center small muted" style="margin-top:12px">Then start your ${trialDays()}-day free trial.</p>` : '<button class="btn ghost block" style="margin-top:12px" data-action="continue-guest">Continue as guest</button>'}
      <p class="center small" style="margin-top:14px"><button class="link" data-action="go-login">I already have an account</button></p>` : `<button class="btn primary block" style="margin-top:24px" data-action="start-plan">${billingOn() && !memberHasAccess() ? `Start my ${trialDays()}-day free trial` : 'Start my plan'}</button>
      <p class="center small muted" style="margin-top:10px">Saved to your account${isCloud() ? ' and synced to your devices' : ''}.</p>`}
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
      ${installCard()}
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
      ${trialEndingBanner()}
      ${checkinCard()}
      ${weighInCard()}
      ${smartSuggestion(c, wk)}

      <div class="section-title"><h2>Today's workout</h2><button class="link" data-action="tab" data-tab="workouts">See plan</button></div>
      ${poster('session', `
        <div class="p-row"><span>${esc(wk.focus)}</span><span>${wk.minutes} min · ${esc(wk.intensity)}</span></div>
        <div class="p-body">
          <div class="p-serif">${esc(wk.summary.split('.')[0])}.</div>
          ${(() => { const pg = L.programDay(S.data, today()); return pg && !pg.complete ? `<div class="p-cap" style="margin-top:10px">${esc(pg.program.name)} · week ${pg.week} of ${pg.total}</div>` : ''; })()}
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
  // Bodyweight and skill work gets no weight suggestion.
  const BODYWEIGHT = /pelvic|breathing|clam|heel slide|bird dog|dead bug|wall push|push-up|sit-to-stand|plank|hang\b|hollow|pogo|marching|balance|heel drop|scapular|negative|pull-up attempt|assisted pull|inverted row|frog pump|box jump|jump rope|band pull|band row|banded|pallof|cat-cow|90\/90|stretch|rotation|walk\b/i;
  function loadHint(ex) {
    if (BODYWEIGHT.test(ex.name)) return '';
    const s = L.suggestLoad(ex.name, ex.reps, S.data.workouts, { phase: cyc().phase, readiness: readinessToday(), unit: unit() });
    if (!s) return '';
    if (s.first) return '<div class="tiny" style="margin-top:4px;color:var(--accent-ink)">First time: pick a weight with 2-3 reps left in the tank</div>';
    return `<div class="tiny" style="margin-top:4px"><strong style="color:var(--accent-ink)">Today: ${fmtLoad(s.weight, s.unit)} x ${s.reps}</strong> <span class="muted">· last ${fmtLoad(s.last.weight, s.unit)} x ${s.last.reps}</span></div>`;
  }

  function exerciseList(wk, withLoads) {
    return `<ul class="ex-list">${wk.exercises.map((ex, i) => `<li><span class="ex-num">${i + 1}</span><div class="grow"><div class="row between"><button class="ex-link" data-action="open-exercise" data-name="${esc(ex.name)}"><strong>${esc(ex.name)}</strong></button><span class="small muted">${adjustSets(ex)} x ${esc(ex.reps)}</span></div><div class="small muted">${esc(ex.cue)}${ex.rest !== '-' ? ` · Rest ${esc(ex.rest)}` : ''}</div>${withLoads ? loadHint(ex) : ''}</div></li>`).join('')}</ul>`;
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
      ${programSection()}

      <div class="section-title"><h2>${S.data.program && L.programDay(S.data, today()) && !L.programDay(S.data, today()).complete ? 'Today in your program' : 'Recommended today'}</h2><span class="tag">${esc(wk.intensity)}</span></div>
      ${poster(wk.phase === 'any' ? 'steady' : wk.phase === 'program' ? (c.steady ? 'steady' : c.phase) : wk.phase, `
        <div class="p-row"><span>${esc(wk.focus)}</span><span>${wk.minutes} min</span></div>
        <div class="p-body"><div class="p-serif">${esc(wk.summary.split('.')[0])}.</div><div class="p-title">${esc(wk.name)}</div><div class="p-cap">${esc(copyFor(c.phase).cap)}</div></div>`, 'short')}
      <div class="card" style="margin-top:12px">
        <div class="why" style="margin-top:0">${esc(wk.phase === 'program' ? (() => { const pg = L.programDay(S.data, today()); return pg && pg.block ? `${pg.block.title}: ${pg.block.note}${c.phase === 'menstrual' ? ' On heavy-flow days, drop a set if you need to.' : ''}` : wk.summary; })() : ph.training)}</div>
        ${exerciseList(wk, true)}
        <p class="tiny muted" style="margin-top:8px">${levelNote}${vol ? ` Your weekly check-in ${vol > 0 ? 'added' : 'removed'} a set on main lifts.` : ''} Suggested weights adjust for your phase and readiness.</p>
        <div class="row" style="margin-top:14px">
          ${done ? `<span class="btn soft block" style="pointer-events:none">${icon('check', 18)} Completed today</span>` : `<button class="btn primary grow" data-action="start-workout" data-id="${wk.id}">Start workout</button>`}
          <button class="btn ghost" data-action="swap-today" aria-label="Choose another workout">${icon('swap', 18)}</button>
        </div>
      </div>

      <div class="section-title"><h2>This week</h2><button class="link" data-action="log-other">Log activity</button></div>
      <div class="card">${thisWeek.length ? thisWeek.map((w) => `<div class="list-item"><div class="ex-num">${icon('check', 14, 2.4)}</div><div class="grow"><strong>${esc(w.name)}</strong><div class="small muted">${fmtDate(parseKey(w.date), { weekday: 'short', month: 'short', day: 'numeric' })} · ${w.minutes} min${w.sets ? ` · ${w.sets} sets` : ''}</div></div>${(S.data.prs || []).some((p) => p.workoutId === w.id) ? '<span class="tag accent">PR</span>' : ''}</div>`).join('') : '<div class="empty">No sessions logged yet this week. Today is a great day to start.</div>'}</div>

      ${myWorkoutsSection()}
      <button class="card lib-entry" data-action="open-library"><div class="row between"><div><div class="eyebrow">Exercise library</div><strong style="display:block;margin-top:4px">Every exercise, with form guides and your records</strong><div class="tiny muted" style="margin-top:4px">Muscles worked, how to do it, common mistakes, strength charts and history.</div></div>${icon('search', 22)}</div></button>
      <div class="section-title"><h2>Workout library</h2></div>
      <div class="chips">${D.PHASE_ORDER.concat(['menopause']).map((p) => `<button class="chip ${lib === p ? 'selected' : ''}" data-action="lib-phase" data-phase="${p}"><span class="dot" style="background:var(--${p})"></span>${phaseName(p)}</button>`).join('')}</div>
      <div class="h-scroll" style="margin-top:14px">${D.WORKOUTS.filter((w) => w.phase === lib).map((w) => `<button class="poster mini" data-action="view-workout" data-id="${w.id}">${backdrop(lib)}<div class="p-row"><span>${w.minutes} min</span><span>${esc(w.intensity)}</span></div><div class="p-body"><div class="p-title">${esc(w.name)}</div><div class="p-cap" style="letter-spacing:.2em">${esc(w.focus)}</div></div></button>`).join('')}</div>
    </div>`;
  }

  // ---------- terms, waiver and proof of agreement ----------
  const LEGAL = window.YOURS_LEGAL;
  const termsOk = () => !!(S.data && S.data.terms && S.data.terms.version === LEGAL.VERSION);
  async function recordConsentIfNeeded() {
    const t = S.data && S.data.terms;
    if (!isCloud() || !t || t.version !== LEGAL.VERSION || t.recorded) return;
    try { await cloud.recordConsent(t.version, 'terms,waiver,age18,health_data,arbitration'); t.recorded = true; save(); } catch { /* retried at next sign-in */ }
  }
  function acceptTerms() {
    S.data.terms = { version: LEGAL.VERSION, at: Date.now(), health: true, recorded: false };
    save();
    recordConsentIfNeeded();
  }
  function viewAgreement() {
    const updated = S.data.terms && S.data.terms.version !== LEGAL.VERSION;
    return `<div class="screen no-nav">
      <div class="top"><div class="wordmark sm">yours.</div></div>
      <div class="eyebrow" style="margin-top:22px">${updated ? 'We updated our terms' : 'One last thing'}</div>
      <h1 style="margin-top:6px">Before you start</h1>
      <p class="muted" style="margin-top:8px">Please read and agree to these so you can train safely with YOURS.</p>
      <ul class="phase-list" style="margin-top:16px">
        <li class="small"><span>YOURS is general fitness information, <strong>not medical advice</strong>. Check with your doctor before starting, especially if you are pregnant, postpartum, in menopause, or have a health condition or injury.</span></li>
        <li class="small"><span>Exercise and diet changes carry risks of injury. You take part voluntarily, accept those risks, and release YOURS from liability as far as the law allows.</span></li>
        <li class="small"><span>Cycle predictions are estimates. <strong>Never use them as contraception.</strong></span></li>
        <li class="small"><span>Food, macro and AI coach estimates can be wrong. Stop and get help if anything hurts or feels wrong.</span></li>
        <li class="small"><span>You are 18 or older and in the United States, and memberships renew automatically until you cancel.</span></li>
        <li class="small"><span>Disputes are settled by individual arbitration, not class actions. You can opt out within 30 days.</span></li>
      </ul>
      <div class="row" style="margin-top:14px"><button class="btn ghost sm grow" data-action="open-legal" data-doc="waiver">Read the waiver</button><button class="btn ghost sm grow" data-action="open-legal" data-doc="terms">Read the terms</button></div>
      <button class="btn ghost sm block" style="margin-top:8px" data-action="open-legal" data-doc="health">Consumer Health Data Privacy Policy</button>
      <button class="list-item" style="width:100%;text-align:left;margin-top:16px" data-action="agree-toggle" aria-pressed="${!!S.agreeChecked}"><span class="check ${S.agreeChecked ? 'on' : ''}" style="width:24px;height:24px;border-radius:7px;flex:none">${S.agreeChecked ? icon('check', 12) : ''}</span><span class="small grow">I am 18 or older and I agree to the Terms of Service and the Health &amp; Safety Waiver.</span></button>
      <button class="list-item" style="width:100%;text-align:left" data-action="health-toggle" aria-pressed="${!!S.healthChecked}"><span class="check ${S.healthChecked ? 'on' : ''}" style="width:24px;height:24px;border-radius:7px;flex:none">${S.healthChecked ? icon('check', 12) : ''}</span><span class="small grow">I consent to YOURS collecting and using my health data (cycle, symptoms, weight, food, photos) to build my plan, as described in the Consumer Health Data Privacy Policy.</span></button>
      <button class="btn primary block" style="margin-top:16px" data-action="agree-continue" ${S.agreeChecked && S.healthChecked ? '' : 'disabled'}>I agree, continue</button>
      <p class="center small" style="margin-top:14px"><button class="link" data-action="logout">${isGuest() ? 'Start over' : 'Sign out'}</button></p>
    </div>`;
  }
  function legalSheet(doc) {
    const items = doc === 'waiver' ? LEGAL.WAIVER : doc === 'health' ? LEGAL.HEALTH : LEGAL.TERMS;
    return `${items.map(([h, t]) => `<div class="label" style="margin-top:16px">${esc(h)}</div><p class="small" style="margin-top:4px">${esc(t)}</p>`).join('')}
      <p class="tiny muted" style="margin-top:18px">Version ${esc(LEGAL.VERSION)}.${S.data && S.data.terms ? ` You agreed on ${fmtDate(new Date(S.data.terms.at), { month: 'long', day: 'numeric', year: 'numeric' })}.` : ''}</p>
      <div class="row" style="margin-top:12px;flex-wrap:wrap">${['terms', 'waiver', 'health'].filter((d) => d !== doc).map((d) => `<button class="btn ghost sm grow" data-action="open-legal" data-doc="${d}">${{ terms: 'Terms of Service', waiver: 'Health &amp; Safety Waiver', health: 'Health data policy' }[d]}</button>`).join('')}<button class="btn ghost sm grow" data-action="open-privacy">Privacy</button></div>`;
  }

  // ---------- add to Home Screen ----------
  const isStandalone = () => !!(window.navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));
  function installPlatform() {
    const ua = navigator.userAgent || '';
    if (isStandalone()) return 'installed';
    const ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    if (ios) return /CriOS|FxiOS|EdgiOS|FBAN|FBAV|Instagram|TikTok|Snapchat|Pinterest|LinkedInApp|GSA\//i.test(ua) ? 'ios-other' : 'ios-safari';
    if (/android/i.test(ua)) return /FBAN|FBAV|Instagram|TikTok|Snapchat|Pinterest/i.test(ua) ? 'android-inapp' : 'android';
    return 'desktop';
  }
  // Little pictures of the buttons she will tap, drawn to match the phone's own icons.
  const IOS_SHARE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M8 11H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2"/></svg>';
  const IOS_ADD = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
  const DOTS = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
  const DOTS_H = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
  function installSteps(platform) {
    const step = (n, html, pic) => `<li class="install-step"><span class="install-n">${n}</span><span class="grow">${html}</span>${pic ? `<span class="install-pic">${pic}</span>` : ''}</li>`;
    if (platform === 'ios-safari') return `<ol class="install-steps">
        ${step(1, 'Tap the <strong>Share</strong> button. It is in the bar at the bottom of Safari (or tap <strong>•••</strong> first, then Share).', IOS_SHARE)}
        ${step(2, 'Scroll down and tap <strong>Add to Home Screen</strong>.', IOS_ADD)}
        ${step(3, 'Tap <strong>Add</strong> in the top corner.', '')}
        ${step(4, 'Open YOURS from the new icon on your Home Screen. It opens full screen, like an app.', '<img src="/icons/icon-192.png" alt="" width="34" height="34" style="border-radius:9px">')}
      </ol>`;
    if (platform === 'ios-other') return `<div class="banner" style="margin:0 0 14px">${icon('advisor', 18)}<div class="grow small">You're in another app's browser. On iPhone, YOURS can only be added to your Home Screen from <strong>Safari</strong>.</div></div>
      <ol class="install-steps">
        ${step(1, 'Copy the YOURS link.', '')}
        ${step(2, 'Open <strong>Safari</strong> and paste the link into the address bar. (Or tap <strong>•••</strong> and choose <strong>Open in Safari / Open in browser</strong>.)', DOTS_H)}
        ${step(3, 'In Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>, then <strong>Add</strong>.', IOS_SHARE)}
      </ol>
      <button class="btn primary block" style="margin-top:14px" data-action="install-copy">Copy the YOURS link</button>`;
    if (platform === 'android-inapp') return `<ol class="install-steps">
        ${step(1, 'Tap <strong>⋮</strong> or <strong>•••</strong> at the top and choose <strong>Open in Chrome</strong> (or Open in browser).', DOTS)}
        ${step(2, 'In Chrome, tap <strong>⋮</strong>, then <strong>Add to Home screen</strong> or <strong>Install app</strong>.', DOTS)}
      </ol>
      <button class="btn ghost block" style="margin-top:14px" data-action="install-copy">Copy the YOURS link</button>`;
    if (platform === 'android') return `${S.installPrompt ? '<button class="btn primary block" style="margin-bottom:16px" data-action="install">Install YOURS</button><p class="tiny muted center" style="margin:-6px 0 14px">Or do it yourself:</p>' : ''}<ol class="install-steps">
        ${step(1, 'In Chrome, tap the <strong>⋮</strong> menu in the top corner.', DOTS)}
        ${step(2, 'Tap <strong>Add to Home screen</strong> or <strong>Install app</strong>.', IOS_ADD)}
        ${step(3, 'Tap <strong>Install</strong> (or Add). YOURS appears with your other apps.', '<img src="/icons/icon-192.png" alt="" width="34" height="34" style="border-radius:9px">')}
      </ol>`;
    return `${S.installPrompt ? '<button class="btn primary block" style="margin-bottom:16px" data-action="install">Install YOURS on this computer</button>' : ''}<p class="small">YOURS is made for your phone. Open <strong>${esc(location.host)}</strong> on your phone and come back to this screen for the steps. On a computer, Chrome and Edge show an install icon at the right of the address bar.</p>
      <button class="btn ghost block" style="margin-top:14px" data-action="install-copy">Copy the YOURS link</button>`;
  }
  function installCard() {
    const platform = installPlatform();
    if (platform === 'installed' || platform === 'desktop' || (S.data.tips || {}).install) return '';
    return `<div class="card install-card" style="margin-bottom:12px"><div class="row" style="gap:14px;align-items:flex-start">
      <img src="/icons/icon-192.png" alt="" width="48" height="48" style="border-radius:12px;flex:none">
      <div class="grow"><strong>Get the YOURS app</strong><p class="small muted" style="margin-top:4px">Add it to your Home Screen: full screen, one tap to open${/^ios/.test(platform) ? ', and reminders on iPhone' : ', and reminders'}. Free, no app store needed.</p>
      <div class="row" style="margin-top:10px">${platform === 'android' && S.installPrompt ? '<button class="btn primary sm" data-action="install">Install</button>' : '<button class="btn primary sm" data-action="open-install">Show me how</button>'}</div></div>
      <button class="icon-btn" style="width:30px;height:30px;flex:none" data-action="dismiss-tip" data-tip="install" aria-label="Dismiss">${icon('x', 14)}</button></div></div>`;
  }

  // ---------- reminders (web push) and emails ----------
  const REMINDER_KINDS = [['workout', "Today's workout", 17], ['checkin', 'Check-in day', 9], ['weigh', 'Morning weigh-in', 7], ['meals', 'Log your food', 20], ['cycle', 'Lighter week ahead (2 days before)', 9]];
  const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const iosNeedsInstall = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));
  const hourLabel = (h) => `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`;
  function urlKey(b64) {
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  }
  async function enableReminders() {
    if (!isCloud()) return toast('Sign in to turn on reminders');
    if (!pushSupported()) return toast(iosNeedsInstall() ? 'Add YOURS to your Home Screen first, then turn on reminders there.' : 'This browser does not support reminders.');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return toast('Notifications are blocked. Allow them in your phone settings to get reminders.');
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlKey((window.YOURS_CONFIG || {}).vapidPublicKey) }));
      await cloud.savePush(sub);
      const r = S.data.reminders || {};
      S.data.reminders = { ...r, on: true, tz: Intl.DateTimeFormat().resolvedOptions().timeZone };
      REMINDER_KINDS.forEach(([k, , hour]) => { S.data.reminders[k] = { on: true, hour, ...(r[k] || {}) }; });
      save(); render();
      toast('Reminders are on');
    } catch { toast('Could not turn on reminders. Try again.'); }
  }
  async function disableReminders() {
    S.data.reminders = { ...(S.data.reminders || {}), on: false };
    save(); render();
    try { const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription(); if (sub) { if (isCloud()) await cloud.removePush(sub.endpoint).catch(() => {}); await sub.unsubscribe(); } } catch { /* already off */ }
  }
  function remindersCard() {
    if (!isCloud()) return '';
    const r = S.data.reminders || {};
    const on = !!r.on;
    const rows = REMINDER_KINDS.filter(([k]) => k !== 'cycle' || !cyc().steady).map(([k, label, def]) => { const p = r[k] || { on: true, hour: def }; return `<div class="row between" style="margin-top:10px"><button class="row" style="gap:10px;text-align:left" data-action="reminder-toggle" data-kind="${k}" aria-pressed="${p.on !== false}"><span class="check ${p.on !== false ? 'on' : ''}" style="width:22px;height:22px;border-radius:7px">${p.on !== false ? icon('check', 12) : ''}</span><span class="small">${label}</span></button><select class="select" style="width:auto;height:36px;padding:0 10px" data-reminder-hour="${k}" aria-label="${label} time" ${p.on === false ? 'disabled' : ''}>${Array.from({ length: 24 }, (_, h) => `<option value="${h}" ${h === (Number.isInteger(p.hour) ? p.hour : def) ? 'selected' : ''}>${hourLabel(h)}</option>`).join('')}</select></div>`; }).join('');
    return `<div class="card flat small"><div class="label">Reminders</div>
      ${on ? `<p class="muted">Only when there's something to do: no workout reminder on rest days or once you've trained. Lock-screen text never mentions your cycle or weight.</p>${rows}
        <div class="row" style="margin-top:12px"><button class="btn ghost sm grow" data-action="reminders-test">Send a test</button><button class="btn ghost sm grow" data-action="reminders-off">Turn off</button></div>`
        : `<p class="muted">Gentle nudges for your workout, check-in day, weigh-in and food log, at times you choose.${iosNeedsInstall() ? ' On iPhone, first add YOURS to your Home Screen and open it from there.' : ''}</p>${iosNeedsInstall() ? '<button class="btn primary sm block" style="margin-top:10px" data-action="open-install">Show me how to add it</button>' : '<button class="btn primary sm block" style="margin-top:10px" data-action="reminders-on">Turn on reminders</button>'}`}
      <div class="row between" style="margin-top:14px"><span class="small">Weekly summary email</span><button class="chip ${S.emailWeekly === false ? '' : 'selected'}" data-action="toggle-weekly-email">${S.emailWeekly === false ? 'Off' : 'On'}</button></div>
    </div>`;
  }

  // ---------- contact ----------
  const SUPPORT_EMAIL = 'yoursfitapp@gmail.com';
  const mailLink = (subject, label) => `<a class="link" href="mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}">${esc(label || SUPPORT_EMAIL)}</a>`;

  // ---------- membership (Stripe via /api/billing; status mirrored in Supabase) ----------
  const billingOn = () => !!(S.billing && S.billing.enabled && cloud);
  const regionBlocked = () => !!(S.billing && S.billing.region && S.billing.region.allowed === false);
  const trialDays = () => ((S.billing && S.billing.trialDays) || 7) + inviteBonusDays();

  // ---------- invite friends (/api/referral) ----------
  // An invite link (?invite=CODE) is remembered on this device until she has an account, then claimed once.
  // The friend gets 2 extra trial weeks; the inviter gets a free month when the friend's first payment goes through.
  const INVITE_BONUS = 14;
  const pendingInvite = () => store.get('yours.invite', null);
  function inviteBonusDays() {
    if (S.sub && S.sub.trial_used) return 0;
    if (S.invite && isCloud()) return S.invite.bonusDays || 0;
    return pendingInvite() ? INVITE_BONUS : 0;
  }
  function myInviteCode() { return (S.invite && S.invite.code) || null; }
  const inviteLink = () => (myInviteCode() ? `${location.origin}/?invite=${myInviteCode()}` : '');
  async function referralCall(body) {
    const token = await cloud.accessToken();
    const r = await fetch('/api/referral', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, ...j };
  }
  async function loadInvite() {
    if (!isCloud()) { S.invite = null; return; }
    try { const j = await referralCall({ action: 'me' }); if (j.ok && j.code) S.invite = j; } catch { /* offline: try again later */ }
  }
  async function claimInvite() {
    const code = pendingInvite();
    if (!isCloud()) return;
    if (!code) { await loadInvite(); render(); return; }
    try {
      const j = await referralCall({ action: 'claim', code });
      if (j.ok) { store.del('yours.invite'); logEvent('invite_claimed'); toast(`Invite applied: your free trial is ${7 + (j.bonusDays || INVITE_BONUS)} days`); }
      else if (j.status === 400) store.del('yours.invite'); // not usable (own code, already used, not a new account)
    } catch { /* offline: keep it and try next time */ }
    await loadInvite();
    render();
  }
  // ---------- owner dashboard (/api/stats; server allows ADMIN_EMAILS only) ----------
  const adminHint = () => isCloud() && S.session && ((window.YOURS_CONFIG || {}).adminEmails || []).map((x) => String(x).toLowerCase()).includes(String(S.session.email).toLowerCase());
  async function openStats() {
    S.modal = { type: 'stats', data: null, error: '' };
    render();
    try {
      const token = await cloud.accessToken();
      const r = await fetch('/api/stats', { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json().catch(() => ({}));
      if (!S.modal || S.modal.type !== 'stats') return;
      if (r.ok) S.modal.data = j; else S.modal.error = r.status === 404 ? 'This account is not on the owner list (ADMIN_EMAILS in Vercel).' : j.error || 'Could not load stats.';
    } catch { if (S.modal && S.modal.type === 'stats') S.modal.error = 'Could not load stats. Check your connection.'; }
    render();
  }
  function statsSheet(m) {
    if (m.error) return `<p class="error">${esc(m.error)}</p>`;
    const d = m.data;
    if (!d) return '<div class="empty">Loading...</div>';
    const ev = d.events || {};
    const n = (x) => Number(x || 0).toLocaleString();
    const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '-');
    const steps = (d.funnel || []).filter((k) => ev[k]);
    const top = Math.max(1, ...steps.map((k) => ev[k].d30));
    const funnel = steps.map((k, i) => {
      const prev = i ? ev[steps[i - 1]].d30 : null;
      return `<div style="margin-top:10px"><div class="row between tiny"><span>${esc(ev[k].label)}</span><span><strong>${n(ev[k].d30)}</strong>${prev != null ? ` <span class="muted">· ${pct(ev[k].d30, prev)}</span>` : ''}</span></div><div class="stat-bar"><span style="width:${(ev[k].d30 / top) * 100}%"></span></div></div>`;
    }).join('');
    const maxDay = Math.max(1, ...d.days.map((x) => x.app_open));
    const bars = d.days.map((x, i) => `<rect x="${i * 10 + 1}" y="${60 - (x.app_open / maxDay) * 56}" width="8" height="${Math.max(1, (x.app_open / maxDay) * 56)}" rx="2" fill="var(--accent)"><title>${x.day}: ${x.app_open} opens, ${x.workout_done} workouts</title></rect>`).join('');
    const mem = d.members;
    const engagement = ['workout_done', 'weekly_checkin', 'program_start', 'library_open', 'exercise_view', 'workout_created', 'measurement_logged', 'exercise_swap', 'photo_compare', 'badge_earned', 'share_card', 'install_done', 'invite_shared', 'invite_opened', 'invite_claimed', 'membership_canceled'].filter((k) => ev[k]);
    return `<div class="stats">${statTile('Paying', n(mem.active), '')}${statTile('In trial', n(mem.trialing), '')}</div>
      <p class="tiny muted" style="margin-top:8px">${n(mem.yearly)} yearly · ${n(mem.monthly)} monthly · ${n(mem.cancelling)} set to cancel · ${n(mem.pastDue)} card failing · ${n(mem.ended)} ended${mem.comp ? ` · ${n(mem.comp)} complimentary` : ''}</p>
      <div class="card" style="margin-top:14px"><div class="eyebrow">Funnel · last 30 days</div>${funnel}<p class="tiny muted" style="margin-top:10px">Percentages compare each step with the one above. Views count once per device per day.</p></div>
      <div class="card" style="margin-top:12px"><div class="row between"><span class="eyebrow">Daily app opens · 30 days</span><span class="tiny muted">${n((ev.app_open || {}).d7)} this week</span></div><svg viewBox="0 0 300 62" style="width:100%;height:80px;margin-top:8px" role="img" aria-label="Daily app opens over 30 days">${bars}</svg></div>
      <div class="card" style="margin-top:12px"><div class="row between"><span class="eyebrow">Activity</span><span class="eyebrow">7 days · 30 days</span></div>${engagement.map((k) => `<div class="list-item" style="padding:8px 0"><span class="grow small">${esc(ev[k].label)}</span><span class="small" style="font-family:var(--mono)">${n(ev[k].d7)} · ${n(ev[k].d30)}</span></div>`).join('')}</div>
      <div class="card" style="margin-top:12px"><div class="eyebrow">Invites</div><p class="small" style="margin-top:6px">${n(d.invites.joined)} joined with an invite · ${n(d.invites.paid)} became paying · ${n(d.invites.rewarded)} free months given</p></div>
      <p class="tiny muted" style="margin-top:12px">Anonymous counts only: no names, emails, device IDs or IP addresses are stored. Updated ${esc(timeAgo(Date.parse(d.generatedAt)))}.</p>
      <button class="btn ghost block" style="margin-top:12px" data-action="open-stats">Refresh</button>`;
  }

  function inviteCard() {
    if (!cloud) return '';
    if (!isCloud()) return `<div class="card flat small"><div class="label">Invite friends</div><p class="muted">Create an account to get your invite link. Friends get 2 extra weeks free, and you get a free month when they join.</p></div>`;
    const v = S.invite;
    return `<div class="card flat small"><div class="row between"><span class="label" style="margin:0">Invite friends</span>${icon('gift', 18)}</div>
      <p class="muted" style="margin-top:6px">Friends get <strong>3 weeks free</strong> instead of 1. When a friend's membership starts, you get <strong>a free month</strong>.</p>
      ${v ? `<div class="invite-code" aria-label="Your invite code">${esc(v.code)}</div>
        <div class="row" style="gap:8px;margin-top:10px"><button class="btn primary sm grow" data-action="invite-share">${icon('share', 16)} Share link</button><button class="btn ghost sm grow" data-action="invite-copy">Copy link</button></div>
        <p class="tiny muted" style="margin-top:10px">${v.joined ? `${plural(v.joined, 'friend')} joined · ${plural(v.rewarded, 'free month')} earned${v.paid > v.rewarded ? ` · ${v.paid - v.rewarded} waiting for your membership` : ''}.` : 'No friends yet.'} Up to ${v.maxRewards || 12} free months.</p>`
        : `<button class="btn ghost sm block" style="margin-top:10px" data-action="invite-load">Get my invite link</button>`}
    </div>`;
  }
  // Paid access needs a cloud account with an active, trialing or recently past-due membership.
  const memberHasAccess = () => isCloud() && window.YOURS_CLOUD.hasAccess(S.sub);
  const money = (p) => (p ? new Intl.NumberFormat(undefined, { style: 'currency', currency: p.currency.toUpperCase(), minimumFractionDigits: p.amount % 1 ? 2 : 0 }).format(p.amount) : '');
  function priceFor(plan) {
    const pr = S.billing && S.billing.prices;
    return pr ? pr[plan] : plan === 'yearly' ? { amount: 99, currency: 'usd' } : { amount: 14.99, currency: 'usd' };
  }
  async function loadBilling() {
    try { const r = await fetch('/api/billing'); S.billing = r.ok ? await r.json() : { enabled: false }; } catch { S.billing = S.billing || { enabled: false }; }
  }
  async function refreshSub() {
    if (!isCloud()) { S.sub = null; return; }
    try { S.sub = await cloud.subscription(); S.subLoaded = true; } catch { /* keep the last known status */ }
  }
  async function billingCall(action, extra) {
    const token = await cloud.accessToken();
    const r = await fetch('/api/billing', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action, ...(extra || {}) }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) throw new Error(j.error || 'Could not reach payments. Try again in a moment.');
    return j.url;
  }
  // Back from Stripe Checkout: the webhook usually lands within seconds, so check a few times.
  async function awaitMembership() {
    S.billingBusy = 'confirming'; render();
    for (let i = 0; i < 15 && !memberHasAccess(); i++) { await refreshSub(); if (!memberHasAccess()) await new Promise((r) => setTimeout(r, 2000)); }
    S.billingBusy = null;
    render();
    if (memberHasAccess()) toast(S.sub.status === 'trialing' ? 'Your free trial has started' : 'Welcome to YOURS');
  }
  function membershipLine() {
    const sub = S.sub;
    if (!sub || sub.status === 'none') return 'No membership yet.';
    const d = (x) => (x ? fmtDate(new Date(x), { month: 'short', day: 'numeric' }) : '');
    const plan = sub.plan === 'yearly' ? 'Yearly' : 'Monthly';
    if (sub.status === 'trialing') return `Free trial${sub.cancel_at_period_end ? `, ends ${d(sub.trial_end)} (cancelled, you won't be charged)` : ` until ${d(sub.trial_end)}, then ${money(priceFor(sub.plan))} ${sub.plan === 'yearly' ? 'a year' : 'a month'}`}.`;
    if (sub.status === 'active') return `${plan} membership${sub.cancel_at_period_end ? `, ends ${d(sub.current_period_end)}` : `, renews ${d(sub.current_period_end)}`}.`;
    if (sub.status === 'comp') return 'Complimentary membership.';
    if (sub.status === 'past_due') return 'Your last payment did not go through. Update your card to keep access.';
    return 'Membership ended.';
  }
  function trialEndingBanner() {
    const sub = S.sub;
    if (!billingOn() || !sub || sub.status !== 'trialing' || sub.cancel_at_period_end || !sub.trial_end) return '';
    const days = Math.ceil((new Date(sub.trial_end).getTime() - Date.now()) / 864e5);
    if (days > 2) return '';
    return `<div class="banner" style="margin-bottom:12px">${icon('flame', 18)}<div class="grow small">Your free trial ends ${days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`}. Your membership then continues at ${money(priceFor(sub.plan))} ${sub.plan === 'yearly' ? 'a year' : 'a month'}.</div><button class="link small" data-action="billing-portal">Manage</button></div>`;
  }
  function viewPaywall() {
    const plan = S.payPlan || 'yearly';
    const m = priceFor('monthly');
    const y = priceFor('yearly');
    const save = m && y ? Math.round((1 - y.amount / (m.amount * 12)) * 100) : 0;
    const trial = !(S.sub && S.sub.trial_used);
    const t = tgt();
    const ended = S.sub && S.sub.status && S.sub.status !== 'none';
    const option = (id, label, price, note) => `<button class="card" style="width:100%;text-align:left;margin:10px 0 0;${plan === id ? 'border:2px solid var(--green)' : ''}" data-action="pay-plan" data-plan="${id}" aria-pressed="${plan === id}">
        <div class="row between"><strong>${label}</strong>${note ? `<span class="tag accent">${esc(note)}</span>` : ''}</div>
        <div class="serif" style="font-size:30px;margin-top:4px">${money(price)}<span class="small muted" style="font-family:var(--body, inherit)"> / ${id === 'yearly' ? 'year' : 'month'}</span></div>
        ${id === 'yearly' && price ? `<div class="tiny muted">${money({ amount: Math.round((price.amount / 12) * 100) / 100, currency: price.currency })} a month, billed yearly</div>` : ''}</button>`;
    const charge = trial ? fmtDate(addDays(today(), trialDays()), { month: 'long', day: 'numeric' }) : null;
    if (!isCloud()) {
      return `<div class="screen no-nav"><div class="top"><div class="wordmark sm">yours.</div></div>
        <h1 style="margin-top:24px">Create your account</h1><p class="muted" style="margin-top:6px">Your plan is ready. Create an account to start your ${trialDays()}-day free trial.</p>
        <div class="card" style="margin-top:20px">${signupForm('paywall')}</div>
        <p class="center small" style="margin-top:14px"><button class="link" data-action="logout">${isGuest() ? 'Start over' : 'Sign out'}</button> · <button class="link" data-action="go-login">I already have an account</button></p></div>`;
    }
    return `<div class="screen no-nav">
      <div class="top"><div class="wordmark sm">yours.</div><button class="link small" data-action="logout">Sign out</button></div>
      <div class="eyebrow" style="margin-top:22px">${ended && !trial ? 'Welcome back' : 'Your plan is ready'}</div>
      <h1 style="margin-top:6px">${trial ? `${trialDays()} days free.<br>Then it's yours.` : 'Pick up where<br>you left off.'}</h1>
      ${trial && inviteBonusDays() ? `<p class="tag accent" style="margin-top:10px;gap:6px">${icon('gift', 14)} Friend's invite: 2 extra weeks free</p>` : ''}
      <ul class="phase-list" style="margin-top:16px"><li>Training, meals and steps that change with your cycle</li><li>Suggested weights for every lift and an AI coach</li><li>Food diary with barcode, photo and voice logging</li><li>8-week programs, progress check-ins and the community</li></ul>
      ${t ? `<p class="small muted" style="margin-top:10px">Your targets: ${t.kcal.toLocaleString()} ${calWord()}, ${t.protein} g protein, ${t.steps.toLocaleString()} steps.</p>` : ''}
      ${option('yearly', 'Yearly', y, save > 0 ? `Save ${save}%` : '')}
      ${option('monthly', 'Monthly', m, '')}
      ${S.billingError ? `<p class="error" style="margin-top:12px">${esc(S.billingError)}</p>` : ''}
      ${regionBlocked() ? '<p class="small" style="margin-top:16px">YOURS is only available in the United States right now. We hope to come to you soon.</p>' : ''}
      <button class="btn primary block" style="margin-top:18px" data-action="pay-start" ${S.billingBusy || regionBlocked() ? 'disabled' : ''}>${S.billingBusy === 'confirming' ? 'Confirming your membership...' : S.billingBusy ? 'Opening secure checkout...' : trial ? `Start my ${trialDays()}-day free trial` : 'Continue'}</button>
      <p class="tiny muted center" style="margin-top:10px">${trial ? `Free until ${charge}. Then ${money(priceFor(plan))} ${plan === 'yearly' ? 'a year' : 'a month'}, renewing automatically. Cancel anytime before ${charge} in Profile and you won't be charged. Secure payment by Stripe.` : `${money(priceFor(plan))} ${plan === 'yearly' ? 'a year' : 'a month'}, renewing automatically. Cancel anytime in Profile. Secure payment by Stripe.`}</p>
      <p class="tiny muted center" style="margin-top:8px">We never sell your data. <button class="link tiny" data-action="open-privacy">Privacy</button> · Questions? ${mailLink('Membership question', 'Email us')}</p>
      <p class="center small" style="margin-top:14px"><button class="link" data-action="billing-recheck">I already subscribed</button>${S.sub && S.sub.status && S.sub.status !== 'none' ? ' · <button class="link" data-action="billing-portal">Manage billing</button>' : ''}</p>
    </div>`;
  }

  // ---------- my workouts (custom) ----------
  const REST_OPTIONS = ['30s', '45s', '60s', '75s', '90s', '2 min', '3 min'];
  function myWorkoutsSection() {
    const list = S.data.customWorkouts || [];
    return `<div class="section-title"><h2>My workouts</h2><button class="link" data-action="builder-new">Create</button></div>
      ${list.length ? `<div class="card">${list.map((c) => { const w = workoutById(c.id); return w ? `<div class="list-item"><button class="grow" style="text-align:left" data-action="view-workout" data-id="${c.id}"><strong>${esc(w.name)}</strong><div class="small muted">${plural(w.exercises.length, 'exercise')} · about ${w.minutes} min</div></button><button class="btn primary xs" data-action="start-workout" data-id="${c.id}">Start</button></div>` : ''; }).join('')}</div>`
        : `<button class="card lib-entry" data-action="builder-new"><div class="row between"><div><strong style="display:block">Build your own workout</strong><div class="tiny muted" style="margin-top:4px">Pick exercises, sets, reps and rest. Suggested weights still come from your history.</div></div>${icon('plus', 22)}</div></button>`}`;
  }
  function openBuilder(fromId, copy) {
    const src = fromId ? (S.data.customWorkouts || []).find((c) => c.id === fromId) : null;
    const tpl = !src && copy ? workoutById(copy) : null;
    S.modal = {
      type: 'builder', id: src ? src.id : null, name: src ? src.name : tpl ? `My ${tpl.name}` : '',
      exercises: src ? src.exercises.map((e) => ({ ...e })) : tpl ? tpl.exercises.map((e) => ({ name: e.name, sets: e.sets, reps: e.reps, rest: REST_OPTIONS.includes(e.rest) ? e.rest : '90s' })) : [],
      picking: !src && !tpl, q: '',
    };
    render();
  }
  function builderPicker(m) {
    const q = (m.q || '').trim().toLowerCase();
    const have = new Set(m.exercises.map((e) => e.name));
    const rows = L.allExercises().filter((x) => !have.has(x.name) && (!q || x.name.toLowerCase().includes(q) || muscleNames(x.primary).toLowerCase().includes(q))).slice(0, 40);
    return rows.length ? rows.map((x) => `<button class="list-item" style="width:100%;text-align:left" data-action="builder-add" data-name="${esc(x.name)}"><div class="grow"><strong class="small">${esc(x.name)}</strong><div class="tiny muted">${esc(muscleNames(x.primary))}</div></div>${icon('plus', 18)}</button>`).join('') : '<div class="empty">Nothing matches that search.</div>';
  }
  function builderSheet(m) {
    const ready = m.name.trim() && m.exercises.length;
    return `<label class="field"><span class="label">Workout name</span><input class="input" data-builder-name value="${esc(m.name)}" maxlength="40" placeholder="e.g. Glutes and hamstrings"></label>
      ${m.exercises.length ? `<div class="label" style="margin-top:14px">Exercises</div>${m.exercises.map((e, i) => `<div class="card builder-ex"><div class="row between"><strong class="small">${i + 1}. ${esc(e.name)}</strong><div class="row" style="gap:4px">
          <button class="icon-btn sm" data-action="builder-move" data-i="${i}" data-d="-1" aria-label="Move ${esc(e.name)} up" ${i === 0 ? 'disabled' : ''}>${icon('send', 14)}</button>
          <button class="icon-btn sm flip" data-action="builder-move" data-i="${i}" data-d="1" aria-label="Move ${esc(e.name)} down" ${i === m.exercises.length - 1 ? 'disabled' : ''}>${icon('send', 14)}</button>
          <button class="icon-btn sm" data-action="builder-remove" data-i="${i}" aria-label="Remove ${esc(e.name)}">${icon('x', 14)}</button></div></div>
        <div class="builder-fields"><label><span class="tiny muted">Sets</span><input class="input" type="number" inputmode="numeric" min="1" max="10" value="${esc(e.sets)}" data-bfield="${i}.sets"></label>
          <label><span class="tiny muted">Reps</span><input class="input" value="${esc(e.reps)}" maxlength="12" data-bfield="${i}.reps" placeholder="8-12"></label>
          <label><span class="tiny muted">Rest</span><select class="select" data-bfield="${i}.rest">${REST_OPTIONS.map((r) => `<option ${r === e.rest ? 'selected' : ''}>${r}</option>`).join('')}</select></label></div></div>`).join('')}` : ''}
      ${m.picking ? `<div class="card" style="margin-top:12px"><div class="row between"><span class="label" style="margin:0">Add an exercise</span>${m.exercises.length ? '<button class="link small" data-action="builder-pick">Done</button>' : ''}</div>
          <input class="input" type="search" style="margin-top:8px" placeholder="Search exercises or muscles" value="${esc(m.q)}" data-builder-q aria-label="Search exercises"><div id="builder-list" style="margin-top:6px;max-height:320px;overflow-y:auto">${builderPicker(m)}</div></div>`
        : `<button class="btn ghost block" style="margin-top:12px" data-action="builder-pick">${icon('plus', 16)} Add exercise</button>`}
      <p class="tiny muted" style="margin-top:10px">Reps can be a number (10) or a range (8-12). With a range, YOURS adds weight once you reach the top of it on every set.</p>
      <button class="btn primary block" style="margin-top:14px" data-action="builder-save" ${ready ? '' : 'disabled'}>${m.id ? 'Save changes' : 'Save workout'}</button>
      ${m.id ? '<button class="btn ghost block" style="margin-top:8px" data-action="builder-delete">Delete this workout</button>' : ''}`;
  }

  // ---------- body measurements ----------
  const cmToShow = (cm) => (unit() === 'lb' ? Math.round((cm / 2.54) * 10) / 10 : Math.round(cm * 10) / 10);
  const measureUnit = () => (unit() === 'lb' ? 'in' : 'cm');
  const MEASURE_TIPS = { waist: 'At your belly button, relaxed.', hips: 'Across your hip bones.', glutes: 'Around the fullest part of your glutes.', thighs: 'The fullest part of your right thigh.', arms: 'Halfway up your right upper arm, relaxed.' };
  function measurementsCard() {
    const list = S.data.measurements || [];
    const mu = measureUnit();
    const note = L.measurementPhaseNote(list);
    const last = list.slice().sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    const rows = L.MEASURE_SITES.map(([k, label]) => {
      const sm = L.measurementSummary(list, k);
      if (!sm) return '';
      const ch = cmToShow(sm.change);
      return `<div class="list-item"><div class="grow"><strong class="small">${label}</strong><div class="tiny muted">${sm.values.length > 1 ? `${ch > 0 ? '+' : ''}${ch} ${mu} since ${esc(shortDate(sm.since))}` : 'First measurement'}</div></div>${sm.values.length > 1 ? `<div class="mini-spark">${sparkline(sm.values.map((v) => v.value))}</div>` : ''}<strong style="margin-left:10px">${cmToShow(sm.last)} ${mu}</strong></div>`;
    }).join('');
    return `<div class="section-title"><h2>Measurements</h2>${last ? `<span>${esc(shortDate(last.date))}</span>` : ''}</div>
      <div class="card">${rows || '<p class="small muted">Your body can change before the scale does. Measure every 2-4 weeks, ideally in the same cycle phase.</p>'}
        ${note ? `<div class="why" style="margin-top:10px">Your waist reads about ${cmToShow(note.cm)} ${mu} bigger in your luteal phase. That's normal water retention, so compare measurements from the same phase.</div>` : ''}
        <button class="btn ${rows ? 'ghost' : 'primary'} block" style="margin-top:12px" data-action="open-measure">${icon('plus', 16)} Log measurements</button></div>`;
  }
  function measureSheet() {
    const mu = measureUnit();
    const today = (S.data.measurements || []).find((x) => x.date === todayKey()) || {};
    return `<p class="small muted">Use a soft tape, snug but not tight, first thing in the morning. Fill in any you like.</p>
      <form data-form="measure" style="margin-top:10px">${L.MEASURE_SITES.map(([k, label]) => `<label class="field"><span class="label">${label} (${mu})</span><input class="input" type="number" step="0.1" inputmode="decimal" name="${k}" value="${today[k] ? cmToShow(today[k]) : ''}" placeholder="-"><span class="tiny muted">${MEASURE_TIPS[k]}</span></label>`).join('')}
        <button class="btn primary block" style="margin-top:12px" type="submit">Save</button></form>
      <p class="tiny muted" style="margin-top:10px">Stored with your private data. Never shared.</p>`;
  }

  // ---------- exercise library and exercise pages ----------
  // Front and back body diagram: primary muscles in the accent colour, secondary muscles lighter.
  function bodyMap(primary, secondary) {
    const P = primary || [], Q = secondary || [];
    const tone = (id) => (P.includes(id) ? 'var(--accent)' : Q.includes(id) ? 'var(--bm-sec)' : 'var(--bm-off)');
    const e = (id, cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${tone(id)}"/>`;
    const pair = (id, ox, cx, cy, rx, ry) => e(id, ox + cx, cy, rx, ry) + e(id, ox + 100 - cx, cy, rx, ry);
    const body = (ox) => `<g fill="var(--bm-body)">
      <circle cx="${ox + 50}" cy="16" r="10"/><rect x="${ox + 45}" y="24" width="10" height="9" rx="3"/>
      <path d="M${ox + 30} 34 Q${ox + 50} 29 ${ox + 70} 34 L${ox + 68} 96 Q${ox + 50} 103 ${ox + 32} 96 Z"/>
      <path d="M${ox + 32} 93 Q${ox + 50} 106 ${ox + 68} 93 L${ox + 67} 113 Q${ox + 50} 120 ${ox + 33} 113 Z"/>
      ${[[25, 56, 6, 15], [21, 84, 5, 14], [19.5, 101, 4, 4.5], [41, 136, 9.5, 27], [41, 184, 6.5, 23], [40, 210, 6.5, 3.5]].map(([x, y, rx, ry]) => `<ellipse cx="${ox + x}" cy="${y}" rx="${rx}" ry="${ry}"/><ellipse cx="${ox + 100 - x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('')}
    </g>`;
    const front = 0, back = 110;
    return `<svg class="bodymap" viewBox="0 0 210 234" role="img" aria-label="Muscles worked: ${esc([...P, ...Q].map((m) => D.MUSCLES[m]).filter(Boolean).join(', ') || 'whole body')}">
      ${body(front)}
      ${pair('side-delts', front, 26, 42, 3, 5)}${pair('front-delts', front, 31.5, 40, 6, 6)}${pair('chest', front, 42, 48, 8.5, 6.5)}
      ${pair('biceps', front, 25, 58, 4.2, 10)}${pair('forearms', front, 21, 83, 3.6, 10)}${pair('obliques', front, 38, 76, 3.5, 12)}
      <rect x="45" y="58" width="10" height="34" rx="4" fill="${tone('core')}"/>
      ${pair('quads', front, 41, 132, 7, 20)}${pair('adductors', front, 47.3, 123, 2.6, 11)}${pair('calves', front, 41, 184, 4, 15)}
      ${body(back)}
      ${e('upper-back', back + 50, 46, 12, 10)}${pair('side-delts', back, 26, 43, 3, 5)}${pair('rear-delts', back, 31.5, 41, 6, 5)}
      ${pair('lats', back, 40, 66, 6.5, 15)}${pair('triceps', back, 25, 58, 4.2, 10)}${pair('forearms', back, 21, 83, 3.6, 10)}
      ${e('lower-back', back + 50, 86, 7, 7)}${pair('glute-med', back, 35, 99, 3.5, 6)}${pair('glutes', back, 43, 106, 8, 8.5)}
      ${pair('hamstrings', back, 41, 138, 6.5, 19)}${pair('calves', back, 41, 182, 5.5, 14)}
      <text x="50" y="230" text-anchor="middle" class="bm-label">Front</text><text x="160" y="230" text-anchor="middle" class="bm-label">Back</text>
    </svg>`;
  }
  const muscleNames = (ids) => ids.map((m) => D.MUSCLES[m]).filter(Boolean).join(' · ');
  const loggedLifts = () => { const s = new Set(); (S.data.workouts || []).forEach((w) => (w.detail || []).forEach((d) => { if (d.sets && d.sets.some((x) => x.weight > 0 || x.reps > 0)) s.add(d.name); })); return s; };
  const favLifts = () => S.data.favLifts || [];
  function cueFor(name) { for (const w of D.WORKOUTS) { const ex = w.exercises.find((x) => x.name === name); if (ex) return ex.cue; } return ''; }

  function openExercise(name, tab) {
    const prev = S.modal && S.modal.type !== 'exercise' ? S.modal : S.modal && S.modal.from;
    S.modal = { type: 'exercise', name, tab: tab || 'overview', from: prev || null };
    logEvent('exercise_view');
    render();
  }

  // Strength level for lifts with published women's standards (estimated 1-rep max vs bodyweight).
  function bodyKg() { const ws = (S.data.checkins || []).slice(-7); return ws.length ? ws.reduce((n, w) => n + w.kg, 0) / ws.length : Number(S.data.profile.weightKg) || 0; }
  function strengthLevelCard(name, records) {
    const std = L.strengthStandard(name);
    if (!std) return '';
    const u = unit();
    const kg = bodyKg();
    const lv = records && records.e1rm.value ? L.strengthLevel(name, L.toKg(records.e1rm.value, u), kg) : null;
    const show = (k) => fmtLoad(Math.round(L.fromKg(k, u) / 2.5) * 2.5, u);
    return `<div class="card strength-card"><div class="row between"><span class="eyebrow">Strength level</span>${lv ? `<span class="tiny muted">${lv.ratio}x bodyweight</span>` : ''}</div>
      ${lv ? `<div class="serif" style="font-size:30px;margin-top:4px">${esc(lv.level)}</div>
        <div class="level-track" aria-hidden="true">${L.STRENGTH_LEVELS.map((x, i) => `<span class="${i <= lv.index ? 'on' : ''}"></span>`).join('')}</div>
        <div class="row between tiny muted" style="margin-top:4px"><span>Beginner</span><span>Elite</span></div>
        <p class="small" style="margin-top:8px">${lv.next ? `Next: <strong>${esc(lv.next.level)}</strong> at about ${show(lv.next.kg)} estimated 1-rep max.` : 'Elite. That is rare. Keep it safe and have fun.'}</p>`
        : `<p class="small muted" style="margin-top:6px">Log a set of ${esc(std.lift.toLowerCase())} to see your level against women of your bodyweight.</p>`}
      <p class="tiny muted" style="margin-top:6px">Based on published strength standards for women, using your latest weight. A guide, not a judgement: every level is strong.</p></div>`;
  }

  function exerciseSheet(m) {
    const name = m.name;
    const gd = L.guideFor(name);
    const u = unit();
    const st = L.liftStats(S.data.workouts, name, u);
    const r = st.records;
    const fav = favLifts().includes(name);
    const back = m.from ? `<button class="link small" style="margin-bottom:10px" data-action="modal-back">${m.from.type === 'active' ? 'Back to workout' : m.from.type === 'library' ? 'Back to library' : 'Back'}</button>` : '';
    const tabs = `<div class="segment" style="margin-bottom:14px">${[['overview', 'Overview'], ['charts', 'Charts'], ['history', 'History']].map(([id, label]) => `<button class="${m.tab === id ? 'active' : ''}" data-action="ex-tab" data-value="${id}">${label}</button>`).join('')}</div>`;
    let body = '';
    if (m.tab === 'charts') {
      const pts = st.sessions.filter((x) => x.e1rm > 0);
      if (pts.length < 2) body = `<div class="card empty">Log this lift twice and your strength chart appears here.</div>`;
      else {
        const vals = pts.map((x) => x.e1rm), lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
        const xy = pts.map((x, i) => [(i / (pts.length - 1)) * 280 + 10, 100 - ((x.e1rm - lo) / span) * 80]);
        const change = vals[vals.length - 1] - vals[0];
        body = `<div class="card"><div class="row between"><span class="eyebrow">Estimated 1-rep max</span><span class="small"><strong>${change >= 0 ? '+' : ''}${fmtLoad(change, u)}</strong> <span class="muted">since ${esc(shortDate(pts[0].date))}</span></span></div>
          <svg viewBox="0 0 300 116" style="width:100%;height:150px;margin-top:10px" role="img" aria-label="Estimated one-rep max from ${fmtLoad(vals[0], u)} to ${fmtLoad(vals[vals.length - 1], u)}">
            <line x1="10" y1="100" x2="290" y2="100" stroke="var(--line)"/><line x1="10" y1="20" x2="290" y2="20" stroke="var(--line)" stroke-dasharray="3 4"/>
            <polyline points="${xy.map((p) => p.join(',')).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
            ${xy.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${pts[i].phase && D.PHASE_ORDER.includes(pts[i].phase) ? `var(--${pts[i].phase})` : 'var(--accent)'}"><title>${esc(shortDate(pts[i].date))}: ${fmtLoad(pts[i].e1rm, u)}</title></circle>`).join('')}
            <text x="10" y="114" class="bm-label">${esc(shortDate(pts[0].date))}</text><text x="290" y="114" text-anchor="end" class="bm-label">${esc(shortDate(pts[pts.length - 1].date))}</text>
            <text x="290" y="15" text-anchor="end" class="bm-label">${fmtLoad(hi, u)}</text>
          </svg>
          <p class="tiny muted" style="margin-top:6px">Dots are coloured by cycle phase. Estimated from your best set each session.</p></div>
          <div class="card"><div class="eyebrow">Heaviest set each session</div>${st.sessions.slice(-8).reverse().map((x) => `<div class="row between" style="margin-top:8px"><span class="small muted">${esc(shortDate(x.date))}</span><span class="small"><strong>${fmtLoad(x.top, u)}</strong></span></div>`).join('')}</div>`;
      }
    } else if (m.tab === 'history') {
      body = st.sessions.length ? `<div class="card">${st.sessions.slice().reverse().map((x) => `<div style="padding:10px 0;border-bottom:1px solid var(--line)"><div class="row between"><strong class="small">${esc(fmtDate(parseKey(x.date), { weekday: 'short', month: 'short', day: 'numeric' }))}</strong><span class="tiny muted">${x.phase && x.phase !== 'steady' ? esc(phaseName(x.phase)) : ''}</span></div><div class="small" style="margin-top:4px;font-family:var(--mono)">${x.sets.map((y) => `${Number(y.weight.toFixed(1))} x ${y.reps}${y.rpe ? ` @${y.rpe}` : ''}`).join(' · ')}</div>${x.e1rm ? `<div class="tiny muted" style="margin-top:2px">Est. 1-rep max ${fmtLoad(x.e1rm, u)}</div>` : ''}</div>`).join('')}</div>` : `<div class="card empty">No sets logged yet. Your sessions for this lift will be listed here.</div>`;
    } else {
      const cue = cueFor(name);
      const similar = L.swapOptions(name).slice(0, 6);
      const list = (items, ordered) => `<${ordered ? 'ol' : 'ul'} class="guide-list">${items.map((x) => `<li>${esc(x)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`;
      body = `<div class="card bodymap-card">${bodyMap(gd ? gd.muscles.p : [], gd ? gd.muscles.s : [])}
          <div class="row" style="gap:14px;justify-content:center;margin-top:4px"><span class="tiny"><span class="bm-dot" style="background:var(--accent)"></span> Main</span><span class="tiny"><span class="bm-dot" style="background:var(--bm-sec)"></span> Also works</span></div></div>
        ${gd ? `<p class="small" style="margin-top:4px"><strong>Main:</strong> ${esc(muscleNames(gd.muscles.p))}${gd.muscles.s.length ? `<br><span class="muted"><strong>Also:</strong> ${esc(muscleNames(gd.muscles.s))}</span>` : ''}</p>` : ''}
        <div class="ex-actions">
          <button class="btn ghost sm" data-action="ex-fav" aria-pressed="${fav}">${icon('heart', 16)} ${fav ? 'Saved' : 'Save'}</button>
          <a class="btn ghost sm" href="https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} proper form`)}" target="_blank" rel="noopener">${icon('eye', 16)} Form videos</a>
          <button class="btn ghost sm" data-action="ex-share">${icon('share', 16)} Share</button>
          <span class="tag">${esc(L.equipmentOf(name))}</span>
        </div>
        ${cue ? `<div class="why" style="margin-top:12px"><strong>Coach cue:</strong> ${esc(cue)}</div>` : ''}
        ${strengthLevelCard(name, r)}
        <div class="section-title" style="margin-top:18px"><h2>Personal records</h2></div>
        ${r ? `<div class="stats">${statTile('Heaviest', fmtLoad(r.maxWeight.value, u), shortDate(r.maxWeight.date))}${statTile('Est. 1-rep max', r.e1rm.value ? fmtLoad(r.e1rm.value, u) : '-', r.e1rm.value ? shortDate(r.e1rm.date) : '')}</div>
          <div class="stats" style="margin-top:8px">${statTile('Most reps', r.mostReps ? `${r.mostReps.reps}` : '-', r.mostReps ? `at ${fmtLoad(r.mostReps.weight, u)}` : '')}${statTile('Best session', `${Math.round(r.volume.value).toLocaleString()}`, `${u} total`)}</div>
          <p class="tiny muted" style="margin-top:6px">${plural(st.sessions.length, 'session')} logged.</p>`
          : `<div class="card empty">No sets logged yet. Log this lift and your records show up here.</div>`}
        ${gd ? `<div class="section-title"><h2>How to do it</h2></div><div class="card">${list(gd.steps, true)}</div>
          <div class="section-title"><h2>Common mistakes</h2></div><div class="card">${list(gd.mistakes)}</div>
          <div class="section-title"><h2>Pro tips</h2></div><div class="card">${list(gd.tips)}</div>` : ''}
        ${similar.length ? `<div class="section-title"><h2>Similar exercises</h2></div><div class="chips">${similar.map((o) => `<button class="chip" data-action="open-exercise" data-name="${esc(o.name)}">${esc(o.name)}</button>`).join('')}</div>` : ''}
        <p class="tiny muted" style="margin-top:16px">General guidance, not medical advice. Stop if anything hurts, and check with a professional if you are unsure about your form.</p>`;
    }
    return `${back}${tabs}${body}`;
  }

  function openLibrary() {
    S.modal = { type: 'library', q: '', group: 'all', view: loggedLifts().size ? 'mine' : 'all' };
    logEvent('library_open');
    render();
  }
  function libraryRows(m) {
    const mine = loggedLifts();
    const favs = favLifts();
    const u = unit();
    const q = (m.q || '').trim().toLowerCase();
    const grp = D.MUSCLE_GROUPS.find((x) => x.id === m.group);
    const rows = L.allExercises().filter((x) => (m.view === 'mine' ? mine.has(x.name) : m.view === 'fav' ? favs.includes(x.name) : true))
      .filter((x) => !q || x.name.toLowerCase().includes(q) || muscleNames(x.primary).toLowerCase().includes(q))
      .filter((x) => !grp || x.primary.some((p) => grp.muscles.includes(p)));
    if (!rows.length) return `<div class="empty">${m.view === 'mine' ? 'No logged lifts match. Try All exercises.' : m.view === 'fav' ? 'Tap Save on any exercise to keep it here.' : 'Nothing matches that search.'}</div>`;
    return rows.map((x) => {
      const r = mine.has(x.name) ? L.liftStats(S.data.workouts, x.name, u).records : null;
      return `<button class="list-item" style="width:100%;text-align:left" data-action="open-exercise" data-name="${esc(x.name)}"><div class="grow"><strong class="small">${esc(x.name)}</strong><div class="tiny muted">${esc(muscleNames(x.primary))}</div></div>${r && r.maxWeight.value ? `<span class="tiny" style="font-family:var(--mono);margin-right:8px">${fmtLoad(r.maxWeight.value, u)}</span>` : ''}<span class="tag">${esc(x.equipment)}</span></button>`;
    }).join('');
  }
  function librarySheet(m) {
    const mineCount = loggedLifts().size;
    return `<input class="input" type="search" placeholder="Search exercises or muscles" value="${esc(m.q || '')}" data-lib-q aria-label="Search exercises">
      <div class="segment" style="margin-top:12px">${[['mine', `My lifts ${mineCount}`], ['all', 'All exercises'], ['fav', 'Saved']].map(([id, label]) => `<button class="${m.view === id ? 'active' : ''}" data-action="lib-view" data-value="${id}">${label}</button>`).join('')}</div>
      <div class="chips" style="margin-top:10px">${[{ id: 'all', label: 'All' }, ...D.MUSCLE_GROUPS].map((x) => `<button class="chip ${m.group === x.id ? 'selected' : ''}" data-action="lib-group" data-value="${x.id}">${esc(x.label)}</button>`).join('')}</div>
      <div id="lib-list" style="margin-top:8px">${libraryRows(m)}</div>`;
  }

  // Lifetime totals for Insights ("your journey").
  function journeyCard() {
    const ws = S.data.workouts || [];
    if (!ws.length) return '';
    const minutes = ws.reduce((n, w) => n + (w.minutes || 0), 0);
    const u = unit();
    const lifted = ws.reduce((n, w) => n + (w.detail || []).reduce((a, d) => a + d.sets.reduce((b, x) => b + (x.weight > 0 && x.reps > 0 ? (u === (w.unit || 'kg') ? x.weight : u === 'lb' ? x.weight * 2.20462 : x.weight / 2.20462) * x.reps : 0), 0), 0), 0);
    const first = ws.map((w) => w.date).sort()[0];
    return `<div class="card journey"><div class="eyebrow" style="color:inherit;opacity:.75">Your journey · since ${esc(fmtDate(parseKey(first), { month: 'short', day: 'numeric', year: 'numeric' }))}</div>
      <div class="journey-big">${minutes.toLocaleString()}</div><div class="eyebrow" style="color:inherit;opacity:.75;margin-top:-4px">Total active minutes</div>
      <div class="journey-row"><div><strong>${ws.length.toLocaleString()}</strong><span>Workouts</span></div><div><strong>${Math.round(minutes / ws.length)}</strong><span>Avg minutes</span></div><div><strong>${lifted >= 10000 ? `${Math.round(lifted / 1000).toLocaleString()}k` : Math.round(lifted).toLocaleString()}</strong><span>${u} lifted</span></div></div>
      <button class="btn cream sm" style="margin-top:14px" data-action="open-library">${icon('workouts', 16)} My lifts and records</button></div>`;
  }

  // ---------- 8-week programs ----------
  function recommendedPrograms() {
    const p = S.data.profile;
    const rec = [];
    if (p.postpartum) rec.push('postpartum');
    if (L.MENO_MODES.includes(p.cycleMode)) rec.push('menopause');
    if (p.goal === 'glutes') rec.push('glutes');
    if (p.level === 'beginner') rec.push('beginner');
    return rec;
  }
  function programContext() {
    const pg = L.programDay(S.data, today());
    if (!pg) return null;
    const pr = L.programProgress(S.data);
    return { name: pg.program.name, week: pg.week, of: pg.total, complete: !!pg.complete, block: pg.block ? pg.block.title : null, sessionsThisWeek: pg.doneThisWeek || 0, perWeek: pg.program.perWeek, todaysSession: pg.session ? pg.session.name : null, completedPct: pr.pct };
  }
  function programSection() {
    const pg = L.programDay(S.data, today());
    if (pg) {
      const pr = L.programProgress(S.data);
      const dayNames = (S.data.program.days || []).slice().sort().map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ');
      return `<div class="section-title"><h2>Your program</h2><button class="link" data-action="open-program" data-id="${pg.program.id}">Details</button></div>
        <div class="card" style="background:var(--green);color:var(--bg);border:none">
          <div class="row between"><span class="eyebrow" style="color:var(--bg);opacity:.7">${pg.complete ? 'Complete' : `Week ${pg.week} of ${pg.total} · ${esc(pg.block.title)}`}</span><span class="eyebrow" style="color:var(--bg);opacity:.7">${pr.pct}%</span></div>
          <div class="serif" style="font-size:32px;margin-top:6px">${esc(pg.program.name)}</div>
          <div class="row" style="gap:4px;margin-top:14px">${pr.weeks.map((n, i) => `<div class="grow" title="Week ${i + 1}: ${n} of ${pg.program.perWeek}" style="height:6px;border-radius:3px;background:${i + 1 === pg.week && !pg.complete ? 'var(--accent)' : 'rgba(247,242,234,.25)'};position:relative;overflow:hidden"><div style="position:absolute;inset:0;width:${Math.min(100, (n / pg.program.perWeek) * 100)}%;background:var(--bg)"></div></div>`).join('')}</div>
          <p class="small" style="margin-top:12px;opacity:.85">${pg.complete ? esc(pg.program.finish) : `${esc(pg.block.note)} ${pg.doneThisWeek} of ${pg.perWeek} sessions this week. Training days: ${dayNames}.`}</p>
          ${pg.complete ? `<button class="btn cream sm" style="margin-top:12px" data-action="program-leave">Finish and choose another</button>` : !pg.scheduled && !pg.doneToday ? `<p class="tiny" style="margin-top:8px;opacity:.7">Not a training day. ${pg.program.offDay ? 'Daily reset below: pelvic floor and a walk.' : 'Walk, stretch and hit your steps.'}</p>` : ''}
          ${pg.program.cue && !pg.complete ? `<p class="tiny" style="margin-top:10px;opacity:.7">${esc(pg.program.cue)}</p>` : ''}
        </div>`;
    }
    const rec = recommendedPrograms();
    const list = D.PROGRAMS.slice().sort((a, b) => (rec.includes(b.id) ? 1 : 0) - (rec.includes(a.id) ? 1 : 0));
    return `<div class="section-title"><h2>8-week programs</h2></div>
      <div class="h-scroll">${list.map((pr) => `<button class="poster mini" style="text-align:left" data-action="open-program" data-id="${pr.id}">${backdrop({ menopause: 'menopause', postpartum: 'menstrual', pullup: 'follicular', beginner: 'steady', home: 'luteal' }[pr.id] || 'ovulation')}<div class="p-row"><span>${esc(pr.kicker)}</span><span>${rec.includes(pr.id) ? 'For you' : `${pr.perWeek}x / week`}</span></div><div class="p-body"><div class="p-title" style="${Math.max(...pr.name.split(' ').map((w) => w.length)) >= 9 ? 'font-size:27px' : ''}">${esc(pr.name)}</div></div></button>`).join('')}</div>`;
  }
  function programSheet(m) {
    const pr = D.PROGRAMS.find((x) => x.id === m.id);
    const active = S.data.program && S.data.program.id === pr.id;
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const flagged = (m.screen || []).length > 0;
    const ready = m.days.length === pr.perWeek && (!pr.clearance || m.cleared);
    return `<p class="serif" style="font-size:22px;margin:0">${esc(pr.tagline)}</p>
      <p class="small muted" style="margin-top:10px">${esc(pr.who)}</p>
      ${pr.blocks.map((b) => `<div class="card" style="margin:12px 0 0;padding:14px"><div class="row between"><span class="eyebrow" style="color:var(--text)">${esc(b.title)}</span><span class="eyebrow">Weeks ${b.from}${b.to > b.from ? `-${b.to}` : ''}</span></div><p class="small muted" style="margin-top:6px">${esc(b.note)}</p>${b.sessions.map((id) => { const w = workoutById(id); return `<button class="list-item" style="width:100%;text-align:left;padding:8px 0" data-action="view-workout" data-id="${id}"><div class="grow"><strong class="small">${esc(w.name)}</strong><div class="tiny muted">${esc(w.focus)} · ${w.minutes} min</div></div>${icon('back', 14)}</button>`; }).join('')}</div>`).join('')}
      ${pr.cue ? `<div class="banner" style="margin-top:12px;background:var(--green-soft)">${icon('shield', 18)}<div class="grow tiny">${esc(pr.cue)}</div></div>` : ''}
      ${active ? `<button class="btn ghost block" style="margin-top:16px" data-action="program-leave">Leave this program</button>` : `
        ${pr.screen ? `<div class="label" style="margin-top:18px">Do you have any of these?</div>${pr.screen.map((q, i) => `<button class="list-item" style="width:100%;text-align:left" data-action="program-screen" data-i="${i}"><span class="check ${(m.screen || []).includes(i) ? 'on' : ''}" style="width:24px;height:24px;border-radius:7px">${(m.screen || []).includes(i) ? icon('check', 12) : ''}</span><span class="small grow">${esc(q)}</span></button>`).join('')}
          ${flagged ? `<div class="banner" style="margin-top:10px">${icon('heart', 18)}<div class="grow small">These are common and treatable. See a pelvic health physiotherapist before progressing past Reconnect, and stay in weeks 1-2 until they improve. You can still start now.</div></div>` : ''}` : ''}
        ${pr.clearance ? `<button class="list-item" style="width:100%;text-align:left;margin-top:8px" data-action="program-cleared"><span class="check ${m.cleared ? 'on' : ''}" style="width:24px;height:24px;border-radius:7px">${m.cleared ? icon('check', 12) : ''}</span><span class="small grow">My doctor or midwife has cleared me for exercise</span></button>` : ''}
        <div class="label" style="margin-top:18px">Pick ${pr.perWeek} training days</div>
        <div class="chips">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<button class="chip ${m.days.includes(d) ? 'selected' : ''}" data-action="program-day" data-d="${d}">${names[d]}</button>`).join('')}</div>
        ${S.data.program ? `<p class="tiny muted" style="margin-top:10px">This replaces ${esc((D.PROGRAMS.find((x) => x.id === S.data.program.id) || {}).name || 'your current program')}.</p>` : ''}
        <p class="tiny muted" style="margin-top:10px">On other days your plan is ${pr.offDay ? 'a short daily reset' : 'active recovery and steps'}. Suggested weights still adjust to your cycle and readiness, and you can swap any day.</p>
        <button class="btn primary block" style="margin-top:14px" data-action="program-start" ${ready ? '' : 'disabled'}>${ready ? 'Start today' : pr.clearance && !m.cleared ? 'Confirm clearance to start' : `Pick ${pr.perWeek - m.days.length > 0 ? pr.perWeek - m.days.length + ' more' : 'only ' + pr.perWeek} day${Math.abs(pr.perWeek - m.days.length) === 1 ? '' : 's'}`}</button>`}`;
  }

  // ---------- workout logger: supersets, rest timer, plates ----------
  // A superset pairs an exercise with the next one: A1 then A2, rest after A2.
  function supersetTag(a, ei) {
    const ex = a.exercises[ei];
    const prev = a.exercises[ei - 1];
    if (!ex.superset && !(prev && prev.superset)) return '';
    let letter = 0;
    for (let i = 0; i <= ei; i++) if (a.exercises[i].superset && !(i && a.exercises[i - 1].superset)) letter++;
    return `${String.fromCharCode(64 + letter)}${prev && prev.superset ? 2 : 1}`;
  }
  const fmtRest = (sec) => (sec >= 60 ? `${Math.round((sec / 60) * 10) / 10} min`.replace('.0 ', ' ') : `${sec}s`);
  const fmtClock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  const restLeft = () => (S.rest ? Math.max(0, Math.ceil((S.rest.endsAt - Date.now()) / 1000)) : 0);
  let restTimer = null;
  let audioCtx = null;
  function startRest(seconds, label) {
    if (!seconds) return;
    try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); } catch { audioCtx = null; } // unlocked by this tap
    S.rest = { endsAt: Date.now() + seconds * 1000, label: label || '' };
    clearInterval(restTimer);
    restTimer = setInterval(tickRest, 500);
  }
  function stopRest() { clearInterval(restTimer); restTimer = null; S.rest = null; }
  function tickRest() {
    if (!S.rest) return stopRest();
    const left = restLeft();
    const el = document.getElementById('rest-time');
    if (el) el.textContent = fmtClock(left);
    if (left > 0) return;
    stopRest();
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch { /* not supported */ }
    try {
      if (audioCtx) { const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(0.15, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4); o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.4); }
    } catch { /* sound unavailable */ }
    toast('Rest done. Next set.');
    if (S.modal && S.modal.type === 'active') render();
  }
  // After a set: in a superset, go straight to the partner; otherwise rest.
  function afterSet(a, ei, si) {
    const ex = a.exercises[ei];
    const partnerNext = ex.superset && a.exercises[ei + 1];
    const partnerPrev = ei > 0 && a.exercises[ei - 1].superset ? a.exercises[ei - 1] : null;
    if (partnerNext) { stopRest(); toast(`Now ${partnerNext.name}`); return; }
    const rest = Math.max(ex.rest || 0, partnerPrev ? partnerPrev.rest || 0 : 0);
    const first = partnerPrev || ex;
    const nextUp = first.sets.some((x) => !x.done) ? first.name : (a.exercises.slice(ei + 1).find((x) => x.sets.some((y) => !y.done)) || {}).name;
    if (rest && nextUp) startRest(rest, nextUp);
  }
  function platesPanel(a, ex, ei) {
    const unit = a.unit === 'kg' ? 'kg' : 'lb';
    const next = ex.sets.find((x) => !x.done) || ex.sets[ex.sets.length - 1];
    const total = Number(next && next.weight) || (ex.suggestion ? ex.suggestion.weight : 0);
    if (!ex.platesOpen) return `<button class="link small" style="margin-top:8px;margin-right:14px" data-action="plates-toggle" data-ei="${ei}">Plate math</button>`;
    const bar = ex.bar || L.defaultBar(ex.name, unit);
    const r = total ? L.platesFor(total, unit, bar) : null;
    const plate = (p) => `<span class="plate" style="height:${Math.round(22 + (p / L.BARS[unit][0]) * 26)}px">${p}</span>`;
    return `<div class="plates-box">
      <div class="row between"><span class="eyebrow" style="color:var(--text)">${total ? `${total} ${unit}` : 'Enter a weight'}</span><button class="link small" data-action="plates-toggle" data-ei="${ei}">Hide</button></div>
      <div class="chips" style="margin-top:8px">${L.BARS[unit].map((b) => `<button class="chip ${bar === b ? 'selected' : ''}" data-action="plates-bar" data-ei="${ei}" data-bar="${b}">${b} ${unit} bar</button>`).join('')}</div>
      ${r ? (r.belowBar ? `<p class="small muted" style="margin-top:8px">That is less than the bar (${bar} ${unit}).</p>` : `<p class="small" style="margin-top:8px">Each side: <strong>${r.perSide.length ? r.perSide.join(' + ') : 'no plates'}</strong></p><div class="plates-row" aria-hidden="true">${r.perSide.map(plate).join('')}<span class="plate-bar"></span></div>${r.leftover ? `<p class="tiny muted">${r.leftover} ${unit} can't be made with standard plates.</p>` : ''}`) : ''}
    </div>`;
  }

  // Warm-up sets before heavy lifts (a guide, not logged) and a quick "how hard was that?" after each set.
  function warmupPanel(a, ex, ei) {
    if (!ex.weighted || ex.sets.some((x) => x.done) || !(ex.main || L.isBarbell(ex.name))) return '';
    const w = Number((ex.sets[0] || {}).weight) || (ex.suggestion ? ex.suggestion.weight : 0);
    const ups = L.warmupSets(ex.name, w, a.unit);
    if (!ups.length) return '';
    const done = ex.wu || [];
    if (ex.wuHidden) return `<button class="link small" style="margin-top:8px" data-action="wu-toggle" data-ei="${ei}">Show warm-up (${ups.length} sets)</button>`;
    return `<div class="warmup"><div class="row between"><span class="eyebrow" style="color:var(--text)">Warm-up first</span><button class="link tiny" data-action="wu-toggle" data-ei="${ei}">Hide</button></div>
      <div class="chips" style="margin-top:8px">${ups.map((x, i) => `<button class="chip ${done.includes(i) ? 'selected' : ''}" data-action="wu-tick" data-ei="${ei}" data-i="${i}" aria-pressed="${done.includes(i)}">${Number(x.weight.toFixed(1))} ${a.unit} x ${x.reps}</button>`).join('')}</div>
      <p class="tiny muted" style="margin-top:6px">Easy, quick reps to get ready. Not counted in your workout.</p></div>`;
  }
  const EFFORT_HINT = { 6: 'Easy, 4+ left', 7: '3 left', 8: '2 left', 9: '1 left', 10: 'Nothing left' };
  function effortRow(ei, si, s) {
    if (Number.isFinite(s.rpe) && !s.rpeOpen) return `<div class="effort-done"><button class="link tiny" data-action="rpe-edit" data-ei="${ei}" data-si="${si}">Effort ${s.rpe}/10 · ${EFFORT_HINT[s.rpe] || ''}</button></div>`;
    return `<div class="effort" role="group" aria-label="How hard was set ${si + 1}?"><span class="tiny muted">How hard?</span>${[6, 7, 8, 9, 10].map((v) => `<button class="effort-btn ${s.rpe === v ? 'on' : ''}" data-action="rpe-set" data-ei="${ei}" data-si="${si}" data-v="${v}" aria-label="${v} out of 10, ${EFFORT_HINT[v]}">${v}</button>`).join('')}</div>`;
  }

  // One exercise in the logger, with suggested weight, last note and empty sets.
  function loggerEntry(name, reps, rest, sets, u, phase) {
    const s = L.suggestLoad(name, reps, S.data.workouts, { phase, readiness: readinessToday(), unit: u });
    const weighted = !!L.parseReps(reps) && !BODYWEIGHT.test(name);
    const lastNote = (S.data.workouts.slice().reverse().map((w) => (w.detail || []).find((d) => d.name === name && d.note)).find(Boolean) || {}).note || '';
    return { name, reps, rest, note: '', lastNote, weighted, suggestion: s && !s.first ? s : null, sets: Array.from({ length: sets }, () => ({ weight: s && !s.first ? String(s.weight) : '', reps: '', target: s ? s.reps : '', done: false })) };
  }
  // "Machine taken? Swap it": exercises that train the same movement, until a set is logged.
  function swapPanel(a, ex, ei) {
    if (ex.sets.some((x) => x.done)) return '';
    const opts = L.swapOptions(ex.name, a.exercises.map((x) => x.name));
    if (!opts.length) return '';
    if (!ex.swapOpen) return `<button class="link small" style="margin-top:8px;margin-right:14px" data-action="swap-toggle" data-ei="${ei}">Swap exercise</button>`;
    return `<div class="plates-box">
      <div class="row between"><span class="eyebrow" style="color:var(--text)">Machine taken? Same muscles:</span><button class="link small" data-action="swap-toggle" data-ei="${ei}">Hide</button></div>
      ${opts.slice(0, 8).map((o) => `<button class="list-item" style="width:100%;text-align:left;padding:9px 0" data-action="swap-pick" data-ei="${ei}" data-name="${esc(o.name)}"><div class="grow"><strong class="small">${esc(o.name)}</strong><div class="tiny muted">${esc(o.group)}</div></div><span class="tag">${esc(o.equipment)}</span></button>`).join('')}
    </div>`;
  }

  function startWorkout(id) {
    const wk = workoutById(id);
    const c = cyc();
    const u = unit();
    S.data.activeWorkout = {
      templateId: id, name: wk.name, startedAt: Date.now(), unit: u, phase: c.phase,
      exercises: wk.exercises.map((ex) => ({ ...loggerEntry(ex.name, ex.reps, L.parseRest(ex.rest), adjustSets(ex), u, c.phase), main: !!ex.main })),
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
      ${a.exercises.map((ex, ei) => { const tag = supersetTag(a, ei); return `<div class="card" style="margin-top:${ei && a.exercises[ei - 1].superset ? 4 : 12}px;${tag ? 'border-left:3px solid var(--accent)' : ''}"><div class="row between"><strong>${tag ? `<span class="tag accent" style="margin-right:6px">${tag}</span>` : ''}<button class="ex-link" data-action="open-exercise" data-name="${esc(ex.name)}">${esc(ex.name)}</button></strong><span class="small muted">Target ${esc(ex.reps)}${ex.rest ? ` · rest ${fmtRest(ex.rest)}` : ''}</span></div>
        ${ex.suggestion ? `<div class="why" style="margin-top:8px"><strong>${fmtLoad(ex.suggestion.weight, ex.suggestion.unit)} x ${ex.suggestion.reps}</strong> · ${esc(ex.suggestion.reason)}</div>` : ''}
        <div class="set-row tiny muted" style="margin-top:10px"><span>Set</span><span class="center">${ex.weighted ? a.unit : '-'}</span><span class="center">Reps</span><span></span></div>
        ${warmupPanel(a, ex, ei)}
        ${ex.sets.map((s, si) => `<div class="set-row"><span class="ex-num">${si + 1}</span><input class="input" type="number" inputmode="decimal" placeholder="-" value="${esc(s.weight)}" data-set="${ei}.${si}.weight" aria-label="Weight set ${si + 1}"><input class="input" type="number" inputmode="numeric" placeholder="${esc(s.target || '-')}" value="${esc(s.reps)}" data-set="${ei}.${si}.reps" aria-label="Reps set ${si + 1}"><button class="check ${s.done ? 'on' : ''}" data-action="toggle-set" data-ei="${ei}" data-si="${si}" aria-label="Mark set done">${icon('check', 18, 2.4)}</button></div>${s.done && ex.weighted ? effortRow(ei, si, s) : ''}`).join('')}
        ${ex.swappedFrom ? `<p class="tiny muted" style="margin-top:6px">Swapped from ${esc(ex.swappedFrom)}</p>` : ''}
        ${ex.weighted && L.isBarbell(ex.name) ? platesPanel(a, ex, ei) : ''}${swapPanel(a, ex, ei)}
        ${ex.lastNote ? `<p class="tiny muted" style="margin-top:8px">Last time: ${esc(ex.lastNote)}</p>` : ''}
        ${ex.noteOpen || ex.note ? `<textarea class="input" style="margin-top:8px;height:64px;padding:10px 14px;resize:none" data-note="${ei}" maxlength="300" placeholder="Note for next time, e.g. felt easy, go up 5 lb" aria-label="Note for ${esc(ex.name)}">${esc(ex.note || '')}</textarea>` : `<button class="link small" style="margin-top:8px" data-action="note-open" data-ei="${ei}">Add note</button>`}
      </div>${ei < a.exercises.length - 1 && !(ei && a.exercises[ei - 1].superset) ? `<div class="center" style="margin-top:6px"><button class="link tiny" data-action="superset-toggle" data-ei="${ei}">${ex.superset ? 'Unlink superset' : 'Superset with next'}</button></div>` : ''}`; }).join('')}
      <button class="btn primary block" style="margin-top:20px;margin-bottom:${S.rest ? 90 : 0}px" data-action="finish-workout" ${doneSets ? '' : 'disabled'}>Finish workout</button>
      ${S.rest ? `<div class="rest-bar" role="timer" aria-live="off"><div class="grow"><div class="eyebrow" style="color:inherit;opacity:.7">Rest${S.rest.label ? ` · next: ${esc(S.rest.label)}` : ''}</div><div id="rest-time" class="rest-time">${fmtClock(restLeft())}</div></div><button class="btn outline xs" data-action="rest-add" data-d="-15" aria-label="15 seconds less">−15</button><button class="btn outline xs" data-action="rest-add" data-d="15" aria-label="15 seconds more">+15</button><button class="btn cream xs" data-action="rest-skip">Skip</button></div>` : ''}
    </div></div>`;
  }

  function finishWorkout() {
    stopRest();
    const a = S.data.activeWorkout;
    const sets = a.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
    const minutes = clamp(Math.round((Date.now() - a.startedAt) / 60000), 5, 240);
    const record = {
      id: uid(), date: todayKey(), templateId: a.templateId, name: a.name, minutes, sets, unit: a.unit, phase: a.phase,
      detail: a.exercises.map((e) => ({ name: e.name, ...(e.note && e.note.trim() ? { note: e.note.trim().slice(0, 300) } : {}), sets: e.sets.filter((s) => s.done).map((s) => ({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 0, ...(Number.isFinite(s.rpe) ? { rpe: s.rpe } : {}) })) })).filter((e) => e.sets.length),
    };
    const prs = L.detectPRs(record, S.data.workouts).map((p) => ({ ...p, date: record.date, workoutId: record.id, phase: record.phase }));
    const volume = record.detail.reduce((n, e) => n + e.sets.reduce((m, s) => m + s.weight * s.reps, 0), 0);
    S.data.workouts.push(record);
    S.data.prs.push(...prs);
    S.data.activeWorkout = null;
    save();
    logEvent('workout_done');
    const unlocked = awardBadges(false);
    S.modal = { type: 'summary', record, prs, volume, badges: unlocked };
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
        <div class="row" style="margin-top:16px"><label class="btn primary grow" style="cursor:pointer">${icon('camera', 18)} Snap plate<input type="file" accept="image/*" capture="environment" data-plate-photo hidden></label><button class="btn soft grow" data-action="open-talk">${icon('mic', 18)} Say it</button></div>
        <div class="row" style="margin-top:8px"><button class="btn ghost grow" data-action="open-scanner">${icon('barcode', 18)} Scan</button><button class="btn ghost" data-action="open-food-search" aria-label="Search foods">${icon('search', 18)}</button><button class="btn ghost" data-action="open-recipes" aria-label="My recipes">${icon('list', 18)}</button><button class="btn ghost" data-action="open-quick-add" aria-label="Quick add calories">${icon('plus', 18)}</button></div>
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
      <button class="btn ghost block" style="margin-top:12px" data-action="open-grocery">${icon('store', 18)} Grocery list and shopping</button>
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
      ${journeyCard()}
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
      ${d.prs.length ? `<div class="section-title"><h2>Personal records</h2></div><div class="card">${d.prs.slice(-5).reverse().map((p) => `<div class="list-item"><div class="grow"><strong>${esc(p.name)}</strong><div class="small muted">${shortDate(p.date)}</div></div><strong>${fmtLoad(p.weight, p.unit)} x ${p.reps}</strong><button class="icon-btn" style="width:32px;height:32px" data-action="share-pr" data-date="${p.date}" data-name="${esc(p.name)}" aria-label="Share">${icon('share', 15)}</button></div>`).join('')}</div>` : ''}
      ${badgesSection()}`;
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
      <div class="banner" style="background:var(--green-soft)">${icon('shield', 20)}<div class="grow">${encrypted ? 'Photos are encrypted with your PIN and' : 'Photos'} stay on this device. They are only sent to your coach when you tap Analyze${S.backupKey ? ', and backed up to your account encrypted with your passphrase' : ', and are not stored anywhere else'}.${encrypted ? '' : ' Set a PIN to encrypt them.'}</div></div>
      <div class="row" style="gap:10px">
        <label class="btn primary grow" style="cursor:pointer">${icon('camera', 18)} Add photo<input type="file" accept="image/*" data-upload hidden></label>
        <select class="select" style="width:auto;height:50px" data-bind-ui="pose" aria-label="Pose">${['front', 'side', 'back'].map((x) => `<option value="${x}" ${S.pose === x ? 'selected' : ''}>${x[0].toUpperCase() + x.slice(1)}</option>`).join('')}</select>
      </div>
      <p class="tiny muted" style="margin-top:8px">For fair comparisons: same light, same outfit, same time of day, and ideally the same cycle phase${cyc().steady ? '' : ` (you are in ${phaseName(cyc().phase).toLowerCase()} now)`}.</p>

      ${backupCard()}
      <div class="section-title"><h2>Photo vault</h2><span class="small muted">${plural(S.photos.length, 'photo')}</span></div>
      ${S.photos.length ? `<p class="small muted" style="margin:-4px 0 10px">Tap to reveal. Select up to 4 to analyze or compare.</p>
        <div class="photo-grid">${S.photos.map((ph) => { const sel = S.compare.indexOf(ph.id); return `<div class="photo ${S.revealed[ph.id] ? '' : 'blur'} ${sel > -1 ? 'selected' : ''}">
          <button style="display:block;width:100%;height:100%" data-action="photo-tap" data-id="${ph.id}" aria-label="${S.revealed[ph.id] ? 'Select photo' : 'Reveal photo'}"><img src="${ph.data}" alt="${esc(ph.pose)} progress photo from ${esc(ph.date)}"></button>
          ${sel > -1 ? `<span class="sel">${sel + 1}</span>` : ''}
          <div class="meta">${esc(ph.pose)} · ${shortDate(ph.date)}${ph.phase && ph.phase !== 'steady' ? ` · ${esc(phaseName(ph.phase))}` : ''}</div></div>`; }).join('')}</div>
        <div class="row" style="margin-top:12px"><button class="btn accent grow" data-action="analyze" ${S.analyzing ? 'disabled' : ''}>${S.analyzing ? 'Analyzing...' : S.compare.length ? `Analyze ${plural(S.compare.length, 'photo')}` : 'Analyze my data'}</button>${S.compare.length ? `<button class="btn ghost" data-action="delete-photos" aria-label="Delete selected">${icon('trash', 18)}</button>` : ''}</div>`
        : `<div class="card empty">Take your first photos front, side and back. Retake every 2-4 weeks in the same cycle phase.</div>
           <button class="btn accent block" style="margin-top:12px" data-action="analyze" ${S.analyzing ? 'disabled' : ''}>${S.analyzing ? 'Analyzing...' : 'Analyze my data'}</button>`}
      ${photoCompareCard()}

      ${review ? `<div class="card" style="margin-top:16px"><div class="row between"><span class="verdict ${review.verdict}">${verdictLabel[review.verdict] || 'Review'}</span><span class="tiny muted">${shortDate(review.date)}</span></div>
        <div class="rich small" style="margin-top:12px">${rich(review.text)}</div>
        ${review.local ? `<p class="tiny muted" style="margin-top:10px">Based on your logged data. ${S.ai ? '' : 'Visual photo review needs the live AI coach.'}</p>` : ''}</div>` : ''}

      ${checkinHistory()}
      ${measurementsCard()}
      <div class="section-title"><h2>Weight check-ins</h2>${weekAvg(0) ? `<span>7-day avg ${bw(weekAvg(0))}${weekAvg(7) ? ` · ${(() => { const dlt = (weekAvg(0) - weekAvg(7)) * (unit() === 'lb' ? 2.20462 : 1); return `${dlt > 0 ? '+' : ''}${dlt.toFixed(1)}`; })()}` : ''}</span>` : ''}</div>
      <div class="card">
        ${ws.length > 1 ? sparkline(ws.map((w) => w.kg)) : ''}
        <form class="row" data-form="checkin" style="margin-top:${ws.length > 1 ? 12 : 0}px"><input class="input grow" type="number" step="0.1" inputmode="decimal" name="w" placeholder="Today's weight (${unit()})" required><button class="btn primary sm" type="submit">Log</button></form>
        ${ws.slice(-4).reverse().map((w) => `<div class="list-item"><div class="grow small">${fmtDate(parseKey(w.date), { weekday: 'short', month: 'short', day: 'numeric' })}</div><strong>${bw(w.kg)}</strong></div>`).join('')}
        <p class="tiny muted" style="margin-top:8px">Weigh in at the same time of day. Compare across the same cycle phase.</p>
      </div>
      <div class="row" style="margin-top:16px"><button class="btn ghost sm grow" data-action="pin-settings">${icon('lock', 16)} ${S.data.pinHash ? 'Change or remove PIN' : 'Set a PIN and encrypt photos'}</button>${S.data.pinHash ? '<button class="btn ghost sm" data-action="lock-vault">Lock</button>' : ''}</div>`;
  }

  function badgesSection() {
    const all = L.badges(S.data);
    const earned = all.filter((b) => b.earned).sort((a, b) => (a.earned < b.earned ? 1 : -1));
    const next = all.filter((b) => !b.earned).sort((a, b) => b.now / b.goal - a.now / a.goal).slice(0, 4);
    return `<div class="section-title"><h2>Badges</h2><span>${earned.length} of ${all.length}</span></div>
      <div class="badge-grid">${earned.map((b) => `<button class="badge-cell" data-action="share-badge" data-id="${b.id}" aria-label="${esc(b.title)}, earned ${esc(shortDate(b.earned))}. Share"><span class="badge-medal earned">${icon(b.icon, 22)}</span><strong class="tiny">${esc(b.title)}</strong><span class="tiny muted">${esc(shortDate(b.earned))}</span></button>`).join('')}
        ${next.map((b) => `<div class="badge-cell locked" aria-label="${esc(b.title)}: ${b.now} of ${b.goal}"><span class="badge-medal">${icon(b.icon, 22)}</span><strong class="tiny">${esc(b.title)}</strong><span class="badge-meter"><span style="width:${Math.round((b.now / b.goal) * 100)}%"></span></span><span class="tiny muted">${b.now} of ${b.goal}</span></div>`).join('')}</div>
      ${earned.length ? '<p class="tiny muted" style="margin-top:8px">Tap a badge to share it.</p>' : ''}`;
  }

  function checkinHistory() {
    const list = S.data.reviews.filter((r) => r.photos && Object.keys(r.photos).length).slice(-6).reverse();
    if (!list.length) return '';
    return `<div class="section-title"><h2>Check-ins</h2><span>${plural(list.length, 'week')}</span></div>
      <div class="card">${list.map((r) => `<div style="padding:10px 0;border-bottom:1px solid var(--line)"><div class="row between"><strong class="small">${fmtDate(parseKey(r.date), { month: 'short', day: 'numeric' })}</strong><span class="tiny muted">${r.weightAvg ? `7-day avg ${bw(r.weightAvg)}` : ''}</span></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px">${['front', 'side', 'back'].map((p) => r.photos[p] ? blurThumb(r.photos[p], p) : '<div></div>').join('')}</div>
        ${r.text ? `<p class="tiny muted" style="margin-top:8px">${esc(r.text.split('\n')[0]).slice(0, 160)}</p>` : ''}</div>`).join('')}</div>`;
  }

  // Before and after: drag a slider across two photos of the same pose, or view them side by side.
  // Defaults to the first and latest photo of a pose; two selected photos in the vault take over.
  function photoCompareCard() {
    const C = S.cmp;
    const poses = ['front', 'side', 'back'].filter((pose) => S.photos.filter((ph) => ph.pose === pose).length >= 2);
    const picked = S.compare.length === 2 ? S.compare.map((id) => S.photos.find((ph) => ph.id === id)).filter(Boolean) : [];
    if (!poses.length && picked.length < 2) {
      return S.photos.length ? `<div class="card soft" style="margin-top:12px"><div class="eyebrow">Before and after</div><p class="small" style="margin-top:6px">Take the same pose again in 2-4 weeks and you can slide between them here.</p></div>` : '';
    }
    let a, b, list = [];
    if (picked.length === 2) {
      [a, b] = picked[0].date <= picked[1].date ? picked : [picked[1], picked[0]];
    } else {
      const pose = poses.includes(C.pose) ? C.pose : poses[0];
      C.pose = pose;
      list = S.photos.filter((ph) => ph.pose === pose).sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
      a = list.find((ph) => ph.id === C.a) || list[0];
      b = list.find((ph) => ph.id === C.b) || list[list.length - 1];
      if (a === b) b = list.find((ph) => ph !== a);
    }
    const day = (ph) => fmtDate(parseKey(ph.date), { month: 'short', day: 'numeric', ...(ph.date.slice(0, 4) === todayKey().slice(0, 4) ? {} : { year: 'numeric' }) });
    const opt = (ph, cur) => `<option value="${ph.id}" ${ph === cur ? 'selected' : ''}>${esc(day(ph))}${ph.phase && ph.phase !== 'steady' ? ` · ${esc(phaseName(ph.phase))}` : ''}</option>`;
    const apart = daysBetween(parseKey(a.date), parseKey(b.date));
    const weightAt = (key) => { const w = S.data.checkins.filter((x) => x.date <= key).slice(-1)[0]; return w && daysBetween(parseKey(w.date), parseKey(key)) <= 7 ? w.kg : null; };
    const wa = weightAt(a.date), wb = weightAt(b.date);
    const blur = C.shown ? '' : 'filter:blur(22px)';
    const alt = (ph, when) => `${esc(ph.pose)} progress photo, ${when}, ${esc(day(ph))}`;
    return `<div class="card" style="margin-top:12px">
      <div class="row between"><div class="eyebrow">Before and after</div><div class="chips" style="margin:0">${['slider', 'side'].map((m) => `<button class="chip ${C.mode === m ? 'selected' : ''}" data-action="cmp-mode" data-mode="${m}">${m === 'slider' ? 'Slider' : 'Side by side'}</button>`).join('')}</div></div>
      ${picked.length === 2 ? '<p class="tiny muted" style="margin-top:6px">Comparing the two photos you selected.</p>' : `
        <div class="chips" style="margin-top:10px">${poses.map((pose) => `<button class="chip ${C.pose === pose ? 'selected' : ''}" data-action="cmp-pose" data-pose="${pose}">${pose[0].toUpperCase() + pose.slice(1)}</button>`).join('')}</div>
        <div class="row" style="gap:8px;margin-top:8px"><label class="grow"><span class="label">Before</span><select class="select" data-cmp-pick="a">${list.filter((ph) => ph !== b).map((ph) => opt(ph, a)).join('')}</select></label><label class="grow"><span class="label">After</span><select class="select" data-cmp-pick="b">${list.filter((ph) => ph !== a).map((ph) => opt(ph, b)).join('')}</select></label></div>`}
      ${C.mode === 'slider' ? `<div class="cmp-slider" style="--pos:${C.pos}%;margin-top:12px">
          <img src="${b.data}" alt="${alt(b, 'after')}" style="${blur}">
          <div class="cmp-before"><img src="${a.data}" alt="${alt(a, 'before')}" style="${blur}"></div>
          ${C.shown ? `<div class="cmp-line" aria-hidden="true"><span>${icon('arrows', 16)}</span></div>` : ''}
          <span class="cmp-tag l">Before</span><span class="cmp-tag r">After</span>
          ${C.shown ? `<input type="range" min="0" max="100" value="${C.pos}" data-cmp-range aria-label="Drag to compare before and after">` : `<button class="cmp-reveal" data-action="cmp-show">${icon('eye', 18)} Tap to reveal</button>`}
        </div>`
        : `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:12px;position:relative">${[[a, 'Before'], [b, 'After']].map(([ph, t]) => `<div><div class="photo" style="border:none"><img src="${ph.data}" alt="${alt(ph, t.toLowerCase())}" style="${blur}"></div><div class="tiny muted center" style="margin-top:6px">${t} · ${esc(day(ph))}</div></div>`).join('')}
          ${C.shown ? '' : `<button class="cmp-reveal" data-action="cmp-show">${icon('eye', 18)} Tap to reveal</button>`}</div>`}
      <p class="small center" style="margin-top:10px"><strong>${plural(apart, 'day')}</strong> apart${wa && wb ? ` · ${(() => { const d = (wb - wa) * (unit() === 'lb' ? 2.20462 : 1); return `${d > 0 ? '+' : ''}${d.toFixed(1)} ${unit()}`; })()}` : ''}</p>
      <p class="tiny muted center" style="margin-top:2px">Same light, outfit and cycle phase make the fairest comparison.</p>
    </div>`;
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
        <div class="head"><div class="avatar sm ${p.author.startsWith('u:') ? '' : 'alt'}">${esc(initials(memberName(p.author)))}</div><div class="grow"><strong>${esc(memberName(p.author))}</strong><div class="tiny muted">${timeAgo(p.ts)}${p.phase && Object.prototype.hasOwnProperty.call(D.PHASES, p.phase) && p.phase !== 'steady' ? ` · ${esc(phaseName(p.phase))} phase` : ''}</div></div><span class="tag ${p.tag === 'Win' ? 'accent' : ''}">${esc(p.tag)}</span></div>
        <div class="body">${esc(p.text)}</div>
        <div class="foot"><button class="${liked ? 'on' : ''}" data-action="like" data-id="${p.id}" aria-label="Like">${icon('heart', 18)} ${p.baseLikes + p.likedBy.length}</button><button data-action="toggle-comments" data-id="${p.id}">${icon('comment', 18)} ${p.comments.length}</button>${p.author !== me ? `<button data-action="message" data-id="${esc(p.author)}">Message</button>` : ''}${isCloud() ? (p.author === me ? `<button data-action="post-delete" data-id="${p.id}" aria-label="Delete your post">${icon('trash', 16)}</button>` : `<button data-action="report" data-post="${p.id}" data-author="${esc(p.author)}" aria-label="Report or hide">More</button>`) : ''}</div>
        ${open ? `${p.comments.map((cm) => `<div class="comment"><div class="avatar sm ${cm.author.startsWith('u:') ? '' : 'alt'}">${esc(initials(memberName(cm.author)))}</div><div class="c"><strong class="small">${esc(memberName(cm.author))}</strong><div class="small">${esc(cm.text)}</div></div></div>`).join('')}
          <form class="row" style="margin-top:10px" data-form="comment" data-id="${p.id}"><input class="input grow" style="height:42px" name="text" placeholder="Add a comment" maxlength="300" required><button class="btn primary sm" type="submit">Reply</button></form>` : ''}
      </div>`; }).join('')}
      ${isCloud() && S.cloudFeed && !posts.length ? '<div class="card empty">No posts yet. Share the first win.</div>' : ''}
      ${isCloud() && !S.cloudFeed ? `<div class="empty">${S.communityError ? 'Could not load the community. Check your connection.' : 'Loading...'}</div>` : ''}
      <p class="tiny muted center" style="margin-top:16px">${isCloud() ? 'Be kind. No body shaming, diet pills or selling. Tap More on any post to report it or hide that member.' : isGuest() && cloud ? 'This is a preview. Create a free account to join the real YOURS community.' : 'Community posts are shared between accounts on this device in this preview.'}</p>`;
  }

  function viewThreads() {
    if (isGuest()) {
      return `<div class="card lock">${icon('comment', 32)}<h2 style="margin-top:14px">Message other members</h2><p class="muted small" style="margin:8px 0 18px">Create a free account to send messages and find accountability partners.</p><button class="btn primary" data-action="open-signup" data-reason="community">Create account</button></div>`;
    }
    const c = community();
    const me = meId();
    if (isCloud() && !members().length) return '<div class="card empty">No conversations yet. Tap Message on someone\'s post to start one.</div>';
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
      ${isCloud() ? `<p class="tiny muted" style="margin:-6px 0 12px"><button class="link tiny" data-action="report" data-author="${esc(other)}">Report or block ${esc(firstName(memberName(other)))}</button></p>` : ''}
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
        ${(m.badges || []).length ? `<div class="card" style="margin-top:12px;background:var(--green);color:var(--bg);border:none"><div class="eyebrow" style="color:var(--bg);opacity:.75">Badge unlocked</div>${m.badges.map((b) => `<div class="row" style="margin-top:10px;gap:12px"><span class="badge-medal earned">${icon(b.icon, 20)}</span><div class="grow"><strong>${esc(b.title)}</strong><div class="tiny" style="opacity:.8">${esc(b.desc)}</div></div><button class="icon-btn" style="width:34px;height:34px;color:var(--bg);background:transparent;border:1px solid currentColor" data-action="share-badge" data-id="${b.id}" aria-label="Share ${esc(b.title)} badge">${icon('share', 16)}</button></div>`).join('')}</div>` : ''}
        <div class="row" style="margin-top:18px"><button class="btn ghost grow" data-action="share-workout">${icon('share', 18)} Share</button><button class="btn primary grow" data-action="close-modal">Done</button></div>`);
    }
    if (m.type === 'share') {
      return sheet('Share your progress', `<div class="segment" style="margin-bottom:12px">${[['post', 'Post 4:5'], ['story', 'Story 9:16']].map(([id, label]) => `<button class="${(m.card.story ? 'story' : 'post') === id ? 'active' : ''}" data-action="share-format" data-value="${id}">${label}</button>`).join('')}</div>
        ${m.url ? `<img src="${m.url}" alt="Share card: ${esc(m.card.eyebrow)}, ${esc(m.card.big)}" style="border-radius:16px;border:1px solid var(--line);${m.card.story ? 'max-height:58vh;width:auto;display:block;margin:0 auto' : ''}">` : '<div class="empty">Creating your card...</div>'}
        <button class="btn primary block" style="margin-top:14px" data-action="share-card" ${m.url ? '' : 'disabled'}>${icon('share', 18)} Share or save</button>
        <p class="tiny muted center" style="margin-top:8px">Stories: save the image, then add it in Instagram.</p>`);
    }
    if (m.type === 'scanner') {
      const recent = S.data.recentFoods || [];
      return `<div class="overlay"><div class="sheet full scanner-sheet" role="dialog" aria-label="Scan a barcode">
        <div class="sheet-head"><button class="icon-btn" data-action="close-scanner" aria-label="Close scanner">${icon('x', 18)}</button><div class="eyebrow" style="color:#F7F2EA">Scan barcode</div><button class="icon-btn" data-action="open-food-search" aria-label="Search foods">${icon('search', 18)}</button></div>
        <div class="scan-frame"><video id="scan-video" playsinline muted autoplay></video><div class="scan-box"><span></span></div>
          <div class="scan-tools"><span id="cam-label" class="mono"></span><span class="grow"></span><button class="icon-btn" id="cam-torch" data-action="cam-torch" aria-label="Flashlight" hidden>${icon('flash', 18)}</button><button class="icon-btn" id="cam-switch" data-action="cam-switch" aria-label="Switch camera" hidden>${icon('swap', 18)}</button></div></div>
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
        <p class="tiny muted center" style="margin-top:10px">${f.approx ? `Approximate, from ${esc(f.brand)}'s published nutrition info. Menus change, so check the restaurant's own guide if it matters.` : f.restaurant && !f.custom ? 'Restaurant nutrition from Nutritionix.' : f.recipeId ? 'Your recipe.' : f.estimated ? 'Suggested meal. Macros are estimates, so adjust the portion to what you ate.' : f.custom ? 'Your saved food.' : 'Nutrition from Open Food Facts. Check the label if anything looks off.'}</p>`);
    }
    if (m.type === 'foodManual') {
      const pre = m.prefill || {};
      return sheet(m.restaurant ? 'Add a restaurant item' : foodTarget().kind === 'recipe' ? 'New ingredient' : 'Create a food', `${m.restaurant ? '<p class="small muted" style="margin-bottom:12px">Most chains publish nutrition on their website or app. Enter it once and it is saved under that restaurant.</p>' : ''}${m.notFound ? `<p class="small" style="margin-bottom:12px">Barcode ${esc(m.barcode)} is not in the database yet. Add it once from the label and it will be saved for next time.</p>` : m.offline ? '<p class="small" style="margin-bottom:12px">Could not reach the food database. Check your connection, or add it from the label.</p>' : ''}
        <form data-form="food-manual">
          ${m.restaurant ? `<label class="field"><span class="label">Restaurant</span><input class="input" name="restaurant" required maxlength="60" value="${esc(m.restaurantName || '')}" placeholder="e.g. Sweetgreen"></label>` : ''}
          <label class="field"><span class="label">${m.restaurant ? 'Menu item' : 'Food name'}</span><input class="input" name="name" required maxlength="80" value="${esc(pre.name || '')}"></label>
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
        ${t.kind === 'recipe' ? '' : `<label class="card" style="display:block;cursor:pointer;margin:0 0 10px;background:var(--green);color:var(--bg);border:none"><div class="row between"><div class="eyebrow" style="color:var(--bg);opacity:.7">New</div>${icon('camera', 22)}</div><div class="serif" style="font-size:26px;margin-top:4px">Snap your plate</div><div class="tiny" style="margin-top:6px;opacity:.75">Take a photo. The coach estimates each food and its macros, and you confirm.</div><input type="file" accept="image/*" capture="environment" data-plate-photo hidden></label>`}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${t.kind === 'recipe' ? '' : tile('open-talk', 'mic', 'Say it')}${tile('open-scanner', 'barcode', 'Scan barcode')}${tile('open-food-search', 'search', 'Search foods')}${t.kind === 'recipe' ? '' : tile('open-restaurants', 'fork', 'Restaurants')}${t.kind === 'recipe' ? '' : tile('open-quick-add', 'plus', 'Quick add')}${tile('open-food-manual', 'list', 'Create a food')}</div>
        ${t.kind !== 'recipe' && recipes.length ? `<div class="label" style="margin-top:20px">My recipes</div>${recipes.map((r) => { const f = L.recipeFood(r); return `<button class="list-item" style="width:100%;text-align:left" data-action="recipe-log" data-id="${r.id}"><div class="grow"><strong class="small">${esc(r.name)}</strong><div class="tiny muted">${esc(f.serving.label)}</div></div><span class="tiny" style="font-family:var(--mono);text-align:right">${Math.round(f.perServing.kcal)} ${calU()}<br>${Math.round(f.perServing.protein)} g P</span></button>`; }).join('')}` : ''}
        ${recent.length ? `<div class="label" style="margin-top:20px">Recent</div>${recent.slice(0, 8).map((r, i) => `<button class="list-item" style="width:100%;text-align:left" data-action="recent-food" data-i="${i}"><div class="grow"><strong class="small">${esc(r.food.name)}</strong><div class="tiny muted">${esc(foodLabel(r.food, r.amount, r.mode))}</div></div><span class="tiny" style="font-family:var(--mono)">${L.foodMacros(r.food, r.amount, r.mode).kcal} ${calU()}</span></button>`).join('')}` : ''}
        ${t.kind !== 'recipe' ? '<button class="btn ghost block" style="margin-top:18px" data-action="new-recipe">Build a recipe from ingredients</button>' : ''}`);
    }
    if (m.type === 'restaurants') {
      const q = (m.q || '').toLowerCase();
      const list = allRestaurants().filter((r) => !q || r.name.toLowerCase().includes(q));
      return sheet('Eating out', `<form class="row" data-form="restaurant-filter"><input class="input grow" name="q" value="${esc(m.q || '')}" placeholder="Restaurant or dish" maxlength="60" aria-label="Search restaurants"><button class="btn primary sm" type="submit">Search</button></form>
        ${S.foodApi && m.q ? `<button class="btn ghost block" style="margin-top:12px" data-action="restaurant-online" data-q="${esc(m.q)}">${icon('search', 16)} Search every restaurant for "${esc(m.q)}"</button>` : ''}
        <div style="margin-top:8px">${list.map((r) => `<button class="list-item" style="width:100%;text-align:left" data-action="open-restaurant" data-id="${esc(r.id)}"><div class="avatar alt sm">${esc(initials(r.name))}</div><div class="grow"><strong class="small">${esc(r.name)}</strong><div class="tiny muted">${esc(r.cuisine || '')}${r.build ? ' · build your own' : ''}${r.mine && r.mine.items.length ? ` · ${plural(r.mine.items.length, 'saved item')}` : ''}</div></div>${icon('back', 16)}</button>`).join('') || '<div class="empty">No match in your list.</div>'}</div>
        <p class="tiny muted" style="margin-top:12px">${S.foodApi ? 'Search covers thousands of chains. ' : ''}Not listed? Add the item once from the restaurant's nutrition info and it is saved for next time.</p>
        <button class="btn ghost block" style="margin-top:10px" data-action="restaurant-add-item">${icon('plus', 16)} Add a restaurant item</button>`);
    }
    if (m.type === 'restaurant') {
      const r = findRestaurant(m.id);
      if (!r) return '';
      const mine = (r.mine && r.mine.items) || [];
      return sheet(esc(r.name), `${r.build ? `<button class="card" style="width:100%;text-align:left;margin:0 0 12px;background:var(--green);color:var(--bg);border:none" data-action="restaurant-build" data-id="${esc(r.id)}"><div class="eyebrow" style="color:var(--bg);opacity:.7">${esc(r.build.title)}</div><div class="serif" style="font-size:26px;margin-top:4px">Build your bowl, burrito or tacos</div><div class="tiny" style="margin-top:6px;opacity:.75">Pick each ingredient and it adds them up.</div></button>` : ''}
        ${mine.length ? `<div class="label" style="margin-top:6px">Your saved items</div>${mine.map((f, i) => `<button class="list-item" style="width:100%;text-align:left" data-action="restaurant-mine" data-id="${esc(r.id)}" data-i="${i}"><div class="grow"><strong class="small">${esc(f.name)}</strong><div class="tiny muted">${esc(f.serving.label)}</div></div><span class="tiny" style="font-family:var(--mono);text-align:right">${Math.round(f.perServing.kcal)} ${calU()}<br>${Math.round(f.perServing.protein)} g P</span></button>`).join('')}` : ''}
        ${r.items.length ? `<div class="label" style="margin-top:12px">Menu</div>${r.items.map((it, i) => `<button class="list-item" style="width:100%;text-align:left" data-action="restaurant-item" data-id="${esc(r.id)}" data-i="${i}"><div class="grow"><strong class="small">${esc(it.name)}</strong><div class="tiny muted">${esc(it.serving)}</div></div><span class="tiny" style="font-family:var(--mono);text-align:right">${it.kcal} ${calU()}<br>${Math.round(it.protein)} g P</span></button>`).join('')}<p class="tiny muted" style="margin-top:10px">Approximate values from ${esc(r.name)}'s published nutrition info. Menus change.</p>` : ''}
        <div class="row" style="margin-top:14px">${S.foodApi ? `<button class="btn ghost grow" data-action="restaurant-online" data-q="${esc(r.name)}">${icon('search', 16)} Full menu</button>` : ''}<button class="btn ghost grow" data-action="restaurant-add-item" data-name="${esc(r.name)}">${icon('plus', 16)} Add an item</button></div>`);
    }
    if (m.type === 'restaurantBuild') {
      const r = findRestaurant(m.id);
      const { totals, names } = L.buildTotals(r, m.picks);
      return sheet(`${esc(r.name)}: build your own`, `${r.build.sections.map((sec) => `<div class="label" style="margin-top:14px">${esc(sec.label)}${sec.type === 'one' ? '' : ` <span style="text-transform:none;letter-spacing:0">${sec.id === 'protein' ? '(tap twice for double)' : '(tap to add or remove)'}</span>`}</div><div class="chips">${sec.options.map((o, i) => { const c = (m.picks[sec.id] || []).filter((x) => x === i).length; return `<button class="chip ${c ? 'selected' : ''}" data-action="build-pick" data-sec="${sec.id}" data-i="${i}">${esc(o.name)}${c > 1 ? ' x2' : ''}</button>`; }).join('')}</div>`).join('')}
        <div class="stats" style="margin-top:16px;grid-template-columns:repeat(4,1fr)">${foodMacroTiles(totals)}</div>
        <p class="tiny muted" style="margin-top:8px">${names.length ? esc(names.join(', ')) : 'Pick your ingredients.'} Approximate, based on standard portions.</p>
        <button class="btn primary block" style="margin-top:16px" data-action="build-log" ${names.length ? '' : 'disabled'}>Continue</button>`);
    }
    if (m.type === 'restaurantSearch') {
      return sheet('Restaurant search', `<form class="row" data-form="restaurant-online"><input class="input grow" name="q" value="${esc(m.q || '')}" maxlength="80" aria-label="Search restaurant menus"><button class="btn primary sm" type="submit">Search</button></form>
        ${m.loading ? '<div class="empty">Searching menus...</div>' : ''}${m.error ? '<p class="tiny error" style="margin-top:10px">Restaurant search is unavailable right now.</p>' : ''}
        ${(m.results || []).map((f, i) => `<button class="list-item" style="width:100%;text-align:left" data-action="restaurant-result" data-i="${i}"><div class="grow"><strong class="small">${esc(f.name)}</strong><div class="tiny muted">${esc(f.brand)} · ${esc(f.serving.label)}</div></div><span class="tiny" style="font-family:var(--mono);text-align:right">${Math.round(f.perServing.kcal)} ${calU()}<br>${Math.round(f.perServing.protein)} g P</span></button>`).join('')}
        ${!m.loading && !m.error && m.q && !(m.results || []).length ? '<div class="empty">No restaurant items found.</div>' : ''}`);
    }
    if (m.type === 'talk') {
      const examples = ['Two eggs and toast', 'Greek yogurt with berries and honey', 'Log my usual breakfast', 'Same lunch as yesterday'];
      return sheet('Say what you ate', `<p class="small muted" style="margin-bottom:12px">Say or type it the way you would tell a friend. Amounts help: "150 g chicken", "a cup of rice", "2 tbsp peanut butter". You check everything before it is logged.</p>
        <form data-form="talk">
          <textarea class="input" name="text" data-talk-text rows="3" maxlength="600" placeholder="I had two eggs and toast" aria-label="What did you eat?" style="resize:none">${esc(m.text || '')}</textarea>
          <div class="row" style="margin-top:12px">${SpeechRec ? `<button type="button" class="btn ${m.listening ? 'primary' : 'outline'} grow" data-action="talk-mic">${icon('mic', 18)} ${m.listening ? 'Listening... tap to stop' : 'Speak'}</button>` : ''}<button class="btn primary grow" type="submit">Continue</button></div>
        </form>
        ${SpeechRec ? '' : '<p class="tiny muted" style="margin-top:8px">Tip: use your keyboard\'s microphone to dictate.</p>'}
        <div class="label" style="margin-top:18px">Try</div><div class="chips">${examples.map((x) => `<button class="chip" data-action="talk-example" data-text="${esc(x)}">${esc(x)}</button>`).join('')}</div>`);
    }
    if (m.type === 'estimate') {
      const on = m.items.filter((x) => x.on);
      const tot = on.reduce((a, x) => ({ kcal: a.kcal + x.kcal * x.scale, protein: a.protein + x.protein * x.scale, carbs: a.carbs + x.carbs * x.scale, fat: a.fat + x.fat * x.scale }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
      const title = m.source === 'photo' ? 'Your plate' : m.source === 'usual' ? 'Your usual' : 'What you ate';
      const row = (x, i) => `<div class="list-item" style="padding:10px 0;align-items:flex-start;${x.on ? '' : 'opacity:.45'}">
          <button class="check ${x.on ? 'on' : ''}" style="width:26px;height:26px;flex:none;margin-top:2px;border-radius:8px" data-action="est-toggle" data-i="${i}" aria-label="${x.on ? 'Leave out' : 'Include'} ${esc(x.name)}" aria-pressed="${x.on}">${x.on ? icon('check', 14) : ''}</button>
          <div class="grow" style="min-width:0">
            ${x.edit ? `<input class="input" style="padding:8px 10px" data-est-field="name" data-i="${i}" value="${esc(x.name)}" maxlength="60" aria-label="Food name"><input class="input" style="padding:8px 10px;margin-top:6px" data-est-field="portion" data-i="${i}" value="${esc(x.portion)}" maxlength="40" aria-label="Portion">
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px">${[['kcal', calU()], ['protein', 'P g'], ['carbs', 'C g'], ['fat', 'F g']].map(([f, l]) => `<label><span class="tiny muted">${l}</span><input class="input" style="padding:8px" type="number" inputmode="decimal" min="0" step="0.1" data-est-field="${f}" data-i="${i}" value="${x[f]}"></label>`).join('')}</div>
            <button class="link small" style="margin-top:6px" data-action="est-edit" data-i="${i}">Done</button>`
            : `<strong class="small">${esc(x.name)}</strong>${x.confidence === 'low' ? ' <span class="tag" style="font-size:9px">check this</span>' : ''}<div class="tiny muted">${esc(x.scale === 1 ? x.portion : `${x.scale} x ${x.portion}`)} · <button class="link tiny" data-action="est-edit" data-i="${i}">Edit</button></div>
            <div class="row" style="gap:6px;margin-top:6px"><button class="icon-btn" style="width:28px;height:28px" data-action="est-scale" data-i="${i}" data-d="-0.25" aria-label="Less ${esc(x.name)}">−</button><span class="tiny" style="font-family:var(--mono);min-width:40px;text-align:center">x${x.scale}</span><button class="icon-btn" style="width:28px;height:28px" data-action="est-scale" data-i="${i}" data-d="0.25" aria-label="More ${esc(x.name)}">+</button></div>`}
          </div>
          <div class="tiny" style="font-family:var(--mono);text-align:right">${Math.round(x.kcal * x.scale)} ${calU()}<br>${Math.round(x.protein * x.scale)} g P<br>${Math.round(x.carbs * x.scale)} C · ${Math.round(x.fat * x.scale)} F</div></div>`;
      return sheet(title, `${m.thumb ? `<img src="${m.thumb}" alt="Your plate" style="width:100%;max-height:220px;object-fit:cover;border-radius:16px;display:block">` : ''}
        ${m.said ? `<p class="serif" style="font-size:20px;margin:0 0 6px">"${esc(m.said)}"</p>` : ''}
        ${m.loading ? `<div class="empty">${m.source === 'photo' ? 'Reading your plate...' : 'Working it out...'}</div>` : ''}
        ${m.noAi ? `<div class="banner" style="margin-top:12px">${icon('advisor', 18)}<div class="grow small">Plate photos use the live AI coach, which is not switched on here. Describe the meal instead and I will estimate it on this device.</div></div><button class="btn primary block" style="margin-top:12px" data-action="open-talk">${icon('mic', 18)} Describe it</button>` : ''}
        ${m.error ? `<p class="small error" style="margin-top:12px">${esc(m.error)}</p><div class="row" style="margin-top:10px"><button class="btn ghost grow" data-action="open-talk">${icon('mic', 16)} ${m.source === 'photo' ? 'Describe it' : 'Try again'}</button><button class="btn ghost grow" data-action="open-food-search">${icon('search', 16)} Search</button></div>` : ''}
        ${!m.loading && m.items.length ? `
          <div class="label" style="margin-top:14px">Log to</div><div class="chips">${Object.entries(SLOT_LABEL).map(([k, l]) => `<button class="chip ${m.slot === k ? 'selected' : ''}" data-action="est-slot" data-slot="${k}">${l}</button>`).join('')}</div>
          <div style="margin-top:8px">${m.items.map(row).join('')}</div>
          <div class="stats" style="margin-top:14px;grid-template-columns:repeat(4,1fr)">${foodMacroTiles(tot)}</div>
          ${m.note ? `<p class="tiny muted" style="margin-top:10px">${esc(m.note)}</p>` : ''}
          ${m.source !== 'usual' ? `<p class="tiny muted" style="margin-top:6px">${m.source === 'photo' ? 'Photo estimates can be off by 20% or more, mostly on oils and sauces. ' : ''}Adjust anything that looks wrong before logging.</p>` : ''}
          <button class="btn primary block" style="margin-top:16px" data-action="est-log" ${on.length ? '' : 'disabled'}>Log ${plural(on.length, 'item')}</button>` : ''}`);
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
      const g = groceryState();
      const list = L.groceryList(S.data, today(), 7, groceryOpts());
      const store = currentStore();
      const cats = Object.keys(list);
      const recipes = Object.values(S.data.recipes || {});
      const total = cats.reduce((n, c) => n + list[c].length, 0);
      const left = cats.reduce((n, c) => n + list[c].filter((it) => !g.checked[it.name]).length, 0);
      return sheet('<span class="serif-tight" style="font-size:44px">the grocery edit</span>', `
        <div class="label">Shop at</div>
        <div class="chips">${D.STORES.map((st) => `<button class="chip ${store.id === st.id ? 'selected' : ''}" data-action="grocery-store" data-value="${st.id}">${esc(st.name)}</button>`).join('')}</div>
        <div class="label" style="margin-top:16px">What you're shopping for</div>
        <div class="chips"><button class="chip ${g.ideas !== false ? 'selected' : ''}" data-action="grocery-ideas">Meal ideas, next 7 days</button>${recipes.map((r) => `<button class="chip ${g.recipes[r.id] ? 'selected' : ''}" data-action="grocery-recipe" data-id="${r.id}">${esc(r.name)}</button>`).join('')}</div>
        <form class="row" data-form="grocery-add" style="margin-top:12px"><input class="input grow" name="item" maxlength="60" placeholder="Add an item" aria-label="Add a grocery item"><button class="btn primary sm" type="submit">Add</button></form>
        <p class="tiny muted" style="margin-top:12px">${total ? `${left} of ${total} left. Tap Find to search ${esc(store.name)} for an item.` : 'Pick what you are shopping for, or add items.'}</p>
        ${cats.map((cat) => `<div class="label" style="margin-top:16px">${esc(cat)}</div>${list[cat].map((it) => `<div class="list-item" style="padding:8px 0"><button class="row grow" style="text-align:left;gap:12px" data-action="grocery-check" data-item="${esc(it.name)}"><span class="check ${g.checked[it.name] ? 'on' : ''}" style="width:28px;height:28px;border-radius:8px">${g.checked[it.name] ? icon('check', 14, 2.6) : ''}</span><span class="grow" style="${g.checked[it.name] ? 'text-decoration:line-through;opacity:.5' : ''}">${esc(it.name)}${it.count > 1 ? ` <span class="tiny muted">x${it.count}</span>` : ''}</span></button>${g.custom.includes(it.name) ? `<button class="icon-btn" style="width:28px;height:28px" data-action="grocery-remove" data-item="${esc(it.name)}" aria-label="Remove ${esc(it.name)}">${icon('x', 12)}</button>` : ''}<a class="btn ghost xs" href="${esc(L.storeLink(store, it.name))}" target="_blank" rel="noopener noreferrer" aria-label="Find ${esc(it.name)} at ${esc(store.name)}">Find</a></div>`).join('')}`).join('')}
        <div class="row" style="margin-top:18px"><button class="btn ghost grow" data-action="grocery-clear">Clear ticks</button><button class="btn primary grow" data-action="grocery-share">${icon('share', 18)} Share list</button></div>
        <p class="tiny muted center" style="margin-top:10px">Find opens ${esc(store.name)}'s own search. Prices, stock and delivery are on their site.</p>`);
    }
    if (m.type === 'workout') {
      const wk = workoutById(m.id);
      const isToday = todaysWorkout().id === wk.id;
      return sheet(esc(wk.name), `${m.from ? `<button class="link small" style="margin-bottom:8px" data-action="modal-back">Back to program</button>` : ''}<div class="eyebrow">${esc(wk.focus)} · ${wk.minutes} min · ${esc(wk.intensity)}</div><p class="small" style="margin-top:8px">${esc(wk.summary)}</p><div class="divider"></div>${exerciseList(wk, true)}
        <div class="row" style="margin-top:16px"><button class="btn primary grow" data-action="start-workout" data-id="${wk.id}">Start now</button>${isToday ? '' : `<button class="btn ghost" data-action="set-today" data-id="${wk.id}">Make today's</button>`}</div>
        ${wk.custom ? `<button class="btn ghost block" style="margin-top:8px" data-action="builder-edit" data-id="${wk.id}">Edit workout</button>` : `<button class="link small" style="margin-top:12px" data-action="builder-copy" data-id="${wk.id}">Copy to My workouts and customise</button>`}`);
    }
    if (m.type === 'stats') return sheet('Owner dashboard', statsSheet(m));
    if (m.type === 'exercise') return sheet(esc(m.name), exerciseSheet(m));
    if (m.type === 'builder') return sheet(m.id ? 'Edit workout' : 'New workout', builderSheet(m));
    if (m.type === 'measure') return sheet('Measurements', measureSheet());
    if (m.type === 'library') return sheet('Exercise library', librarySheet(m));
    if (m.type === 'install') {
      const platform = installPlatform();
      if (platform === 'installed') return sheet('You have the app', '<p class="small">YOURS is already on your Home Screen. You are using it right now.</p>');
      return sheet('Add YOURS to your Home Screen', `<p class="small muted" style="margin-bottom:14px">${/^ios/.test(platform) ? 'Takes 10 seconds. You get YOURS full screen with its own icon, and reminders work.' : 'Takes 10 seconds. You get YOURS full screen with its own icon.'}</p>${installSteps(platform)}`);
    }
    if (m.type === 'legal') return sheet(m.doc === 'waiver' ? 'Health &amp; Safety Waiver' : m.doc === 'health' ? 'Consumer Health Data Privacy Policy' : 'Terms of Service', legalSheet(m.doc));
    if (m.type === 'privacy') {
      const h = (t) => `<div class="label" style="margin-top:18px">${t}</div>`;
      const li = (items) => `<ul class="phase-list" style="margin-top:6px">${items.map((x) => `<li class="small"><span>${x}</span></li>`).join('')}</ul>`;
      return sheet('Your data is yours', `
        <div class="card" style="margin:0;background:var(--green);color:var(--bg);border:none"><div class="serif" style="font-size:24px;line-height:1.15">We never sell your data.</div>
          <p class="small" style="margin-top:8px;opacity:.85">We don't share it with advertisers or data brokers. There are no ads and no third-party trackers in YOURS. Your cycle, health and body data is never used for advertising.</p></div>
        ${h('What we keep')}
        ${li(['Your name and email, for your account.', 'Your plan and what you log: cycle, check-ins, workouts, food, steps and weight.', 'Your community posts, comments and messages.', 'Whether your membership is active. Your card details stay with Stripe; we never see them.'])}
        ${h('Anonymous usage counts')}
        <p class="small" style="margin-top:6px">To see what's working, YOURS counts simple events like "a workout was finished" or "a trial started". Each count is just the event and the date: no name, email, account, device ID, IP address or health details. If your browser is set to Do Not Track or Global Privacy Control, nothing is counted.</p>
        ${h('Invites')}
        <p class="small" style="margin-top:6px">If you join with a friend's invite, we note that you were invited so they can get their free month. They only see how many friends joined, never who.</p>
        ${h('Where it lives')}
        ${li(['On your phone, and in your private YOURS account so it syncs across your devices. Other members can never see it; only your posts and messages are shared, with the people you share them with.', 'Progress photos stay on your phone, locked with your PIN. If you turn on backup, they are encrypted on your phone with your passphrase first, so we cannot see them.'])}
        ${h('Services that help run YOURS')}
        <p class="tiny muted" style="margin-top:4px">They process data only to provide their part of the app, not for their own purposes.</p>
        ${li(['<strong>Supabase</strong>: accounts and storage.', '<strong>Vercel</strong>: hosts the app.', '<strong>Stripe</strong>: payments.', '<strong>Anthropic (Claude)</strong>: AI coach answers, food estimates and photo reviews, only when you use them. Photos are sent only when you tap Analyze or snap a plate, and are not stored or used to train AI models.', '<strong>Open Food Facts</strong>: the barcode number when you scan.', '<strong>Nutritionix</strong>: what you type when you search restaurant menus.', '<strong>Have I Been Pwned</strong>: a 5-character fragment of a scrambled version of a new password, to check it has not been leaked. Never the password itself.'])}
        ${h('Legal requests')}
        <p class="small" style="margin-top:6px">We only disclose data when legally required, such as by a valid court order. We push back on overly broad requests and tell you about any request for your data unless the law forbids it. We keep as little as we need: your period and health data is never used for advertising, and progress photos stay on your phone unless you back them up encrypted.</p>
        ${h('How long we keep it')}
        <p class="small" style="margin-top:6px">As long as you have an account. Deleting your account deletes your data. If a breach ever affects your data, we will tell you as the law requires.</p>
        <button class="btn ghost sm block" style="margin-top:12px" data-action="open-legal" data-doc="health">Consumer Health Data Privacy Policy</button>
        ${h('Your choices')}
        ${li(['Export everything as a file from Profile.', 'Delete your account from Profile. It removes your data, posts, messages and photo backup, and cancels your membership.', 'Hide or report anyone in the community.'])}
        ${h('Questions')}
        <p class="small" style="margin-top:6px">Email us at ${mailLink('Privacy question')}. You can also ask us to delete your data this way.</p>
        <div class="row" style="margin-top:16px"><button class="btn ghost sm grow" data-action="open-legal" data-doc="terms">Terms of Service</button><button class="btn ghost sm grow" data-action="open-legal" data-doc="waiver">Health &amp; Safety Waiver</button></div>
        <p class="tiny muted" style="margin-top:16px">Last updated October 2026.</p>`);
    }
    if (m.type === 'confirmEmail') {
      return sheet('Check your email', `<p class="small">We sent a link to <strong>${esc(m.email)}</strong>. Tap it to confirm your account, then sign in here.</p>
        <p class="small muted" style="margin-top:10px">${m.migrating ? 'Until then you are signed in on this device as before.' : 'Your plan is saved on this device and moves into your account when you sign in.'} No email? Check spam, or wait a minute.</p>
        <button class="btn primary block" style="margin-top:18px" data-action="confirm-signin">I've confirmed, sign in</button>`);
    }
    if (m.type === 'newPassword') {
      return sheet('Set a new password', `<form data-form="new-password"><label class="field"><span class="label">New password</span><input class="input" type="password" name="password" autocomplete="new-password" minlength="8" required></label>
        <button class="btn primary block" style="margin-top:16px" type="submit">Save password</button></form>`);
    }
    if (m.type === 'report') {
      const name = memberName(m.author);
      return sheet(m.sent ? 'Thanks for telling us' : m.postId ? 'Report this post' : `Report ${esc(firstName(name))}`, m.sent ? `<p class="small">We will review it. You can also hide ${esc(firstName(name))} so you no longer see her posts or messages.</p><button class="btn ghost block" style="margin-top:16px" data-action="block-member">Hide ${esc(firstName(name))}</button>` : `<p class="small muted" style="margin-bottom:12px">What is wrong?</p>
        ${['Body shaming or bullying', 'Unsafe diet or health advice', 'Spam or selling', 'Something else'].map((r) => `<button class="list-item" style="width:100%;text-align:left" data-action="report-send" data-reason="${esc(r)}"><span class="grow small">${esc(r)}</span>${icon('back', 14)}</button>`).join('')}
        <button class="btn ghost block" style="margin-top:16px" data-action="block-member">Just hide ${esc(firstName(name))}</button>`);
    }
    if (m.type === 'backupSetup' || m.type === 'backupUnlock') {
      const setup = m.type === 'backupSetup';
      return sheet(setup ? 'Turn on encrypted backup' : 'Backup passphrase', `<form data-form="${setup ? 'backup-setup' : 'backup-unlock'}">
        <p class="small muted">${setup ? 'Choose a backup passphrase: at least 10 characters, like three random words. Your photos are encrypted with it on this phone before upload, so not even YOURS can see them.' : 'Enter the backup passphrase you chose when you turned on backup.'}</p>
        <label class="field" style="margin-top:12px"><span class="label">Passphrase</span><input class="input" type="password" name="pass" minlength="${setup ? 10 : 1}" autocomplete="off" required></label>
        ${setup ? '<label class="field" style="margin-top:12px"><span class="label">Repeat it</span><input class="input" type="password" name="pass2" autocomplete="off" required></label><div class="banner" style="margin-top:14px">' + icon('lock', 18) + '<div class="grow small">Write it down somewhere safe. If you forget it, backed-up photos cannot be recovered by anyone.</div></div>' : ''}
        ${m.error ? `<p class="error" style="margin-top:10px">${esc(m.error)}</p>` : ''}
        <button class="btn primary block" style="margin-top:16px" type="submit" ${m.busy ? 'disabled' : ''}>${m.busy ? 'Securing...' : setup ? 'Turn on backup' : 'Unlock backup'}</button></form>`);
    }
    if (m.type === 'program') {
      const pr = D.PROGRAMS.find((x) => x.id === m.id);
      return sheet(esc(pr.name), programSheet(m));
    }
    if (m.type === 'swap') {
      const c = cyc();
      const list = D.WORKOUTS.filter((w) => w.phase === 'program' ? !!(S.data.program && w.program === S.data.program.id) : c.steady || w.phase === c.phase || w.phase === 'any').concat(L.setCustomWorkouts(S.data.customWorkouts));
      return sheet('Choose today\'s workout', `<p class="small muted" style="margin-bottom:14px">${c.steady ? 'Any session works in steady mode.' : `Options that suit your ${phaseName(c.phase).toLowerCase()} phase.`}</p><div class="options">${list.map((w) => `<button class="option ${todaysWorkout().id === w.id ? 'selected' : ''}" data-action="set-today" data-id="${w.id}"><strong>${esc(w.name)}</strong><span>${w.minutes} min · ${esc(w.intensity)} · ${esc(w.focus)}</span></button>`).join('')}</div>
        <button class="btn ghost block" style="margin-top:12px" data-action="reset-today">Use the recommended plan</button>`);
    }
    if (m.type === 'steps') {
      const v = S.data.steps[todayKey()] || '';
      return sheet('Log steps', `<form data-form="steps"><label class="field"><span class="label">Total steps today</span><input class="input" name="steps" type="number" inputmode="numeric" min="0" max="100000" value="${v}" required autofocus></label><p class="tiny muted" style="margin-top:8px">Copy the number from your phone or watch.</p><button class="btn primary block" style="margin-top:16px" type="submit">Save</button></form>`);
    }
    if (m.type === 'other') {
      return sheet('Log activity', `<form data-form="other"><label class="field"><span class="label">Activity</span><input class="input" name="name" placeholder="e.g. Yoga class, hike, sports" required maxlength="60"></label><label class="field"><span class="label">Minutes</span><input class="input" name="minutes" type="number" inputmode="numeric" min="5" max="600" value="45" required></label><button class="btn primary block" style="margin-top:16px" type="submit">Log it</button></form>`);
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
          <div class="row between" style="margin-top:14px"><span class="small">Daily weigh-in prompt</span><button class="chip ${S.data.weighDaily === false ? '' : 'selected'}" data-action="toggle-weigh">${S.data.weighDaily === false ? 'Off' : 'On'}</button></div>
          <div class="row between" style="margin-top:14px"><span class="small">Had a baby in the last year</span><button class="chip ${S.data.profile.postpartum ? 'selected' : ''}" data-action="toggle-postpartum">${S.data.profile.postpartum ? 'Yes' : 'No'}</button></div></div>
        <div class="card flat"><div class="label">Units</div><div class="segment">${[['imperial', 'lb · ft'], ['metric', 'kg · cm']].map(([v, l]) => `<button class="${(p.units === 'metric' ? 'metric' : 'imperial') === v ? 'active' : ''}" data-action="set-units" data-value="${v}">${l}</button>`).join('')}</div><p class="tiny muted" style="margin-top:8px">Past workouts keep the unit they were logged in. Suggested weights convert automatically.</p></div>
        <div class="card flat"><div class="label">Appearance</div><div class="segment">${['system', 'light', 'dark'].map((x) => `<button class="${theme === x ? 'active' : ''}" data-action="theme" data-value="${x}">${x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div></div>
        ${adminHint() ? `<div class="card flat small"><div class="label">Owner dashboard</div><p class="muted">Trials, payments, the sign-up funnel and how members use YOURS. Anonymous counts only.</p><button class="btn ghost sm block" style="margin-top:10px" data-action="open-stats">Open dashboard</button></div>` : ''}
        ${inviteCard()}
        ${installPlatform() !== 'installed' ? '<div class="card flat small"><div class="label">Get the app</div><p class="muted">Add YOURS to your Home Screen for full screen, one-tap access and reminders.</p><button class="btn ghost sm block" style="margin-top:10px" data-action="open-install">Show me how</button></div>' : ''}
        <div class="card flat small"><div class="label">Coach</div><p class="muted">${S.ai ? 'Live AI coach is connected.' : 'Running the on-device coach. Set ANTHROPIC_API_KEY on the server to enable the live AI coach and photo reviews.'}</p></div>
        ${billingOn() && isCloud() ? `<div class="card flat small"><div class="label">Membership</div><p class="muted">${esc(membershipLine())}</p>${S.sub && S.sub.status && !['none', 'comp'].includes(S.sub.status) ? '<button class="btn ghost sm block" style="margin-top:10px" data-action="billing-portal">Manage membership</button>' : ''}<p class="tiny muted" style="margin-top:8px">Cancel, switch plans or update your card on Stripe's secure page.</p></div>` : ''}
        ${isCloud() ? `<div class="card flat small"><div class="label">Account sync</div><p class="muted">${S.syncState === 'offline' ? 'Offline. Changes are saved on this device and sync when you are back online.' : S.syncState === 'saving' ? 'Saving...' : `Synced across your devices${S.syncedAt ? ` · ${timeAgo(S.syncedAt)}` : ''}.`}</p><button class="btn ghost sm block" style="margin-top:10px" data-action="sync-now">Sync now</button>${(S.data.blocked || []).length ? `<button class="link small" style="margin-top:10px" data-action="unblock-all">Show ${plural(S.data.blocked.length, 'hidden member')} again</button>` : ''}</div>` : cloud && !isGuest() ? '<div class="card flat small"><div class="label">Account sync</div><p class="muted">This account lives on this device only. Sign out and sign in again with the same email and password to move it to your YOURS account and sync across devices.</p></div>' : ''}
        ${remindersCard()}
        <div class="card flat small"><div class="label">Help & contact</div><p class="muted">Questions, feedback or a problem with your membership? We read every email.</p><p style="margin-top:8px">${mailLink('YOURS help')}</p></div>
        <div class="card flat small"><div class="label">Your data</div><p><strong>We never sell your data</strong> or share it with advertisers. No ads, no tracking.</p><p class="muted" style="margin-top:6px">${isCloud() ? 'Your plan and history are stored in your private YOURS account and on this device. Progress photos stay on this device unless you turn on encrypted backup. Nothing is used to train AI models.' : 'Everything is stored on this device. Nothing is used to train AI models.'}</p><button class="btn ghost sm block" style="margin-top:10px" data-action="export-data">${icon('download', 16)} Export my data</button><button class="link small" style="margin-top:10px" data-action="open-privacy">Read our privacy promise</button> · <button class="link small" data-action="open-legal" data-doc="terms">Terms</button> · <button class="link small" data-action="open-legal" data-doc="waiver">Waiver</button> · <button class="link small" data-action="open-legal" data-doc="health">Health data policy</button></div>
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
    if (S.data) L.setCustomWorkouts(S.data.customWorkouts);
    let html;
    const landing = showLanding();
    root.classList.toggle('wide', landing);
    if (!S.session) html = S.screen === 'login' ? viewLogin() : landing ? viewLanding() : viewWelcome();
    else if (!S.data.onboarded) html = viewOnboarding();
    else if (!S.data.planSeen) html = viewReveal();
    else if (!termsOk()) html = viewAgreement();
    else if (billingOn() && !memberHasAccess()) html = viewPaywall();
    else {
      const views = { home: viewHome, workouts: viewWorkouts, meals: viewMeals, advisor: viewAdvisor, community: viewCommunity };
      html = (views[S.tab] || viewHome)() + nav();
    }
    const focusedName = document.activeElement && document.activeElement.name;
    const sheetEl = root.querySelector('.sheet');
    const sheetScroll = sheetEl ? sheetEl.scrollTop : 0;
    root.innerHTML = html + viewModal();
    // Only animate a sheet when it first opens, not on every update inside it.
    const modalType = S.modal ? S.modal.type : null;
    if (modalType && modalType === S.lastModalType) root.querySelectorAll('.overlay, .sheet').forEach((el) => el.classList.add('still'));
    S.lastModalType = modalType;
    const newSheet = root.querySelector('.sheet');
    if (newSheet && sheetScroll) newSheet.scrollTop = sheetScroll;
    if (focusedName === 'msg') { const ta = root.querySelector('textarea[name="msg"]'); if (ta && !S.typing) ta.focus(); }
  }

  // ---------- session handling ----------
  async function startSession(session) {
    S.session = session;
    S.invite = null;
    S.authForm = null; // forget what was typed into the sign-up form, including the password
    store.set('yours.session', session);
    loadData();
    S.vaultUnlocked = false;
    S.photoKey = null;
    S.revealed = {};
    S.compare = [];
    S.tab = 'home';
    S.backupKey = null; S.backupNames = null;
    stopCloudCommunity();
    await loadPhotos();
    if (session.cloud) { await syncPull(); await refreshSub(); recordConsentIfNeeded(); startCloudCommunity(); cloud.emailPrefs().then((p) => { S.emailWeekly = p.weekly; }).catch(() => {}); claimInvite(); }
  }
  // Keep a local name entry for cloud accounts so the app can greet her offline.
  function rememberCloudUser(email, name) {
    const all = users();
    all[email] = { ...(all[email] || {}), email, name: name || (all[email] && all[email].name) || 'Member', cloud: true, createdAt: (all[email] && all[email].createdAt) || Date.now() };
    store.set('yours.users', all);
  }

  async function signup(form) {
    const name = form.name.value.trim();
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;
    S.authForm = { ...(S.authForm || {}), name, email }; // kept if there is an error, so she does not retype them
    if (form.agree && !form.agree.checked) { S.authError = 'Please agree to the Terms and Health & Safety Waiver to continue.'; return render(); }
    if (form.health && !form.health.checked) { S.authError = 'Please consent to YOURS using your health data. YOURS needs it to build your plan.'; return render(); }
    if (S.data && form.agree) S.data.terms = { version: LEGAL.VERSION, at: Date.now(), health: true, recorded: false };
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { S.authError = 'Enter your name and a valid email.'; return render(); }
    if (regionBlocked()) { S.authError = 'YOURS is only available in the United States right now. We hope to come to you soon.'; return render(); }
    if (password.length < (cloud ? 8 : 6)) { S.authError = `Use at least ${cloud ? 8 : 6} characters for your password.`; return render(); }
    if (cloud) return cloudSignup(name, email, password);
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

  async function cloudSignup(name, email, password) {
    S.authBusy = true; render();
    if (await window.YOURS_CLOUD.passwordLeaks(password) > 0) { S.authBusy = false; S.authError = 'A password like this has appeared in a data breach, so it is easy for others to guess. Please choose a different one.'; return render(); }
    try {
      const r = await cloud.signUp(email, password, name);
      logEvent('account_created');
      rememberCloudUser(email, name);
      // Her guest plan becomes the account's data; it uploads on first sign-in.
      if (S.data && isGuest()) { S.data.planSeen = true; S.data._updated = Date.now(); store.set(`yours.data.${email}`, S.data); }
      S.authError = '';
      S.authBusy = false;
      if (r.needsConfirm) { S.authForm = null; S.modal = { type: 'confirmEmail', email }; return render(); }
      store.del('yours.data.guest');
      S.modal = null;
      await startSession({ kind: 'user', email, cloud: true });
      render();
      toast(`Welcome to YOURS, ${firstName(name)}`);
    } catch (e) { S.authBusy = false; S.authError = window.YOURS_CLOUD.friendlyError(e); render(); }
  }

  // Signed in to the cloud: bring along her guest plan if this device has one, then start syncing.
  async function enterCloudAccount(u) {
    const email = u.email;
    rememberCloudUser(email, u.name);
    const hasLocal = !!store.get(`yours.data.${email}`, null);
    const guest = store.get('yours.data.guest', null);
    if (!hasLocal && guest && guest.onboarded) { guest.planSeen = true; guest._updated = 0; store.set(`yours.data.${email}`, guest); }
    if (guest) store.del('yours.data.guest');
    await startSession({ kind: 'user', email, cloud: true });
  }

  async function cloudLogin(email, password) {
    S.authBusy = true; render();
    try {
      const u = await cloud.signIn(email, password);
      S.authError = ''; S.authBusy = false; S.modal = null;
      await enterCloudAccount(u);
      render();
      return true;
    } catch (e) {
      S.authBusy = false;
      // An account made on this device before the cloud existed: move it up with the same email and password.
      const local = users()[email];
      if (local && local.hash && (await hashSecret(password, local.salt)) === local.hash && /match/.test(window.YOURS_CLOUD.friendlyError(e))) {
        try {
          const r = await cloud.signUp(email, password, local.name);
          rememberCloudUser(email, local.name);
          if (!r.needsConfirm) { S.modal = null; await startSession({ kind: 'user', email, cloud: true }); render(); toast('Your account now syncs across devices'); return true; }
          S.modal = null; await startSession({ kind: 'user', email }); render();
          S.modal = { type: 'confirmEmail', email, migrating: true }; render();
          return true;
        } catch { /* fall through to the error */ }
      }
      S.authError = window.YOURS_CLOUD.friendlyError(e);
      render();
      return false;
    }
  }

  async function login(form) {
    const email = form.email.value.trim().toLowerCase();
    S.prefillEmail = email;
    if (cloud) return cloudLogin(email, form.password.value);
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
    // Her usual breakfast on most of the last week, so "log my usual breakfast" has something to find.
    const basic = (id) => { const f = D.BASIC_FOODS.find((x) => x.id === id); return { barcode: null, name: f.names[0].replace(/^./, (c) => c.toUpperCase()), brand: '', image: null, custom: true, serving: { label: f.unit, grams: f.grams }, perServing: { kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat }, per100: null }; };
    const usual = [yog, basic('berries'), basic('granola')];
    [1, 2, 3, 5, 6].forEach((i) => { d.foodLog[dateKey(addDays(t, -i))] = usual.map((f) => ({ id: uid(), slot: 'breakfast', name: f.name, brand: '', barcode: null, food: f, amount: 1, mode: 'servings', label: f.serving.label, ...L.foodMacros(f, 1, 'servings'), ts: Date.now() })); });
    d.recentFoods = usual.map((f) => ({ food: f, amount: 1, mode: 'servings' }));
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
    if (isCloud()) {
      // Save first; then clear this device's copy, since the account holds everything.
      const saved = await pushNow();
      if (!saved && !confirm('Your latest changes have not synced yet (no connection). Sign out anyway and lose them on this device?')) return;
      if (saved) store.del(dataKey());
      store.del(bkStoreKey());
      stopCloudCommunity();
      try { const reg = 'serviceWorker' in navigator && await navigator.serviceWorker.getRegistration(); const sub = reg && reg.pushManager && await reg.pushManager.getSubscription(); if (sub) { await cloud.removePush(sub.endpoint).catch(() => {}); await sub.unsubscribe(); } } catch { /* no reminders on this device */ }
      await cloud.signOut();
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
    if (isCloud()) {
      if (!confirm('Delete your YOURS account? This removes your plan, history, posts, messages and photo backup from every device and from the cloud. It cannot be undone.')) return;
      if (billingOn() && S.sub && S.sub.status && !['none', 'comp', 'canceled'].includes(S.sub.status)) {
        // End the membership first so a deleted account is never charged again.
        try {
          const token = await cloud.accessToken();
          const r = await fetch('/api/billing', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ action: 'cancel_for_delete' }) });
          if (!r.ok) throw new Error('cancel failed');
        } catch { return toast('Could not cancel your membership. Check your connection and try again.'); }
      }
      try { await cloud.deleteAccount(); } catch (e) { return toast(window.YOURS_CLOUD.friendlyError(e)); }
      stopCloudCommunity();
      store.del(bkStoreKey());
    } else if (!confirm('Delete all of your YOURS data on this device? This cannot be undone.')) return;
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
    start: () => { S.authError = ''; logEvent('signup_start'); startSession({ kind: 'guest' }).then(render); },
    'go-login': () => {
      // Guest progress stays saved on the device; signing in switches to that account's data.
      S.authError = ''; S.modal = null; S.screen = 'login';
      if (S.session && !isGuest()) { S.data.planSeen = true; save(); S.tab = 'home'; render(); return; } // already signed in
      if (S.session && isGuest()) { S.session = null; store.del('yours.session'); }
      render(); window.scrollTo(0, 0);
    },
    'go-welcome': () => { S.screen = 'welcome'; S.authError = ''; render(); },
    demo: () => demo(),
    'open-legal': (el) => { S.modal = { type: 'legal', doc: el.dataset.doc }; render(); const sh = root.querySelector('.sheet'); if (sh) sh.scrollTop = 0; },
    'agree-toggle': () => { S.agreeChecked = !S.agreeChecked; render(); },
    'health-toggle': () => { S.healthChecked = !S.healthChecked; render(); },
    'agree-continue': () => { if (!S.agreeChecked || !S.healthChecked) return; acceptTerms(); S.agreeChecked = false; S.healthChecked = false; S.tab = 'home'; render(); window.scrollTo(0, 0); },
    'reminders-on': () => enableReminders(),
    'reminders-off': () => disableReminders(),
    'reminder-toggle': (el) => { const r = S.data.reminders || {}; const k = el.dataset.kind; const cur = r[k] || { on: true, hour: REMINDER_KINDS.find((x) => x[0] === k)[2] }; r[k] = { ...cur, on: cur.on === false }; S.data.reminders = r; save(); render(); },
    'reminders-test': async () => {
      try { const token = await cloud.accessToken(); const res = await fetch('/api/push-test', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); toast(res.ok ? 'Test sent. It should arrive in a few seconds.' : res.status === 404 ? 'Turn reminders on again on this device.' : 'Reminders are not switched on on the server yet.'); } catch { toast('Could not send a test.'); }
    },
    'toggle-weekly-email': async () => { const next = S.emailWeekly === false; S.emailWeekly = next; render(); try { await cloud.setWeeklyEmail(next); } catch { S.emailWeekly = !next; render(); toast('Could not save. Try again.'); } },
    'open-privacy': () => { S.modal = { type: 'privacy' }; render(); },
    'pay-plan': (el) => { S.payPlan = el.dataset.plan; S.billingError = ''; render(); },
    'pay-start': async () => {
      S.billingBusy = 'opening'; S.billingError = ''; render();
      logEvent('checkout_start');
      try { location.href = await billingCall('checkout', { plan: S.payPlan || 'yearly' }); }
      catch (e) { S.billingBusy = null; S.billingError = e.message; render(); }
    },
    'billing-portal': async () => {
      try { location.href = await billingCall('portal'); } catch (e) { toast(e.message); }
    },
    'billing-recheck': () => awaitMembership(),
    'start-plan': () => { S.data.planSeen = true; S.tab = 'home'; save(); render(); window.scrollTo(0, 0); },
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
      if (!S.data.onboarded) logEvent('onboarding_done');
      S.data.onboarded = true;
      S.data.obStep = 0;
      if (S.data.editing) { S.data.editing = false; S.data.planSeen = true; toast('Plan updated'); }
      save(); render(); window.scrollTo(0, 0);
    },

    tab: (el) => { goTab(el.dataset.tab); if (S.tab === 'community' && isCloud()) refreshCommunity(); render(); if (S.tab === 'advisor' && S.advisorView === 'coach') scrollChat(); },
    'open-settings': () => { S.modal = { type: 'settings' }; render(); },
    'close-modal': () => { stopDictation(); if (S.modal && ['addFood', 'food', 'foodSearch', 'foodManual', 'quickAdd', 'scanner', 'talk', 'estimate', 'restaurants', 'restaurant', 'restaurantBuild', 'restaurantSearch'].includes(S.modal.type)) return closeFoodFlow(); if (S.modal && S.modal.type === 'recipe') { S.recipeDraft = null; S.foodTarget = null; } stopScanner(); S.modal = null; render(); },
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
      awardBadges(true);
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
      logEvent('weekly_checkin');
      setTimeout(() => { awardBadges(true); render(); }, 2600);
    },

    'view-workout': (el) => { S.modal = { type: 'workout', id: el.dataset.id, from: S.modal && S.modal.type === 'program' ? S.modal : null }; render(); },
    'modal-back': () => { S.modal = S.modal.from; render(); },
    'toggle-postpartum': () => { S.data.profile.postpartum = !S.data.profile.postpartum; save(); render(); if (S.data.profile.postpartum) toast('Postpartum return is now suggested in Workouts'); },
    'open-program': (el) => { const cur = S.data.program && S.data.program.id === el.dataset.id ? S.data.program.days : [1, 3, 5]; S.modal = { type: 'program', id: el.dataset.id, days: cur.slice(), screen: [], cleared: false }; render(); },
    'program-day': (el) => { const d = Number(el.dataset.d); const m = S.modal; m.days = m.days.includes(d) ? m.days.filter((x) => x !== d) : m.days.concat(d); render(); },
    'program-screen': (el) => { const i = Number(el.dataset.i); const m = S.modal; m.screen = m.screen.includes(i) ? m.screen.filter((x) => x !== i) : m.screen.concat(i); render(); },
    'program-cleared': () => { S.modal.cleared = !S.modal.cleared; render(); },
    'program-start': () => {
      const m = S.modal;
      const pr = D.PROGRAMS.find((x) => x.id === m.id);
      S.data.program = { id: pr.id, start: todayKey(), days: m.days.slice().sort(), flagged: m.screen.length > 0 };
      logEvent('program_start');
      if (pr.id === 'postpartum') S.data.profile.postpartum = true;
      delete S.data.overrides[todayKey()];
      S.modal = null;
      save(); render();
      toast(`${pr.name} starts today`);
    },
    'program-leave': () => {
      const pg = L.programDay(S.data, today());
      if (pg && !pg.complete && !confirm('Leave this program? Your logged workouts stay in your history.')) return;
      S.data.program = null; S.modal = null; save(); render();
    },
    'start-workout': (el) => {
      if (S.data.activeWorkout && S.data.activeWorkout.templateId === el.dataset.id) { S.modal = { type: 'active' }; return render(); }
      if (S.data.activeWorkout && !confirm('You have a workout in progress. Replace it?')) return;
      startWorkout(el.dataset.id);
    },
    'resume-workout': () => { S.modal = { type: 'active' }; render(); },
    'toggle-set': (el) => {
      const a = S.data.activeWorkout;
      const s = a.exercises[el.dataset.ei].sets[el.dataset.si];
      s.done = !s.done;
      if (s.done && !s.reps && s.target) s.reps = String(s.target);
      if (s.done) afterSet(a, Number(el.dataset.ei), Number(el.dataset.si)); else stopRest();
      save(); render();
    },
    'rest-add': (el) => { if (!S.rest) return; S.rest.endsAt = Math.max(Date.now() + 1000, S.rest.endsAt + Number(el.dataset.d) * 1000); tickRest(); },
    'rest-skip': () => { stopRest(); render(); },
    'superset-toggle': (el) => { const ex = S.data.activeWorkout.exercises[el.dataset.ei]; ex.superset = !ex.superset; save(); render(); },
    'note-open': (el) => { S.data.activeWorkout.exercises[el.dataset.ei].noteOpen = true; render(); const t = root.querySelector(`[data-note="${el.dataset.ei}"]`); if (t) t.focus(); },
    'swap-toggle': (el) => { const ex = S.data.activeWorkout.exercises[el.dataset.ei]; ex.swapOpen = !ex.swapOpen; render(); },
    'swap-pick': (el) => {
      const a = S.data.activeWorkout;
      const ei = Number(el.dataset.ei);
      const ex = a.exercises[ei];
      if (!ex || ex.sets.some((x) => x.done) || !L.swapOptions(ex.name).some((o) => o.name === el.dataset.name)) return;
      const next = loggerEntry(el.dataset.name, ex.reps, ex.rest, ex.sets.length, a.unit, a.phase);
      a.exercises[ei] = { ...next, main: ex.main, superset: ex.superset, swappedFrom: ex.swappedFrom || ex.name };
      logEvent('exercise_swap');
      save(); render();
      toast(`Swapped to ${next.name}`);
    },
    'cmp-mode': (el) => { S.cmp.mode = el.dataset.mode; render(); },
    'cmp-pose': (el) => { S.cmp = { ...S.cmp, pose: el.dataset.pose, a: null, b: null }; render(); },
    'cmp-show': () => { S.cmp.shown = true; logEvent('photo_compare'); render(); },
    'plates-toggle': (el) => { const ex = S.data.activeWorkout.exercises[el.dataset.ei]; ex.platesOpen = !ex.platesOpen; render(); },
    'plates-bar': (el) => { S.data.activeWorkout.exercises[el.dataset.ei].bar = Number(el.dataset.bar); save(); render(); },
    'finish-workout': () => finishWorkout(),
    'discard-workout': () => { if (!confirm('Discard this workout?')) return; stopRest(); S.data.activeWorkout = null; S.modal = null; save(); render(); },
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
    'open-restaurants': () => { stopScanner(); S.modal = { type: 'restaurants', q: '' }; render(); },
    'open-restaurant': (el) => { S.modal = { type: 'restaurant', id: el.dataset.id }; render(); },
    'restaurant-item': (el) => { const r = findRestaurant(el.dataset.id); openFood(restaurantFood(r, r.items[el.dataset.i], true)); },
    'restaurant-mine': (el) => { const r = findRestaurant(el.dataset.id); openFood(r.mine.items[el.dataset.i]); },
    'restaurant-build': (el) => { S.modal = { type: 'restaurantBuild', id: el.dataset.id, picks: { base: [0] } }; render(); },
    'build-pick': (el) => {
      const m = S.modal; const r = findRestaurant(m.id); const sec = r.build.sections.find((x) => x.id === el.dataset.sec); const i = Number(el.dataset.i);
      const cur = m.picks[sec.id] || [];
      if (sec.type === 'one') m.picks[sec.id] = [i];
      else { const c = cur.filter((x) => x === i).length; m.picks[sec.id] = c === 0 ? cur.concat([i]) : c === 1 && sec.id === 'protein' ? cur.concat([i]) : cur.filter((x) => x !== i); }
      render();
    },
    'build-log': () => {
      const m = S.modal; const r = findRestaurant(m.id); const { totals, names } = L.buildTotals(r, m.picks);
      const base = r.build.sections[0].options[(m.picks.base || [0])[0]].name.split(' (')[0];
      openFood({ barcode: null, name: `${r.name} ${base.toLowerCase()}: ${names.join(', ').toLowerCase()}`, brand: r.name, image: null, custom: true, restaurant: true, approx: true, serving: { label: '1 order', grams: null }, perServing: totals, per100: null });
    },
    'restaurant-online': (el) => searchRestaurantsOnline(el.dataset.q),
    'restaurant-result': (el) => { const f = S.modal.results[el.dataset.i]; if (f) openFood(f); },
    'restaurant-add-item': (el) => { S.modal = { type: 'foodManual', restaurant: true, restaurantName: el.dataset.name || '' }; render(); },
    'cam-switch': () => {
      if (camDevices.length < 2) return;
      const cur = scanTrack && scanTrack.getSettings ? scanTrack.getSettings().deviceId : null;
      const i = camDevices.findIndex((d) => d.deviceId === cur);
      store.set('yours.camera', camDevices[(i + 1) % camDevices.length].deviceId);
      setScanStatus('Switching camera...');
      restartScanner();
    },
    'cam-torch': async (el) => {
      S.torch = !S.torch;
      el.classList.toggle('on', S.torch);
      try { await scanTrack.applyConstraints({ advanced: [{ torch: S.torch }] }); } catch { toast('Flashlight is not available on this camera'); }
    },
    'grocery-store': (el) => { groceryState().store = el.dataset.value; save(); render(); },
    'grocery-ideas': () => { const g = groceryState(); g.ideas = g.ideas === false; save(); render(); },
    'grocery-recipe': (el) => { const g = groceryState(); g.recipes[el.dataset.id] = !g.recipes[el.dataset.id]; save(); render(); },
    'grocery-remove': (el) => { const g = groceryState(); g.custom = g.custom.filter((x) => x !== el.dataset.item); save(); render(); },
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
    'open-talk': () => { stopScanner(); stopDictation(); if (S.modal && S.modal.type === 'estimate') S.foodTarget = { kind: 'log', slot: S.modal.slot }; else if (S.foodTarget && S.foodTarget.kind !== 'log') S.foodTarget = null; S.modal = { type: 'talk', text: '' }; render(); },
    'talk-example': (el) => { stopDictation(); processTalk(el.dataset.text); },
    'talk-mic': () => { if (S.dictation) { S.dictation.stop(); return; } startDictation(); },
    'est-toggle': (el) => { const x = S.modal.items[el.dataset.i]; x.on = !x.on; render(); },
    'est-scale': (el) => { const x = S.modal.items[el.dataset.i]; x.scale = clamp(Math.round((x.scale + Number(el.dataset.d)) * 100) / 100, 0.25, 10); render(); },
    'est-edit': (el) => { const x = S.modal.items[el.dataset.i]; x.edit = !x.edit; render(); },
    'est-slot': (el) => { S.modal.slot = el.dataset.slot; render(); },
    'est-log': () => logEstimate(),
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
      const list = L.groceryList(S.data, today(), 7, groceryOpts());
      const text = `YOURS grocery list · ${currentStore().name}\n` + Object.entries(list).map(([cat, items]) => `\n${cat}\n` + items.map((i) => `- ${i.name}${i.count > 1 ? ` x${i.count}` : ''}`).join('\n')).join('\n');
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
    'open-stats': () => openStats(),
    'open-library': () => openLibrary(),
    'wu-toggle': (el) => { const ex = S.data.activeWorkout.exercises[el.dataset.ei]; ex.wuHidden = !ex.wuHidden; save(); render(); },
    'wu-tick': (el) => { const ex = S.data.activeWorkout.exercises[el.dataset.ei]; const i = Number(el.dataset.i); ex.wu = (ex.wu || []).includes(i) ? ex.wu.filter((x) => x !== i) : (ex.wu || []).concat(i); save(); render(); },
    'rpe-set': (el) => { const st = S.data.activeWorkout.exercises[el.dataset.ei].sets[el.dataset.si]; st.rpe = Number(el.dataset.v); st.rpeOpen = false; save(); render(); },
    'rpe-edit': (el) => { S.data.activeWorkout.exercises[el.dataset.ei].sets[el.dataset.si].rpeOpen = true; render(); },
    'builder-new': () => openBuilder(),
    'builder-edit': (el) => openBuilder(el.dataset.id),
    'builder-copy': (el) => openBuilder(null, el.dataset.id),
    'builder-pick': () => { S.modal.picking = !S.modal.picking; S.modal.q = ''; render(); },
    'builder-add': (el) => { const m = S.modal; m.exercises.push({ name: el.dataset.name, sets: 3, reps: L.parseReps('8-12') && /plank|hold|hang|carry|walk|breath|pelvic/i.test(el.dataset.name) ? '30s' : '8-12', rest: '90s' }); render(); },
    'builder-remove': (el) => { S.modal.exercises.splice(Number(el.dataset.i), 1); render(); },
    'builder-move': (el) => { const x = S.modal.exercises; const i = Number(el.dataset.i), j = i + Number(el.dataset.d); if (j < 0 || j >= x.length) return; [x[i], x[j]] = [x[j], x[i]]; render(); },
    'builder-save': () => {
      const m = S.modal;
      const clean = { id: m.id || `cw-${uid()}`, name: m.name.trim().slice(0, 40), exercises: m.exercises.map((e) => ({ name: e.name, sets: clamp(Math.round(Number(e.sets) || 3), 1, 10), reps: String(e.reps || '8-12').trim().slice(0, 12) || '8-12', rest: REST_OPTIONS.includes(e.rest) ? e.rest : '90s' })) };
      if (!clean.name || !clean.exercises.length) return;
      const list = (S.data.customWorkouts || []).filter((c) => c.id !== clean.id);
      S.data.customWorkouts = m.id ? (S.data.customWorkouts || []).map((c) => (c.id === clean.id ? clean : c)) : list.concat(clean);
      if (!m.id) logEvent('workout_created');
      save(); L.setCustomWorkouts(S.data.customWorkouts);
      S.modal = { type: 'workout', id: clean.id }; render();
      toast(m.id ? 'Workout updated' : 'Saved to My workouts');
    },
    'builder-delete': () => {
      const m = S.modal;
      if (!confirm('Delete this workout? Sessions you already logged stay in your history.')) return;
      S.data.customWorkouts = (S.data.customWorkouts || []).filter((c) => c.id !== m.id);
      Object.keys(S.data.overrides || {}).forEach((k) => { if (S.data.overrides[k] === m.id) delete S.data.overrides[k]; });
      save(); S.modal = null; render(); toast('Workout deleted');
    },
    'open-measure': () => { S.modal = { type: 'measure' }; render(); },
    'open-exercise': (el) => openExercise(el.dataset.name),
    'ex-tab': (el) => { S.modal.tab = el.dataset.value; render(); const sh = root.querySelector('.sheet'); if (sh) sh.scrollTop = 0; },
    'ex-fav': () => { const n = S.modal.name; const f = favLifts(); S.data.favLifts = f.includes(n) ? f.filter((x) => x !== n) : f.concat(n); save(); render(); },
    'ex-share': async () => {
      const m = S.modal; const u = unit(); const r = L.liftStats(S.data.workouts, m.name, u).records;
      if (r && r.maxWeight.value) return openShare({ art: cyc().phase, eyebrow: 'Personal record', big: fmtLoad(r.maxWeight.value, u), sub: `My heaviest ${m.name.toLowerCase()} so far.`, foot: shortDate(r.maxWeight.date) });
      const url = `${location.origin}/`; const text = `${m.name}: how to do it, muscles worked and common mistakes, in YOURS.`;
      if (navigator.share) { try { await navigator.share({ title: m.name, text, url }); } catch { /* cancelled */ } } else { try { await navigator.clipboard.writeText(`${text} ${url}`); toast('Copied'); } catch { /* unavailable */ } }
    },
    'lib-view': (el) => { S.modal.view = el.dataset.value; render(); },
    'lib-group': (el) => { S.modal.group = el.dataset.value; render(); },
    'invite-load': async () => { await loadInvite(); render(); if (!S.invite) toast('Could not load your invite link. Try again in a moment.'); },
    'invite-copy': async () => { const link = inviteLink(); if (!link) return; try { await navigator.clipboard.writeText(link); toast('Invite link copied'); } catch { prompt('Copy your invite link', link); } logEvent('invite_shared'); },
    'invite-share': async () => {
      const link = inviteLink(); if (!link) return;
      const text = 'I train with YOURS, strength training that follows your cycle. Use my link for 3 weeks free:';
      logEvent('invite_shared');
      if (navigator.share) { try { await navigator.share({ title: 'YOURS', text, url: link }); return; } catch { return; } }
      try { await navigator.clipboard.writeText(`${text} ${link}`); toast('Invite copied. Paste it in a message.'); } catch { prompt('Copy your invite link', link); }
    },
    'share-format': (el) => { const m = S.modal; if (!m || m.type !== 'share') return; openShare({ ...m.card, story: el.dataset.value === 'story' }); },
    'share-badge': (el) => { const b = L.badges(S.data).find((x) => x.id === el.dataset.id && x.earned); if (b) openShare({ art: cyc().phase, eyebrow: 'Badge unlocked', big: b.short, sub: `${b.title}. ${b.desc}`, foot: shortDate(b.earned) }); },

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
      if (isCloud()) { try { await cloud.removeBackups(ids.map((id) => `${id}.bin`)); if (S.backupNames) S.backupNames = S.backupNames.filter((n) => !ids.includes(n.replace(/\.bin$/, ''))); } catch { /* removed locally */ } }
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
    'lock-vault': () => { S.vaultUnlocked = false; S.photoKey = null; S.backupKey = null; S.photos = []; S.revealed = {}; S.compare = []; S.cmp.shown = false; render(); },

    'community-view': (el) => { S.communityView = el.dataset.value; S.openThread = null; render(); },
    'post-tag': (el) => { S.postTag = el.dataset.value; const ta = root.querySelector('[data-form="post"] textarea'); const keep = ta ? ta.value : ''; render(); const nt = root.querySelector('[data-form="post"] textarea'); if (nt) nt.value = keep; },
    like: (el) => {
      if (!requireAccount('community')) return;
      const c = community();
      const p = c.posts.find((x) => x.id === el.dataset.id);
      const me = meId();
      const i = p.likedBy.indexOf(me);
      if (i > -1) p.likedBy.splice(i, 1); else p.likedBy.push(me);
      if (isCloud()) { render(); cloudCall(() => cloud.like(p.id, i === -1)); return; }
      saveCommunity(c); render();
    },
    'toggle-comments': (el) => { S.openComments[el.dataset.id] = !S.openComments[el.dataset.id]; render(); },
    'post-delete': (el) => { if (!confirm('Delete your post?')) return; cloudCall(() => cloud.deletePost(el.dataset.id), 'Post deleted'); },
    report: (el) => { S.modal = { type: 'report', postId: el.dataset.post || null, author: el.dataset.author }; render(); },
    'report-send': async (el) => {
      const m = S.modal;
      const reason = el.dataset.reason;
      const ok = await cloudCall(() => cloud.report({ postId: m.postId }, `${reason}${m.postId ? '' : ` (member ${m.author})`}`));
      if (ok) { S.modal = { ...m, sent: true }; render(); }
    },
    'block-member': () => {
      const id = S.modal.author;
      S.data.blocked = Array.from(new Set((S.data.blocked || []).concat(id)));
      save();
      if (S.openThread === id) S.openThread = null;
      S.modal = null;
      refreshCommunity();
      toast(`You will no longer see ${memberName(id)}`);
    },
    'unblock-all': () => { S.data.blocked = []; save(); refreshCommunity(); render(); toast('Hidden members are visible again'); },
    'forgot-password': async () => {
      const el = root.querySelector('[data-form="login"] [name="email"]');
      const email = el ? el.value.trim().toLowerCase() : '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { S.authError = 'Enter your email above, then tap Forgot password.'; return render(); }
      try { await cloud.resetPassword(email, location.origin); S.authError = ''; render(); toast('Check your email for a reset link'); }
      catch (e) { S.authError = window.YOURS_CLOUD.friendlyError(e); render(); }
    },
    'confirm-signin': () => { const email = S.modal.email; S.modal = null; S.session = null; S.data = null; store.del('yours.session'); S.screen = 'login'; S.prefillEmail = email; render(); },
    'backup-setup': () => { S.modal = { type: 'backupSetup' }; render(); },
    'backup-unlock': () => { S.modal = { type: 'backupUnlock' }; render(); },
    'backup-now': () => backupAll(),
    'backup-restore': () => restoreAll(),
    'sync-now': async () => { await pushNow(); await syncPull(); render(); toast(S.syncState === 'synced' ? 'Synced' : 'Could not reach YOURS. Changes are saved here and will sync later.'); },
    message: (el) => {
      if (!requireAccount('community')) return;
      if (el.dataset.id === meId()) return;
      S.communityView = 'messages'; S.openThread = el.dataset.id; render(); window.scrollTo(0, 0);
    },
    'open-thread': (el) => { S.openThread = el.dataset.id; render(); scrollChat(); },
    'close-thread': () => { S.openThread = null; render(); },

    theme: (el) => { applyTheme(el.dataset.value); render(); },
    'set-units': (el) => { S.data.profile.units = el.dataset.value; save(); render(); toast(`Weights now in ${unit() === 'lb' ? 'pounds' : 'kilograms'}`); },
    'open-install': () => { S.modal = { type: 'install' }; render(); },
    'install-copy': async () => { try { await navigator.clipboard.writeText(location.origin); toast('Link copied. Paste it into Safari.'); } catch { prompt('Copy this link:', location.origin); } },
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
    if (el.form && el.form.dataset.form === 'signup' && ['name', 'email', 'password'].includes(el.name)) { S.authForm = { ...(S.authForm || {}), [el.name]: el.value }; }
    if (el.matches('[data-talk-text]') && S.modal && S.modal.type === 'talk') { S.modal.text = el.value; return; }
    if (el.dataset.estField && S.modal && S.modal.type === 'estimate') {
      const x = S.modal.items[el.dataset.i];
      const f = el.dataset.estField;
      if (!x) return;
      x[f] = f === 'name' || f === 'portion' ? el.value : Math.max(0, Number(el.value) || 0);
      x.edited = true;
      x.confidence = 'high';
      return;
    }
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
    if (S.modal && S.modal.type === 'builder') {
      if (el.matches('[data-builder-name]')) { S.modal.name = el.value; const b = root.querySelector('[data-action=builder-save]'); if (b) b.disabled = !(el.value.trim() && S.modal.exercises.length); return; }
      if (el.matches('[data-builder-q]')) { S.modal.q = el.value; const box = document.getElementById('builder-list'); if (box) box.innerHTML = builderPicker(S.modal); return; }
      if (el.dataset.bfield) { const [i, f] = el.dataset.bfield.split('.'); if (S.modal.exercises[i]) S.modal.exercises[i][f] = el.value; return; }
    }
    if (el.matches('[data-lib-q]') && S.modal && S.modal.type === 'library') { S.modal.q = el.value; const box = document.getElementById('lib-list'); if (box) box.innerHTML = libraryRows(S.modal); return; }
    if (el.matches('[data-cmp-range]')) { S.cmp.pos = Number(el.value); const box = el.closest('.cmp-slider'); if (box) box.style.setProperty('--pos', `${el.value}%`); return; }
    if (el.dataset.note != null && S.data && S.data.activeWorkout) { const ex = S.data.activeWorkout.exercises[el.dataset.note]; if (ex) { ex.note = el.value.slice(0, 300); save(); } return; }
    if (el.dataset.set && S.data.activeWorkout) {
      const [ei, si, field] = el.dataset.set.split('.');
      S.data.activeWorkout.exercises[ei].sets[si][field] = el.value;
      save();
    }
    if (el.tagName === 'TEXTAREA' && el.name === 'msg') { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }
  });

  document.addEventListener('change', async (ev) => {
    const el = ev.target;
    if (el.form && el.form.dataset.form === 'signup' && (el.name === 'agree' || el.name === 'health')) { S.authForm = { ...(S.authForm || {}), [el.name]: el.checked }; return; }
    if (el.dataset.bindUi === 'pose') { S.pose = el.value; return; }
    if (el.dataset.bfield && S.modal && S.modal.type === 'builder') { const [i, f] = el.dataset.bfield.split('.'); if (S.modal.exercises[i]) S.modal.exercises[i][f] = el.value; return; }
    if (el.dataset.cmpPick) { S.cmp[el.dataset.cmpPick] = el.value; render(); return; }
    if (el.matches('[data-scan-photo]') && el.files && el.files[0]) { scanPhoto(el.files[0]); return; }
    if (el.dataset.reminderHour && S.data) { const k = el.dataset.reminderHour; S.data.reminders = S.data.reminders || {}; S.data.reminders[k] = { ...(S.data.reminders[k] || { on: true }), hour: Number(el.value) }; S.data.reminders.tz = Intl.DateTimeFormat().resolvedOptions().timeZone; save(); return; }
    if (el.matches('[data-plate-photo]') && el.files && el.files[0]) { handlePlate(el.files[0]); el.value = ''; return; }
    if (el.dataset.estField && S.modal && S.modal.type === 'estimate') { render(); return; }
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
    if (type === 'measure') {
      const toCm = (v) => { const n = Number(v); if (!(n > 0)) return null; const cm = unit() === 'lb' ? n * 2.54 : n; return cm >= 10 && cm <= 250 ? Math.round(cm * 10) / 10 : null; };
      const entry = { date: todayKey(), phase: cyc().phase };
      L.MEASURE_SITES.forEach(([k]) => { const v = toCm(form[k].value); if (v) entry[k] = v; });
      if (Object.keys(entry).length <= 2) { toast('Add at least one measurement'); return; }
      S.data.measurements = (S.data.measurements || []).filter((x) => x.date !== entry.date).concat(entry);
      logEvent('measurement_logged');
      save(); S.modal = null; render(); toast('Measurements saved');
      return;
    }
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
    if (type === 'new-password') {
      const pw = form.password.value;
      if (pw.length < 8) return toast('Use at least 8 characters');
      if (await window.YOURS_CLOUD.passwordLeaks(pw) > 0) return toast('A password like this has appeared in a data breach, so it is easy for others to guess. Please choose a different one.');
      try { await cloud.updatePassword(pw); S.modal = null; render(); return toast('Password updated'); } catch (e) { return toast(window.YOURS_CLOUD.friendlyError(e)); }
    }
    if (type === 'backup-setup' || type === 'backup-unlock') {
      const m = S.modal;
      const pass = form.pass.value;
      if (type === 'backup-setup') {
        if (pass.length < 10) { m.error = 'Use at least 10 characters.'; return render(); }
        if (pass !== form.pass2.value) { m.error = 'The two passphrases do not match.'; return render(); }
      }
      m.busy = true; m.error = ''; render();
      try {
        const salt = type === 'backup-setup' ? newSalt() : S.data.backup.salt;
        const { raw, key } = await backupKeyFrom(pass, salt);
        if (type === 'backup-setup') { S.data.backup = { salt, check: await encryptText(key, 'yours-backup'), created: Date.now() }; save(); }
        else if ((await decryptText(key, S.data.backup.check).catch(() => '')) !== 'yours-backup') { m.busy = false; m.error = 'That passphrase does not match.'; return render(); }
        S.backupKey = key; S.backupRaw = raw;
        await rememberBackupKey(raw);
        S.modal = null; render();
        if (type === 'backup-setup') backupAll(); else { await refreshBackupList(); toast('Backup unlocked on this device'); }
      } catch { m.busy = false; m.error = 'Something went wrong. Try again.'; render(); }
      return;
    }
    if (type === 'talk') { stopDictation(); return processTalk(form.text.value); }
    if (type === 'food-search') { const q = form.q.value.trim(); if (q.length >= 2) searchFoods(q); return; }
    if (type === 'restaurant-filter') { S.modal.q = form.q.value.trim(); return render(); }
    if (type === 'restaurant-online') { const q = form.q.value.trim(); if (q.length >= 2) searchRestaurantsOnline(q); return; }
    if (type === 'grocery-add') {
      const v = form.item.value.trim().slice(0, 60);
      if (!v) return;
      const g = groceryState();
      if (!g.custom.some((x) => x.toLowerCase() === v.toLowerCase())) g.custom.push(v);
      save(); render();
      const inp = root.querySelector('[data-form="grocery-add"] [name=item]'); if (inp) inp.focus();
      return;
    }
    if (type === 'quick-add') {
      const n = (x) => Math.max(0, Number(form[x].value) || 0);
      const food = { barcode: null, name: form.name.value.trim().slice(0, 60) || 'Quick add', brand: '', image: null, custom: true, serving: { label: 'Quick add', grams: null }, perServing: { kcal: n('kcal'), protein: n('protein'), carbs: n('carbs'), fat: n('fat') }, per100: null };
      S.modal = { type: 'food', food, amount: 1, mode: 'servings', slot: foodTarget().slot || slotNow(), target: 'log' };
      return logFood();
    }
    if (type === 'food-manual') {
      const n = (x) => Math.max(0, Number(form[x].value) || 0);
      const restName = form.restaurant ? form.restaurant.value.trim().slice(0, 60) : '';
      const food = { barcode: S.modal.barcode || null, name: form.name.value.trim().slice(0, 80), brand: restName, restaurant: !!restName, image: null, custom: true, serving: { label: form.serving.value.trim().slice(0, 40) || '1 serving', grams: null }, perServing: { kcal: n('kcal'), protein: n('protein'), carbs: n('carbs'), fat: n('fat') }, per100: null };
      if (food.barcode) S.data.customFoods[food.barcode] = food;
      if (restName) {
        const builtIn = D.RESTAURANTS.find((r) => r.name.toLowerCase() === restName.toLowerCase());
        const rid = builtIn ? builtIn.id : slug(restName);
        const mr = (S.data.myRestaurants = S.data.myRestaurants || {});
        mr[rid] = mr[rid] || { id: rid, name: builtIn ? builtIn.name : restName, items: [] };
        mr[rid].items = mr[rid].items.filter((x) => x.name.toLowerCase() !== food.name.toLowerCase()).concat([food]);
      }
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
      if (!isGuest()) { if (S.backupKey && S.backupRaw) await rememberBackupKey(S.backupRaw); else store.del(bkStoreKey()); }
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
      if (ok) { S.photoKey = await photoKeyFrom(form.pin.value, S.data.pinSalt); await loadPhotos(); await restoreBackupKey(); refreshBackupList(); }
      return render();
    }
    if (type === 'post') {
      if (!requireAccount('community')) return;
      const text = form.text.value.trim();
      if (!text) return;
      if (isCloud()) { form.text.value = ''; return cloudCall(() => cloud.post(text.slice(0, 600), S.postTag || 'Win', cyc().phase), 'Shared with the community'); }
      const c = community();
      c.posts.push({ id: uid(), author: meId(), text: text.slice(0, 600), tag: S.postTag || 'Win', phase: cyc().phase, ts: Date.now(), baseLikes: 0, likedBy: [], comments: [] });
      saveCommunity(c); render(); return toast('Shared with the community');
    }
    if (type === 'comment') {
      if (!requireAccount('community')) return;
      const text = form.text.value.trim();
      if (!text) return;
      if (isCloud()) { form.text.value = ''; return cloudCall(() => cloud.comment(form.dataset.id, text.slice(0, 300))); }
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
      if (isCloud()) { S.cloudThreads = c.threads; render(); scrollChat(); return cloudCall(() => cloud.send(other, text.slice(0, 1000))); }
      saveCommunity(c); render(); scrollChat();
      if (D.MEMBERS.some((x) => x.id === other)) {
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
    S.vaultUnlocked = false; S.photoKey = null; S.backupKey = null; S.backupRaw = null; S.photos = []; S.revealed = {}; S.compare = []; S.cmp.shown = false;
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
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); S.installPrompt = e; if (S.session) render(); });
  window.addEventListener('appinstalled', () => { logEvent('install_done'); S.installPrompt = null; if (S.modal && S.modal.type === 'install') S.modal = null; toast('YOURS is on your Home Screen'); if (S.session) render(); });
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => { /* offline support unavailable */ }));
  }

  // ---------- boot ----------
  (async function boot() {
    const inviteParam = new URLSearchParams(location.search).get('invite');
    if (inviteParam) {
      const code = inviteParam.trim().toUpperCase();
      if (/^[A-HJ-NP-Z2-9]{6}$/.test(code)) { store.set('yours.invite', code); logEvent('invite_opened'); }
      history.replaceState(null, '', location.pathname);
    }
    setTimeout(() => { if (S.data && S.data.onboarded && awardBadges(true).length) render(); }, 4000);
    await Promise.all([initCloud(), loadBilling()]);
    if (S.session) {
      if (S.session.kind === 'user' && !users()[S.session.email]) { S.session = null; store.del('yours.session'); }
      else if (S.session.cloud) {
        // Show cached data right away; then confirm the account session and sync.
        loadData(); await loadPhotos(); render();
        const u = cloud ? await cloud.init() : null;
        if (u) { await syncPull(); await refreshSub(); startCloudCommunity(); claimInvite(); }
        else if (cloud && navigator.onLine) { S.session = null; S.data = null; store.del('yours.session'); S.screen = 'login'; S.authError = 'Please sign in again.'; }
      } else {
        loadData(); await loadPhotos();
        // A guest who just confirmed her email arrives signed in to the cloud: switch her to the account.
        if (isGuest() && cloud) { const u = await cloud.init(); if (u) await enterCloudAccount(u); }
      }
    } else if (cloud) {
      // Arriving from the confirmation email: the link carries her session, so sign her straight in.
      const u = await cloud.init();
      if (u) await enterCloudAccount(u);
    }
    render();
    // Opened from a reminder: go to the right screen.
    const openTo = new URLSearchParams(location.search).get('open');
    if (openTo && S.session && S.data && ['home', 'workouts', 'meals', 'advisor', 'community', 'checkin', 'settings'].includes(openTo)) {
      history.replaceState(null, '', location.pathname);
      if (openTo === 'settings') S.modal = { type: 'settings' };
      else if (openTo === 'checkin') { if (L.weeklyDue(S.data)) S.modal = { type: 'ciPhotos', photos: {} }; S.tab = 'home'; } else goTab(openTo);
    }
    // Back from Stripe: tidy the address bar, then confirm the membership.
    const billingReturn = new URLSearchParams(location.search).get('billing');
    if (billingReturn) {
      history.replaceState(null, '', location.pathname);
      if (billingReturn === 'success' && isCloud()) awaitMembership();
      else if (isCloud()) refreshSub().then(render);
    }
    if (S.session && S.data && S.data.onboarded) logEvent('app_open');
    checkAI();
    fetch('/api/food').then((r) => r.json()).then((j) => { S.foodApi = !!j.available; }).catch(() => { S.foodApi = false; });
  })();
})();
