// Restaurant food search via the Nutritionix API (optional).
// Set NUTRITIONIX_APP_ID and NUTRITIONIX_APP_KEY to enable. Keys stay on the server.
// GET /api/food            -> { available }
// GET /api/food?q=chipotle -> { available, results: [{ name, brand, serving, perServing }] }

const BASE = 'https://trackapi.nutritionix.com/v2';

function configured() {
  return Boolean(process.env.NUTRITIONIX_APP_ID && process.env.NUTRITIONIX_APP_KEY);
}

async function nx(path) {
  const r = await fetch(BASE + path, {
    headers: { 'x-app-id': process.env.NUTRITIONIX_APP_ID, 'x-app-key': process.env.NUTRITIONIX_APP_KEY },
  });
  if (!r.ok) throw Object.assign(new Error('nutritionix ' + r.status), { status: r.status });
  return r.json();
}

const r1 = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v) * 10) / 10 : 0);

function toFood(f) {
  const label = [f.serving_qty, f.serving_unit].filter((x) => x != null && x !== '').join(' ') || '1 serving';
  const grams = Number(f.serving_weight_grams) || null;
  return {
    barcode: null,
    name: f.food_name,
    brand: f.brand_name || '',
    image: f.photo && f.photo.thumb ? f.photo.thumb : null,
    restaurant: true,
    serving: { label: grams ? `${label} (${Math.round(grams)} g)` : label, grams },
    perServing: { kcal: Math.round(Number(f.nf_calories) || 0), protein: r1(f.nf_protein), carbs: r1(f.nf_total_carbohydrate), fat: r1(f.nf_total_fat) },
    per100: grams ? { kcal: r1((f.nf_calories / grams) * 100), protein: r1((f.nf_protein / grams) * 100), carbs: r1((f.nf_total_carbohydrate / grams) * 100), fat: r1((f.nf_total_fat / grams) * 100) } : null,
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  const q = String((req.query && req.query.q) || new URL(req.url, 'http://x').searchParams.get('q') || '').trim().slice(0, 80);
  if (!configured()) return res.status(200).json({ available: false, results: [] });
  if (q.length < 2) return res.status(200).json({ available: true, results: [] });
  try {
    const search = await nx(`/search/instant?branded=true&common=false&detailed=false&query=${encodeURIComponent(q)}`);
    // brand_type 1 = restaurant, 2 = grocery product.
    const restaurant = (search.branded || []).filter((b) => b.brand_type === 1).slice(0, 12);
    const details = await Promise.all(restaurant.map((b) => nx(`/search/item?nix_item_id=${encodeURIComponent(b.nix_item_id)}`).then((d) => (d.foods || [])[0]).catch(() => null)));
    return res.status(200).json({ available: true, results: details.filter(Boolean).map(toFood) });
  } catch (err) {
    console.error('food search error', err.status || '', err.message);
    return res.status(err.status === 429 ? 429 : 502).json({ available: true, error: 'Restaurant search unavailable', results: [] });
  }
};
