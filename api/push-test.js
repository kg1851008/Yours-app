// Sends one test notification to the signed-in member's devices, so she can check reminders work.
const B = require('../lib/billing');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bbziozglnpamfvepnxfp.supabase.co';
const SECRET = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BNaFDEPYr97ouYX3AErtEpIXAHXW4F8qKj50W4CMf3NvhJdqARDW8jscAwjtiHT_-CcsAw6s3FwsfmMeaFAwN54';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.VAPID_PRIVATE_KEY || !SECRET) return res.status(503).json({ error: 'Reminders are not switched on yet' });
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const user = await B.userFromToken(token).catch(() => null);
  if (!user) return res.status(401).json({ error: 'Please sign in again' });
  const r = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?user_id=eq.${user.id}&select=id,endpoint,p256dh,auth`, { headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}` } });
  const subs = r.ok ? await r.json() : [];
  if (!subs.length) return res.status(404).json({ error: 'No devices with reminders on' });
  const webpush = require('web-push');
  webpush.setVapidDetails('mailto:yoursfitapp@gmail.com', VAPID_PUBLIC, process.env.VAPID_PRIVATE_KEY);
  let sent = 0;
  for (const s of subs) {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ title: 'Reminders are on', body: "You'll hear from YOURS at the times you picked.", url: '/' })); sent++; } catch { /* expired device */ }
  }
  return res.status(sent ? 200 : 502).json({ sent });
};
