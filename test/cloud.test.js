const test = require('node:test');
const assert = require('node:assert');
const C = require('../public/cloud.js');

test('sync picks whichever copy changed last', () => {
  assert.equal(C.pickNewer({ onboarded: true }, 100, null), 'push');
  assert.equal(C.pickNewer(null, 0, { data: { a: 1 }, updated: 5 }), 'pull');
  assert.equal(C.pickNewer({ onboarded: false }, 999, { data: { a: 1 }, updated: 5 }), 'pull'); // fresh device
  assert.equal(C.pickNewer({ onboarded: true }, 100, { data: { onboarded: true }, updated: 200 }), 'pull');
  assert.equal(C.pickNewer({ onboarded: true }, 300, { data: {}, updated: 200 }), 'push');
  assert.equal(C.pickNewer({ onboarded: true }, 200, { data: { onboarded: true }, updated: 200 }), 'none');
  assert.equal(C.pickNewer({ onboarded: true }, 100, { data: { onboarded: false }, updated: 900 }), 'push'); // blank account copy never wins
});

test('feed and threads map to the app shape and respect hidden members', () => {
  const rows = [
    { id: 'p1', user_id: 'a', author_name: 'Ana', text: 'PR!', tag: 'Win', phase: 'follicular', created_at: '2026-10-01T10:00:00Z', likes: [{ user_id: 'b' }], comments: [{ id: 'c2', user_id: 'b', author_name: 'Bea', text: 'yes', created_at: '2026-10-01T11:00:00Z' }, { id: 'c1', user_id: 'x', author_name: 'X', text: 'spam', created_at: '2026-10-01T10:30:00Z' }] },
    { id: 'p2', user_id: 'x', author_name: 'X', text: 'buy pills', tag: 'Tip', created_at: '2026-10-01T09:00:00Z' },
  ];
  const feed = C.mapFeed(rows, 'c:a', ['c:x']);
  assert.equal(feed.length, 1);
  assert.equal(feed[0].author, 'c:a');
  assert.equal(feed[0].mine, true);
  assert.deepEqual(feed[0].likedBy, ['c:b']);
  assert.deepEqual(feed[0].comments.map((c) => c.text), ['yes']);
  const threads = C.mapThreads([
    { id: 'm2', from_id: 'b', to_id: 'a', text: 'hi back', created_at: '2026-10-01T10:01:00Z' },
    { id: 'm1', from_id: 'a', to_id: 'b', text: 'hi', created_at: '2026-10-01T10:00:00Z' },
    { id: 'm3', from_id: 'x', to_id: 'a', text: 'spam', created_at: '2026-10-01T10:02:00Z' },
  ], 'c:a', ['c:x']);
  assert.deepEqual(Object.keys(threads), ['c:a|c:b']);
  assert.deepEqual(threads['c:a|c:b'].map((m) => m.text), ['hi', 'hi back']);
});

test('cloud stays off without a key', () => {
  assert.equal(C.create({ supabaseUrl: 'https://x.supabase.co', supabaseAnonKey: '' }, () => ({})), null);
  assert.equal(C.friendlyError({ message: 'Invalid login credentials' }), 'That email and password do not match.');
});

test('leaked-password check only sends a 5-character hash prefix and finds breached passwords', async () => {
  const crypto = require('node:crypto');
  const sha = (p) => crypto.createHash('sha1').update(p).digest('hex').toUpperCase();
  const asked = [];
  const fakeFetch = async (url) => {
    asked.push(url);
    const prefix = url.slice(-5);
    const body = [sha('password123'), sha('Tr0ub4dor&3')].filter((h) => h.startsWith(prefix)).map((h) => `${h.slice(5)}:4120`).concat(['0000000000000000000000000000000000A:0']).join('\r\n');
    return { ok: true, text: async () => body };
  };
  assert.equal(await C.passwordLeaks('password123', fakeFetch), 4120);
  assert.equal(await C.passwordLeaks('kettle-orbit-velvet-71', fakeFetch), 0);
  assert.ok(asked.every((u) => /\/range\/[0-9A-F]{5}$/.test(u)));
  assert.ok(!asked.some((u) => u.includes('password123')));
  // If the service is down, sign-up is not blocked.
  assert.equal(await C.passwordLeaks('x', async () => { throw new Error('offline'); }), null);
});

test('legal documents have a version and cover the key protections', () => {
  const LEGAL = require('../public/legal.js');
  assert.match(LEGAL.VERSION, /^\d{4}-\d{2}-\d{2}[a-z]?$/);
  const health = LEGAL.HEALTH.map((x) => x.join(' ')).join(' ').toLowerCase();
  for (const phrase of ['what health data we collect', 'never sell', 'withdraw your consent', 'law enforcement', '45 days', 'breach']) assert.ok(health.includes(phrase), phrase);
  const waiver = LEGAL.WAIVER.map((x) => x.join(' ')).join(' ');
  const terms = LEGAL.TERMS.map((x) => x.join(' ')).join(' ');
  for (const phrase of ['not medical advice', 'contraception', 'Assumption of risk', 'Release of liability']) assert.ok(waiver.toLowerCase().includes(phrase.toLowerCase()), phrase);
  for (const phrase of ['18 years old', 'Limitation of liability', 'cancel', 'United States', 'class action', 'opt out', 'Copyright']) assert.ok(terms.toLowerCase().includes(phrase.toLowerCase()), phrase);
});
