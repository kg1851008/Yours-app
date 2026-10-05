// Invite friends (Vercel function; also mounted by server.js locally).
// POST /api/referral { action: 'me' }            -> { code, joined, paid, rewarded, invited, bonusDays }
// POST /api/referral { action: 'claim', code }    -> { ok, bonusDays } or { ok: false, error }
// Needs the member's Supabase session token as "Authorization: Bearer <token>".

const B = require('../lib/billing');
const R = require('../lib/referral');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!B.supabaseConfigured()) return res.status(503).json({ error: 'Invites are not switched on yet' });
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const user = await B.userFromToken(token).catch(() => null);
  if (!user) return res.status(401).json({ error: 'Please sign in again' });
  let body;
  try { body = await B.readBody(req); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  try {
    if (body.action === 'claim') {
      const out = await R.claim(user, body.code);
      return res.status(out.ok ? 200 : 400).json(out);
    }
    if (body.action === 'me') {
      const [code, st, mine, sub] = await Promise.all([R.codeFor(user.id), R.stats(user.id), R.referralOf(user.id), B.getRow(user.id).catch(() => null)]);
      const bonus = mine && mine.status === 'joined' && !(sub && sub.trial_used);
      return res.status(200).json({ code, ...st, invited: !!mine, bonusDays: bonus ? R.BONUS_DAYS : 0, maxRewards: R.MAX_REWARDS });
    }
    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    console.error('referral error', e && e.message);
    return res.status(502).json({ error: 'Could not load invites. Try again in a moment.' });
  }
};
