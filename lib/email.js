// Emails through Resend (resend.com). Needs RESEND_API_KEY and EMAIL_FROM (an address on a domain verified in Resend),
// for example: EMAIL_FROM="YOURS <hello@yoursfitapp.com>". Without them, nothing is sent.
// Emails never include period, cycle, weight or other health details; those stay in the app.

const crypto = require('node:crypto');
const L = require('../public/logic.js');

const APP_URL = (process.env.APP_URL || 'https://yours-app-tau.vercel.app').replace(/\/$/, '');
const SUPPORT = 'yoursfitapp@gmail.com';

const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

// Signed, per-member unsubscribe links (no login needed to unsubscribe).
const unsubToken = (userId) => crypto.createHmac('sha256', process.env.CRON_SECRET || 'unset').update(`unsub:${userId}`).digest('hex').slice(0, 32);
const unsubUrl = (userId) => `${APP_URL}/api/email-unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubToken(userId)}`;
function validUnsub(userId, token) {
  const want = Buffer.from(unsubToken(userId));
  const got = Buffer.from(String(token || ''));
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Simple, on-brand HTML that works in email clients (inline styles, tables avoided where possible).
function layout(title, bodyHtml, footerExtra) {
  return `<!doctype html><html><body style="margin:0;background:#F9F7F4;font-family:Helvetica,Arial,sans-serif;color:#2F3720">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px">
    <div style="font-size:28px;font-weight:900;letter-spacing:-1px;color:#2F3720">yours.</div>
    <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:30px;line-height:1.15;margin:24px 0 12px">${esc(title)}</h1>
    ${bodyHtml}
    <p style="margin:28px 0 0"><a href="${APP_URL}" style="display:inline-block;background:#2F3720;color:#F9F7F4;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase">Open YOURS</a></p>
    <p style="font-size:12px;color:#666153;margin-top:32px;line-height:1.6">Questions? Reply to this email or write to ${SUPPORT}. We never sell your data.${footerExtra || ''}</p>
  </div></body></html>`;
}

function welcomeEmail(name) {
  const first = String(name || '').split(' ')[0];
  const title = `Welcome${first ? `, ${first}` : ''}. Your plan is ready.`;
  const p = (t) => `<p style="font-size:15px;line-height:1.6;margin:0 0 12px">${t}</p>`;
  const html = layout(title, [
    p('YOURS changes your training, food and steps with your cycle or life stage, and learns from you as you go.'),
    p('<strong>Three things that make the biggest difference this week:</strong>'),
    p('1. Do the 20-second daily check-in. It sets your readiness and tunes your workouts.'),
    p('2. Log your lifts. Suggested weights get smarter with every session.'),
    p('3. Add YOURS to your home screen (Share, then Add to Home Screen) and turn on reminders in Profile.'),
    p('Talk to your doctor before starting a new program, especially if you are pregnant, postpartum, in menopause or managing a condition.'),
  ].join(''));
  const text = `${title}\n\nYOURS changes your training, food and steps with your cycle or life stage.\n\n1. Do the daily check-in.\n2. Log your lifts.\n3. Add YOURS to your home screen and turn on reminders.\n\nOpen YOURS: ${APP_URL}\n\nQuestions? ${SUPPORT}`;
  return { subject: 'Welcome to YOURS', html, text };
}

// The week in numbers. Deliberately no weight, period or cycle details in an inbox.
function weeklyEmail(name, data, userId, now) {
  const stats = L.weeklyStats(data, now);
  const streak = L.streak(data).count;
  const first = String(name || '').split(' ')[0];
  const t = L.targets(data.profile, L.cycleInfo(data.profile, now), data.plan);
  const rows = [
    ['Workouts', `${stats.sessions}${stats.planned ? ` of ${stats.planned}` : ''}`],
    ['Average steps', `${stats.stepAvg.toLocaleString('en-US')}${t && t.steps ? ` (goal ${t.steps.toLocaleString('en-US')})` : ''}`],
    ['Daily check-ins', `${stats.checkinDays} of 7`],
    ['Streak', `${streak} day${streak === 1 ? '' : 's'}`],
  ];
  if (stats.prs) rows.push(['New personal records', String(stats.prs)]);
  const title = stats.sessions ? `${first ? `${first}, you` : 'You'} trained ${stats.sessions} time${stats.sessions === 1 ? '' : 's'} this week.` : `${first ? `${first}, a` : 'A'} fresh week starts today.`;
  const table = `<div style="background:#FFFFFF;border-radius:18px;padding:8px 18px;margin:8px 0 16px">${rows.map(([k, v]) => `<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #EFEAE3;font-size:15px"><span style="color:#666153">${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>`;
  const nudge = stats.sessions ? 'Your plan for the new week is ready, with suggested weights updated from what you lifted.' : 'No pressure. One session and a walk this week will get you moving again. Your plan is ready.';
  const unsub = unsubUrl(userId);
  const html = layout(title, `${table}<p style="font-size:15px;line-height:1.6;margin:0">${esc(nudge)}</p>`, ` <a href="${unsub}" style="color:#666153">Unsubscribe from weekly summaries</a>.`);
  const text = `${title}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${nudge}\n\nOpen YOURS: ${APP_URL}\nUnsubscribe from weekly summaries: ${unsub}`;
  return { subject: 'Your week in YOURS', html, text, unsub };
}

async function sendEmail(to, message) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      reply_to: SUPPORT,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.unsub ? { headers: { 'List-Unsubscribe': `<${message.unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } : {}),
    }),
  });
  if (!r.ok) throw new Error(`resend ${r.status} ${await r.text()}`);
  return r.json();
}

module.exports = { emailConfigured, welcomeEmail, weeklyEmail, sendEmail, unsubUrl, validUnsub, APP_URL };
