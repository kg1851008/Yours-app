const test = require('node:test');
const assert = require('node:assert');
process.env.CRON_SECRET = 'test-cron-secret-0123456789';
const N = require('../lib/notify');
const E = require('../lib/email');
const L = require('../public/logic.js');

const base = () => {
  const t = L.today();
  const k = (n) => L.dateKey(L.addDays(t, n));
  return { onboarded: true, profile: { cycleMode: 'natural', periodStart: k(-9), cycleLength: 28, periodLength: 5, weightKg: 62, heightCm: 165, age: 30, goal: 'glutes', activity: 'light', level: 'intermediate' }, plan: { volume: 0, stepBonus: 0, kcalAdjust: 0 }, workouts: [], checkins: [], foodLog: {}, daily: {}, steps: {}, overrides: {}, reviews: [], periods: [k(-9)], prs: [] };
};

test('local time follows her time zone', () => {
  const now = new Date('2026-10-05T12:30:00Z'); // a Monday
  assert.equal(N.localNow('America/Los_Angeles', now).hour, 5);
  assert.equal(N.localNow('America/New_York', now).hour, 8);
  assert.equal(N.localNow('America/New_York', now).weekday, 'Mon');
  assert.equal(N.localNow('Not/AZone', now).hour, 8); // bad zone falls back to Eastern
});

test('reminders only fire when there is something to do, at her chosen hour', () => {
  const d = base();
  const date = new Date(2026, 9, 5);
  d.overrides[L.dateKey(date)] = 'f-lower';
  assert.equal(N.due('workout', d, date), true);
  d.workouts.push({ date: L.dateKey(date), templateId: 'f-lower' });
  assert.equal(N.due('workout', d, date), false); // already trained
  d.overrides[L.dateKey(date)] = 'rest';
  d.workouts = [];
  assert.equal(N.due('workout', d, date), false); // rest day
  assert.equal(N.due('weigh', d, date), true);
  d.checkins.push({ date: L.dateKey(date), kg: 62 });
  assert.equal(N.due('weigh', d, date), false);
  assert.equal(N.due('meals', d, date), true);
  d.weighDaily = false;
  assert.equal(N.due('weigh', { ...d, checkins: [] }, date), false); // weigh-in prompt turned off

  const now = new Date('2026-10-05T20:00:00Z'); // 4pm New York
  const p = base();
  p.reminders = { on: true, tz: 'America/New_York', meals: { on: true, hour: 16 }, workout: { on: false }, weigh: { hour: 7 }, checkin: { hour: 9 } };
  assert.deepEqual(N.remindersNow(p, now).map((r) => r.kind), ['meals']);
  assert.deepEqual(N.remindersNow({ ...p, reminders: { ...p.reminders, on: false } }, now), []);
  // Lock-screen text never mentions cycle, period or weight.
  for (const r of Object.values(N.REMINDERS)) assert.ok(!/period|cycle|phase|weigh(?!-in)|lb|kg|pms/i.test(r.title + ' ' + r.body), r.title);
});

test('weekly email goes out Monday 8am her time, once per ISO week', () => {
  const d = base();
  d.reminders = { tz: 'America/Chicago' };
  assert.ok(N.weeklyEmailNow(d, new Date('2026-10-05T13:00:00Z'))); // Mon 8am Chicago
  assert.equal(N.weeklyEmailNow(d, new Date('2026-10-05T14:00:00Z')), null);
  assert.equal(N.isoWeek(new Date(2026, 9, 5)), '2026-W41');
  assert.equal(N.isoWeek(new Date(2026, 0, 1)), '2026-W01');
});

test('emails: discreet weekly summary with a working unsubscribe link', () => {
  const d = base();
  d.workouts.push({ date: L.dateKey(L.addDays(L.today(), -1)), templateId: 'f-lower', name: 'Lower', detail: [] });
  const uid = '11111111-2222-3333-4444-555555555555';
  const m = E.weeklyEmail('Kay Smith', d, uid, L.today());
  assert.match(m.html, /Workouts/);
  assert.ok(!/\bperiod\b|cycle|phase|62 ?kg|136|body ?weight|weigh-in|lb\b/i.test(m.text), 'no health details in the inbox');
  const u = new URL(m.unsub);
  assert.equal(u.searchParams.get('u'), uid);
  assert.equal(E.validUnsub(uid, u.searchParams.get('t')), true);
  assert.equal(E.validUnsub(uid, 'nope'), false);
  assert.equal(E.validUnsub('99999999-2222-3333-4444-555555555555', u.searchParams.get('t')), false);
  const w = E.welcomeEmail('<b>Kay</b>');
  assert.ok(!w.html.includes('<b>Kay</b>'), 'names are escaped');
});

test('hourly job needs the secret and never sends the same reminder twice', async () => {
  process.env.SUPABASE_SECRET_KEY = 'sb_secret_test';
  process.env.VAPID_PRIVATE_KEY = 'x';
  const cron = require('../api/cron');
  assert.equal(cron.authorized({ headers: {} }), false);
  assert.equal(cron.authorized({ headers: { 'x-cron-secret': 'wrong' } }), false);
  assert.equal(cron.authorized({ headers: { 'x-cron-secret': process.env.CRON_SECRET } }), true);

  const now = new Date('2026-10-05T20:00:00Z');
  const d = base();
  d.reminders = { on: true, tz: 'America/New_York', meals: { on: true, hour: 16 }, workout: { on: false }, weigh: { on: false }, checkin: { on: false } };
  const sent = new Set();
  global.fetch = async (url, opts) => {
    const u = new URL(url);
    const ok = (b) => ({ ok: true, status: 200, json: async () => b, text: async () => '' });
    if (u.pathname === '/rest/v1/user_data') return ok([{ user_id: 'u1', data: d }]);
    if (u.pathname === '/rest/v1/push_subscriptions') return ok([{ id: 1, user_id: 'u1', endpoint: 'https://push.example/1', p256dh: 'k', auth: 'a' }]);
    if (u.pathname === '/rest/v1/sent_log') { const body = JSON.parse(opts.body); const key = `${body.user_id}|${body.kind}|${body.period}`; if (sent.has(key)) return ok([]); sent.add(key); return ok([body]); }
    throw new Error('unexpected ' + url);
  };
  const pushes = [];
  require.cache[require.resolve('web-push')] = { exports: { setVapidDetails() {}, sendNotification: async (sub, payload) => { pushes.push(JSON.parse(payload)); } } };
  const s1 = await cron.run(now);
  const s2 = await cron.run(now);
  assert.equal(s1.push, 1);
  assert.equal(s2.push, 0);
  assert.equal(pushes[0].title, "Log today's food");
});

test('cycle heads-up: two days before a predicted period, never for steady modes', () => {
  const d = base();
  const t = L.today();
  // Period predicted in 2 days: start was len-2 days ago, so day = 27 of 28.
  d.profile.periodStart = L.dateKey(L.addDays(t, -26));
  assert.equal(N.due('cycle', d, t), true);
  d.profile.periodStart = L.dateKey(L.addDays(t, -20));
  assert.equal(N.due('cycle', d, t), false);
  d.profile.periodStart = L.dateKey(L.addDays(t, -26)); d.profile.cycleMode = 'hormonal';
  assert.equal(N.due('cycle', d, t), false);
  assert.ok(!/period|cycle|bleed/i.test(N.REMINDERS.cycle.title + N.REMINDERS.cycle.body), 'lock-screen text stays discreet');
});

test('trial reminder: once, 24-48 hours before the trial ends, not if she cancelled', () => {
  const now = new Date('2026-10-05T12:00:00Z');
  const row = { status: 'trialing', cancel_at_period_end: false, trial_end: '2026-10-07T06:00:00Z' };
  const data = { workouts: [{}, {}, {}], prs: [{}] };
  const r = N.trialReminder(row, data, now);
  assert.equal(r.title, 'Your free trial ends in 2 days');
  assert.match(r.body, /3 workouts and 1 personal record/);
  assert.match(r.body, /cancel anytime/);
  assert.equal(r.period, '2026-10-07');
  assert.equal(N.trialReminder({ ...row, cancel_at_period_end: true }, data, now), null);
  assert.equal(N.trialReminder({ ...row, trial_end: '2026-10-06T06:00:00Z' }, data, now), null); // under 24h
  assert.equal(N.trialReminder({ ...row, status: 'active' }, data, now), null);
  assert.match(N.trialReminder(row, { workouts: [] }, now).body, /^Keep going/);
});
