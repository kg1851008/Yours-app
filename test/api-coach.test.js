const test = require('node:test');
const assert = require('node:assert');
const handler = require('../api/coach.js');

function res() {
  const r = { statusCode: 0, headers: {}, body: null };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
}

test('food estimates from the model are clamped and trimmed', () => {
  const out = handler.cleanFoodItems([{ name: '  Rice ', portion: '1 cup', grams: 158, kcal: 99999, protein: -2, carbs: 45, fat: 0.44, confidence: 'high' }, { name: 3 }]);
  assert.deepEqual(out, [{ name: 'Rice', portion: '1 cup', grams: 158, kcal: 3000, protein: 0, carbs: 45, fat: 0.4, confidence: 'high' }]);
  assert.equal(handler.FOOD_SCHEMA.additionalProperties, false);
});

test('food mode needs the AI key', async () => {
  const saved = [process.env.ANTHROPIC_API_KEY, process.env.ANTHROPIC_AUTH_TOKEN];
  delete process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_AUTH_TOKEN;
  const r = res();
  await handler({ method: 'POST', body: { mode: 'food', text: 'two eggs' } }, r);
  assert.equal(r.statusCode, 503);
  const g = res();
  await handler({ method: 'GET' }, g);
  assert.deepEqual(g.body, { ai: false, coach: false, review: false });
  if (saved[0]) process.env.ANTHROPIC_API_KEY = saved[0];
  if (saved[1]) process.env.ANTHROPIC_AUTH_TOKEN = saved[1];
});

test('live coach chat stays off unless AI_COACH=on; food estimates do not need it', async () => {
  const saved = [process.env.ANTHROPIC_API_KEY, process.env.AI_COACH];
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test'; delete process.env.AI_COACH;
  const g = res();
  await handler({ method: 'GET' }, g);
  assert.deepEqual(g.body, { ai: true, coach: false, review: false });
  const r = res();
  await handler({ method: 'POST', headers: {}, body: { mode: 'chat', messages: [{ role: 'user', content: 'hi' }] } }, r);
  assert.equal(r.statusCode, 503);
  assert.equal(r.body.coach, false);
  process.env.AI_COACH = 'on';
  const g2 = res();
  await handler({ method: 'GET' }, g2);
  assert.deepEqual(g2.body, { ai: true, coach: true, review: false });
  if (saved[0]) process.env.ANTHROPIC_API_KEY = saved[0]; else delete process.env.ANTHROPIC_API_KEY;
  if (saved[1]) process.env.AI_COACH = saved[1]; else delete process.env.AI_COACH;
});

test('progress photos are never sent to the AI unless AI_PHOTO_REVIEW=on', async () => {
  const saved = [process.env.ANTHROPIC_API_KEY, process.env.AI_PHOTO_REVIEW];
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test'; delete process.env.AI_PHOTO_REVIEW;
  const r = res();
  await handler({ method: 'POST', headers: {}, body: { mode: 'progress', images: [] } }, r);
  assert.equal(r.statusCode, 503);
  assert.equal(r.body.review, false);
  process.env.AI_PHOTO_REVIEW = 'on';
  const g = res();
  await handler({ method: 'GET' }, g);
  assert.equal(g.body.review, true);
  if (saved[0]) process.env.ANTHROPIC_API_KEY = saved[0]; else delete process.env.ANTHROPIC_API_KEY;
  if (saved[1]) process.env.AI_PHOTO_REVIEW = saved[1]; else delete process.env.AI_PHOTO_REVIEW;
});
