// One-click unsubscribe from weekly summary emails (link in every summary, plus the List-Unsubscribe header).
const E = require('../lib/email');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bbziozglnpamfvepnxfp.supabase.co';
const SECRET = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const page = (title, text) => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;background:#F9F7F4;font-family:Helvetica,Arial,sans-serif;color:#2F3720"><div style="max-width:480px;margin:0 auto;padding:48px 24px"><div style="font-size:28px;font-weight:900">yours.</div><h1 style="font-family:Georgia,serif;font-weight:normal">${title}</h1><p style="line-height:1.6">${text}</p><p><a href="${E.APP_URL}" style="color:#9C5230">Open YOURS</a></p></div></body></html>`;

module.exports = async function handler(req, res) {
  const url = new URL(req.url, 'https://x');
  const u = url.searchParams.get('u') || '';
  const t = url.searchParams.get('t') || '';
  if (!/^[0-9a-f-]{36}$/i.test(u) || !E.validUnsub(u, t)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(400).send(page('Link not valid', 'This unsubscribe link is not valid. You can turn weekly emails off in YOURS under Profile.'));
  }
  const r = await fetch(`${SUPABASE_URL}/rest/v1/email_prefs?on_conflict=user_id`, {
    method: 'POST',
    headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: u, weekly: false, updated_at: new Date().toISOString() }),
  });
  if (req.method === 'POST') return res.status(r.ok ? 200 : 500).json({ ok: r.ok }); // one-click from the mail app
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(r.ok ? 200 : 500).send(r.ok ? page("You're unsubscribed", 'You will no longer get weekly summary emails. You can turn them back on in YOURS under Profile.') : page('Something went wrong', 'Please try again, or turn weekly emails off in YOURS under Profile.'));
};
