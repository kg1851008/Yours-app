const test = require('node:test');
const assert = require('node:assert');

process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_PRICE_MONTHLY = 'price_month';
process.env.STRIPE_PRICE_YEARLY = 'price_year';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.SUPABASE_SECRET_KEY = 'sb_secret_test';
const B = require('../lib/billing');
const webhook = require('../api/stripe-webhook');
const billing = require('../api/billing');
const RealStripe = require('stripe');

function res() {
  const r = { statusCode: 0, headers: {}, body: null };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
}
// Fake Supabase REST + auth over fetch.
function fakeSupabase(rows, users) {
  return async (url, opts) => {
    const u = new URL(url);
    const ok = (body) => ({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) });
    if (u.pathname === '/auth/v1/user') { const t = opts.headers.Authorization.replace('Bearer ', ''); return users[t] ? ok(users[t]) : { ok: false, status: 401, json: async () => ({}) }; }
    if (u.pathname === '/rest/v1/subscriptions' && (!opts || !opts.method)) {
      const [col, val] = [...u.searchParams.entries()].find(([k]) => k !== 'select');
      return ok(rows.filter((r) => String(r[col]) === val.replace('eq.', '')));
    }
    if (u.pathname === '/rest/v1/subscriptions' && opts.method === 'POST') {
      const row = JSON.parse(opts.body);
      const i = rows.findIndex((r) => r.user_id === row.user_id);
      if (i > -1) rows[i] = { ...rows[i], ...row }; else rows.push({ trial_used: false, ...row });
      return ok(null);
    }
    throw new Error('unexpected ' + url);
  };
}

test('access: trialing, active and briefly past due unlock; everything else locks', () => {
  const now = Date.parse('2026-10-10T00:00:00Z');
  assert.equal(B.hasAccess({ status: 'trialing' }, now), true);
  assert.equal(B.hasAccess({ status: 'active' }, now), true);
  assert.equal(B.hasAccess({ status: 'past_due', current_period_end: '2026-10-08T00:00:00Z' }, now), true);
  assert.equal(B.hasAccess({ status: 'past_due', current_period_end: '2026-09-20T00:00:00Z' }, now), false);
  assert.equal(B.hasAccess({ status: 'canceled' }, now), false);
  assert.equal(B.hasAccess({ status: 'comp' }, now), true);
  assert.equal(B.hasAccess(null, now), false);
  const C = require('../public/cloud.js');
  assert.equal(C.hasAccess({ status: 'trialing' }, now), true);
  assert.equal(C.hasAccess({ status: 'incomplete' }, now), false);
});

test('subscription rows read the period end from either API shape', () => {
  const base = { id: 'sub_1', customer: 'cus_1', status: 'trialing', trial_end: 1790000000, cancel_at_period_end: false };
  const a = B.rowFromSubscription({ ...base, current_period_end: 1790000000, items: { data: [{ price: { id: 'price_year' } }] } });
  const b = B.rowFromSubscription({ ...base, items: { data: [{ current_period_end: 1790000000, price: { id: 'price_month' } }] } });
  assert.equal(a.plan, 'yearly'); assert.equal(b.plan, 'monthly');
  assert.equal(a.current_period_end, b.current_period_end);
  assert.equal(a.trial_used, true);
});

test('webhook rejects bad signatures and stores verified subscription changes', async () => {
  const rows = [{ user_id: 'u1', customer_id: 'cus_1', status: 'none', trial_used: false }];
  global.fetch = fakeSupabase(rows, {});
  const sub = { id: 'sub_1', object: 'subscription', customer: 'cus_1', status: 'trialing', trial_end: 1790000000, cancel_at_period_end: false, metadata: { user_id: 'u1' }, items: { data: [{ current_period_end: 1790000000, price: { id: 'price_month', recurring: { interval: 'month' } } }] } };
  const real = new RealStripe('sk_test_123');
  B.stripe = () => ({ webhooks: real.webhooks, subscriptions: { retrieve: async () => sub } });
  const payload = JSON.stringify({ id: 'evt_1', object: 'event', type: 'customer.subscription.created', data: { object: sub } });

  const bad = res();
  await webhook({ method: 'POST', headers: { 'stripe-signature': 't=1,v1=nope' }, body: Buffer.from(payload) }, bad);
  assert.equal(bad.statusCode, 400);
  assert.equal(rows[0].status, 'none');

  const sig = real.webhooks.generateTestHeaderString({ payload, secret: 'whsec_test' });
  const good = res();
  await webhook({ method: 'POST', headers: { 'stripe-signature': sig }, body: Buffer.from(payload) }, good);
  assert.equal(good.statusCode, 200);
  assert.equal(rows[0].status, 'trialing');
  assert.equal(rows[0].plan, 'monthly');
  assert.equal(rows[0].trial_used, true);
});

test('checkout: needs a signed-in member, gives the trial once, and refuses a second membership', async () => {
  const rows = [];
  global.fetch = fakeSupabase(rows, { tok: { id: 'u2', email: 'a@b.co' } });
  const calls = [];
  B.stripe = () => ({
    customers: { create: async (x) => { calls.push(['customer', x]); return { id: 'cus_2' }; } },
    checkout: { sessions: { create: async (x) => { calls.push(['checkout', x]); return { url: 'https://checkout.stripe.com/c/pay/1' }; } } },
    subscriptions: { list: async () => ({ data: subsInStripe }) },
  });
  let subsInStripe = [];
  const anon = res();
  await billing({ method: 'POST', headers: {}, body: { action: 'checkout' } }, anon);
  assert.equal(anon.statusCode, 401);

  const r1 = res();
  await billing({ method: 'POST', headers: { authorization: 'Bearer tok', origin: 'https://yours-app-tau.vercel.app' }, body: { action: 'checkout', plan: 'yearly' } }, r1);
  assert.equal(r1.statusCode, 200);
  const s1 = calls.find((c) => c[0] === 'checkout')[1];
  assert.equal(s1.subscription_data.trial_period_days, 7);
  assert.equal(s1.line_items[0].price, 'price_year');
  assert.equal(s1.payment_method_collection, 'always');
  assert.equal(s1.success_url, 'https://yours-app-tau.vercel.app/?billing=success');
  assert.equal(rows[0].customer_id, 'cus_2');

  // Trial already used: no second trial. An untrusted origin falls back to the app's own address.
  rows[0].trial_used = true; rows[0].status = 'canceled';
  calls.length = 0;
  const r2 = res();
  await billing({ method: 'POST', headers: { authorization: 'Bearer tok', origin: 'https://evil.example' }, body: { action: 'checkout', plan: 'monthly' } }, r2);
  const s2 = calls.find((c) => c[0] === 'checkout')[1];
  assert.equal(s2.subscription_data.trial_period_days, undefined);
  assert.equal(s2.success_url, 'https://yours-app-tau.vercel.app/?billing=success');
  assert.equal(calls.filter((c) => c[0] === 'customer').length, 0);

  rows[0].status = 'active';
  const r3 = res();
  await billing({ method: 'POST', headers: { authorization: 'Bearer tok' }, body: { action: 'checkout' } }, r3);
  assert.equal(r3.statusCode, 409);
});

test('checkout refuses a second membership that Stripe already has (open in two tabs)', async () => {
  const rows = [{ user_id: 'u3', customer_id: 'cus_3', status: 'none', trial_used: false }];
  global.fetch = fakeSupabase(rows, { tok3: { id: 'u3', email: 'c@d.co' } });
  let created = 0;
  B.stripe = () => ({ subscriptions: { list: async () => ({ data: [{ id: 'sub_a', status: 'trialing' }] }) }, checkout: { sessions: { create: async () => { created++; return { url: 'x' }; } } } });
  const r = res();
  await billing({ method: 'POST', headers: { authorization: 'Bearer tok3' }, body: { action: 'checkout' } }, r);
  assert.equal(r.statusCode, 409);
  assert.equal(created, 0);
});

test('deleting an account cancels every live subscription', async () => {
  const rows = [{ user_id: 'u4', customer_id: 'cus_4', status: 'active', trial_used: true }];
  global.fetch = fakeSupabase(rows, { tok4: { id: 'u4', email: 'e@f.co' } });
  const cancelled = [];
  B.stripe = () => ({ subscriptions: { list: async () => ({ data: [{ id: 'sub_live', status: 'active' }, { id: 'sub_old', status: 'canceled' }] }), cancel: async (id) => { cancelled.push(id); return {}; } } });
  const r = res();
  await billing({ method: 'POST', headers: { authorization: 'Bearer tok4' }, body: { action: 'cancel_for_delete' } }, r);
  assert.equal(r.statusCode, 200);
  assert.deepEqual(cancelled, ['sub_live']);
});

test('a late event about an old cancelled subscription does not lock out a paying member', async () => {
  const rows = [{ user_id: 'u5', customer_id: 'cus_5', subscription_id: 'sub_new', status: 'active', trial_used: true }];
  global.fetch = fakeSupabase(rows, {});
  const old = { id: 'sub_old', object: 'subscription', customer: 'cus_5', status: 'canceled', cancel_at_period_end: false, metadata: { user_id: 'u5' }, items: { data: [{ current_period_end: 1790000000, price: { id: 'price_month' } }] } };
  const real = new RealStripe('sk_test_123');
  B.stripe = () => ({ webhooks: real.webhooks, subscriptions: { retrieve: async () => old } });
  const payload = JSON.stringify({ id: 'evt_9', object: 'event', type: 'customer.subscription.deleted', data: { object: old } });
  const r = res();
  await webhook({ method: 'POST', headers: { 'stripe-signature': real.webhooks.generateTestHeaderString({ payload, secret: 'whsec_test' }) }, body: Buffer.from(payload) }, r);
  assert.equal(r.statusCode, 200);
  assert.equal(rows[0].status, 'active');
  assert.equal(rows[0].subscription_id, 'sub_new');
});

test('the AI coach only serves signed-in members with access', async () => {
  const rows = [{ user_id: 'u6', customer_id: 'cus_6', status: 'canceled' }, { user_id: 'u7', status: 'comp' }];
  global.fetch = fakeSupabase(rows, { tok6: { id: 'u6' }, tok7: { id: 'u7' } });
  assert.deepEqual(await B.memberGate({ headers: {} }), { status: 401, error: 'Sign in to use the AI coach' });
  assert.equal((await B.memberGate({ headers: { authorization: 'Bearer tok6' } })).status, 402);
  assert.equal(await B.memberGate({ headers: { authorization: 'Bearer tok7' } }), null);
});

test('memberships are US-only: checkout is refused from other countries', async () => {
  assert.deepEqual(B.region({ headers: { 'x-vercel-ip-country': 'us' } }), { country: 'US', allowed: true });
  assert.equal(B.region({ headers: { 'x-vercel-ip-country': 'GB' } }).allowed, false);
  assert.equal(B.region({ headers: {} }).allowed, true); // local development has no country
  const rows = [];
  global.fetch = fakeSupabase(rows, { tok8: { id: 'u8', email: 'g@h.co' } });
  let created = 0;
  B.stripe = () => ({ customers: { create: async () => { created++; return { id: 'cus_8' }; } }, checkout: { sessions: { create: async () => { created++; return { url: 'x' }; } } }, subscriptions: { list: async () => ({ data: [] }) } });
  const r = res();
  await billing({ method: 'POST', headers: { authorization: 'Bearer tok8', 'x-vercel-ip-country': 'FR' }, body: { action: 'checkout' } }, r);
  assert.equal(r.statusCode, 451);
  assert.equal(created, 0);
  const g = res();
  await billing({ method: 'GET', headers: { 'x-vercel-ip-country': 'FR' } }, g);
  assert.equal(g.body.region.allowed, false);
});
