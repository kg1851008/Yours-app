// YOURS content library: cycle phases, preloaded workouts, meals and community seed data.
(function () {
  const PHASES = {
    menstrual: {
      name: 'Menstrual',
      short: 'Rest and restore',
      energy: 'Lower energy',
      hormones: 'Estrogen and progesterone are at their lowest. Inflammation and fatigue can run higher.',
      training: 'Keep intensity low to moderate. Mobility and lighter full-body lifting keep momentum without draining recovery.',
      nutrition: 'Prioritise iron, vitamin C, omega-3s and warm, easy-to-digest meals. Hydrate well.',
      tips: [
        'Swap heavy lifting for controlled tempo work at RPE 5-6.',
        'Pair iron sources with vitamin C to improve absorption.',
        'A 20-minute walk can ease cramps better than staying still.',
      ],
      foods: ['Spinach', 'Lentils', 'Lean red meat', 'Salmon', 'Citrus', 'Dark chocolate', 'Bone broth', 'Ginger'],
    },
    follicular: {
      name: 'Follicular',
      short: 'Build and push',
      energy: 'Rising energy',
      hormones: 'Estrogen climbs steadily, improving insulin sensitivity, mood and recovery.',
      training: 'Your best window for strength. Add load, attempt progressive overload and learn new lifts.',
      nutrition: 'Fresh, lighter foods, fermented foods and lean protein. Carbs fuel heavier sessions well now.',
      tips: [
        'Aim to add weight or a rep to your main lifts this week.',
        'Fuel sessions with carbs 1-2 hours before training.',
        'Recovery is quicker now, so you can train 4-5 days.',
      ],
      foods: ['Eggs', 'Chicken', 'Greek yogurt', 'Kimchi', 'Oats', 'Berries', 'Broccoli sprouts', 'Quinoa'],
    },
    ovulation: {
      name: 'Ovulation',
      short: 'Peak and perform',
      energy: 'Peak energy',
      hormones: 'Estrogen peaks and testosterone rises briefly. Strength and confidence are typically highest.',
      training: 'Go for PRs, power and high-output glute work. Warm up thoroughly and keep strict knee control.',
      nutrition: 'Fiber, antioxidants and cruciferous vegetables support estrogen clearance. Keep protein high.',
      tips: [
        'Test a heavy single or a rep PR if you feel strong.',
        'Spend an extra 5 minutes on your warm-up and landing mechanics.',
        'Load up on colourful vegetables and fiber.',
      ],
      foods: ['Salmon', 'Cruciferous veg', 'Berries', 'Quinoa', 'Avocado', 'Almonds', 'Bell peppers', 'Turkey'],
    },
    luteal: {
      name: 'Luteal',
      short: 'Sustain and steady',
      energy: 'Gradually lower energy',
      hormones: 'Progesterone rises, body temperature and calorie needs increase, and cravings are normal.',
      training: 'Moderate loads, higher reps and controlled tempo. Focus on technique and consistency rather than PRs.',
      nutrition: 'Complex carbs, magnesium and B6. You may need 100-200 more calories, so eat them on purpose.',
      tips: [
        'Hold your weights steady and chase quality reps instead of new maxes.',
        'Magnesium-rich foods help with sleep and cravings.',
        'Expect some water retention, so the scale may rise temporarily.',
      ],
      foods: ['Sweet potato', 'Dark chocolate', 'Pumpkin seeds', 'Brown rice', 'Bananas', 'Chickpeas', 'Turkey', 'Leafy greens'],
    },
  };

  const PHASE_ORDER = ['menstrual', 'follicular', 'ovulation', 'luteal'];

  // e(name, sets, reps, rest, cue, main) - main lifts get an extra set for advanced users.
  const e = (name, sets, reps, rest, cue, main) => ({ name, sets, reps, rest, cue, main: !!main });

  const WORKOUTS = [
    {
      id: 'm-restore', phase: 'menstrual', name: 'Restore and Mobility', focus: 'Mobility and core', minutes: 30, intensity: 'Low',
      summary: 'Gentle mobility and light lifts to ease cramps, open the hips and keep you consistent.',
      exercises: [
        e('Cat-cow', 2, '10', '30s', 'Move slowly with your breath.'),
        e('90/90 hip switches', 2, '8 / side', '30s', 'Sit tall and rotate from the hips.'),
        e('Glute bridge', 3, '12', '45s', 'Squeeze for 2 seconds at the top.'),
        e('Goblet squat (light)', 2, '10', '60s', 'An easy weight and smooth reps.'),
        e('Bird dog', 3, '8 / side', '30s', 'Keep hips square and core braced.'),
        e('Dead bug', 3, '8 / side', '30s', 'Press your low back into the floor.'),
      ],
    },
    {
      id: 'm-light', phase: 'menstrual', name: 'Light Full Body', focus: 'Full body', minutes: 35, intensity: 'Low-moderate',
      summary: 'Moderate loads at RPE 6 to maintain strength without draining you.',
      exercises: [
        e('Goblet squat', 3, '10', '60s', 'Elbows inside knees, chest proud.', true),
        e('Dumbbell Romanian deadlift', 3, '10', '60s', 'Soft knees, hinge until you feel the hamstrings.', true),
        e('Seated cable row', 3, '12', '60s', 'Pull elbows to your back pockets.'),
        e('Incline dumbbell press', 3, '10', '60s', 'Control the lowering for 2 seconds.'),
        e('Pallof press', 2, '10 / side', '30s', 'Resist rotation and breathe out as you press.'),
      ],
    },
    // Ids m-walk, f-hiit and l-pilates are kept so saved plans and history still resolve; all three are lifting sessions now.
    {
      id: 'm-walk', phase: 'menstrual', name: 'Gentle Glutes and Core', focus: 'Glutes and core', minutes: 35, intensity: 'Low',
      summary: 'Light glute work and core strength at RPE 5-6. Easy on the body, still lifting.',
      exercises: [
        e('Dumbbell glute bridge', 3, '12', '60s', 'Pause for 2 seconds at the top.', true),
        e('Step-up (low box)', 3, '8 / leg', '60s', 'Drive through the whole foot, control the way down.'),
        e('Cable pull-through', 3, '12', '60s', 'Hinge back, then squeeze the glutes to stand.'),
        e('Lying leg curl', 2, '12', '60s', 'Slow 3-second lowering.'),
        e('Forearm plank', 3, '30s', '30s', 'Ribs down, glutes on.'),
        e('Side plank', 2, '20s / side', '30s', 'Stack hips and keep a long line.'),
      ],
    },
    {
      id: 'f-lower', phase: 'follicular', name: 'Lower Body Strength', focus: 'Quads, glutes, hamstrings', minutes: 55, intensity: 'High',
      summary: 'Heavy compound lower-body work. Add load wherever you can.',
      exercises: [
        e('Back squat', 4, '6', '2-3 min', 'Brace before every rep and drive through mid-foot.', true),
        e('Romanian deadlift', 4, '8', '2 min', 'Bar close to legs, hips back.', true),
        e('Bulgarian split squat', 3, '8 / leg', '90s', 'Lean slightly forward to bias glutes.'),
        e('Barbell hip thrust', 4, '8', '90s', 'Chin tucked, pause at lockout.', true),
        e('Lying leg curl', 3, '12', '60s', 'Slow 3-second lowering.'),
        e('Standing calf raise', 3, '15', '45s', 'Full stretch at the bottom.'),
      ],
    },
    {
      id: 'f-upper', phase: 'follicular', name: 'Upper Body Push and Pull', focus: 'Back, chest, shoulders', minutes: 50, intensity: 'High',
      summary: 'Balanced upper-body strength with progressive overload on main lifts.',
      exercises: [
        e('Lat pulldown', 4, '8', '90s', 'Drive elbows down to your sides.', true),
        e('Dumbbell bench press', 4, '8', '90s', 'Shoulder blades pinned back.', true),
        e('Chest-supported row', 3, '10', '75s', 'Pause with elbows behind you.'),
        e('Seated dumbbell shoulder press', 3, '10', '75s', 'Ribs down, do not arch.'),
        e('Cable lateral raise', 3, '15', '45s', 'Lead with elbows, slow on the way down.'),
        e('Face pull', 3, '15', '45s', 'Pull to eye level and rotate out.'),
      ],
    },
    {
      id: 'f-hiit', phase: 'follicular', name: 'Full Body Strength', focus: 'Full body', minutes: 50, intensity: 'High',
      summary: 'Big compound lifts for the whole body while your recovery is at its best.',
      exercises: [
        e('Trap bar deadlift', 4, '6', '2-3 min', 'Brace, push the floor away, stand tall.', true),
        e('Incline dumbbell press', 4, '8', '90s', 'Control the lowering for 2 seconds.', true),
        e('Reverse lunge', 3, '10 / leg', '75s', 'Step back long and stay tall.'),
        e('Seated cable row', 3, '10', '75s', 'Pull elbows to your back pockets.'),
        e('Kettlebell swing', 3, '12', '60s', 'Snap the hips and float the bell.'),
        e('Pallof press', 2, '10 / side', '45s', 'Resist rotation and breathe out as you press.'),
      ],
    },
    {
      id: 'o-glute', phase: 'ovulation', name: 'Glute Hypertrophy', focus: 'Glutes', minutes: 55, intensity: 'High',
      summary: 'High-output glute day while strength is at its peak.',
      exercises: [
        e('Barbell hip thrust', 4, '8-10', '2 min', 'Go heavy and own the lockout.', true),
        e('Sumo deadlift', 3, '6', '2 min', 'Knees out, chest up.', true),
        e('Walking lunge', 3, '12 / leg', '90s', 'Long stride and a soft back knee.'),
        e('Cable kickback', 3, '12 / leg', '45s', 'Squeeze the glute, not the low back.'),
        e('Hip abduction', 3, '20', '45s', 'Lean forward slightly for upper glutes.'),
        e('45-degree back extension', 3, '15', '60s', 'Round the upper back and drive with the glutes.'),
      ],
    },
    {
      id: 'o-power', phase: 'ovulation', name: 'Power and PR Day', focus: 'Strength and power', minutes: 50, intensity: 'Very high',
      summary: 'Test your strength. Warm up thoroughly and keep strict knee alignment.',
      exercises: [
        e('Trap bar deadlift', 5, '3', '3 min', 'Work up to a heavy triple or test a PR.', true),
        e('Box jump', 4, '5', '90s', 'Land soft with knees tracking over toes.'),
        e('Push press', 4, '5', '2 min', 'Dip and drive, then lock out overhead.', true),
        e('Pull-up or assisted pull-up', 4, 'AMRAP', '2 min', 'Full hang to chin over bar.'),
        e('Sled push', 4, '20 m', '90s', 'Low angle, quick steps.'),
      ],
    },
    {
      id: 'l-steady', phase: 'luteal', name: 'Steady Strength', focus: 'Lower body', minutes: 45, intensity: 'Moderate',
      summary: 'Hold your working weights steady and chase quality reps.',
      exercises: [
        e('Goblet squat', 3, '10-12', '75s', 'Tempo 3-1-1.', true),
        e('Hip thrust', 3, '12', '75s', 'Hold the top for 1 second.', true),
        e('Single-leg Romanian deadlift', 3, '10 / leg', '60s', 'Square hips and reach long.'),
        e('Leg press', 3, '12-15', '75s', 'Feet high for glutes.'),
        e('Seated leg curl', 3, '12', '60s', 'Squeeze at the bottom.'),
        e('Forearm plank', 3, '40s', '30s', 'Breathe behind the brace.'),
      ],
    },
    {
      id: 'l-upper', phase: 'luteal', name: 'Upper Body Sculpt', focus: 'Upper body', minutes: 45, intensity: 'Moderate',
      summary: 'Higher-rep upper-body work for shape and posture.',
      exercises: [
        e('One-arm dumbbell row', 3, '12 / side', '60s', 'Pull to the hip.', true),
        e('Incline dumbbell press', 3, '12', '60s', 'Slow lowering.', true),
        e('Arnold press', 3, '10', '60s', 'Rotate smoothly.'),
        e('Cable fly', 3, '15', '45s', 'Hug a tree.'),
        e('Dumbbell curl', 3, '12', '45s', 'No swinging.'),
        e('Triceps rope pushdown', 3, '15', '45s', 'Split the rope at the bottom.'),
      ],
    },
    {
      id: 'l-pilates', phase: 'luteal', name: 'Glute and Core Sculpt', focus: 'Glutes and core', minutes: 40, intensity: 'Low-moderate',
      summary: 'Lighter glute and core lifting when energy dips late in the cycle.',
      exercises: [
        e('Dumbbell hip thrust', 3, '12', '60s', 'Hold the top for 1 second.', true),
        e('Cable kickback', 3, '12 / leg', '45s', 'Squeeze the glute, not the low back.'),
        e('Seated hip abduction', 3, '15', '45s', 'Lean forward slightly for upper glutes.'),
        e('45-degree back extension', 2, '12', '60s', 'Round the upper back and drive with the glutes.'),
        e('Dead bug', 3, '8 / side', '30s', 'Press your low back into the floor.'),
        e('Pallof press', 2, '10 / side', '30s', 'Resist rotation and breathe out as you press.'),
      ],
    },
    {
      id: 'mp-strength', phase: 'menopause', name: 'Bone-Building Strength', focus: 'Full body strength', minutes: 50, intensity: 'High',
      summary: 'Heavy, controlled compound lifts. Loading your bones and muscles is the most effective training for this stage of life.',
      exercises: [
        e('Trap bar deadlift', 4, '6-8', '2 min', 'Brace, push the floor away, stand tall.', true),
        e('Goblet squat', 4, '8', '90s', 'Sit between your heels, chest proud.', true),
        e('Dumbbell bench press', 3, '8-10', '90s', 'Shoulder blades pinned back.', true),
        e('One-arm dumbbell row', 3, '10 / side', '60s', 'Pull to the hip.'),
        e('Step-up', 3, '8 / leg', '60s', 'Drive through the whole foot, control the way down.'),
        e('Farmer carry', 3, '30 m', '60s', 'Heavy, tall and slow. Great for grip and posture.'),
      ],
    },
    {
      id: 'mp-power', phase: 'menopause', name: 'Power and Impact', focus: 'Power, bone density, balance', minutes: 35, intensity: 'Moderate',
      summary: 'Short bursts of impact and speed that tell your bones to stay strong. Scale the jumps to what your joints and pelvic floor like.',
      exercises: [
        e('Low box jump or step-up hop', 4, '5', '60s', 'Land softly. Swap for fast step-ups if jumping does not feel right.'),
        e('Kettlebell swing', 4, '12', '60s', 'Snap the hips, float the bell.', true),
        e('Medicine ball slam', 3, '8', '45s', 'Reach tall, slam with intent.'),
        e('Dumbbell push press', 3, '8', '60s', 'Dip and drive, then lock out overhead.'),
        e('Single-leg balance reach', 3, '6 / leg', '30s', 'Slow and steady. Hold a wall if needed.'),
      ],
    },
    {
      id: 'mp-mobility', phase: 'menopause', name: 'Mobility and Balance', focus: 'Joints, balance, recovery', minutes: 30, intensity: 'Low',
      summary: 'Keep joints happy and balance sharp. Good for days with poor sleep or joint aches.',
      exercises: [
        e('Hip airplane', 2, '5 / side', '30s', 'Hold something for support.'),
        e('Thoracic rotations', 2, '8 / side', '30s', 'Follow your hand with your eyes.'),
        e('Glute bridge', 3, '12', '45s', 'Squeeze for 2 seconds at the top.'),
        e('Tandem walk', 2, '10 steps', '30s', 'Heel to toe in a straight line.'),
        e('Light dumbbell Romanian deadlift', 2, '10', '60s', 'Easy weight, long spine, hips back.'),
      ],
    },
    {
      id: 'rest', phase: 'any', name: 'Active Recovery', focus: 'Recovery', minutes: 25, intensity: 'Very low',
      summary: 'Rest is part of the plan. Walk, stretch and hit your step target.',
      exercises: [
        e('Easy walk', 1, '20 min', '-', 'Outdoors if you can.'),
        e('Hip flexor stretch', 2, '45s / side', '-', 'Tuck the pelvis.'),
        e('Thoracic rotations', 2, '8 / side', '-', 'Follow your hand with your eyes.'),
      ],
    },
  ];

  // Rotations by day within each phase.
  const ROTATION = {
    menstrual: ['m-restore', 'm-light', 'm-walk', 'm-light', 'rest'],
    follicular: ['f-lower', 'f-upper', 'f-hiit', 'rest', 'f-lower', 'f-upper', 'rest'],
    ovulation: ['o-glute', 'o-power', 'rest'],
    luteal: ['l-steady', 'l-upper', 'rest', 'l-pilates', 'l-steady', 'l-upper', 'rest'],
  };

  // Meal tags used for avoid filtering: dairy, gluten, egg, fish, shellfish, redmeat, pork, soy, nuts, poultry, mushroom.
  const m = (name, desc, tags, protein, kcal, why) => ({ name, desc, tags, protein, kcal, why });

  const MEALS = {
    menstrual: {
      breakfast: [
        m('Warm cacao protein oats', 'Oats cooked with cacao, protein powder, banana and pumpkin seeds.', ['gluten'], 32, 480, 'Magnesium and iron from cacao and pumpkin seeds ease cramps.'),
        m('Spinach and feta egg scramble', 'Three eggs with spinach, feta, and sourdough toast.', ['egg', 'dairy', 'gluten'], 30, 450, 'Spinach and eggs provide iron and B12.'),
        m('Tofu breakfast hash', 'Crumbled tofu, sweet potato, kale and turmeric.', ['soy'], 26, 430, 'Turmeric and ginger have anti-inflammatory properties.'),
      ],
      lunch: [
        m('Lentil and beef bolognese bowl', 'Lean beef and lentil ragu over brown rice with spinach.', ['redmeat'], 42, 620, 'Heme and plant iron help replace what you lose.'),
        m('Salmon and quinoa power bowl', 'Baked salmon, quinoa, roasted beets and citrus dressing.', ['fish'], 38, 580, 'Omega-3s and vitamin C support recovery and iron uptake.'),
        m('Chickpea and spinach curry', 'Coconut chickpea curry with spinach and basmati rice.', [], 22, 560, 'A warming, iron-rich and easy-to-digest meal.'),
      ],
      dinner: [
        m('Ginger chicken bone broth soup', 'Chicken, bone broth, ginger, bok choy and rice noodles.', ['poultry'], 40, 520, 'Warming and hydrating, and ginger can ease cramping.'),
        m('Miso-glazed cod with greens', 'Cod, miso glaze, sauteed kale and jasmine rice.', ['fish', 'soy'], 36, 540, 'Lean protein with iodine and leafy-green iron.'),
        m('Black bean and sweet potato chili', 'Hearty bean chili topped with avocado.', [], 24, 560, 'Fiber, iron and complex carbs for steady energy.'),
      ],
      snack: [
        m('Dark chocolate and almonds', '20 g of 85% dark chocolate with a handful of almonds.', ['nuts'], 7, 260, 'Magnesium helps with cramps and mood.'),
        m('Greek yogurt and berries', 'High-protein yogurt with mixed berries.', ['dairy'], 20, 200, 'Protein and vitamin C.'),
        m('Edamame with sea salt', 'A cup of steamed edamame.', ['soy'], 17, 190, 'Plant protein and iron.'),
      ],
    },
    follicular: {
      breakfast: [
        m('Greek yogurt protein parfait', 'Greek yogurt, granola, berries and chia.', ['dairy', 'gluten'], 34, 430, 'Probiotics and protein while estrogen rises.'),
        m('Veggie egg-white omelet', 'Egg whites, peppers, spinach and avocado toast.', ['egg', 'gluten'], 32, 420, 'Lean protein and fresh vegetables.'),
        m('Green protein smoothie', 'Pea protein, spinach, mango, oats and flax.', [], 30, 410, 'Light, fresh fuel for heavier training days.'),
      ],
      lunch: [
        m('Chicken kimchi rice bowl', 'Grilled chicken, kimchi, brown rice, cucumber and sesame.', ['poultry', 'soy'], 45, 600, 'Fermented foods support gut health and estrogen metabolism.'),
        m('Shrimp poke bowl', 'Shrimp, sushi rice, edamame, mango and seaweed.', ['shellfish', 'soy'], 36, 560, 'Lean protein and carbs to fuel strength work.'),
        m('Tempeh quinoa salad', 'Tempeh, quinoa, sprouts, herbs and lemon tahini.', ['soy'], 30, 540, 'Fermented plant protein with fresh greens.'),
      ],
      dinner: [
        m('Lemon herb chicken and potatoes', 'Roast chicken thighs, baby potatoes and green beans.', ['poultry'], 44, 610, 'Protein and carbs for recovery after heavy lifts.'),
        m('Turkey zucchini meatballs', 'Turkey meatballs, marinara and whole-wheat pasta.', ['poultry', 'gluten'], 42, 600, 'Lean protein with performance carbs.'),
        m('Tofu stir-fry with soba', 'Crispy tofu, broccoli, snap peas and buckwheat soba.', ['soy'], 30, 560, 'Fiber-rich vegetables and complete plant protein.'),
      ],
      snack: [
        m('Cottage cheese and pineapple', 'A cup of cottage cheese with pineapple.', ['dairy'], 24, 220, 'Slow-digesting protein.'),
        m('Rice cakes and turkey', 'Two rice cakes with turkey slices and mustard.', ['poultry'], 18, 190, 'Quick pre-workout carbs and protein.'),
        m('Protein shake and banana', 'Whey or plant protein with a banana.', [], 26, 250, 'Fast fuel around training.'),
      ],
    },
    ovulation: {
      breakfast: [
        m('Berry flax overnight oats', 'Oats, flax, mixed berries and protein yogurt.', ['gluten', 'dairy'], 30, 450, 'Fiber and antioxidants support estrogen clearance.'),
        m('Smoked salmon avocado toast', 'Smoked salmon, avocado, arugula and rye toast.', ['fish', 'gluten'], 28, 440, 'Omega-3s and healthy fats.'),
        m('Tofu veggie scramble', 'Tofu, peppers, tomatoes and black beans.', ['soy'], 28, 400, 'Plant protein and colourful antioxidants.'),
      ],
      lunch: [
        m('Salmon and roasted broccoli bowl', 'Salmon, broccoli, quinoa and tahini.', ['fish'], 40, 600, 'Cruciferous vegetables help metabolise estrogen.'),
        m('Turkey and cauliflower rice burrito bowl', 'Turkey, cauliflower rice, beans, salsa and avocado.', ['poultry'], 42, 560, 'Fiber-forward with high protein.'),
        m('Rainbow lentil salad', 'Lentils, peppers, red cabbage, feta and herbs.', ['dairy'], 26, 520, 'Antioxidants and fiber at your peak.'),
      ],
      dinner: [
        m('Grilled steak and Brussels sprouts', 'Sirloin, roasted Brussels sprouts and sweet potato.', ['redmeat'], 45, 620, 'Protein for power work plus cruciferous vegetables.'),
        m('Shrimp and veggie skewers', 'Shrimp, zucchini, peppers and wild rice.', ['shellfish'], 38, 540, 'Light, lean and colourful.'),
        m('Chickpea cauliflower tikka', 'Roasted cauliflower and chickpeas in tikka sauce with rice.', [], 22, 560, 'Fiber and plant protein.'),
      ],
      snack: [
        m('Apple and almond butter', 'A sliced apple with 1 tbsp almond butter.', ['nuts'], 5, 200, 'Fiber and healthy fats.'),
        m('Hummus and crudites', 'Hummus with carrots, peppers and cucumber.', [], 8, 180, 'Fiber and micronutrients.'),
        m('Protein yogurt bark', 'Frozen Greek yogurt with berries.', ['dairy'], 15, 170, 'Cool, high-protein snack.'),
      ],
    },
    luteal: {
      breakfast: [
        m('Sweet potato protein pancakes', 'Pancakes made with sweet potato, eggs, oats and protein.', ['egg', 'gluten'], 32, 480, 'Complex carbs steady the luteal energy dip.'),
        m('Peanut butter banana oats', 'Oats, banana, peanut butter and protein powder.', ['gluten', 'nuts'], 30, 520, 'B6 and magnesium help with mood and cravings.'),
        m('Savory tofu rice bowl', 'Tofu, brown rice, spinach and sesame.', ['soy'], 26, 460, 'Slow carbs and plant protein.'),
      ],
      lunch: [
        m('Turkey sweet potato bowl', 'Ground turkey, roasted sweet potato, kale and tahini.', ['poultry'], 42, 620, 'Complex carbs and tryptophan support mood.'),
        m('Salmon brown rice sushi bowl', 'Salmon, brown rice, avocado and cucumber.', ['fish', 'soy'], 38, 610, 'Omega-3s may ease PMS symptoms.'),
        m('Lentil and pumpkin soup', 'Red lentils, pumpkin, cumin and a side of seeded bread.', ['gluten'], 24, 540, 'Magnesium and fiber for cravings.'),
      ],
      dinner: [
        m('Beef and black bean tacos', 'Lean beef, black beans, slaw and corn tortillas.', ['redmeat'], 42, 640, 'Higher-calorie, satisfying protein for higher needs.'),
        m('Chicken and chickpea tray bake', 'Chicken, chickpeas, peppers and harissa.', ['poultry'], 44, 600, 'Protein and fiber keep you full.'),
        m('Halloumi and roasted veggie couscous', 'Halloumi, roasted vegetables, couscous and pumpkin seeds.', ['dairy', 'gluten'], 28, 620, 'Magnesium from seeds with satisfying carbs.'),
      ],
      snack: [
        m('Dark chocolate and pumpkin seeds', '20 g dark chocolate with pumpkin seeds.', [], 8, 240, 'Magnesium for cravings and sleep.'),
        m('Banana and peanut butter', 'A banana with 1 tbsp peanut butter.', ['nuts'], 6, 210, 'B6 and potassium for bloating.'),
        m('Protein hot chocolate', 'Cacao, protein powder and warm milk of choice.', [], 25, 200, 'Satisfies cravings with protein.'),
      ],
    },
  };

  // Suggested meals list protein and calories. Estimate carbs and fat from the remaining calories
  // so a logged suggestion carries all four macros (fat-rich ingredients shift the split).
  Object.values(MEALS).forEach((slots) => Object.values(slots).forEach((list) => list.forEach((meal) => {
    if (meal.carbs != null) return;
    const rest = Math.max(0, meal.kcal - meal.protein * 4);
    const fatShare = /salmon|avocado|almond|peanut|cheese|feta|halloumi|chocolate|egg|tahini|coconut|beef|steak|thigh|seed|miso|cod/i.test(meal.name + ' ' + meal.desc) ? 0.45 : 0.3;
    meal.fat = Math.round((rest * fatShare) / 9);
    meal.carbs = Math.round((rest * (1 - fatShare)) / 4);
    meal.estimated = true;
  })));

  const FAVORITE_OPTIONS = ['Chicken', 'Salmon', 'Eggs', 'Greek yogurt', 'Oats', 'Rice', 'Sweet potato', 'Avocado', 'Berries', 'Tofu', 'Beef', 'Turkey', 'Spinach', 'Quinoa', 'Shrimp', 'Chocolate'];
  const AVOID_OPTIONS = [
    { label: 'Dairy', tags: ['dairy'] },
    { label: 'Gluten', tags: ['gluten'] },
    { label: 'Eggs', tags: ['egg'] },
    { label: 'Fish', tags: ['fish'] },
    { label: 'Shellfish', tags: ['shellfish'] },
    { label: 'Red meat', tags: ['redmeat'] },
    { label: 'Pork', tags: ['pork'] },
    { label: 'Soy', tags: ['soy'] },
    { label: 'Nuts', tags: ['nuts'] },
    { label: 'Vegetarian', tags: ['fish', 'shellfish', 'redmeat', 'pork', 'poultry'] },
    { label: 'Mushrooms', tags: ['mushroom'] },
  ];

  const MEMBERS = [
    { id: 'maya', name: 'Maya R.', bio: 'Glute-focused, 2 years lifting' },
    { id: 'jess', name: 'Jess T.', bio: 'Mum of two, home workouts' },
    { id: 'priya', name: 'Priya K.', bio: 'First powerlifting meet in spring' },
    { id: 'elle', name: 'Elle M.', bio: 'Recomp, 10k steps every day' },
  ];

  const SEED_POSTS = [
    { id: 's1', author: 'priya', text: 'Hit a 100 kg trap bar deadlift on my ovulation PR day. Six months ago I could barely pull 60. Trust the follicular build-up.', tag: 'Win', hoursAgo: 3, likes: 24, comments: [{ author: 'maya', text: 'That is huge. Congratulations.' }] },
    { id: 's2', author: 'jess', text: 'Luteal week and the cravings are real. Protein hot chocolate before bed has been saving me.', tag: 'Tip', hoursAgo: 9, likes: 15, comments: [] },
    { id: 's3', author: 'elle', text: '30 days in a row of hitting my step target. Down 3 cm on my waist without changing much else.', tag: 'Win', hoursAgo: 20, likes: 31, comments: [{ author: 'jess', text: 'Steps are so underrated.' }] },
    { id: 's4', author: 'maya', text: 'Question: does anyone else feel weaker on day 1-2 of their period? I swapped to the Restore session and felt so much better.', tag: 'Question', hoursAgo: 30, likes: 12, comments: [{ author: 'priya', text: 'Every cycle. Listening to it made me more consistent overall.' }] },
  ];

  const AUTO_REPLIES = [
    'Love that. How are you feeling this phase?',
    'That is such a good point. I have been trying the same thing.',
    'You have got this. Consistency over perfection.',
    'Thanks for the message. Let us check in again after your next session.',
    'Same here. The coach told me to keep steps up and it helped a lot.',
  ];

  // Hormonal contraception and no-period modes use a steady weekly plan instead of phases.
  PHASES.steady = {
    name: 'Steady',
    short: 'Consistent and strong',
    energy: 'Steady energy',
    hormones: 'Your hormones follow a steadier pattern, so your plan follows a weekly rhythm and your daily check-in instead of cycle phases. If you are postpartum, get clearance from your doctor before strenuous training.',
    training: 'Strength 3-4 days a week with progressive overload. Let your daily readiness decide how hard to push.',
    nutrition: 'Protein at every meal, plenty of fiber and colour, and carbs around training.',
    tips: [
      'Check in daily. Your readiness score sets the tone for training.',
      'Add a rep or a little weight to your main lifts each week.',
      'Keep steps consistent. They are your best recovery and fat-loss tool.',
    ],
    foods: ['Chicken', 'Salmon', 'Greek yogurt', 'Oats', 'Berries', 'Quinoa', 'Leafy greens', 'Eggs'],
  };
  ROTATION.steady = ['f-lower', 'f-upper', 'rest', 'o-glute', 'l-upper', 'f-hiit', 'rest']; // Monday first

  // Menopause and postmenopause: a steady week built around bone density, muscle and balance.
  PHASES.menopause = {
    name: 'Menopause',
    short: 'Strong for life',
    energy: 'Steady energy',
    hormones: 'With estrogen low and steady, muscle and bone need a stronger signal to stay strong. Heavy lifting, some impact work, enough protein and good sleep make the biggest difference.',
    training: 'Lift heavy three times a week, add short impact or power work, and keep balance sharp. Progress the weights steadily.',
    nutrition: 'High protein at every meal, calcium and vitamin D, plenty of fiber, and soy or flax if you enjoy them. Go easy on alcohol, which can worsen hot flashes and sleep.',
    tips: [
      'Strength training is the most effective way to protect bone density. Lift heavy enough that the last reps are hard.',
      'Aim for protein at every meal. Muscle needs more of it after menopause.',
      'Hot flashes or night sweats? Keep the bedroom cool, wear layers, and notice whether alcohol or spicy food triggers them.',
    ],
    foods: ['Greek yogurt', 'Salmon', 'Tofu', 'Leafy greens', 'Sardines', 'Lentils', 'Ground flax', 'Fortified milk'],
  };
  ROTATION.menopause = ['mp-strength', 'rest', 'mp-power', 'mp-mobility', 'mp-strength', 'rest', 'rest']; // Monday first
  MEALS.menopause = MEALS.follicular;
  MEALS.steady = MEALS.follicular;

  const CYCLE_MODES = [
    { id: 'natural', label: 'Natural cycle', desc: 'No hormonal contraception' },
    { id: 'irregular', label: 'Irregular cycle', desc: 'Length changes a lot month to month' },
    { id: 'pcos', label: 'PCOS', desc: 'Diagnosed or suspected' },
    { id: 'perimenopause', label: 'Perimenopause', desc: 'Cycles changing in your 40s' },
    { id: 'hormonal', label: 'Hormonal contraception', desc: 'Pill, implant, injection or hormonal IUD' },
    { id: 'menopause', label: 'Menopause', desc: 'Postmenopause, or 12+ months without a period' },
    { id: 'none', label: 'No period right now', desc: 'Postpartum or other' },
  ];

  const SYMPTOMS = ['Cramps', 'Bloating', 'Cravings', 'Headache', 'Tender breasts', 'Breakouts', 'Low mood', 'Poor sleep'];
  // Shown in the check-in for perimenopause and menopause.
  const MENO_SYMPTOMS = ['Hot flashes', 'Night sweats', 'Brain fog', 'Joint aches', 'Low mood', 'Poor sleep', 'Headache', 'Bloating'];

  // Grocery items per meal. Prefix: p protein, v produce, g grains and pantry, d dairy and eggs.
  const GROCERY = {
    'Warm cacao protein oats': ['g:Oats', 'g:Cacao powder', 'g:Protein powder', 'v:Bananas', 'g:Pumpkin seeds'],
    'Spinach and feta egg scramble': ['d:Eggs', 'v:Spinach', 'd:Feta', 'g:Sourdough bread'],
    'Tofu breakfast hash': ['p:Firm tofu', 'v:Sweet potatoes', 'v:Kale', 'g:Turmeric'],
    'Lentil and beef bolognese bowl': ['p:Lean ground beef', 'g:Lentils', 'g:Brown rice', 'v:Spinach', 'g:Tomato passata'],
    'Salmon and quinoa power bowl': ['p:Salmon fillets', 'g:Quinoa', 'v:Beets', 'v:Oranges'],
    'Chickpea and spinach curry': ['g:Chickpeas', 'g:Coconut milk', 'v:Spinach', 'g:Basmati rice', 'g:Curry paste'],
    'Ginger chicken bone broth soup': ['p:Chicken breast', 'g:Bone broth', 'v:Ginger', 'v:Bok choy', 'g:Rice noodles'],
    'Miso-glazed cod with greens': ['p:Cod fillets', 'g:Miso paste', 'v:Kale', 'g:Jasmine rice'],
    'Black bean and sweet potato chili': ['g:Black beans', 'v:Sweet potatoes', 'g:Chopped tomatoes', 'v:Avocados', 'v:Onions'],
    'Dark chocolate and almonds': ['g:Dark chocolate (85%)', 'g:Almonds'],
    'Greek yogurt and berries': ['d:Greek yogurt', 'v:Mixed berries'],
    'Edamame with sea salt': ['v:Edamame (frozen)'],
    'Greek yogurt protein parfait': ['d:Greek yogurt', 'g:Granola', 'v:Mixed berries', 'g:Chia seeds'],
    'Veggie egg-white omelet': ['d:Egg whites', 'v:Bell peppers', 'v:Spinach', 'v:Avocados', 'g:Wholegrain bread'],
    'Green protein smoothie': ['g:Pea protein powder', 'v:Spinach', 'v:Mango (frozen)', 'g:Oats', 'g:Ground flax'],
    'Chicken kimchi rice bowl': ['p:Chicken breast', 'v:Kimchi', 'g:Brown rice', 'v:Cucumbers', 'g:Sesame seeds'],
    'Shrimp poke bowl': ['p:Shrimp', 'g:Sushi rice', 'v:Edamame (frozen)', 'v:Mango (frozen)', 'g:Nori'],
    'Tempeh quinoa salad': ['p:Tempeh', 'g:Quinoa', 'v:Sprouts', 'v:Fresh herbs', 'g:Tahini', 'v:Lemons'],
    'Lemon herb chicken and potatoes': ['p:Chicken thighs', 'v:Baby potatoes', 'v:Green beans', 'v:Lemons'],
    'Turkey zucchini meatballs': ['p:Lean ground turkey', 'v:Zucchini', 'g:Marinara sauce', 'g:Wholewheat pasta'],
    'Tofu stir-fry with soba': ['p:Firm tofu', 'v:Broccoli', 'v:Snap peas', 'g:Soba noodles'],
    'Cottage cheese and pineapple': ['d:Cottage cheese', 'v:Pineapple'],
    'Rice cakes and turkey': ['g:Rice cakes', 'p:Turkey slices'],
    'Protein shake and banana': ['g:Protein powder', 'v:Bananas'],
    'Berry flax overnight oats': ['g:Oats', 'g:Ground flax', 'v:Mixed berries', 'd:Greek yogurt'],
    'Smoked salmon avocado toast': ['p:Smoked salmon', 'v:Avocados', 'v:Arugula', 'g:Rye bread'],
    'Tofu veggie scramble': ['p:Firm tofu', 'v:Bell peppers', 'v:Tomatoes', 'g:Black beans'],
    'Salmon and roasted broccoli bowl': ['p:Salmon fillets', 'v:Broccoli', 'g:Quinoa', 'g:Tahini'],
    'Turkey and cauliflower rice burrito bowl': ['p:Lean ground turkey', 'v:Cauliflower rice', 'g:Black beans', 'g:Salsa', 'v:Avocados'],
    'Rainbow lentil salad': ['g:Lentils', 'v:Bell peppers', 'v:Red cabbage', 'd:Feta', 'v:Fresh herbs'],
    'Grilled steak and Brussels sprouts': ['p:Sirloin steak', 'v:Brussels sprouts', 'v:Sweet potatoes'],
    'Shrimp and veggie skewers': ['p:Shrimp', 'v:Zucchini', 'v:Bell peppers', 'g:Wild rice'],
    'Chickpea cauliflower tikka': ['g:Chickpeas', 'v:Cauliflower', 'g:Tikka sauce', 'g:Basmati rice'],
    'Apple and almond butter': ['v:Apples', 'g:Almond butter'],
    'Hummus and crudites': ['g:Hummus', 'v:Carrots', 'v:Bell peppers', 'v:Cucumbers'],
    'Protein yogurt bark': ['d:Greek yogurt', 'v:Mixed berries'],
    'Sweet potato protein pancakes': ['v:Sweet potatoes', 'd:Eggs', 'g:Oats', 'g:Protein powder'],
    'Peanut butter banana oats': ['g:Oats', 'v:Bananas', 'g:Peanut butter', 'g:Protein powder'],
    'Savory tofu rice bowl': ['p:Firm tofu', 'g:Brown rice', 'v:Spinach', 'g:Sesame seeds'],
    'Turkey sweet potato bowl': ['p:Lean ground turkey', 'v:Sweet potatoes', 'v:Kale', 'g:Tahini'],
    'Salmon brown rice sushi bowl': ['p:Salmon fillets', 'g:Brown rice', 'v:Avocados', 'v:Cucumbers'],
    'Lentil and pumpkin soup': ['g:Red lentils', 'v:Pumpkin', 'g:Cumin', 'g:Seeded bread'],
    'Beef and black bean tacos': ['p:Lean ground beef', 'g:Black beans', 'v:Slaw mix', 'g:Corn tortillas'],
    'Chicken and chickpea tray bake': ['p:Chicken thighs', 'g:Chickpeas', 'v:Bell peppers', 'g:Harissa'],
    'Halloumi and roasted veggie couscous': ['d:Halloumi', 'v:Zucchini', 'v:Bell peppers', 'g:Couscous', 'g:Pumpkin seeds'],
    'Dark chocolate and pumpkin seeds': ['g:Dark chocolate (85%)', 'g:Pumpkin seeds'],
    'Banana and peanut butter': ['v:Bananas', 'g:Peanut butter'],
    'Protein hot chocolate': ['g:Cacao powder', 'g:Protein powder', 'd:Milk of choice'],
  };

  // Editorial copy for phase posters.
  const PHASE_COPY = {
    menstrual: { serif: 'Slow down. It still counts.', cap: 'Rest . Restore . Reset' },
    follicular: { serif: 'Something is building.', cap: 'Build . Push . Progress' },
    ovulation: { serif: 'This is your moment.', cap: 'Peak . Power . Perform' },
    luteal: { serif: 'Steady wins this week.', cap: 'Sustain . Steady . Strong' },
    steady: { serif: 'Consistency is the plan.', cap: 'Train . Fuel . Recover' },
    menopause: { serif: 'Stronger every year.', cap: 'Lift . Load . Balance' },
  };

  // Campaign photography slots. Drop images in public/img/ and set the paths, e.g. welcome: 'img/welcome.jpg'.
  // Until then, posters use grainy motion-blur art in the same palette.
  const IMAGERY = { welcome: null, menstrual: null, follicular: null, ovulation: null, luteal: null, steady: null, menopause: null, session: null };

  // Built-in restaurant starter menus. Values are approximate, taken from each chain's published
  // nutrition information; menus and recipes change, so the app labels them as approximate.
  // n(name, kcal, protein, carbs, fat, serving)
  const n = (name, kcal, protein, carbs, fat, serving) => ({ name, kcal, protein, carbs, fat, serving: serving || '1 item' });
  const RESTAURANTS = [
    {
      id: 'chipotle', name: 'Chipotle', cuisine: 'Mexican grill',
      build: {
        title: 'Build your own',
        sections: [
          { id: 'base', label: 'Base', type: 'one', options: [n('Bowl', 0, 0, 0, 0), n('Burrito (flour tortilla)', 320, 8, 50, 9), n('Salad (romaine)', 5, 0, 1, 0), n('3 crispy corn tacos', 210, 3, 30, 9), n('3 soft flour tacos', 240, 6, 39, 7.5)] },
          { id: 'protein', label: 'Protein', type: 'many', options: [n('Chicken', 180, 32, 0, 7), n('Steak', 150, 21, 1, 6), n('Barbacoa', 170, 24, 2, 7), n('Carnitas', 210, 23, 0, 12), n('Sofritas', 150, 8, 9, 10)] },
          { id: 'rice', label: 'Rice', type: 'many', options: [n('White rice', 210, 4, 40, 4), n('Brown rice', 210, 4, 36, 6)] },
          { id: 'beans', label: 'Beans', type: 'many', options: [n('Black beans', 130, 8, 22, 1.5), n('Pinto beans', 130, 8, 21, 1.5)] },
          { id: 'toppings', label: 'Toppings', type: 'many', options: [n('Fajita veggies', 20, 1, 5, 0), n('Fresh tomato salsa', 25, 0, 4, 0), n('Roasted chili-corn salsa', 80, 3, 16, 1.5), n('Tomatillo-green chili salsa', 15, 0, 4, 0), n('Tomatillo-red chili salsa', 30, 0, 4, 0), n('Sour cream', 110, 2, 2, 9), n('Cheese', 110, 6, 1, 8), n('Queso blanco', 120, 5, 4, 9), n('Guacamole', 230, 2, 8, 22), n('Romaine lettuce', 5, 0, 1, 0)] },
        ],
      },
      items: [n('Chips', 540, 7, 73, 25, '1 bag'), n('Side of guacamole', 230, 2, 8, 22, '4 oz'), n('Side of chicken', 180, 32, 0, 7, '4 oz')],
    },
    {
      id: 'chickfila', name: 'Chick-fil-A', cuisine: 'Chicken',
      items: [n('Grilled Nuggets, 8 ct', 130, 25, 1, 3), n('Grilled Nuggets, 12 ct', 200, 38, 2, 4.5), n('Chick-fil-A Nuggets, 8 ct', 250, 27, 11, 11), n('Grilled Chicken Sandwich', 390, 28, 44, 11), n('Chick-fil-A Chicken Sandwich', 420, 29, 41, 18), n('Waffle Potato Fries, medium', 420, 5, 45, 24)],
    },
    {
      id: 'starbucks', name: 'Starbucks', cuisine: 'Coffee and breakfast',
      items: [n('Egg White & Roasted Red Pepper Egg Bites', 170, 12, 11, 8, '2 bites'), n('Bacon & Gruyere Egg Bites', 300, 19, 9, 20, '2 bites'), n('Spinach, Feta & Egg White Wrap', 290, 20, 34, 8), n('Caffe Latte, grande, 2% milk', 190, 13, 19, 7, 'grande'), n('Iced Brown Sugar Oatmilk Shaken Espresso, grande', 120, 1, 20, 3, 'grande')],
    },
  ];

  // ---------- 8-week programs ----------
  // Each block lists the sessions she rotates through on her training days. Loads progress through the normal
  // suggested-weight logic (double progression, lighter when menstrual or low readiness).
  const pw = (id, program, name, focus, minutes, intensity, summary, exercises) => ({ id, phase: 'program', program, name, focus, minutes, intensity, summary, exercises });
  const PF = 'Exhale as you lift or push, gently drawing the pelvic floor up. Stop if you leak, feel heaviness or pain, or see doming along your midline.';
  const PROGRAM_WORKOUTS = [
    // Postpartum return to training
    pw('pp-1a', 'postpartum', 'Reconnect A', 'Breath, pelvic floor and core', 25, 'Very low', 'Reconnect breath, pelvic floor and deep core before adding load.', [
      e('360 breathing', 2, '6 breaths', '30s', 'Breathe into your ribs and back; let the pelvic floor relax on the inhale.'),
      e('Pelvic floor holds', 2, '8 x 5s hold', '45s', 'Lift as if stopping wind and urine, hold, then fully let go.'),
      e('Pelvic floor quick lifts', 2, '10', '30s', 'Quick lift, full release, every rep.'),
      e('Heel slides', 2, '8 / side', '30s', 'Exhale and connect as the leg slides out.'),
      e('Glute bridge', 3, '10', '45s', 'Exhale and lift; squeeze the glutes at the top.'),
      e('Side-lying clam', 2, '12 / side', '30s', 'Keep the hips stacked.'),
    ]),
    pw('pp-1b', 'postpartum', 'Reconnect B', 'Posture and upper body', 25, 'Very low', 'Gentle upper body and posture work for feeding and carrying.', [
      e('360 breathing', 2, '6 breaths', '30s', 'Ribs expand in every direction.'),
      e('Pelvic floor holds', 2, '8 x 5s hold', '45s', 'Relax fully between reps.'),
      e('Wall push-up', 3, '10', '45s', 'Exhale as you push away.'),
      e('Band pull-apart', 3, '12', '30s', 'Shoulders down and back.'),
      e('Bird dog (from knees)', 2, '6 / side', '30s', 'Slow and steady.'),
      e('Sit-to-stand', 3, '8', '45s', 'Exhale as you stand.'),
    ]),
    pw('pp-2a', 'postpartum', 'Rebuild A', 'Lower body and core', 30, 'Low', 'Bodyweight strength with the breath leading every rep.', [
      e('Pelvic floor holds', 2, '10 x 8s hold', '45s', 'Build the hold before you build the load.'),
      e('Box squat', 3, '10', '60s', 'Exhale on the way up.', true),
      e('Glute bridge march', 3, '6 / side', '45s', 'Hips stay level.'),
      e('Supported split squat', 3, '8 / side', '60s', 'Hold a rail or wall for balance.'),
      e('Dead bug heel taps', 2, '6 / side', '45s', 'Low back stays heavy on the floor.'),
      e('Suitcase carry (light)', 3, '20 m / side', '45s', 'Stand tall; do not lean.'),
    ]),
    pw('pp-2b', 'postpartum', 'Rebuild B', 'Upper body and core', 30, 'Low', 'Rows, presses and anti-rotation work.', [
      e('Pelvic floor quick lifts', 2, '10', '30s', 'Full release every rep.'),
      e('Incline push-up', 3, '8', '60s', 'Bench or counter height.', true),
      e('Band row', 3, '12', '45s', 'Squeeze the shoulder blades.'),
      e('Pallof press', 3, '8 / side', '45s', 'Exhale as you press; resist the twist.'),
      e('Side plank (knees)', 2, '20s / side', '30s', 'Hips in line with shoulders.'),
    ]),
    pw('pp-3a', 'postpartum', 'Load A', 'Lower body strength', 35, 'Moderate', 'Dumbbells come back in. Keep the breath with every rep.', [
      e('Goblet squat', 3, '8-10', '75s', 'Exhale and lift the pelvic floor as you stand.', true),
      e('Dumbbell Romanian deadlift', 3, '8-10', '75s', 'Hinge with a long spine.', true),
      e('Step-up', 3, '8 / side', '60s', 'Low box first.'),
      e('Glute bridge', 3, '12', '45s', 'Add a dumbbell on the hips when easy.'),
      e('Dead bug', 2, '8 / side', '45s', 'Arms and legs move together.'),
    ]),
    pw('pp-3b', 'postpartum', 'Load B', 'Upper body strength', 35, 'Moderate', 'Rows and presses for carrying a growing baby.', [
      e('One-arm dumbbell row', 3, '8-10 / side', '60s', 'Brace on a bench.', true),
      e('Dumbbell floor press', 3, '8-10', '75s', 'Exhale as you press.', true),
      e('Half-kneeling Pallof press', 3, '8 / side', '45s', 'Tall through the crown of the head.'),
      e('Farmer carry', 3, '30 m', '60s', 'Moderate weight, tall posture.'),
      e('Side plank (knees)', 2, '30s / side', '30s', 'Progress to feet when it feels solid.'),
    ]),
    pw('pp-4a', 'postpartum', 'Strengthen A', 'Lower body strength', 40, 'Moderate', 'Heavier lower body on the way back to full lifting.', [
      e('Goblet squat', 4, '8', '90s', 'A little heavier than last block.', true),
      e('Hip thrust', 3, '10', '75s', 'Exhale at the top.', true),
      e('Kettlebell deadlift', 3, '10', '75s', 'Exhale and lift the pelvic floor as you stand.'),
      e('Reverse lunge', 3, '8 / side', '60s', 'Controlled, no rush.'),
      e('Calf raise', 3, '15', '45s', 'Full range.'),
    ]),
    pw('pp-4b', 'postpartum', 'Strengthen B', 'Full body strength', 40, 'Moderate', 'Full body strength with loaded carries.', [
      e('Dumbbell Romanian deadlift', 4, '8', '90s', 'Heavier than last block.', true),
      e('One-arm dumbbell row', 3, '10 / side', '60s', 'Pause at the top.', true),
      e('Half-kneeling dumbbell press', 3, '8 / side', '60s', 'Ribs stay down.'),
      e('Single-leg glute bridge', 3, '8 / side', '45s', 'Hips level.'),
      e('Suitcase carry', 3, '30 m / side', '60s', 'Heavier than before.'),
      e('Plank', 2, '30s', '45s', 'Only if there is no doming; otherwise stay on your knees.'),
    ]),
    pw('pp-daily', 'postpartum', 'Daily reset', 'Pelvic floor', 10, 'Very low', 'A few minutes of pelvic floor work on your off days.', [
      e('Pelvic floor holds', 1, '10 x 5-10s hold', '-', 'Lying, sitting or standing.'),
      e('Pelvic floor quick lifts', 1, '10', '-', 'Full release every rep.'),
      e('Glute bridge', 2, '10', '30s', 'Exhale and lift; squeeze the glutes at the top.'),
    ]),

    // Glute Build
    pw('gb-1a', 'glutes', 'Glute Build: Thrust day', 'Glutes, hamstrings', 50, 'Moderate', 'Volume block: lots of quality reps close to failure.', [
      e('Barbell hip thrust', 4, '10-12', '90s', 'Chin tucked, ribs down, 1-second squeeze.', true),
      e('Romanian deadlift', 3, '10', '90s', 'Push the hips back; feel the hamstrings.', true),
      e('Cable kickback', 3, '12-15 / side', '45s', 'Small lean forward, kick back and out.'),
      e('Seated hip abduction', 3, '15-20', '45s', 'Lean forward slightly for more glute.'),
      e('Back extension (glute bias)', 2, '15', '60s', 'Round the upper back and squeeze.'),
    ]),
    pw('gb-1b', 'glutes', 'Glute Build: Squat day', 'Quads and glutes', 50, 'Moderate', 'Single-leg work and deep knee bends for the whole glute.', [
      e('Bulgarian split squat', 3, '10 / side', '90s', 'Slight forward lean for glutes.', true),
      e('Goblet squat', 3, '12', '75s', 'Sit deep, knees out.', true),
      e('Single-leg hip thrust', 3, '10 / side', '60s', 'Drive through the heel.'),
      e('Cable pull-through', 3, '15', '60s', 'Snap the hips through.'),
      e('Banded lateral walk', 2, '12 / side', '45s', 'Stay low.'),
    ]),
    pw('gb-1c', 'glutes', 'Glute Build: Full body', 'Full body', 45, 'Moderate', 'Upper body to stay balanced, plus a glute finisher.', [
      e('Lat pulldown', 3, '10', '75s', 'Elbows to your back pockets.', true),
      e('Dumbbell bench press', 3, '10', '75s', 'Control the lowering.', true),
      e('Seated cable row', 3, '12', '60s', 'Squeeze and pause.'),
      e('45-degree hip extension', 3, '15', '60s', 'Toes turned out.'),
      e('Frog pump', 2, '25', '45s', 'Fast reps, hard squeeze.'),
    ]),
    pw('gb-2a', 'glutes', 'Glute Build: Heavy thrust', 'Glutes, hamstrings', 55, 'High', 'Strength block: heavier loads, fewer reps.', [
      e('Barbell hip thrust', 4, '6-8', '2-3 min', 'Heavier. Pause 1 second at the top.', true),
      e('Romanian deadlift', 4, '6-8', '2 min', 'Heavier, same clean hinge.', true),
      e('B-stance hip thrust', 3, '10 / side', '60s', 'Front leg does the work.'),
      e('Cable kickback', 3, '12 / side', '45s', 'Slow on the way back.'),
      e('Seated hip abduction', 3, '20', '45s', 'Pause at the top.'),
    ]),
    pw('gb-2b', 'glutes', 'Glute Build: Heavy legs', 'Quads and glutes', 55, 'High', 'Heavy single-leg work and a deep squat pattern.', [
      e('Bulgarian split squat', 4, '8 / side', '2 min', 'Dumbbells heavier than block one.', true),
      e('Hack squat', 3, '8-10', '2 min', 'Feet high and wide for glutes.', true),
      e('Walking lunge', 3, '10 / side', '75s', 'Long steps.'),
      e('Single-leg Romanian deadlift', 3, '8 / side', '60s', 'Hips square.'),
      e('Banded glute bridge', 2, '25', '45s', 'Knees out against the band.'),
    ]),
    pw('gb-3a', 'glutes', 'Glute Build: Peak thrust', 'Glutes', 55, 'High', 'Peak block. In week 8, work up to a heavy set of 8 on the hip thrust and compare with week 1.', [
      e('Barbell hip thrust', 5, '5-6', '3 min', 'Your heaviest block. Week 8: work up to a best set of 8.', true),
      e('Deficit Romanian deadlift', 3, '8', '2 min', 'Stand on a small plate for more range.', true),
      e('Single-leg hip thrust', 3, '12 / side', '60s', 'Burnout set to finish.'),
      e('Cable kickback', 3, '15 / side', '45s', 'Hold the squeeze.'),
      e('Seated hip abduction', 3, '20 + 10 partials', '45s', 'Finish with partials.'),
    ]),

    // First pull-up
    pw('pu-1a', 'pullup', 'Pull-Up: Hang and pull', 'Grip, back and core', 40, 'Moderate', 'Build grip, shoulder control and pulling strength.', [
      e('Dead hang', 3, '20-30s', '60s', 'Active shoulders: pull them down away from the ears.'),
      e('Scapular pull-up', 3, '8', '60s', 'Arms straight; lift the body by pulling the shoulders down.'),
      e('Inverted row (high bar)', 3, '8-10', '75s', 'Body straight as a plank.', true),
      e('Lat pulldown', 3, '10', '75s', 'Pull to the top of the chest.', true),
      e('Hollow body hold', 3, '20s', '45s', 'Low back pressed down.'),
    ]),
    pw('pu-1b', 'pullup', 'Pull-Up: Strength', 'Back, biceps and legs', 45, 'Moderate', 'Pulling strength plus legs to stay balanced.', [
      e('Flexed-arm hang', 3, '10s', '75s', 'Jump to the top, chin over the bar, hold.'),
      e('One-arm dumbbell row', 3, '10 / side', '60s', 'Heavy and strict.', true),
      e('Goblet squat', 3, '10', '75s', 'Keep legs in the plan.', true),
      e('Dumbbell curl', 3, '10', '45s', 'No swinging.'),
      e('Dead hang', 2, 'max', '60s', 'Note your time and beat it.'),
    ]),
    pw('pu-2a', 'pullup', 'Pull-Up: Negatives', 'Eccentric strength', 45, 'High', 'Lowering slowly builds strength fastest at this stage.', [
      e('Negative pull-up', 4, '3 x 5s lower', '2 min', 'Jump or step to the top and lower as slowly as you can.', true),
      e('Band-assisted pull-up', 3, '5', '2 min', 'Heavy band, full range.', true),
      e('Inverted row (lower bar)', 3, '8', '75s', 'Lower the bar from last block.'),
      e('Flexed-arm hang', 3, '15s', '75s', 'Chin over the bar.'),
      e('Hollow body hold', 3, '25s', '45s', 'Arms overhead if you can.'),
    ]),
    pw('pu-2b', 'pullup', 'Pull-Up: Pulldown and legs', 'Back and legs', 45, 'Moderate', 'Heavier pulldowns and lower body.', [
      e('Lat pulldown', 4, '6-8', '2 min', 'Heavier than block one.', true),
      e('Romanian deadlift', 3, '8', '2 min', 'Hinge, do not squat.', true),
      e('Chest-supported row', 3, '10', '75s', 'Pause at the top.'),
      e('Hammer curl', 3, '10', '45s', 'Slow lowering.'),
      e('Dead hang', 2, 'max', '60s', 'Beat last week.'),
    ]),
    pw('pu-3a', 'pullup', 'Pull-Up: Singles', 'Pull-up attempts', 45, 'High', 'Fresh, high-quality attempts. Week 8: test your first strict pull-up.', [
      e('Pull-up attempt', 5, '1', '2-3 min', 'Dead hang start, chin over the bar. Use the lightest band you can if needed.', true),
      e('Negative pull-up', 3, '2 x 8s lower', '2 min', 'Slower than last block.', true),
      e('Inverted row (feet elevated)', 3, '6-8', '90s', 'Hardest row variation.'),
      e('Flexed-arm hang', 2, '20s', '75s', 'Chin over the bar.'),
      e('Hollow body rock', 3, '10', '45s', 'Stay tight.'),
    ]),

    // Strong through menopause
    pw('sm-1a', 'menopause', 'Strong: Foundation A', 'Squat, push and balance', 45, 'Moderate', 'Learn the patterns with good form before going heavy.', [
      e('Goblet squat', 3, '8-10', '90s', 'Sit between your heels.', true),
      e('Dumbbell bench press', 3, '8-10', '90s', 'Control the lowering.', true),
      e('Step-up', 3, '8 / side', '60s', 'Drive through the whole foot.'),
      e('Single-leg balance', 2, '30s / side', '30s', 'Near a wall for safety.'),
      e('Farmer carry', 3, '30 m', '60s', 'Tall and steady.'),
    ]),
    pw('sm-1b', 'menopause', 'Strong: Foundation B', 'Hinge, pull and posture', 45, 'Moderate', 'Hinge and pull for a strong back and hips.', [
      e('Dumbbell Romanian deadlift', 3, '8-10', '90s', 'Long spine, hips back.', true),
      e('One-arm dumbbell row', 3, '10 / side', '60s', 'Brace on a bench.', true),
      e('Glute bridge', 3, '12', '45s', 'Pause at the top.'),
      e('Back extension', 2, '12', '60s', 'Strong upper back helps posture.'),
      e('Heel drops', 2, '10', '45s', 'Rise onto toes and drop onto heels: gentle impact for bone.'),
    ]),
    pw('sm-2a', 'menopause', 'Strong: Build A', 'Heavy lower and impact', 50, 'High', 'Heavier sets of 5 plus jump prep. Bone responds to heavy, brief loading.', [
      e('Trap bar deadlift', 4, '5', '2-3 min', 'Heavy but smooth. Stop with a rep in reserve.', true),
      e('Goblet squat', 3, '6-8', '2 min', 'Heavier than block one.', true),
      e('Pogo hops', 3, '10', '60s', 'Small, springy hops. Skip if your pelvic floor or joints complain.'),
      e('Reverse lunge', 3, '8 / side', '75s', 'Controlled.'),
      e('Suitcase carry', 3, '30 m / side', '60s', 'Heavy enough to challenge your grip.'),
    ]),
    pw('sm-2b', 'menopause', 'Strong: Build B', 'Heavy upper and posture', 50, 'High', 'Pressing and pulling heavy for upper body and spine.', [
      e('Overhead press', 4, '5-6', '2 min', 'Ribs down, glutes tight.', true),
      e('Lat pulldown', 4, '6-8', '2 min', 'Pull to the chest.', true),
      e('Hip thrust', 3, '8', '90s', 'Pause at the top.'),
      e('Back extension', 3, '10', '60s', 'Hold a plate when it gets easy.'),
      e('Single-leg balance (eyes closed)', 2, '20s / side', '30s', 'Near a wall.'),
    ]),
    pw('sm-3a', 'menopause', 'Strong: Peak A', 'Heavy lower and power', 55, 'High', 'Your strongest block: heavier triples and fives, plus low jumps.', [
      e('Trap bar deadlift', 5, '3-5', '3 min', 'Heaviest block. Week 8: a best set of 5.', true),
      e('Front-loaded squat', 4, '5', '2-3 min', 'Goblet or front squat.', true),
      e('Low box jump', 3, '5', '90s', 'Step down, do not jump down.'),
      e('Walking lunge', 3, '10 / side', '75s', 'Long stride.'),
      e('Farmer carry', 3, '40 m', '75s', 'Heaviest yet.'),
    ]),
    pw('sm-3b', 'menopause', 'Strong: Peak B', 'Heavy upper and balance', 55, 'High', 'Heavy pressing and pulling with balance work.', [
      e('Overhead press', 5, '3-5', '2-3 min', 'Strict press.', true),
      e('Chest-supported row', 4, '6', '2 min', 'Heavy and paused.', true),
      e('Dumbbell bench press', 3, '8', '90s', 'Controlled.'),
      e('Step-down', 3, '8 / side', '60s', 'Slow lowering for knee and balance control.'),
      e('Heel drops', 3, '10', '45s', 'Rise onto toes and drop onto heels: gentle impact for bone. Hold dumbbells when easy.'),
    ]),

    // Beginner foundations: gym machines and dumbbells, one movement pattern at a time
    pw('bf-1a', 'beginner', 'Foundations: Full body A', 'Squat, push and pull', 40, 'Low-moderate', 'Learn the basic patterns with light weights. Every rep should feel controlled.', [
      e('Goblet squat', 3, '10', '90s', 'Hold a dumbbell at your chest and sit between your heels.', true),
      e('Machine chest press', 3, '10', '90s', 'Handles at mid-chest. Press, then lower for 2 seconds.', true),
      e('Lat pulldown', 3, '10', '75s', 'Pull to the top of your chest, elbows to your sides.'),
      e('Glute bridge', 2, '12', '60s', 'Squeeze for 2 seconds at the top.'),
      e('Dead bug', 2, '6 / side', '45s', 'Low back stays heavy on the floor.'),
    ]),
    pw('bf-1b', 'beginner', 'Foundations: Full body B', 'Hinge, press and row', 40, 'Low-moderate', 'Learn the hip hinge and build a strong back.', [
      e('Dumbbell Romanian deadlift', 3, '10', '90s', 'Soft knees, push your hips back, dumbbells close to your legs.', true),
      e('Seated cable row', 3, '10', '75s', 'Sit tall and pull elbows to your back pockets.', true),
      e('Leg press', 3, '12', '90s', 'Feet hip-width. Lower until knees reach about 90 degrees.'),
      e('Seated dumbbell shoulder press', 2, '10', '75s', 'Ribs down, press straight up.'),
      e('Forearm plank', 2, '20s', '45s', 'Ribs down, glutes on.'),
    ]),
    pw('bf-2a', 'beginner', 'Foundations: Build A', 'Lower body and push', 45, 'Moderate', 'Same patterns, a little heavier. Add weight when every set reaches the top of the range.', [
      e('Goblet squat', 3, '8-12', '90s', 'Heavier than weeks 1-2.', true),
      e('Dumbbell bench press', 3, '8-12', '90s', 'Shoulder blades pinned back.', true),
      e('Reverse lunge', 2, '8 / leg', '75s', 'Step back long, hold a wall if needed.'),
      e('Lat pulldown', 3, '10-12', '75s', 'Control the way up.'),
      e('Hip thrust', 3, '10-12', '75s', 'Bench behind your shoulders, chin tucked.'),
    ]),
    pw('bf-2b', 'beginner', 'Foundations: Build B', 'Hinge and pull', 45, 'Moderate', 'Build the hinge and your back. Most beginners can add weight every week now.', [
      e('Dumbbell Romanian deadlift', 3, '8-12', '90s', 'Heavier, same clean hinge.', true),
      e('One-arm dumbbell row', 3, '10 / side', '75s', 'Brace on a bench and pull to your hip.', true),
      e('Leg press', 3, '10-12', '90s', 'Feet high for more glutes.'),
      e('Lying leg curl', 2, '12', '60s', 'Slow 3-second lowering.'),
      e('Pallof press', 2, '10 / side', '45s', 'Resist the twist and breathe out as you press.'),
    ]),
    pw('bf-3a', 'beginner', 'Foundations: Progress A', 'Full body strength', 50, 'Moderate', 'Your strongest weeks. In week 8, compare your goblet squat with week 1.', [
      e('Goblet squat', 4, '8-10', '2 min', 'Week 8: a best set of 10.', true),
      e('Dumbbell bench press', 3, '8-10', '90s', 'Control the lowering.', true),
      e('Bulgarian split squat', 2, '8 / leg', '75s', 'Back foot on a bench, lean slightly forward.'),
      e('Lat pulldown', 3, '8-10', '90s', 'Heavier than block two.'),
      e('Hip thrust', 3, '10', '75s', 'Pause at the top.'),
    ]),
    pw('bf-3b', 'beginner', 'Foundations: Progress B', 'Full body strength', 50, 'Moderate', 'Heavier hinge and rows. Ready for any YOURS program after this.', [
      e('Dumbbell Romanian deadlift', 4, '8-10', '2 min', 'Week 8: compare with week 1.', true),
      e('Seated cable row', 3, '8-10', '90s', 'Pause with elbows behind you.', true),
      e('Leg press', 3, '10', '90s', 'Heavier than block two.'),
      e('Seated dumbbell shoulder press', 3, '8-10', '75s', 'Ribs down.'),
      e('Farmer carry', 3, '30 m', '60s', 'Heavy, tall and slow.'),
    ]),

    // Home strength: dumbbells and a resistance band (a chair or bench helps)
    pw('hs-1a', 'home', 'Home: Lower body', 'Legs and glutes', 35, 'Moderate', 'Dumbbells only. Pick a weight that makes the last 2 reps hard.', [
      e('Goblet squat', 3, '10-12', '75s', 'Sit between your heels, chest proud.', true),
      e('Dumbbell Romanian deadlift', 3, '10-12', '75s', 'Hips back, dumbbells close to your legs.', true),
      e('Reverse lunge', 3, '8 / leg', '60s', 'Hold dumbbells at your sides.'),
      e('Dumbbell glute bridge', 3, '12-15', '60s', 'Dumbbell on your hips, 2-second squeeze.'),
      e('Banded lateral walk', 2, '12 / side', '45s', 'Band above your knees, stay low.'),
    ]),
    pw('hs-1b', 'home', 'Home: Upper body', 'Back, chest and arms', 35, 'Moderate', 'Rows and presses with dumbbells and a band.', [
      e('One-arm dumbbell row', 3, '10-12 / side', '60s', 'Brace a hand on a chair or bench.', true),
      e('Dumbbell floor press', 3, '10-12', '75s', 'Elbows touch the floor, then press.', true),
      e('Band pull-apart', 3, '15', '45s', 'Shoulders down and back.'),
      e('Seated dumbbell shoulder press', 3, '10', '60s', 'On a chair, ribs down.'),
      e('Dumbbell curl', 2, '12', '45s', 'No swinging.'),
      e('Push-up', 2, '6-10', '60s', 'From your knees or a counter if needed.'),
    ]),
    pw('hs-2a', 'home', 'Home: Legs build', 'Legs and glutes', 40, 'Moderate', 'Single-leg work makes light dumbbells feel heavy.', [
      e('Bulgarian split squat', 3, '8-10 / leg', '75s', 'Back foot on a chair or sofa.', true),
      e('Single-leg Romanian deadlift', 3, '8 / leg', '60s', 'Hold a wall if needed. Hips square.', true),
      e('Goblet squat', 3, '12', '60s', '3 seconds down, 1 second pause at the bottom.'),
      e('Single-leg hip thrust', 3, '10 / leg', '60s', 'Shoulders on the sofa or a bench.'),
      e('Calf raise', 3, '15', '45s', 'On a step, full stretch at the bottom.'),
    ]),
    pw('hs-2b', 'home', 'Home: Upper build', 'Back, chest and shoulders', 40, 'Moderate', 'More volume and slower lowering for strength at home.', [
      e('One-arm dumbbell row', 4, '10 / side', '60s', '2-second pause at the top.', true),
      e('Dumbbell floor press', 4, '10', '75s', '3 seconds down.', true),
      e('Dumbbell lateral raise', 3, '12-15', '45s', 'Lead with your elbows.'),
      e('Band face pull', 3, '15', '45s', 'Band anchored in a door at eye level.'),
      e('Push-up', 3, '6-10', '60s', 'Progress from counter to knees to floor.'),
    ]),
    pw('hs-2c', 'home', 'Home: Full body', 'Full body', 40, 'Moderate', 'Big movements with a little more pace.', [
      e('Dumbbell thruster', 3, '10', '75s', 'Squat, then drive the dumbbells overhead.', true),
      e('Dumbbell Romanian deadlift', 3, '10', '75s', 'Same weight or heavier than last week.', true),
      e('Renegade row', 3, '6 / side', '60s', 'From your knees to start. Hips stay still.'),
      e('Step-up', 3, '8 / leg', '60s', 'On a sturdy chair or stair.'),
      e('Dead bug', 3, '8 / side', '45s', 'Press your low back down.'),
    ]),
    pw('hs-3a', 'home', 'Home: Legs peak', 'Legs and glutes', 45, 'High', 'Hardest leg session. In week 8, compare your split squat with week 3.', [
      e('Bulgarian split squat', 4, '8 / leg', '90s', 'Heaviest dumbbells you can control.', true),
      e('Dumbbell Romanian deadlift', 4, '8-10', '90s', 'Pause just below the knee.', true),
      e('Dumbbell sumo squat', 3, '12', '60s', 'Wide stance, one heavy dumbbell.'),
      e('Single-leg hip thrust', 3, '12 / leg', '60s', 'Burnout to finish.'),
      e('Banded lateral walk', 2, '15 / side', '45s', 'Stay low the whole time.'),
    ]),
    pw('hs-3b', 'home', 'Home: Upper peak', 'Back, chest and shoulders', 45, 'High', 'Hardest upper session. Slow lowering on every rep.', [
      e('One-arm dumbbell row', 4, '8 / side', '75s', 'Heaviest dumbbell you have.', true),
      e('Dumbbell floor press', 4, '8', '90s', '1-second pause on the floor.', true),
      e('Arnold press', 3, '10', '60s', 'Rotate smoothly.'),
      e('Band face pull', 3, '15', '45s', 'Pull to eye level and rotate out.'),
      e('Push-up', 3, 'AMRAP', '60s', 'As many good reps as you can.'),
    ]),
  ];

  const PROGRAMS = [
    {
      id: 'postpartum', name: 'Postpartum return', kicker: 'After baby', perWeek: 3, offDay: 'pp-daily',
      tagline: 'Pelvic floor first, then strength, then a safe path back to full lifting.',
      who: 'From your postnatal check (usually 6 weeks or later) once a doctor or midwife has cleared you for exercise. After a C-section, wait for their go-ahead.',
      clearance: true,
      screen: ['Leaking when you cough, sneeze, laugh or lift', 'Heaviness, dragging or bulging in the vagina', 'Pelvic, back or scar pain', 'A ridge or doming along your midline when you lift your head'],
      blocks: [
        { from: 1, to: 2, title: 'Reconnect', note: 'Breath, pelvic floor and gentle strength. Daily pelvic floor work on the other days.', sessions: ['pp-1a', 'pp-1b'] },
        { from: 3, to: 4, title: 'Rebuild', note: 'Bodyweight strength and anti-rotation core.', sessions: ['pp-2a', 'pp-2b'] },
        { from: 5, to: 6, title: 'Load', note: 'Dumbbells come back. Keep exhaling on effort.', sessions: ['pp-3a', 'pp-3b'] },
        { from: 7, to: 8, title: 'Strengthen', note: 'Heavier loads to get you back to full lifting.', sessions: ['pp-4a', 'pp-4b'] },
      ],
      cue: PF,
      finish: 'If you can squat, deadlift and lunge with weights for 10 reps without leaking, heaviness or pain, you are ready for the main YOURS plan or another program. If not, a pelvic health physio can help.',
    },
    {
      id: 'glutes', name: 'Glute build', kicker: '8 weeks', perWeek: 3,
      tagline: 'Three blocks: volume, strength, then a peak. Test your hip thrust in week 1 and week 8.',
      who: 'For anyone comfortable in a gym. Needs a barbell or machine for hip thrusts.',
      blocks: [
        { from: 1, to: 3, title: 'Volume', note: 'Sets of 10-15 close to failure.', sessions: ['gb-1a', 'gb-1b', 'gb-1c'] },
        { from: 4, to: 6, title: 'Strength', note: 'Heavier sets of 6-8.', sessions: ['gb-2a', 'gb-2b', 'gb-1c'] },
        { from: 7, to: 8, title: 'Peak', note: 'Heaviest work. Week 8 is a test.', sessions: ['gb-3a', 'gb-2b', 'gb-1c'] },
      ],
      finish: 'Compare your week 8 hip thrust with week 1 in Strength by phase, and take check-in photos with the same poses and light.',
    },
    {
      id: 'pullup', name: 'First pull-up', kicker: '8 weeks', perWeek: 3,
      tagline: 'Hangs, rows and slow negatives, then singles. Test a strict pull-up in week 8.',
      who: 'For anyone who cannot yet do a strict pull-up. Needs a pull-up bar; a band and a lat pulldown help.',
      blocks: [
        { from: 1, to: 2, title: 'Hang and pull', note: 'Grip, shoulder control and rows.', sessions: ['pu-1a', 'pu-1b'] },
        { from: 3, to: 5, title: 'Negatives', note: 'Slow lowering builds the strength to pull up.', sessions: ['pu-2a', 'pu-2b'] },
        { from: 6, to: 8, title: 'Singles', note: 'Fresh, quality attempts. Week 8 is a test.', sessions: ['pu-3a', 'pu-2b'] },
      ],
      finish: 'Not there yet? Repeat weeks 6-8. Most women need 8-16 weeks, and every slow negative counts.',
    },
    {
      id: 'menopause', name: 'Strong through menopause', kicker: '8 weeks', perWeek: 3,
      tagline: 'Heavy, brief strength work plus small doses of impact for bone, muscle and balance.',
      who: 'For perimenopause, menopause and beyond. If you have osteoporosis, a past fracture or joint problems, check with your doctor and consider a coach for the heavy lifts.',
      blocks: [
        { from: 1, to: 2, title: 'Foundation', note: 'Learn the lifts and find your starting weights.', sessions: ['sm-1a', 'sm-1b'] },
        { from: 3, to: 5, title: 'Build', note: 'Heavier sets of 5 and gentle impact.', sessions: ['sm-2a', 'sm-2b'] },
        { from: 6, to: 8, title: 'Peak', note: 'Your strongest weeks, plus low jumps.', sessions: ['sm-3a', 'sm-3b'] },
      ],
      finish: 'Keep lifting heavy two to three times a week for life. Bone responds over months, so this is the start.',
    },
    {
      id: 'beginner', name: 'Beginner foundations', kicker: 'New to lifting', perWeek: 3,
      tagline: 'Learn the five basic movements, build confidence in the gym, then get stronger every week.',
      who: 'For anyone new to lifting or coming back after a long break. Uses dumbbells and common gym machines, with simple cues for every exercise.',
      blocks: [
        { from: 1, to: 2, title: 'Learn', note: 'Light weights and perfect reps. Leave 3 reps in the tank.', sessions: ['bf-1a', 'bf-1b'] },
        { from: 3, to: 5, title: 'Build', note: 'Add weight when every set hits the top of the rep range.', sessions: ['bf-2a', 'bf-2b'] },
        { from: 6, to: 8, title: 'Progress', note: 'Your strongest weeks. Week 8 is a test.', sessions: ['bf-3a', 'bf-3b'] },
      ],
      finish: 'Compare your week 8 goblet squat and Romanian deadlift with week 1. You are ready for Glute build, First pull-up or the main YOURS plan.',
    },
    {
      id: 'home', name: 'Home strength', kicker: 'Dumbbells only', perWeek: 3,
      tagline: 'Real strength training at home with a pair of dumbbells and a resistance band.',
      who: 'For training at home. You need dumbbells (adjustable ones are ideal) and a resistance band. A sturdy chair or bench helps.',
      blocks: [
        { from: 1, to: 2, title: 'Base', note: 'Learn the moves and find your dumbbell weights.', sessions: ['hs-1a', 'hs-1b'] },
        { from: 3, to: 5, title: 'Build', note: 'Single-leg work and slower lowering make light weights work hard.', sessions: ['hs-2a', 'hs-2b', 'hs-2c'] },
        { from: 6, to: 8, title: 'Push', note: 'Your hardest weeks. Week 8 is a test.', sessions: ['hs-3a', 'hs-3b', 'hs-2c'] },
      ],
      finish: 'Compare your week 8 split squat and row with week 3. When your dumbbells feel light for 15 reps, go heavier or try a gym program.',
    },
  ];

  // Member quotes for the landing page. Only add real quotes from real members, with their permission,
  // e.g. { quote: 'I finally stopped fighting my body on period week.', name: 'Jess', detail: 'Member since 2026' }.
  // The section stays hidden while this list is empty.
  const TESTIMONIALS = [];

  // Swap groups: exercises in a group train the same movement and muscles, so any one can stand in for another
  // ("machine taken? swap it"). An exercise can sit in more than one group.
  const SWAPS = [
    { id: 'squat', label: 'Squat', names: ['Back squat', 'Goblet squat', 'Front-loaded squat', 'Leg press', 'Hack squat', 'Dumbbell sumo squat', 'Box squat', 'Goblet squat (light)'] },
    { id: 'hinge', label: 'Hip hinge', names: ['Romanian deadlift', 'Dumbbell Romanian deadlift', 'Trap bar deadlift', 'Sumo deadlift', 'Kettlebell deadlift', 'Deficit Romanian deadlift', 'Cable pull-through', '45-degree back extension', 'Back extension', 'Light dumbbell Romanian deadlift'] },
    { id: 'thrust', label: 'Glute bridge', names: ['Barbell hip thrust', 'Hip thrust', 'Dumbbell hip thrust', 'B-stance hip thrust', 'Single-leg hip thrust', 'Dumbbell glute bridge', 'Glute bridge', 'Banded glute bridge', 'Single-leg glute bridge', 'Glute bridge march'] },
    { id: 'single-leg', label: 'Single leg', names: ['Bulgarian split squat', 'Reverse lunge', 'Walking lunge', 'Step-up', 'Step-up (low box)', 'Supported split squat', 'Single-leg Romanian deadlift'] },
    { id: 'leg-curl', label: 'Hamstrings', names: ['Lying leg curl', 'Seated leg curl', 'Stability ball leg curl', 'Single-leg Romanian deadlift'] },
    { id: 'glute-iso', label: 'Glute isolation', names: ['Cable kickback', 'Seated hip abduction', 'Hip abduction', 'Banded lateral walk', 'Frog pump', '45-degree back extension', 'Back extension (glute bias)', '45-degree hip extension'] },
    { id: 'v-pull', label: 'Vertical pull', names: ['Lat pulldown', 'Pull-up or assisted pull-up', 'Band-assisted pull-up', 'Band lat pulldown', 'Straight-arm cable pulldown'] },
    { id: 'h-pull', label: 'Row', names: ['Seated cable row', 'Chest-supported row', 'One-arm dumbbell row', 'Inverted row (high bar)', 'Band row', 'Renegade row'] },
    { id: 'h-press', label: 'Chest press', names: ['Dumbbell bench press', 'Incline dumbbell press', 'Machine chest press', 'Dumbbell floor press', 'Push-up', 'Incline push-up'] },
    { id: 'v-press', label: 'Overhead press', names: ['Seated dumbbell shoulder press', 'Overhead press', 'Arnold press', 'Push press', 'Dumbbell push press', 'Half-kneeling dumbbell press', 'Machine shoulder press'] },
    { id: 'lateral', label: 'Side delts', names: ['Cable lateral raise', 'Dumbbell lateral raise', 'Band lateral raise'] },
    { id: 'rear-delt', label: 'Rear delts', names: ['Face pull', 'Band face pull', 'Band pull-apart', 'Reverse dumbbell fly'] },
    { id: 'fly', label: 'Chest fly', names: ['Cable fly', 'Dumbbell fly', 'Machine pec deck'] },
    { id: 'biceps', label: 'Biceps', names: ['Dumbbell curl', 'Hammer curl', 'Cable curl', 'Band curl'] },
    { id: 'triceps', label: 'Triceps', names: ['Triceps rope pushdown', 'Overhead dumbbell triceps extension', 'Band triceps pushdown', 'Bench dip'] },
    { id: 'calves', label: 'Calves', names: ['Standing calf raise', 'Calf raise', 'Seated calf raise'] },
    { id: 'core', label: 'Core', names: ['Pallof press', 'Half-kneeling Pallof press', 'Dead bug', 'Forearm plank', 'Side plank', 'Side plank (knees)', 'Plank', 'Bird dog', 'Hollow body hold'] },
    { id: 'carry', label: 'Carry', names: ['Farmer carry', 'Suitcase carry', 'Suitcase carry (light)'] },
    { id: 'power', label: 'Power', names: ['Kettlebell swing', 'Box jump', 'Low box jump', 'Medicine ball slam', 'Dumbbell thruster'] },
  ];

  // Everyday foods for talk-to-log when the AI coach is off. Values per unit, approximate (USDA averages).
  // b(id, aliases, unit label, grams per unit, kcal, protein, carbs, fat)
  const b = (id, names, unit, grams, kcal, protein, carbs, fat) => ({ id, names, unit, grams, kcal, protein, carbs, fat });
  const BASIC_FOODS = [
    b('egg', ['egg', 'eggs', 'boiled egg', 'boiled eggs', 'fried egg', 'fried eggs', 'scrambled egg', 'scrambled eggs'], '1 large egg', 50, 72, 6.3, 0.4, 4.8),
    b('egg-white', ['egg white', 'egg whites'], '1 egg white', 33, 17, 3.6, 0.2, 0.1),
    b('toast', ['toast', 'slice of toast', 'slices of toast', 'bread', 'slice of bread', 'slices of bread'], '1 slice', 32, 80, 3, 14, 1),
    b('sourdough', ['sourdough', 'sourdough toast'], '1 slice', 50, 130, 5, 25, 1),
    b('bagel', ['bagel', 'bagels'], '1 bagel', 105, 280, 11, 55, 1.7),
    b('english-muffin', ['english muffin', 'english muffins'], '1 muffin', 57, 130, 5, 25, 1),
    b('tortilla', ['tortilla', 'tortillas', 'wrap', 'wraps'], '1 tortilla (8 in)', 49, 140, 4, 24, 3.5),
    b('oats', ['oats', 'oatmeal', 'porridge', 'overnight oats'], '1/2 cup dry', 40, 150, 5, 27, 3),
    b('granola', ['granola'], '1/2 cup', 60, 270, 6, 38, 11),
    b('cereal', ['cereal'], '1 cup', 30, 115, 2.5, 25, 1),
    b('greek-yogurt', ['greek yogurt', 'greek yoghurt', 'yogurt', 'yoghurt'], '1 cup (170 g)', 170, 100, 17, 6, 0.7),
    b('cottage-cheese', ['cottage cheese'], '1/2 cup', 113, 90, 12, 5, 2.5),
    b('milk', ['milk', 'glass of milk'], '1 cup', 244, 122, 8, 12, 4.8),
    b('oat-milk', ['oat milk', 'oatmilk'], '1 cup', 240, 120, 3, 16, 5),
    b('almond-milk', ['almond milk'], '1 cup', 240, 40, 1, 2, 3),
    b('cheese', ['cheese', 'slice of cheese', 'cheddar'], '1 slice (1 oz)', 28, 113, 7, 0.4, 9.3),
    b('butter', ['butter'], '1 tbsp', 14, 102, 0.1, 0, 11.5),
    b('olive-oil', ['olive oil', 'oil'], '1 tbsp', 14, 119, 0, 0, 13.5),
    b('peanut-butter', ['peanut butter', 'pb', 'almond butter'], '1 tbsp', 16, 95, 3.5, 3.5, 8),
    b('avocado', ['avocado', 'avocados', 'avo'], '1/2 avocado', 68, 114, 1.3, 6, 10.5),
    b('banana', ['banana', 'bananas'], '1 medium', 118, 105, 1.3, 27, 0.4),
    b('apple', ['apple', 'apples'], '1 medium', 182, 95, 0.5, 25, 0.3),
    b('orange', ['orange', 'oranges'], '1 medium', 131, 62, 1.2, 15, 0.2),
    b('berries', ['berries', 'blueberries', 'strawberries', 'raspberries'], '1 cup', 148, 70, 1, 17, 0.5),
    b('chicken', ['chicken', 'chicken breast', 'grilled chicken'], '4 oz cooked', 113, 187, 35, 0, 4),
    b('turkey', ['ground turkey', 'turkey'], '4 oz cooked', 113, 230, 31, 0, 11),
    b('beef', ['ground beef', 'beef', 'steak'], '4 oz cooked', 113, 280, 30, 0, 17),
    b('salmon', ['salmon'], '4 oz cooked', 113, 233, 25, 0, 14),
    b('tuna', ['tuna', 'can of tuna'], '1 can (5 oz)', 142, 120, 27, 0, 1),
    b('shrimp', ['shrimp', 'prawns'], '4 oz cooked', 113, 112, 27, 0, 1),
    b('tofu', ['tofu'], '1/2 block (7 oz)', 200, 180, 20, 4, 10),
    b('bacon', ['bacon', 'slice of bacon', 'slices of bacon', 'strips of bacon'], '1 slice', 8, 43, 3, 0.1, 3.3),
    b('rice', ['rice', 'white rice', 'brown rice'], '1 cup cooked', 158, 205, 4.3, 45, 0.4),
    b('quinoa', ['quinoa'], '1 cup cooked', 185, 222, 8, 39, 3.6),
    b('pasta', ['pasta', 'spaghetti', 'noodles'], '1 cup cooked', 140, 220, 8, 43, 1.3),
    b('potato', ['potato', 'potatoes', 'baked potato'], '1 medium', 173, 160, 4.3, 37, 0.2),
    b('sweet-potato', ['sweet potato', 'sweet potatoes'], '1 medium', 130, 112, 2, 26, 0.1),
    b('broccoli', ['broccoli'], '1 cup', 91, 31, 2.5, 6, 0.3),
    b('salad', ['salad', 'side salad', 'greens', 'spinach'], '2 cups', 60, 15, 1.5, 2.5, 0.2),
    b('protein-shake', ['protein shake', 'protein shakes', 'shake', 'scoop of protein', 'scoops of protein', 'protein powder', 'whey', 'protein'], '1 scoop', 32, 120, 24, 3, 1.5),
    b('protein-bar', ['protein bar', 'protein bars'], '1 bar', 60, 200, 20, 22, 7),
    b('almonds', ['almonds', 'nuts', 'handful of almonds', 'handful of nuts'], '1 oz (23 almonds)', 28, 164, 6, 6, 14),
    b('hummus', ['hummus'], '2 tbsp', 30, 70, 2, 4, 5),
    b('honey', ['honey'], '1 tbsp', 21, 64, 0, 17, 0),
    b('coffee', ['coffee', 'black coffee', 'espresso', 'americano'], '1 cup', 240, 2, 0.3, 0, 0),
    b('latte', ['latte', 'cappuccino', 'flat white'], '1 grande (2% milk)', 470, 190, 13, 19, 7),
    b('dark-chocolate', ['dark chocolate', 'chocolate'], '1 oz', 28, 170, 2, 13, 12),
    b('rice-cake', ['rice cake', 'rice cakes'], '1 cake', 9, 35, 0.7, 7.3, 0.3),
  ];

  // Grocery stores: each link opens that store's own product search for an item.
  const STORES = [
    { id: 'walmart', name: 'Walmart', search: 'https://www.walmart.com/search?q=' },
    { id: 'target', name: 'Target', search: 'https://www.target.com/s?searchTerm=' },
    { id: 'kroger', name: 'Kroger', search: 'https://www.kroger.com/search?query=' },
    { id: 'wholefoods', name: 'Whole Foods', search: 'https://www.wholefoodsmarket.com/search?text=' },
    { id: 'traderjoes', name: "Trader Joe's", search: 'https://www.traderjoes.com/home/search?section=products&q=' },
    { id: 'costco', name: 'Costco', search: 'https://www.costco.com/CatalogSearch?keyword=' },
    { id: 'instacart', name: 'Instacart', search: 'https://www.instacart.com/store/s?k=' },
    { id: 'amazonfresh', name: 'Amazon Fresh', search: 'https://www.amazon.com/s?i=amazonfresh&k=' },
  ];

  WORKOUTS.push(...PROGRAM_WORKOUTS);

  const api = { TESTIMONIALS, SWAPS, PROGRAMS, BASIC_FOODS, RESTAURANTS, STORES, PHASE_COPY, IMAGERY, PHASES, PHASE_ORDER, WORKOUTS, ROTATION, MEALS, FAVORITE_OPTIONS, AVOID_OPTIONS, MEMBERS, SEED_POSTS, AUTO_REPLIES, CYCLE_MODES, SYMPTOMS, MENO_SYMPTOMS, GROCERY };
  if (typeof window !== 'undefined') window.YOURS_DATA = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
