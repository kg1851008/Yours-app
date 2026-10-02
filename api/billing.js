// YOURS billing (Vercel function; also mounted by server.js locally).
// GET  /api/billing -> { enabled, trialDays, prices: { monthly, yearly } }
// POST /api/billing { action: 'checkout', plan: 'monthly' | 'yearly' } -> { url }   (Stripe Checkout, 7-day trial once per member)
// POST /api/billing { action: 'portal' } -> { url }                                (Stripe customer portal: cancel, change card)
// POST needs the member's Supabase session token as "Authorization: Bearer <token>".

const B = require('../lib/billing');

let priceCache = null;
async function prices() {
  if (priceCache && Date.now() - priceCache.at < 10 * 60000) return priceCache.value;
  const s = B.stripe();
  const show = (p) => ({ amount: p.unit_amount / 100, currency: p.currency, interval: p.recurring ? p.recurring.interval : null });
  const [m, y] = await Promise.all([s.prices.retrieve(process.env.STRIPE_PRICE_MONTHLY), s.prices.retrieve(process.env.STRIPE_PRICE_YEARLY)]);
  priceCache = { at: Date.now(), value: { monthly: show(m), yearly: show(y) } };
  return priceCache.value;
}

function originOf(req) {
  const allowed = (process.env.APP_URL || '').replace(/\/$/, '');
  const o = req.headers.origin || '';
  // Only send people back to this app's own address.
  if (allowed) return allowed;
  if (/^https:\/\/yours-app[a-z0-9-]*\.vercel\.app$/.test(o) || /^http:\/\/localhost:\d+$/.test(o)) return o;
  return 'https://yours-app-tau.vercel.app';
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    if (!B.billingConfigured()) return res.status(200).json({ enabled: false });
    try { return res.status(200).json({ enabled: true, trialDays: B.TRIAL_DAYS, prices: await prices() }); }
    catch (e) { console.error('billing prices', e && e.message); return res.status(200).json({ enabled: true, trialDays: B.TRIAL_DAYS, prices: null }); }
  }
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!B.billingConfigured()) return res.status(503).json({ error: 'Payments are not set up yet' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const user = await B.userFromToken(token).catch(() => null);
  if (!user) return res.status(401).json({ error: 'Please sign in again' });

  let body;
  try { body = await B.readBody(req); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  const s = B.stripe();
  const origin = originOf(req);

  try {
    let row = await B.getRow(user.id);
    if (body.action === 'portal') {
      if (!row || !row.customer_id) return res.status(400).json({ error: 'No membership yet' });
      const portal = await s.billingPortal.sessions.create({ customer: row.customer_id, return_url: `${origin}/?billing=portal` });
      return res.status(200).json({ url: portal.url });
    }
    if (body.action !== 'checkout') return res.status(400).json({ error: 'Unknown action' });
    if (B.hasAccess(row)) return res.status(409).json({ error: 'You already have an active membership' });

    const plan = body.plan === 'yearly' ? 'yearly' : 'monthly';
    if (!row || !row.customer_id) {
      const customer = await s.customers.create({ email: user.email, metadata: { user_id: user.id } });
      row = { user_id: user.id, customer_id: customer.id, status: (row && row.status) || 'none', trial_used: !!(row && row.trial_used) };
      await B.saveRow(row);
    }
    const trial = !row.trial_used; // one free trial per member
    const session = await s.checkout.sessions.create({
      mode: 'subscription',
      customer: row.customer_id,
      client_reference_id: user.id,
      line_items: [{ price: plan === 'yearly' ? process.env.STRIPE_PRICE_YEARLY : process.env.STRIPE_PRICE_MONTHLY, quantity: 1 }],
      payment_method_collection: 'always',
      subscription_data: { metadata: { user_id: user.id }, ...(trial ? { trial_period_days: B.TRIAL_DAYS, trial_settings: { end_behavior: { missing_payment_method: 'cancel' } } } : {}) },
      allow_promotion_codes: true,
      success_url: `${origin}/?billing=success`,
      cancel_url: `${origin}/?billing=cancel`,
    });
    return res.status(200).json({ url: session.url, trial });
  } catch (e) {
    console.error('billing error', e && e.message);
    return res.status(502).json({ error: 'Could not reach payments. Try again in a moment.' });
  }
};
