const test = require('node:test');
const assert = require('node:assert');

process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_PRICE_MONTHLY = 'price_month';
process.env.STRIPE_PRICE_YEARLY = 'price_year';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
process.env.SUPABASE_SECRET_KEY = 'sb_secret_test';
const B = require('../lib/billing');
const R = require('../lib/referral');
const referral = require('../api/referral');
const billing = require('../api/billing');
const webhook = require('../api/stripe-webhook');
const RealStripe = require('stripe');

function res() {
  const r = { statusCode: 0, headers: {}, body: null };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
}
// A tiny PostgREST: eq filters, insert with unique keys (409), patch with filters, return=representation.
function fakeDb(tables, users) {
  const unique = { subscriptions: ['user_id'], referral_codes: ['user_id', 'code'], referrals: ['referred_id'] };
  let nextId = 1;
  return async (url, opts) => {
    opts = opts || {};
    const u = new URL(url);
    const reply = (status, body) => ({ ok: status < 300, status, json: async () => body, text: async () => (body == null ? '' : JSON.stringify(body)) });
    if (u.pathname === '/auth/v1/user') { const t = opts.headers.Authorization.replace('Bearer ', ''); return users[t] ? reply(200, users[t]) : reply(401, {}); }
    const table = u.pathname.replace('/rest/v1/', '');
    const rows = (tables[table] = tables[table] || []);
    const filters = [...u.searchParams.entries()].filter(([k]) => !['select', 'order', 'on_conflict'].includes(k)).map(([k, v]) => [k, v.replace(/^eq\./, '')]);
    const match = (r) => filters.every(([k, v]) => String(r[k]) === v);
    const method = opts.method || 'GET';
    const wantRows = /return=representation/.test((opts.headers && opts.headers.Prefer) || '');
    if (method === 'GET') return reply(200, rows.filter(match));
    if (method === 'POST') {
      const row = JSON.parse(opts.body);
      if (u.searchParams.get('on_conflict')) { const k = u.searchParams.get('on_conflict'); const i = rows.findIndex((r) => r[k] === row[k]); if (i > -1) { rows[i] = { ...rows[i], ...row }; return reply(201, null); } }
      for (const k of unique[table] || []) if (rows.some((r) => r[k] === row[k])) return reply(409, { message: 'duplicate key' });
      rows.push({ id: nextId++, ...(table === 'subscriptions' ? { trial_used: false } : {}), ...row });
      return reply(201, null);
    }
    if (method === 'PATCH') {
      const patch = JSON.parse(opts.body);
      const hit = rows.filter(match);
      hit.forEach((r) => Object.assign(r, patch));
      return reply(200, wantRows ? hit : null);
    }
    throw new Error('unexpected ' + method + ' ' + url);
  };
}
const fresh = (days) => new Date(Date.now() - days * 864e5).toISOString();

test('claim rules: valid code, not your own, once, new members only', () => {
  const user = { id: 'new', created_at: fresh(1) };
  assert.equal(R.canClaim({ user, code: 'ABC234', owner: 'old' }), null);
  assert.match(R.canClaim({ user, code: 'abc', owner: 'old' }), /not valid/);
  assert.match(R.canClaim({ user, code: 'ABC234', owner: null }), /not valid/);
  assert.match(R.canClaim({ user, code: 'ABC234', owner: 'new' }), /own/);
  assert.match(R.canClaim({ user, code: 'ABC234', owner: 'old', existing: { id: 1 } }), /already/);
  assert.match(R.canClaim({ user, code: 'ABC234', owner: 'old', sub: { status: 'canceled', trial_used: true } }), /new members/);
  assert.match(R.canClaim({ user: { id: 'new', created_at: fresh(30) }, code: 'ABC234', owner: 'old' }), /new members/);
  assert.equal(R.trialDaysFor(null), 7);
  assert.equal(R.trialDaysFor({ status: 'joined' }), 21);
  assert.equal(R.trialDaysFor({ status: 'earned' }), 7);
  for (let i = 0; i < 50; i++) assert.ok(R.validCode(R.newCode()));
});

test('invite flow: code, claim, 21-day trial, then a free month for the inviter when the friend pays', async () => {
  const db = { subscriptions: [{ user_id: 'amy', customer_id: 'cus_amy', status: 'active', trial_used: true }] };
  global.fetch = fakeDb(db, { tA: { id: 'amy', email: 'amy@x.co', created_at: fresh(200) }, tB: { id: 'bea', email: 'bea@x.co', created_at: fresh(0) } });
  const credits = [];
  const checkouts = [];
  const real = new RealStripe('sk_test_123');
  let sub = null;
  B.stripe = () => ({
    webhooks: real.webhooks,
    prices: { retrieve: async () => ({ unit_amount: 1499, currency: 'usd' }) },
    customers: { create: async () => ({ id: 'cus_bea' }), createBalanceTransaction: async (cus, x, o) => { if (!credits.some((c) => c.key === o.idempotencyKey)) credits.push({ cus, ...x, key: o.idempotencyKey }); return {}; } },
    checkout: { sessions: { create: async (x) => { checkouts.push(x); return { url: 'https://checkout.stripe.com/x' }; } } },
    subscriptions: { list: async () => ({ data: [] }), retrieve: async () => sub },
  });

  // Amy gets her code (same one every time).
  const me = res();
  await referral({ method: 'POST', headers: { authorization: 'Bearer tA' }, body: { action: 'me' } }, me);
  assert.equal(me.statusCode, 200);
  const code = me.body.code;
  assert.ok(R.validCode(code));
  const again = res();
  await referral({ method: 'POST', headers: { authorization: 'Bearer tA' }, body: { action: 'me' } }, again);
  assert.equal(again.body.code, code);

  // Amy can't use her own code; Bea (new) can, once.
  const self = res();
  await referral({ method: 'POST', headers: { authorization: 'Bearer tA' }, body: { action: 'claim', code } }, self);
  assert.equal(self.statusCode, 400);
  const claim = res();
  await referral({ method: 'POST', headers: { authorization: 'Bearer tB' }, body: { action: 'claim', code: code.toLowerCase() } }, claim);
  assert.deepEqual(claim.body, { ok: true, bonusDays: 14 });
  const twice = res();
  await referral({ method: 'POST', headers: { authorization: 'Bearer tB' }, body: { action: 'claim', code } }, twice);
  assert.equal(twice.statusCode, 400);

  // Bea's checkout has a 21-day trial.
  const co = res();
  await billing({ method: 'POST', headers: { authorization: 'Bearer tB' }, body: { action: 'checkout', plan: 'monthly' } }, co);
  assert.equal(co.statusCode, 200);
  assert.equal(checkouts[0].subscription_data.trial_period_days, 21);

  // Trial started: no reward yet. First payment (active): Amy gets one month's credit, once, even if Stripe retries.
  const send = async (status, id) => {
    sub = { id: 'sub_bea', object: 'subscription', customer: 'cus_bea', status, cancel_at_period_end: false, metadata: { user_id: 'bea' }, items: { data: [{ current_period_end: 1790000000, price: { id: 'price_month' } }] } };
    const payload = JSON.stringify({ id, object: 'event', type: 'customer.subscription.updated', data: { object: sub } });
    const r = res();
    await webhook({ method: 'POST', headers: { 'stripe-signature': real.webhooks.generateTestHeaderString({ payload, secret: 'whsec_test' }) }, body: Buffer.from(payload) }, r);
    assert.equal(r.statusCode, 200);
  };
  await send('trialing', 'evt_1');
  assert.equal(credits.length, 0);
  await send('active', 'evt_2');
  await send('active', 'evt_3');
  assert.equal(credits.length, 1);
  assert.deepEqual([credits[0].cus, credits[0].amount, credits[0].currency], ['cus_amy', -1499, 'usd']);
  assert.equal(db.referrals[0].status, 'rewarded');

  const stats = res();
  await referral({ method: 'POST', headers: { authorization: 'Bearer tA' }, body: { action: 'me' } }, stats);
  assert.deepEqual([stats.body.joined, stats.body.paid, stats.body.rewarded], [1, 1, 1]);
});

test('an inviter without a membership keeps her reward until she joins, and rewards are capped', async () => {
  const db = { subscriptions: [], referral_codes: [{ user_id: 'cat', code: 'CAT234' }], referrals: [] };
  for (let i = 0; i < 13; i++) db.referrals.push({ id: 100 + i, referrer_id: 'cat', referred_id: `f${i}`, code: 'CAT234', status: 'joined' });
  global.fetch = fakeDb(db, { tC: { id: 'cat', email: 'cat@x.co', created_at: fresh(100) } });
  const credits = [];
  B.stripe = () => ({
    prices: { retrieve: async () => ({ unit_amount: 1499, currency: 'usd' }) },
    customers: { create: async () => ({ id: 'cus_cat' }), createBalanceTransaction: async (cus, x, o) => { credits.push(o.idempotencyKey); return {}; } },
    checkout: { sessions: { create: async () => ({ url: 'x' }) } },
    subscriptions: { list: async () => ({ data: [] }) },
  });
  assert.equal(await R.onFriendPaid('f0'), 'earned');
  assert.equal(credits.length, 0);
  // She joins: the earned month becomes credit at checkout.
  const r = res();
  await billing({ method: 'POST', headers: { authorization: 'Bearer tC' }, body: { action: 'checkout' } }, r);
  assert.equal(r.statusCode, 200);
  assert.deepEqual(credits, ['yours-referral-100']);
  // Eleven more friends pay: rewarded up to 12 in total; the 13th is not.
  for (let i = 1; i < 13; i++) await R.onFriendPaid(`f${i}`);
  assert.equal(credits.length, 12);
  assert.equal(db.referrals.find((x) => x.referred_id === 'f12').status, 'void');
});
