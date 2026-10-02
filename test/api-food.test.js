const test = require('node:test');
const assert = require('node:assert');

function call(handler, url) {
  return new Promise((resolve) => {
    const res = { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.statusCode = c; return this; }, json(b) { resolve({ status: this.statusCode, body: b }); } };
    const u = new URL(url, 'http://x');
    handler({ method: 'GET', url, query: Object.fromEntries(u.searchParams) }, res);
  });
}

test('food endpoint is off without Nutritionix keys', async () => {
  delete process.env.NUTRITIONIX_APP_ID; delete process.env.NUTRITIONIX_APP_KEY;
  const handler = require('../api/food.js');
  const r = await call(handler, '/api/food?q=chipotle');
  assert.deepEqual(r.body, { available: false, results: [] });
});

test('food endpoint keeps restaurant items and maps nutrition', async () => {
  process.env.NUTRITIONIX_APP_ID = 'id'; process.env.NUTRITIONIX_APP_KEY = 'key';
  const seen = [];
  global.fetch = async (url, opts) => {
    seen.push({ url, headers: opts.headers });
    if (url.includes('/search/instant')) return { ok: true, json: async () => ({ branded: [
      { food_name: 'Harvest Bowl', brand_name: 'Sweetgreen', brand_type: 1, nix_item_id: 'a1' },
      { food_name: 'Greek Yogurt', brand_name: 'Fage', brand_type: 2, nix_item_id: 'g1' },
    ] }) };
    if (url.includes('nix_item_id=a1')) return { ok: true, json: async () => ({ foods: [{ food_name: 'Harvest Bowl', brand_name: 'Sweetgreen', serving_qty: 1, serving_unit: 'bowl', serving_weight_grams: 400, nf_calories: 705, nf_protein: 37, nf_total_carbohydrate: 62, nf_total_fat: 36 }] }) };
    throw new Error('unexpected ' + url);
  };
  const handler = require('../api/food.js');
  const r = await call(handler, '/api/food?q=sweetgreen');
  assert.equal(r.body.available, true);
  assert.equal(r.body.results.length, 1);
  const f = r.body.results[0];
  assert.equal(f.brand, 'Sweetgreen');
  assert.equal(f.serving.label, '1 bowl (400 g)');
  assert.deepEqual(f.perServing, { kcal: 705, protein: 37, carbs: 62, fat: 36 });
  assert.equal(f.per100.kcal, 176.3);
  assert.equal(seen[0].headers['x-app-id'], 'id');
  assert.ok(!seen.some((s) => s.url.includes('g1')), 'grocery items are skipped');
});
