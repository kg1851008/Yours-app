const test = require('node:test');
const assert = require('node:assert');

process.env.SUPABASE_SECRET_KEY = 'sb_secret_test';
process.env.RESEND_API_KEY = 're_test';
process.env.EMAIL_FROM = 'YOURS <hello@example.com>';
process.env.CRON_SECRET = 'cron_test';
const E = require('../lib/email');
const lead = require('../api/lead');
const unsub = require('../api/email-unsubscribe');

function res() {
  const r = { statusCode: 0, headers: {}, body: null };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.send = (b) => { r.body = b; return r; };
  r.end = () => r;
  return r;
}
// Just enough PostgREST and Resend for the leads table.
function fake() {
  const rows = {}; const sent = [];
  global.fetch = async (url, opts) => {
    opts = opts || {};
    const u = new URL(url);
    const reply = (status, body) => ({ ok: status < 300, status, json: async () => body, text: async () => (body == null ? '' : JSON.stringify(body)) });
    if (u.hostname === 'api.resend.com') { sent.push(JSON.parse(opts.body)); return reply(200, { id: 'em_1' }); }
    const body = opts.body ? JSON.parse(opts.body) : null;
    if (opts.method === 'POST') { rows[body.email] = { guide_sent_at: null, ...rows[body.email], ...body }; return reply(201, [rows[body.email]]); }
    if (opts.method === 'PATCH') { const e = u.searchParams.get('email').replace(/^eq\./, ''); if (rows[e]) Object.assign(rows[e], body); return reply(204, null); }
    return reply(404, null);
  };
  return { rows, sent };
}
const post = (body) => ({ method: 'POST', headers: {}, body });

test('quiz sign-up stores only the email and sends the cheat sheet once', async () => {
  const { rows, sent } = fake();
  let r = res(); await lead(post({ email: ' Me@Example.com ', consent: true, source: 'phase', phase: 'luteal', periodStart: '2026-10-01' }), r);
  assert.equal(r.statusCode, 200);
  assert.deepEqual(Object.keys(rows), ['me@example.com']);
  assert.ok(!('phase' in rows['me@example.com']) && !('periodStart' in rows['me@example.com']));
  assert.equal(sent.length, 1);
  assert.match(sent[0].html, /Unsubscribe/);
  assert.ok(sent[0].headers['List-Unsubscribe']);
  r = res(); await lead(post({ email: 'me@example.com', consent: true, source: 'phase' }), r);
  assert.equal(r.statusCode, 200);
  assert.equal(sent.length, 1, 'the same address is never emailed twice');
});

test('quiz sign-up needs consent and a real address, and ignores bots', async () => {
  const { rows, sent } = fake();
  let r = res(); await lead(post({ email: 'me@example.com', source: 'phase' }), r);
  assert.equal(r.statusCode, 400);
  r = res(); await lead(post({ email: 'not-an-email', consent: true }), r);
  assert.equal(r.statusCode, 400);
  r = res(); await lead(post({ email: 'bot@example.com', consent: true, website: 'spam.biz' }), r);
  assert.equal(r.statusCode, 200);
  assert.equal(Object.keys(rows).length, 0);
  assert.equal(sent.length, 0);
});

test('lead unsubscribe link works only with its signed token', async () => {
  const { rows } = fake();
  rows['me@example.com'] = { email: 'me@example.com' };
  const link = new URL(E.leadUnsubUrl('me@example.com'));
  let r = res(); await unsub({ method: 'GET', url: link.pathname + link.search }, r);
  assert.equal(r.statusCode, 200);
  assert.ok(rows['me@example.com'].unsubscribed_at);
  r = res(); await unsub({ method: 'GET', url: '/api/email-unsubscribe?e=other%40example.com&t=' + link.searchParams.get('t') }, r);
  assert.equal(r.statusCode, 400);
});
