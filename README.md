# yours.

**For your body.** YOURS is a cycle-synced fitness coaching app for women. Training, meals, step targets and coaching all change with your cycle phase (menstrual, follicular, ovulation, luteal).

## Features

- **Try before signing up.** Welcome, then 7 onboarding steps, then a personal plan. She can save the plan to an account or continue as a guest. Guest data moves into the account on signup. There is also a one-tap demo.
- **Onboarding:** fitness level, main goal, period start date, height/weight/age (metric or imperial), activity level, cycle and period length, favourite foods and foods to avoid.
- **Home:** date, cycle ring with the current phase, hormone notes and tips, today's workout, protein/calorie/water/step targets, and a coach note.
- **Workouts:** 12 preloaded sessions grouped by phase, a daily recommendation based on cycle day, sets adjusted for fitness level, a set-by-set logger, a weekly overview and a library.
- **Meals:** breakfast, lunch, dinner and a snack for the current phase. Avoided foods are filtered out, favourites come first, each meal can be swapped, and portions scale to her calorie target.
- **Advisor:** an AI coach chat that knows her phase, targets, workouts and steps. It can suggest in-app actions (swap today's workout, log water, open a tab) as buttons she can tap.
- **Progress:** a private photo vault with an optional PIN. Photos are blurred until tapped, can be compared side by side, and can be sent for an AI review that says whether she is on track. Also tracks weight check-ins.
- **Community:** a feed for wins, questions and tips, with likes and comments, plus direct messages.
- Light and dark mode, mobile-first layout, no emojis.

### Coaching intelligence

- **Learns her cycle.** Each logged period start updates her predicted cycle length (average of recent cycles, with range and regularity). A late period stays in luteal and is flagged, instead of silently starting a new cycle. Logging bleeding at check-in asks whether her period started.
- **Supports every cycle type.** Natural, irregular, PCOS and perimenopause use phase predictions, labelled as estimates where appropriate. Hormonal contraception and no current period use a steady weekly plan driven by readiness.
- **Daily check-in.** Energy, sleep, mood, soreness, symptoms and bleeding produce a 0-100 readiness score. Low readiness offers a lighter session with one tap and lowers suggested weights.
- **Patterns.** After about 6 check-ins, YOURS shows when her energy dips (for example "around day 24"), which phase each symptom clusters in, and how energy varies by phase. Known dip days trigger a lighter-session suggestion.
- **Suggested weights.** Every main lift gets a target weight and rep count from her last session, using double progression. Loads are about 10% lighter when menstrual or low on readiness and held steady in the luteal phase. Suggestions are pre-filled in the workout logger.
- **PR detection** using estimated one-rep max, plus **strength by phase**, which compares her relative strength across phases on the same lifts.
- **Weekly check-in.** Three questions (how training felt, hunger, next week's plans) plus her numbers (sessions, steps, readiness, weight trend, upcoming phase changes) produce plan changes she can accept or skip: sets on main lifts, step target and calories, all within safe limits.
- **Forgiving streak.** A day counts for training, a check-in, or 60% of her step target, and one missed day a week is forgiven.
- **Protein tracking** by marking meals as eaten, plus a **grocery list** for the next 7 days of meals that she can tick off and share.
- **Share cards** (PRs, streak, strength by phase): 1080x1350 branded images, shared through the phone's share menu or downloaded.
- **Installable app (PWA).** Home-screen icon, an offline app shell, and the Android install prompt. On iPhone, Safari's Add to Home Screen.
- **Privacy.** With a vault PIN, photos are encrypted on the device with AES-GCM (key derived from the PIN with PBKDF2). She can export her data as JSON and delete everything.

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

## Tests

```bash
npm test   # coaching logic: cycle learning, readiness, load suggestions, PRs, patterns, weekly review, streak, grocery list
```

## Run locally

```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start   # key is optional
# open http://localhost:3000
```

## Deploy

On Vercel, `public/` is served as the static site and `api/coach.js` runs as a serverless function. Add `ANTHROPIC_API_KEY` under Project Settings, Environment Variables.
