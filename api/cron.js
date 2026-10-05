// Hourly job: reminders (web push) and emails (welcome, weekly summary).
// Called every hour by Supabase's scheduler (pg_cron + pg_net) with the header "x-cron-secret: <CRON_SECRET>".
// Needs: CRON_SECRET, SUPABASE_SECRET_KEY; for push VAPID_PRIVATE_KEY (+ the public key in public/config.js);
// for email RESEND_API_KEY and EMAIL_FROM. Each part switches itself off when its settings are missing.

const crypto = require('node:crypto');
const B = require('../lib/billing');
const N = require('../lib/notify');
const E = require('../lib/email');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://bbziozglnpamfvepnxfp.supabase.co';
const SECRET = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BNaFDEPYr97ouYX3AErtEpIXAHXW4F8qKj50W4CMf3NvhJdqARDW8jscAwjtiHT_-CcsAw6s3FwsfmMeaFAwN54';
const pushConfigured = () => Boolean(process.env.VAPID_PRIVATE_KEY && VAPID_PUBLIC);

const h = (extra) => ({ apikey: SECRET, Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json', ...(extra || {}) });
async function rest(path, opts) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...(opts || {}), headers: h(opts && opts.headers) });
  if (!r.ok) throw new Error(`supabase ${path.split('?')[0]} ${r.status}`);
  return r.status === 204 ? null : r.json();
}
async function all(table, select) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const page = await rest(`${table}?select=${select}`, { headers: { Range: `${from}-${from + 999}` } });
    out.push(...page);
    if (page.length < 1000) return out;
  }
}
async function users() {
  const out = [];
  for (let page = 1; ; page++) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=1000`, { headers: h() });
    if (!r.ok) throw new Error(`auth users ${r.status}`);
    const j = await r.json();
    const list = j.users || [];
    out.push(...list);
    if (list.length < 1000) return out;
  }
}
// Claim a send in sent_log; false if it was already sent (another run got there first).
async function claim(userId, kind, period) {
  const rows = await rest('sent_log?on_conflict=user_id,kind,period', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=representation' }, body: JSON.stringify({ user_id: userId, kind, period }) });
  return Array.isArray(rows) && rows.length > 0;
}

let webpush;
function push() {
  if (!webpush) {
    webpush = require('web-push');
    webpush.setVapidDetails(`mailto:${'yoursfitapp@gmail.com'}`, VAPID_PUBLIC, process.env.VAPID_PRIVATE_KEY);
  }
  return webpush;
}
async function sendPush(subs, payload, stats) {
  for (const s of subs) {
    try {
      await push().sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 3600 });
      stats.push++;
    } catch (e) {
      // The phone unsubscribed or the app was removed: forget this subscription.
      if (e && (e.statusCode === 404 || e.statusCode === 410)) { await rest(`push_subscriptions?id=eq.${s.id}`, { method: 'DELETE' }).catch(() => {}); stats.expired++; }
      else stats.errors++;
    }
  }
}

function authorized(req) {
  const want = Buffer.from(String(process.env.CRON_SECRET || ''));
  const got = Buffer.from(String(req.headers['x-cron-secret'] || ''));
  return want.length >= 16 && want.length === got.length && crypto.timingSafeEqual(want, got);
}

async function run(now) {
  const stats = { members: 0, push: 0, expired: 0, welcome: 0, weekly: 0, errors: 0 };
  const [dataRows, subs, memberships, prefs, accounts] = await Promise.all([
    all('user_data', 'user_id,data'),
    pushConfigured() ? all('push_subscriptions', 'id,user_id,endpoint,p256dh,auth') : [],
    B.billingConfigured() ? all('subscriptions', 'user_id,status,current_period_end,trial_end,cancel_at_period_end') : [],
    E.emailConfigured() ? all('email_prefs', 'user_id,weekly') : [],
    E.emailConfigured() ? users() : [],
  ]);
  const byUser = (rows) => rows.reduce((m, r) => ((m[r.user_id] = m[r.user_id] || []).push(r), m), {});
  const subsBy = byUser(subs);
  const access = (id) => !B.billingConfigured() || B.hasAccess((memberships.find((m) => m.user_id === id)) || null, now.getTime());
  const dataBy = Object.fromEntries(dataRows.map((r) => [r.user_id, r.data]));
  stats.members = dataRows.length;

  // Reminders: members with access who turned them on, at the hour they chose.
  if (pushConfigured()) {
    for (const row of dataRows) {
      const mine = subsBy[row.user_id];
      if (!mine || !access(row.user_id)) continue;
      for (const r of N.remindersNow(row.data, now)) {
        try {
          if (await claim(row.user_id, `push:${r.kind}`, r.period)) await sendPush(mine, { title: r.title, body: r.body, url: r.url, tag: `yours-${r.kind}` }, stats);
        } catch { stats.errors++; }
      }
    }
  }

  // Trial ending in 2 days: one honest heads-up per trial (push), with how to cancel.
  if (pushConfigured()) {
    for (const m of memberships) {
      const mine = subsBy[m.user_id];
      const t = mine && N.trialReminder(m, dataBy[m.user_id], now);
      if (!t) continue;
      try { if (await claim(m.user_id, 'push:trial', t.period)) await sendPush(mine, { title: t.title, body: t.body, url: t.url, tag: 'yours-trial' }, stats); }
      catch { stats.errors++; }
    }
  }

  // Emails: a welcome within 3 days of confirming, and the weekly summary on Monday morning.
  if (E.emailConfigured()) {
    const optedOut = new Set(prefs.filter((p) => p.weekly === false).map((p) => p.user_id));
    for (const u of accounts) {
      if (!u.email || !u.email_confirmed_at) continue;
      const name = (u.user_metadata && u.user_metadata.name) || '';
      try {
        if (now - new Date(u.email_confirmed_at) < 3 * 864e5 && await claim(u.id, 'email:welcome', 'once')) {
          await E.sendEmail(u.email, E.welcomeEmail(name)); stats.welcome++;
        }
        const data = dataBy[u.id];
        const wk = data && data.onboarded && !optedOut.has(u.id) && access(u.id) ? N.weeklyEmailNow(data, now) : null;
        if (wk && await claim(u.id, 'email:weekly', wk.period)) {
          await E.sendEmail(u.email, E.weeklyEmail(name, data, u.id, wk.local.date)); stats.weekly++;
        }
      } catch { stats.errors++; }
    }
  }
  return stats;
}

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!authorized(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (!SECRET) return res.status(503).json({ error: 'SUPABASE_SECRET_KEY is not set' });
  try {
    const stats = await run(new Date());
    return res.status(200).json({ ok: true, pushEnabled: pushConfigured(), emailEnabled: E.emailConfigured(), sent: stats });
  } catch (e) {
    console.error('cron error', e && e.message);
    return res.status(500).json({ error: 'Cron failed' });
  }
}

module.exports = handler;
module.exports.run = run;
module.exports.authorized = authorized;
