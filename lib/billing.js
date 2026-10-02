// Shared billing helpers for api/billing.js and api/stripe-webhook.js.
// Stripe runs payments and the 7-day trial; each member's status is mirrored into the Supabase `subscriptions`
// table with the Supabase secret key (server only), and the app reads its own row to unlock access.

const TRIAL_DAYS = 7;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bbziozglnpamfvepnxfp.supabase.co';
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function billingConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_MONTHLY && process.env.STRIPE_PRICE_YEARLY && SUPABASE_SECRET);
}

let stripeClient;
function stripe() {
  if (!stripeClient) {
    const Stripe = require('stripe');
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

// Trialing, active and past due (Stripe is retrying the card) keep access; anything else locks the app.
// 'comp' is free access you grant by hand in the Supabase table (you, testers, partners).
const ACCESS_STATUSES = ['trialing', 'active', 'past_due', 'comp'];
function hasAccess(row, now) {
  if (!row || !ACCESS_STATUSES.includes(row.status)) return false;
  if (row.status === 'past_due' && row.current_period_end) return new Date(row.current_period_end).getTime() + 7 * 864e5 > (now || Date.now());
  return true;
}

const iso = (sec) => (sec ? new Date(sec * 1000).toISOString() : null);
function planOf(sub) {
  const price = sub.items && sub.items.data && sub.items.data[0] && sub.items.data[0].price;
  if (!price) return null;
  if (price.id === process.env.STRIPE_PRICE_YEARLY) return 'yearly';
  if (price.id === process.env.STRIPE_PRICE_MONTHLY) return 'monthly';
  return price.recurring && price.recurring.interval === 'year' ? 'yearly' : 'monthly';
}
// A Stripe subscription -> our row. Newer Stripe API versions keep the period end on the subscription item.
function rowFromSubscription(sub) {
  const item = sub.items && sub.items.data && sub.items.data[0];
  return {
    customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer && sub.customer.id,
    subscription_id: sub.id,
    status: sub.status,
    plan: planOf(sub),
    trial_end: iso(sub.trial_end),
    current_period_end: iso(sub.current_period_end || (item && item.current_period_end)),
    cancel_at_period_end: !!sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
    ...(sub.trial_end || sub.status === 'trialing' ? { trial_used: true } : {}),
  };
}

// ---- Supabase (server side, secret key) ----
function sbHeaders(extra) {
  return { apikey: SUPABASE_SECRET, Authorization: `Bearer ${SUPABASE_SECRET}`, 'Content-Type': 'application/json', ...(extra || {}) };
}
async function userFromToken(token) {
  if (!token) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_SECRET, Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? { id: u.id, email: u.email } : null;
}
async function getRow(userId) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(userId)}&select=*`, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`supabase read ${r.status}`);
  const rows = await r.json();
  return rows[0] || null;
}
async function getRowByCustomer(customerId) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?customer_id=eq.${encodeURIComponent(customerId)}&select=*`, { headers: sbHeaders() });
  if (!r.ok) throw new Error(`supabase read ${r.status}`);
  const rows = await r.json();
  return rows[0] || null;
}
async function saveRow(row) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?on_conflict=user_id`, {
    method: 'POST',
    headers: sbHeaders({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify(row),
  });
  if (!r.ok) throw new Error(`supabase write ${r.status} ${await r.text()}`);
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const raw = await rawBody(req);
  return JSON.parse(raw.toString('utf8') || '{}');
}
// The exact bytes Stripe sent (needed for the signature). Read the stream first, without touching req.body,
// which some hosts parse on access; fall back to an already-buffered body (express.raw locally).
async function rawBody(req) {
  const chunks = [];
  if (req.readable !== false && typeof req[Symbol.asyncIterator] === 'function') { for await (const c of req) chunks.push(Buffer.from(c)); }
  if (chunks.length) return Buffer.concat(chunks);
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  return Buffer.alloc(0);
}

module.exports = { TRIAL_DAYS, billingConfigured, stripe, hasAccess, rowFromSubscription, planOf, userFromToken, getRow, getRowByCustomer, saveRow, readBody, rawBody };
