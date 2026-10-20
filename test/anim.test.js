const test = require('node:test');
const assert = require('node:assert');
const A = require('../public/anim.js');
const L = require('../public/logic.js');

test('every exercise in the library has a demonstration', () => {
  const missing = L.allExercises().filter((e) => !A.patternFor(e.name)).map((e) => e.name);
  assert.deepEqual(missing, []);
});

test('demonstrations render cleanly through the whole loop and light up the working muscles', () => {
  for (const e of L.allExercises()) {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const svg = A.svg(e.name, { t, primary: e.primary, secondary: e.secondary, equipment: e.equipment, label: e.name });
      assert.ok(svg.startsWith('<svg'), e.name);
      assert.ok(!/NaN|undefined|Infinity/.test(svg), `${e.name} at ${t}`);
    }
  }
  const lat = A.svg('Lat pulldown', { t: 1, primary: ['lats'], secondary: [] });
  assert.match(lat, /#C8673F/);
  assert.doesNotMatch(A.svg('Lat pulldown', { t: 1, primary: [], secondary: [] }), /#C8673F" opacity/);
});

test('the loop eases up, holds, comes down and rests', () => {
  assert.equal(A.phaseAt(0, 2800), 0);
  assert.equal(A.phaseAt(1200, 2800), 1);
  assert.equal(A.phaseAt(2700, 2800), 0);
  assert.ok(A.phaseAt(500, 2800) > 0 && A.phaseAt(500, 2800) < 1);
});

test('names with symbols cannot break out of the drawing', () => {
  assert.doesNotMatch(A.svg('Squat <script>', { label: 'Squat <script>' }), /<script/);
});
