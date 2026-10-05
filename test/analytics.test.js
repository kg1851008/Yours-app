const test = require('node:test');
const assert = require('node:assert');

process.env.SUPABASE_SECRET_KEY = 'sb_secret_test';
delete process.env.ADMIN_EMAILS;
const A = require('../lib/analytics');
const event = require('../api/event');
const stats = require('../api/stats');

function res() {
  const r = { statusCode: 0, headers: {}, body: null };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.end = () => r;
  return r;
}

test('only listed event names are stored, and nothing but the name is sent', async () => {
  const sent = [];
  global.fetch = async (url, opts) => { sent.push({ url, body: JSON.parse(opts.body) }); return { ok: true, status: 201, text: async () => '' }; };
  const bad = res();
  await event({ method: 'POST', headers: {}, body: { name: 'email:someone@x.co' } }, bad);
  assert.equal(bad.statusCode, 400);
  const ok = res();
  await event({ method: 'POST', headers: { 'x-forwarded-for': '1.2.3.4', 'user-agent': 'iPhone' }, body: { name: 'workout_done', userId: 'u1', extra: 'x' } }, ok);
  assert.equal(ok.statusCode, 204);
  assert.equal(sent.length, 1);
  assert.match(sent[0].url, /\/rest\/v1\/events$/);
  assert.deepEqual(sent[0].body, { name: 'workout_done' });
});

test('Stripe status changes become trial, payment and cancel counts', () => {
  assert.equal(A.subscriptionEvent(null, { status: 'trialing' }), 'trial_started');
  assert.equal(A.subscriptionEvent({ status: 'none', trial_used: false }, { status: 'trialing' }), 'trial_started');
  assert.equal(A.subscriptionEvent({ status: 'trialing' }, { status: 'trialing' }), null);
  assert.equal(A.subscriptionEvent({ status: 'trialing' }, { status: 'active' }), 'membership_paid');
  assert.equal(A.subscriptionEvent({ status: 'past_due' }, { status: 'active' }), null); // card fixed, not a new payer
  assert.equal(A.subscriptionEvent({ status: 'active' }, { status: 'canceled' }), 'membership_canceled');
  assert.equal(A.subscriptionEvent({ status: 'canceled' }, { status: 'canceled' }), null);
});

test('owner dashboard: admins only, and counts are summarized by window', async () => {
  assert.equal(stats.isAdmin({ email: 'YoursFitApp@gmail.com' }), true);
  assert.equal(stats.isAdmin({ email: 'someone@x.co' }), false);
  global.fetch = async (url) => {
    if (url.includes('/auth/v1/user')) return { ok: true, json: async () => ({ id: 'u9', email: 'someone@x.co' }) };
    throw new Error('should not read data for a non-admin');
  };
  const r = res();
  await stats({ method: 'GET', headers: { authorization: 'Bearer t' } }, r);
  assert.equal(r.statusCode, 404);

  const now = Date.parse('2026-10-05T12:00:00Z');
  const s = stats.summarize([
    { name: 'landing_view', day: '2026-10-05' }, { name: 'landing_view', day: '2026-09-20' },
    { name: 'trial_started', day: '2026-10-01' }, { name: 'trial_started', day: '2026-08-01' },
    { name: 'app_open', day: '2026-10-05' }, { name: 'nonsense', day: '2026-10-05' },
  ], now);
  assert.deepEqual([s.events.landing_view.d7, s.events.landing_view.d30], [1, 2]);
  assert.deepEqual([s.events.trial_started.d7, s.events.trial_started.d30], [1, 1]);
  assert.equal(s.days.length, 30);
  assert.equal(s.days[29].day, '2026-10-05');
  assert.equal(s.days[29].app_open, 1);
  assert.equal(s.funnel[0], 'landing_view');
});
