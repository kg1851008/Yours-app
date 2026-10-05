// Anonymous usage counts: POST /api/event { name } (sent with navigator.sendBeacon).
// Only names in lib/analytics.js are stored, with the date. Nothing else from the request is kept.
const A = require('../lib/analytics');
const B = require('../lib/billing');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  let body;
  try { body = await B.readBody(req); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  if (!body || !A.valid(body.name)) return res.status(400).json({ error: 'Unknown event' });
  try { await A.record(body.name); } catch (e) { console.error('event', e && e.message); }
  return res.status(204).end();
};
