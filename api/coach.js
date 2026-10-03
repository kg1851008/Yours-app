// YOURS AI coach endpoint (Vercel serverless function; also mounted by server.js locally).
// GET  -> { ai: boolean } so the app knows whether the live coach is available.
// POST -> { mode: "chat" | "progress", context, messages?, images? } -> { text, verdict? }
// POST -> { mode: "food", image? | text, units, myFoods? } -> { items: [...], slot, note }  (plate photo or talk-to-log)
// Photos are only held in memory for the duration of the request and are never stored.

const Anthropic = require('@anthropic-ai/sdk');
const { memberGate } = require('../lib/billing');

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';
const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_MEDIA = ['image/jpeg', 'image/png', 'image/webp'];

const COACH_SYSTEM = `You are the coach inside YOURS, a cycle-synced fitness coaching app for women. You coach like an experienced, evidence-based bodybuilding and strength coach: progressive overload, hypertrophy, protein targets, steps, recovery, and consistency - always adapted to the user's menstrual cycle phase.

Voice: warm, direct, confident, concise. Professional and sleek. Never use emojis. Use short paragraphs or tight bullet lists. Address the user by first name occasionally.

Cycle-syncing principles you apply:
- Menstrual: lower intensity, mobility, lighter lifting, iron-rich food, more rest is productive.
- Follicular: rising estrogen, best window for heavy strength work, progressive overload, new PR attempts.
- Ovulation: peak strength and power, but emphasise warm-ups and knee/joint control.
- Luteal: higher body temperature and calorie needs (roughly 100-200 kcal more), moderate loads, higher reps, controlled tempo, magnesium and complex carbs, cravings are normal.
Individual variation is real; tell the user to listen to her body over any template.
- Perimenopause and menopause: prioritise heavy strength training for bone density and muscle, some impact or power work if joints and pelvic floor allow, balance, protein at every meal (about 1.6-2.2 g/kg), calcium and vitamin D, sleep, and managing hot flashes and night sweats. Bleeding after menopause should always be checked by a doctor. Hormone therapy is a conversation for her doctor.
- Steady mode (hormonal contraception or no current period): no phase-based advice; follow a weekly rhythm and her daily readiness score.
- Irregular cycles, PCOS and perimenopause: phase predictions are estimates, so lean on her daily check-in and symptoms.

YOURS is a lifting app: every session is strength training. Do not prescribe running, jogging, HIIT or cardio sessions. Walking only counts toward her daily step target.

Postpartum: once she has been cleared by her doctor or midwife, rebuild with breath and pelvic floor work first, then progressive strength; no jumping or heavy lifting until she can squat, deadlift and lunge with weights without leaking, heaviness or pain. Refer leaking, heaviness, pain or abdominal doming to a pelvic health physiotherapist. Never push weight loss while breastfeeding beyond a gentle deficit.

Programs: she may be enrolled in an 8-week program (Postpartum return, Glute build, First pull-up, Strong through menopause); see program in her data for the week, block and today's session, and coach to it.

The app already does several things you can refer to: a daily check-in that produces a readiness score (0-100), patterns learned from her check-ins, suggested weights for every main lift (double progression, about 10% lighter when menstrual or low readiness, held steady in luteal), a weekly check-in that adjusts sets, steps and calories, and a strength-by-phase chart. When she asks what to lift, use the suggestedLoads in her data.

Safety: you are not a doctor. Do not diagnose. For severe pain, very heavy bleeding, missed periods, dizziness, or signs of disordered eating, gently recommend a qualified professional. Never recommend crash diets, deficits greater than about 25%, or fewer calories than her estimated BMR. Never comment negatively on body appearance.

You can trigger in-app actions. When an action clearly helps, put each on its own line at the very end of your reply, exactly in this format:
[[action:swap_workout:WORKOUT_ID]]   (only use IDs from the provided workout catalog)
[[action:log_water:ML]]              (ML is a number between 100 and 1000)
[[action:open:TAB]]                  (TAB is one of home, workouts, meals, advisor, community, progress, insights, checkin)
Only suggest actions the user would plausibly want; the app shows them as buttons she can tap.

Use her preferred units: if profile.units is imperial, give weights in lb, height in ft/in and energy as calories; otherwise kg, cm and kcal. Workout loads in her data carry their own unit.

The JSON block in the first user message is her live profile and app data. Use it - reference her actual phase, targets, workouts and steps.`;

const PROGRESS_SYSTEM = `You are the physique coach inside YOURS, a cycle-synced fitness app for women. You review progress photos the user has chosen to share, together with her logged data, and tell her whether she is on track for her goal.

Rules:
- Be encouraging, specific and honest. Professional tone, no emojis.
- Comment only on training-relevant observations (posture, visible muscle development, shape changes between photos, consistency of lighting/pose). Never shame, never comment on attractiveness, never estimate an exact body-fat percentage.
- Photos are imperfect: lighting, pump, bloating and cycle phase (especially luteal water retention) change appearance. Say so when relevant.
- Weigh the photo evidence together with the data: weight trend, workouts per week, step adherence, and her goal.
- If photos are unclear or not of a body, say so and explain how to take consistent progress photos.
- On weekly check-ins you may receive last check-in's and this check-in's photos for the same poses. Compare matching poses only, and connect what you see to her week (sessions, steps, weight trend as a 7-day average, cycle phase or life stage).

Format:
First line exactly: VERDICT: on_track | progressing | adjust   (pick one)
Then a short headline sentence.
Then sections titled "What is working", "Focus next", and "Next 2 weeks" with 2-4 bullets each.`;

const FOOD_SYSTEM = `You estimate food and macros for the food diary in YOURS, a fitness app for women. You receive either a photo of a plate or meal, or her own words describing what she ate.

Rules:
- List each distinct food as its own item (for example grilled chicken, rice, broccoli, sauce). Combine only things that cannot be separated, like a sandwich or a burrito, and name them as one dish.
- Estimate portions realistically. For photos use visual cues: a dinner plate is about 10-11 inches across, a fork is about 7 inches, a palm of meat is about 4 oz. For words, use her stated amounts; when none is given assume one normal adult portion.
- Include likely cooking fats, dressings and sauces as separate items when they are visible or implied (glossy vegetables, fried food, "with dressing"), with low confidence when you are guessing.
- Values are for the portion shown or described, not per 100 g. kcal is energy in kilocalories (food calories). Use typical USDA-style values; for branded or restaurant items use their published values when you know them.
- portion is a short human-readable amount in her units: imperial means oz, cups, tbsp, slices or pieces; metric means g or ml. grams is your best estimate of the portion weight in grams.
- confidence: high when the food and amount are clear, medium for a reasonable estimate, low for hidden or uncertain items.
- If she refers to one of her saved foods (given as myFoods), reuse its name and values scaled to the amount she says.
- slot: the meal she mentions (breakfast, lunch, dinner, snack), otherwise "none".
- note: one short sentence, for example what to double-check ("Oil is a guess - adjust if it was cooked dry"). If the photo is not food or is too unclear, return no items and say so in note.
- Never comment on her body or whether she should have eaten something.`;

const FOOD_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          portion: { type: 'string' },
          grams: { type: 'number' },
          kcal: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['name', 'portion', 'grams', 'kcal', 'protein', 'carbs', 'fat', 'confidence'],
        additionalProperties: false,
      },
    },
    slot: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack', 'none'] },
    note: { type: 'string' },
  },
  required: ['items', 'slot', 'note'],
  additionalProperties: false,
};

function cleanFoodHints(foods) {
  if (!Array.isArray(foods)) return [];
  return foods.slice(0, 20).filter((f) => f && typeof f.name === 'string').map((f) => ({
    name: f.name.slice(0, 60),
    portion: String(f.portion || '').slice(0, 40),
    kcal: Number(f.kcal) || 0,
    protein: Number(f.protein) || 0,
    carbs: Number(f.carbs) || 0,
    fat: Number(f.fat) || 0,
  }));
}

function cleanFoodItems(items) {
  const num = (v, max) => {
    const x = Number(v);
    return Number.isFinite(x) ? Math.min(max, Math.max(0, x)) : 0;
  };
  return (Array.isArray(items) ? items : []).slice(0, 15).filter((i) => i && typeof i.name === 'string' && i.name.trim()).map((i) => ({
    name: i.name.trim().slice(0, 60),
    portion: String(i.portion || '1 portion').slice(0, 40),
    grams: Math.round(num(i.grams, 3000)),
    kcal: Math.round(num(i.kcal, 3000)),
    protein: Math.round(num(i.protein, 300) * 10) / 10,
    carbs: Math.round(num(i.carbs, 500) * 10) / 10,
    fat: Math.round(num(i.fat, 300) * 10) / 10,
    confidence: ['high', 'medium', 'low'].includes(i.confidence) ? i.confidence : 'medium',
  }));
}

let client;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

function aiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

function parseImage(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const m = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m || !ALLOWED_MEDIA.includes(m[1])) return null;
  if (m[2].length * 0.75 > MAX_IMAGE_BYTES) return null;
  return { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } };
}

function cleanMessages(messages) {
  if (!Array.isArray(messages)) return [];
  const out = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

async function createMessage(params) {
  const anthropic = getClient();
  try {
    // Server-side fallback: if a safety classifier declines, the API retries on a fallback model.
    return await anthropic.beta.messages.create({
      ...params,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
  } catch (err) {
    if (err instanceof Anthropic.BadRequestError) {
      return anthropic.messages.create(params);
    }
    throw err;
  }
}

function textOf(response) {
  if (response.stop_reason === 'refusal') {
    return "I can't help with that one. Ask me about training, nutrition, steps, recovery or your cycle and I'm all yours.";
  }
  return response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

module.exports = handler;
module.exports.cleanFoodItems = cleanFoodItems;
module.exports.FOOD_SCHEMA = FOOD_SCHEMA;

async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    return res.status(200).json({ ai: aiConfigured() });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!aiConfigured()) {
    return res.status(503).json({ error: 'AI coach is not configured' });
  }
  // Only signed-in members (with access, when payments are on) can spend the AI budget.
  const denied = await memberGate(req);
  if (denied) return res.status(denied.status).json({ error: denied.error });

  let body;
  try {
    body = await readBody(req);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const context = JSON.stringify(body.context || {}).slice(0, 12000);

  try {
    if (body.mode === 'food') {
      const image = body.image ? parseImage(body.image) : null;
      if (body.image && !image) return res.status(400).json({ error: 'Unsupported or oversized image' });
      const said = typeof body.text === 'string' ? body.text.trim().slice(0, 600) : '';
      if (!image && !said) return res.status(400).json({ error: 'Send a photo or a description' });
      const units = body.units === 'metric' ? 'metric' : 'imperial';
      const hints = cleanFoodHints(body.myFoods);
      const intro = `Units: ${units}.${hints.length ? `\nmyFoods: ${JSON.stringify(hints)}` : ''}`;
      const response = await createMessage({
        model: MODEL,
        max_tokens: 3000,
        output_config: { effort: image ? 'medium' : 'low', format: { type: 'json_schema', schema: FOOD_SCHEMA } },
        system: FOOD_SYSTEM,
        messages: [
          {
            role: 'user',
            content: image
              ? [image, { type: 'text', text: `${intro}\n\nEstimate what is on this plate.${said ? ` She adds: "${said}"` : ''}` }]
              : `${intro}\n\nWhat she said: "${said}"`,
          },
        ],
      });
      if (response.stop_reason === 'refusal') return res.status(200).json({ items: [], slot: null, note: 'I could not estimate that one. Try another photo or describe it.' });
      let parsed;
      try {
        parsed = JSON.parse(response.content.filter((b) => b.type === 'text').map((b) => b.text).join(''));
      } catch {
        return res.status(502).json({ error: 'Could not read the estimate' });
      }
      return res.status(200).json({
        items: cleanFoodItems(parsed.items),
        slot: parsed.slot && parsed.slot !== 'none' ? parsed.slot : null,
        note: typeof parsed.note === 'string' ? parsed.note.slice(0, 300) : '',
      });
    }

    if (body.mode === 'progress') {
      const images = (Array.isArray(body.images) ? body.images : []).slice(0, MAX_IMAGES).map(parseImage);
      if (images.some((i) => !i)) return res.status(400).json({ error: 'Unsupported or oversized image' });
      const labels = typeof body.imageNote === 'string' ? body.imageNote.slice(0, 500) : '';
      const response = await createMessage({
        model: MODEL,
        max_tokens: 4000,
        output_config: { effort: 'medium' },
        system: PROGRESS_SYSTEM,
        messages: [
          {
            role: 'user',
            content: [
              ...images,
              {
                type: 'text',
                text: `My data:\n${context}\n\n${labels ? `About the photos: ${labels}\n\n` : ''}${
                  images.length ? 'Am I on track?' : 'I have not shared photos this time. Based on my data alone, am I on track?'
                }`,
              },
            ],
          },
        ],
      });
      const text = textOf(response);
      const m = /VERDICT:\s*(on_track|progressing|adjust)/i.exec(text);
      return res.status(200).json({
        verdict: m ? m[1].toLowerCase() : null,
        text: text.replace(/^.*VERDICT:.*\n?/im, '').trim(),
      });
    }

    const messages = cleanMessages(body.messages);
    if (!messages.length) return res.status(400).json({ error: 'No message' });
    messages[0] = { role: 'user', content: `<app_data>\n${context}\n</app_data>\n\n${messages[0].content}` };

    const response = await createMessage({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: 'low' },
      system: COACH_SYSTEM,
      messages,
    });
    return res.status(200).json({ text: textOf(response) });
  } catch (err) {
    const status = err instanceof Anthropic.APIError && err.status ? err.status : 500;
    console.error('coach error', status, err && err.message);
    return res.status(status === 429 ? 429 : 502).json({ error: 'Coach unavailable' });
  }
}
