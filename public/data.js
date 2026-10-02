// YOURS content library: cycle phases, preloaded workouts, meals and community seed data.
(function () {
  const PHASES = {
    menstrual: {
      name: 'Menstrual',
      short: 'Rest and restore',
      energy: 'Lower energy',
      hormones: 'Estrogen and progesterone are at their lowest. Inflammation and fatigue can run higher.',
      training: 'Keep intensity low to moderate. Mobility, walking and lighter full-body work keep momentum without draining recovery.',
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
      training: 'Moderate loads, higher reps and steady cardio. Focus on technique and consistency rather than PRs.',
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
      summary: 'Gentle movement to ease cramps, open the hips and keep you consistent.',
      exercises: [
        e('Cat-cow', 2, '10', '30s', 'Move slowly with your breath.'),
        e('90/90 hip switches', 2, '8 / side', '30s', 'Sit tall and rotate from the hips.'),
        e('Glute bridge', 3, '12', '45s', 'Squeeze for 2 seconds at the top.'),
        e('Bird dog', 3, '8 / side', '30s', 'Keep hips square and core braced.'),
        e('Dead bug', 3, '8 / side', '30s', 'Press your low back into the floor.'),
        e('Incline walk', 1, '15 min', '-', 'Conversational pace.'),
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
        e('Easy walk', 1, '10 min', '-', 'Cool down.'),
      ],
    },
    {
      id: 'm-walk', phase: 'menstrual', name: 'Zone 2 Walk and Core', focus: 'Cardio and core', minutes: 40, intensity: 'Low',
      summary: 'Steady walking for heart health and cramp relief, finished with core work.',
      exercises: [
        e('Zone 2 walk', 1, '30 min', '-', 'You should be able to talk in full sentences.'),
        e('Forearm plank', 3, '30s', '30s', 'Ribs down, glutes on.'),
        e('Side plank', 2, '20s / side', '30s', 'Stack hips and keep a long line.'),
        e('Supine breathing', 1, '2 min', '-', 'Inhale 4 seconds, exhale 6 seconds.'),
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
      id: 'f-hiit', phase: 'follicular', name: 'Conditioning Intervals', focus: 'Conditioning', minutes: 30, intensity: 'High',
      summary: 'Short, hard intervals while your recovery is at its best.',
      exercises: [
        e('Row erg intervals', 8, '30s hard / 60s easy', '-', 'Push through the legs first.'),
        e('Kettlebell swing', 4, '15', '45s', 'Snap the hips and float the bell.'),
        e('Reverse lunge', 3, '10 / leg', '45s', 'Step back long and stay tall.'),
        e('Mountain climbers', 3, '30s', '30s', 'Shoulders over wrists.'),
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
      id: 'l-pilates', phase: 'luteal', name: 'Pilates Core Sculpt', focus: 'Core and stability', minutes: 35, intensity: 'Low-moderate',
      summary: 'Low-impact control work when energy dips late in the cycle.',
      exercises: [
        e('Hundred', 1, '100 pulses', '30s', 'Chin to chest, legs at tabletop.'),
        e('Single-leg stretch', 3, '10 / side', '30s', 'Keep the low back heavy.'),
        e('Side-lying leg series', 2, '15 / side', '30s', 'Long body, small range.'),
        e('Glute bridge march', 3, '10 / side', '30s', 'Level hips.'),
        e('Swimming', 3, '30s', '30s', 'Reach long through fingers and toes.'),
        e('Zone 2 walk', 1, '15 min', '-', 'Easy pace.'),
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
  MEALS.steady = MEALS.follicular;

  const CYCLE_MODES = [
    { id: 'natural', label: 'Natural cycle', desc: 'No hormonal contraception' },
    { id: 'irregular', label: 'Irregular cycle', desc: 'Length changes a lot month to month' },
    { id: 'pcos', label: 'PCOS', desc: 'Diagnosed or suspected' },
    { id: 'perimenopause', label: 'Perimenopause', desc: 'Cycles changing in your 40s' },
    { id: 'hormonal', label: 'Hormonal contraception', desc: 'Pill, implant, injection or hormonal IUD' },
    { id: 'none', label: 'No period right now', desc: 'Postpartum, menopause or other' },
  ];

  const SYMPTOMS = ['Cramps', 'Bloating', 'Cravings', 'Headache', 'Tender breasts', 'Breakouts', 'Low mood', 'Poor sleep'];

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
  };

  // Campaign photography slots. Drop images in public/img/ and set the paths, e.g. welcome: 'img/welcome.jpg'.
  // Until then, posters use grainy motion-blur art in the same palette.
  const IMAGERY = { welcome: null, menstrual: null, follicular: null, ovulation: null, luteal: null, steady: null, session: null };

  const api = { PHASE_COPY, IMAGERY, PHASES, PHASE_ORDER, WORKOUTS, ROTATION, MEALS, FAVORITE_OPTIONS, AVOID_OPTIONS, MEMBERS, SEED_POSTS, AUTO_REPLIES, CYCLE_MODES, SYMPTOMS, GROCERY };
  if (typeof window !== 'undefined') window.YOURS_DATA = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
