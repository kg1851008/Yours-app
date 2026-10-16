// Owner dashboard: GET /api/stats (Authorization: Bearer <Supabase session token>).
// Only for the emails in ADMIN_EMAILS (comma separated; default: the YOURS support address).
// Returns anonymous event counts, membership totals, and the member list: account details only (name, email,
// dates, membership status). Never health, cycle, food, weight or photo data.
const A = require('../lib/analytics');
const B = require('../lib/billing');

const admins = () => String(process.env.ADMIN_EMAILS || 'yoursfitapp@gmail.com').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);
const isAdmin = (user) => !!(user && user.email && admins().includes(String(user.email).toLowerCase()));

// One row per account, newest first. Only account and membership fields.
function memberList(users, subs) {
  const byUser = new Map(subs.map((x) => [x.user_id, x]));
  return users
    .map((u) => {
      const sub = byUser.get(u.id) || {};
      return {
        name: String((u.user_metadata && u.user_metadata.name) || '').slice(0, 80),
        email: u.email || '',
        joined: u.created_at || null,
        lastSignIn: u.last_sign_in_at || null,
        confirmed: !!u.email_confirmed_at,
        status: sub.status || 'none',
        plan: sub.plan || null,
        trialEnd: sub.trial_end || null,
        periodEnd: sub.current_period_end || null,
        cancelling: !!sub.cancel_at_period_end,
      };
    })
    .sort((a, b) => String(b.joined || '').localeCompare(String(a.joined || '')));
}

function summarize(rows, now) {
  const day = (n) => new Date(now - n * 864e5).toISOString().slice(0, 10);
  const since7 = day(6), since30 = day(29);
  const out = {};
  for (const name of Object.keys(A.EVENTS)) out[name] = { label: A.EVENTS[name], d7: 0, d30: 0 };
  const daily = {};
  for (const r of rows) {
    if (!out[r.name]) continue;
    if (r.day >= since30) out[r.name].d30++;
    if (r.day >= since7) out[r.name].d7++;
    if (r.day >= since30 && ['app_open', 'workout_done', 'trial_started'].includes(r.name)) {
      daily[r.day] = daily[r.day] || { app_open: 0, workout_done: 0, trial_started: 0 };
      daily[r.day][r.name]++;
    }
  }
  const days = Array.from({ length: 30 }, (_, i) => day(29 - i)).map((d) => ({ day: d, ...(daily[d] || { app_open: 0, workout_done: 0, trial_started: 0 }) }));
  return { events: out, funnel: A.FUNNEL, days };
}

async function all(path) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const page = await B.sbRest(path, { headers: { Range: `${from}-${from + 999}` } });
    out.push(...(page || []));
    if (!page || page.length < 1000) return out;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!B.supabaseConfigured()) return res.status(503).json({ error: 'Not configured' });
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const user = await B.userFromToken(token).catch(() => null);
  if (!isAdmin(user)) return res.status(404).json({ error: 'Not found' });
  try {
    const now = Date.now();
    const since = new Date(now - 30 * 864e5).toISOString().slice(0, 10);
    const [events, subs, refs, users] = await Promise.all([
      all(`events?select=name,day&day=gte.${since}`),
      all('subscriptions?select=user_id,status,plan,cancel_at_period_end,trial_end,current_period_end'),
      all('referrals?select=status').catch(() => []),
      B.listUsers().catch((e) => { console.error('stats users', e && e.message); return null; }),
    ]);
    const count = (list, f) => list.filter(f).length;
    const members = {
      trialing: count(subs, (s) => s.status === 'trialing'),
      active: count(subs, (s) => s.status === 'active'),
      pastDue: count(subs, (s) => s.status === 'past_due'),
      comp: count(subs, (s) => s.status === 'comp'),
      ended: count(subs, (s) => ['canceled', 'unpaid', 'incomplete_expired'].includes(s.status)),
      cancelling: count(subs, (s) => ['trialing', 'active'].includes(s.status) && s.cancel_at_period_end),
      yearly: count(subs, (s) => ['trialing', 'active', 'past_due'].includes(s.status) && s.plan === 'yearly'),
      monthly: count(subs, (s) => ['trialing', 'active', 'past_due'].includes(s.status) && s.plan === 'monthly'),
    };
    const invites = { joined: refs.length, paid: count(refs, (r) => ['earned', 'rewarded'].includes(r.status)), rewarded: count(refs, (r) => r.status === 'rewarded') };
    return res.status(200).json({ ...summarize(events, now), members, invites, people: users ? memberList(users, subs) : null, generatedAt: new Date(now).toISOString() });
  } catch (e) {
    console.error('stats', e && e.message);
    return res.status(502).json({ error: 'Could not load stats' });
  }
};
module.exports.summarize = summarize;
module.exports.memberList = memberList;
module.exports.isAdmin = isAdmin;
