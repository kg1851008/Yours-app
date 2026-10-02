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
  assert.deepEqual(g.body, { ai: false });
  if (saved[0]) process.env.ANTHROPIC_API_KEY = saved[0];
  if (saved[1]) process.env.ANTHROPIC_AUTH_TOKEN = saved[1];
});
