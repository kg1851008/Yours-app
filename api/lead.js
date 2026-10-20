// Email sign-up from the free phase quiz: POST /api/lead { email, consent: true, source: 'phase' }.
// Stores the address only (never her cycle answers) and sends the phase cheat sheet once per address.
const B = require('../lib/billing');
const E = require('../lib/email');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!B.supabaseConfigured()) return res.status(503).json({ error: 'Email sign-up is not switched on yet' });
  let body;
  try { body = await B.readBody(req); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  if (body.website) return res.status(200).json({ ok: true }); // a bot filled the hidden field
  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return res.status(400).json({ error: 'Please check your email address' });
  if (body.consent !== true) return res.status(400).json({ error: 'Please tick the box to get emails' });
  const source = body.source === 'phase' ? 'phase' : 'other';
  try {
    const rows = await B.sbRest('leads?on_conflict=email', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: { email, source, consent_at: new Date().toISOString(), unsubscribed_at: null },
    });
    const lead = rows && rows[0];
    if (lead && !lead.guide_sent_at && E.emailConfigured()) {
      await E.sendEmail(email, E.phaseGuideEmail(email));
      await B.sbRest(`leads?email=eq.${encodeURIComponent(email)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { guide_sent_at: new Date().toISOString() } });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('lead error', e && e.message);
    return res.status(500).json({ error: 'Could not sign you up. Try again in a moment.' });
  }
};
