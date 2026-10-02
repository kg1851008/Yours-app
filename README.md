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

## How data is stored

The app stores everything on the user's device for now:

- Accounts, profile and history are in `localStorage`. Passwords and the vault PIN are hashed with PBKDF2.
- Progress photos are in IndexedDB. They are resized to at most 1024 px and never leave the device unless the user taps **Analyze**. The server only holds them in memory for that request and does not save them.
- Community posts and messages are shared only between accounts in the same browser. A real multi-user community needs a backend.

## AI coach

`api/coach.js` calls Claude through the Anthropic SDK. It handles both coach chat and progress-photo review.

- Set `ANTHROPIC_API_KEY` in your Vercel project, or in your shell for local runs, to turn on the live coach. `ANTHROPIC_MODEL` is optional and defaults to `claude-opus-5-5`.
- Without a key, the app uses a built-in on-device coach. It gives phase-aware answers and reviews progress from logged data. Photo review needs the live coach.

## Run locally

```bash
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start   # key is optional
# open http://localhost:3000
```

## Deploy

On Vercel, `public/` is served as the static site and `api/coach.js` runs as a serverless function. Add `ANTHROPIC_API_KEY` under Project Settings, Environment Variables.
