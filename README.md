# yours.

**For your body.** YOURS is a cycle-synced fitness coaching app for women. Training, meals, step targets and coaching all change with your cycle phase (menstrual, follicular, ovulation, luteal).

## Features

- **Try before signing up.** Welcome, then 7 onboarding steps, then a personal plan. She can save the plan to an account or continue as a guest. Guest data moves into the account on signup. There is also a one-tap demo.
- **Onboarding:** fitness level, main goal, period start date, height/weight/age (metric or imperial), activity level, cycle and period length, favourite foods and foods to avoid.
- **Home:** date, cycle ring with the current phase, hormone notes and tips, today's workout, protein/calorie/water/step targets, and a coach note.
- **Workouts:** 12 preloaded sessions grouped by phase, a daily recommendation based on cycle day, sets adjusted for fitness level, a set-by-set logger, a weekly overview and a library.
- **Meals (food diary):** a MyFitnessPal-style diary with Breakfast, Lunch, Dinner and Snacks, calories remaining (goal minus food) and macro bars. She can add food per meal, tap an entry to change the amount, and move between days to log past meals. Phase meal ideas sit below as optional suggestions with a "Log this" button (portion-adjustable, macros estimated), plus a grocery list.
- **Advisor:** an AI coach chat that knows her phase, targets, workouts and steps. It can suggest in-app actions (swap today's workout, log water, open a tab) as buttons she can tap.
- **Progress:** a private photo vault with an optional PIN. Photos are blurred until tapped, can be compared side by side, and can be sent for an AI review that says whether she is on track. Also tracks weight check-ins.
- **Community:** a feed for wins, questions and tips, with likes and comments, plus direct messages.
- **Opening splash:** the YOURS logo full screen on cream, then a fade into the app. Shown once per visit (not on refresh), shortened for reduce-motion users.
- Light and dark mode, mobile-first layout, no emojis.

### Coaching intelligence

- **Learns her cycle.** Each logged period start updates her predicted cycle length (average of recent cycles, with range and regularity). A late period stays in luteal and is flagged, instead of silently starting a new cycle. Logging bleeding at check-in asks whether her period started.
- **Supports every cycle type and life stage.** Natural, irregular, PCOS and perimenopause use phase predictions, labelled as estimates where appropriate. Hormonal contraception and no current period use a steady weekly plan driven by readiness.
- **Menopause.** A dedicated life stage with a bone-density and muscle plan (bone-building strength, power and impact, mobility and balance), higher protein, calcium and vitamin D guidance, check-in symptoms for hot flashes, night sweats, brain fog and joint aches, insights on how those affect readiness and sleep, and a prompt to see a doctor if bleeding is logged after menopause. Perimenopause gets the same symptom tracking alongside cycle estimates.
- **Daily check-in.** Energy, sleep, mood, soreness, symptoms and bleeding produce a 0-100 readiness score. Low readiness offers a lighter session with one tap and lowers suggested weights.
- **Patterns.** After about 6 check-ins, YOURS shows when her energy dips (for example "around day 24"), which phase each symptom clusters in, and how energy varies by phase. Known dip days trigger a lighter-session suggestion.
- **Suggested weights.** Every main lift gets a target weight and rep count from her last session, using double progression. Loads are about 10% lighter when menstrual or low on readiness and held steady in the luteal phase. Suggestions are pre-filled in the workout logger.
- **PR detection** using estimated one-rep max, plus **strength by phase**, which compares her relative strength across phases on the same lifts.
- **Check-in day.** She picks her weekday. The coach reminds her the day before and on the day. The check-in takes front, side and back photos ("wear whatever you are comfortable in"), her weigh-in, and three questions. The advisor then reviews this week's photos against her last check-in's (same poses) together with the week's data, and updates next week's plan. Past check-ins appear in Progress with their 7-day average weight.
- **Daily weigh-in** prompt on Home (can be turned off), with trends shown as 7-day averages.
- **Weekly review.** Three questions (how training felt, hunger, next week's plans) plus her numbers (sessions, steps, readiness, weight trend, upcoming phase changes) produce plan changes she can accept or skip: sets on main lifts, step target and calories, all within safe limits.
- **Forgiving streak.** A day counts for training, a check-in, or 60% of her step target, and one missed day a week is forgiven.
- **Recipes.** Build a meal from its ingredients (scan, search or create each), set how many servings it makes and optionally the cooked weight, then log a serving or any number of grams. Recipes are saved and editable. Quick add covers meals out.
- **Eating out.** A Restaurants option in Add food. Built-in starter menus (Chipotle build-your-own bowl, burrito or tacos with double protein; Chick-fil-A; Starbucks) use approximate values from published nutrition info and are labelled that way. With Nutritionix keys set, she can search every restaurant's menu. Anything missing can be saved once under its restaurant.
- **Grocery shopping by store.** The grocery list combines the week's meal ideas, any saved recipes she picks, and her own items, sorted by aisle. She picks a store (Walmart, Target, Kroger, Whole Foods, Trader Joe's, Costco, Instacart, Amazon Fresh) and each item has a Find link to that store's search. Ticks, store and selections are remembered, and the list can be shared.
- **Food scale guidance.** A dismissible tip on the diary, plus hints in recipes and grams entry. Always optional.
- **Barcode food logging.** Scan a packaged food with the phone's back camera (it prefers the main back lens over ultra-wide or front, with a switch-camera button that remembers her choice, and a flashlight button where supported) (native BarcodeDetector on Android Chrome, the bundled ZXing reader on iPhone and everywhere else), scan from a photo, or type the number. Nutrition comes from Open Food Facts, a free open database; only the barcode is sent. Log by servings or grams to a meal. Products missing from the database can be added once from the label and are remembered. Also: food search, recent foods, and manual entries. Calories, protein, carbs and fat roll up into daily totals on Home and Meals.
- **Protein tracking** by marking meals as eaten, plus a **grocery list** for the next 7 days of meals that she can tick off and share.
- **Share cards** (PRs, streak, strength by phase): 1080x1350 branded images, shared through the phone's share menu or downloaded.
- **Installable app (PWA).** Home-screen icon, an offline app shell, and the Android install prompt. On iPhone, Safari's Add to Home Screen.
- **Privacy.** Check-in photos require a vault PIN (4-6 digits). Photos are encrypted on the device with AES-GCM (key derived from the PIN with PBKDF2). The vault locks whenever the app goes to the background and after 5 minutes idle; wrong PINs are throttled; photos stay blurred until tapped and are never included in exports. She can export her data as JSON and delete everything.

## Design

The look is editorial athletic: grainy, motion-blurred campaign posters, condensed display headlines (Anton), italic serif accents (Instrument Serif), tracked monospace captions (DM Mono), Inter for body text, Mrs Saint Delafield script for handwritten accents, and the Archivo Expanded wordmark. Bright studio posters (warm greige sweep tinted by phase) sit alongside darker motion posters, with four-corner micro captions, a taped coach-note card, curved text badges and a contact-sheet photo grid. All fonts are self-hosted in `public/fonts/` under the SIL Open Font License, so they work offline and make no third-party requests.

**Photography.** Posters currently use grainy motion-blur art in the brand palette. To use real campaign photos, add images to `public/img/` and set the paths in `IMAGERY` in `public/data.js` (`welcome`, each phase, and `session` for workouts). Grain and a legibility shade are applied automatically. Use photos you own or have licensed.

## How data is stored

The app stores everything on the user's device for now:

- Accounts, profile and history are in `localStorage`. Passwords and the vault PIN are hashed with PBKDF2.
- Progress photos are in IndexedDB, encrypted when a vault PIN is set. They are resized to at most 1024 px and never leave the device unless the user taps **Analyze**. The server only holds them in memory for that request and does not save them. A 4-digit PIN deters casual snooping but would not stop a determined attacker with the device.
- Community posts and messages are shared only between accounts in the same browser. A real multi-user community needs a backend.

## AI coach

`api/coach.js` calls Claude through the Anthropic SDK. It handles both coach chat and progress-photo review.

- Set `ANTHROPIC_API_KEY` in your Vercel project, or in your shell for local runs, to turn on the live coach. `ANTHROPIC_MODEL` is optional and defaults to `claude-opus-5-5`.
- Without a key, the app uses a built-in on-device coach. It gives phase-aware answers and reviews progress from logged data. Photo review needs the live coach.

## Restaurant search (optional)

`api/food.js` proxies the Nutritionix API so keys stay on the server. Set `NUTRITIONIX_APP_ID` and `NUTRITIONIX_APP_KEY` (from developer.nutritionix.com) to turn on "Search every restaurant". Without keys the built-in starter menus and saved restaurant items still work. The endpoint is written against Nutritionix's v2 instant search and item lookup; verify it with your real keys before launch.

## Tests

```bash
npm test   # coaching and nutrition logic: cycle learning, readiness, load suggestions, PRs, patterns, weekly review, streak, grocery list
```

## Run locally

```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start   # key is optional
# open http://localhost:3000
```

## Deploy

On Vercel, `public/` is served as the static site and `api/coach.js` runs as a serverless function. Add `ANTHROPIC_API_KEY` under Project Settings, Environment Variables.
