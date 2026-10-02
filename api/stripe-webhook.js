// Stripe webhook (Vercel function; also mounted by server.js locally).
// Keeps each member's row in the Supabase `subscriptions` table in step with Stripe:
// trial started, paid, card failed, cancelled, renewed. Every request is verified with STRIPE_WEBHOOK_SECRET.

const B = require('../lib/billing');

const HANDLED = ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted', 'customer.subscription.paused', 'customer.subscription.resumed'];

async function userIdFor(sub, fallback) {
  if (sub.metadata && sub.metadata.user_id) return sub.metadata.user_id;
  if (fallback) return fallback;
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer && sub.customer.id;
  const row = customer ? await B.getRowByCustomer(customer) : null;
  return row ? row.user_id : null;
}

async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!B.billingConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Not configured' });

  let event;
  try {
    const raw = await B.rawBody(req);
    event = B.stripe().webhooks.constructEvent(raw, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid signature' });
  }
  if (!HANDLED.includes(event.type)) return res.status(200).json({ received: true });

  try {
    const obj = event.data.object;
    let sub;
    let fallbackUser = null;
    if (event.type === 'checkout.session.completed') {
      if (!obj.subscription) return res.status(200).json({ received: true });
      fallbackUser = obj.client_reference_id;
      sub = await B.stripe().subscriptions.retrieve(typeof obj.subscription === 'string' ? obj.subscription : obj.subscription.id);
    } else {
      // Re-read so out-of-order events still store the latest state.
      sub = await B.stripe().subscriptions.retrieve(obj.id).catch(() => obj);
    }
    const userId = await userIdFor(sub, fallbackUser);
    if (!userId) return res.status(200).json({ received: true, note: 'no member for this customer' });
    await B.saveRow({ user_id: userId, ...B.rowFromSubscription(sub) });
    return res.status(200).json({ received: true });
  } catch (e) {
    console.error('webhook error', e && e.message);
    return res.status(500).json({ error: 'Webhook failed' }); // Stripe retries
  }
}

module.exports = handler;
// Vercel: hand over the raw request body so the Stripe signature can be checked.
module.exports.config = { api: { bodyParser: false } };
