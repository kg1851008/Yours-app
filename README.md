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
- **Community:** a feed for wins, questions and tips, with likes and comments, plus direct messages, shared with every member when the cloud is on.
- **Opening splash:** the YOURS logo full screen on cream, then a fade into the app. Shown once per visit (not on refresh), shortened for reduce-motion users.
- **Privacy promise and contact.** "We never sell your data" on the welcome screen, sign-up, the membership screen and Profile, linking to a plain-English privacy page. Support email (yoursfitapp@gmail.com, set as `SUPPORT_EMAIL` in `public/app.js`) on the privacy page, the membership screen and Profile → Help & contact.
- **Terms, waiver and health data consent.** Sign-up needs two ticked boxes: (1) 18 or older and agreement to the Terms of Service and Health & Safety Waiver, and (2) a separate consent to collect and use health data, per the Consumer Health Data Privacy Policy (written for laws like Washington's My Health My Data Act). Anyone already using the app sees a one-time "Before you start" screen with both. Each agreement is recorded in the Supabase `consents` table with the server's time and the terms version; changing `VERSION` in `public/legal.js` asks everyone to agree again. The Terms include US-only availability, a copyright complaint process, and individual arbitration with a class action waiver and a 30-day opt-out. The health data policy covers what is collected and why, who processes it, legal and law enforcement requests, retention, rights (access, deletion, withdrawing consent, 45-day responses and appeals) and breaches; it is linked from the welcome screen, sign-up, Privacy and Profile. This is a starting draft, not legal advice: have a lawyer review it, add the business name and state, and confirm the arbitration terms.
- **US only.** Memberships can only be bought from the United States: `api/billing.js` checks the visitor's country (Vercel's `x-vercel-ip-country` header) and refuses checkout elsewhere, and the app tells non-US visitors plainly. Set `ALLOWED_COUNTRIES` (for example `US,CA`) to expand.
- **Accessible.** Every screen passes an automated WCAG 2.1 AA audit (axe-core) in light and dark mode: text colours meet contrast minimums (`--muted`, and `--accent-ink` for peach text), and keyboard users get a visible focus ring.
- **Workout logger tools.** A rest timer that starts when a set is ticked (with +15/-15, skip, and a buzz and beep at zero), plate math for barbell lifts (plates per side, choice of bar), supersets (A1/A2, rest after the pair), and notes per exercise that show as "Last time" next session.
- **Reminders (push notifications).** In Profile → Reminders she turns on nudges for today's workout, check-in day, the morning weigh-in and logging food, each at a time she picks, in her own time zone. They only fire when there is something to do (no workout reminder on rest days or once she has trained), and the text never mentions her cycle or weight. On iPhone, YOURS must be added to the Home Screen first. "Send a test" checks the setup. Tapping a reminder opens the right screen.
- **Emails.** A welcome email after she confirms her account, and a weekly summary on Monday at 8am her time (workouts, steps, check-ins, streak, PRs; never weight or cycle details), with one-click unsubscribe and a toggle in Profile. Sent through Resend.
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
- **Snap your plate.** Photograph a meal and the coach lists each food with an estimated portion, calories and macros (cooking oils and sauces too, flagged "check this" when guessed). She can untick items, change portions in quarter steps, edit any number, pick the meal, and only then log. The photo is resized on the device, sent once for the estimate, and never stored.
- **Talk to log.** Say or type "two eggs and toast" or "150 g chicken and a cup of rice" (uses the phone's speech recognition where available). With the live coach it handles any food; without it, an on-device parser covers about 50 everyday foods plus her recent foods. "Log my usual breakfast" repeats her most repeated breakfast from the last 3 weeks, and "same lunch as yesterday" copies yesterday's. Saying "I had..." in the coach chat opens the same review sheet.
- **8-week programs** in Workouts: Postpartum return (doctor or midwife clearance required, a symptom check that points to a pelvic health physio, breath and pelvic floor first, daily resets on off days, a loaded strength check before full lifting), Glute build (volume, strength, peak), First pull-up (hangs, negatives, singles) and Strong through menopause (heavy, brief lifting plus gentle impact for bone). She picks 3 training days; a missed day moves that session to the next training day. Progress shows per week, Home shows the program week, suggested weights still adjust to her cycle and readiness, and the coach knows where she is. Programs matching her life stage or goal are marked "For you".
- **Recipes.** Build a meal from its ingredients (scan, search or create each), set how many servings it makes and optionally the cooked weight, then log a serving or any number of grams. Recipes are saved and editable. Quick add covers meals out.
- **Eating out.** A Restaurants option in Add food. Built-in starter menus (Chipotle build-your-own bowl, burrito or tacos with double protein; Chick-fil-A; Starbucks) use approximate values from published nutrition info and are labelled that way. With Nutritionix keys set, she can search every restaurant's menu. Anything missing can be saved once under its restaurant.
- **Grocery shopping by store.** The grocery list combines the week's meal ideas, any saved recipes she picks, and her own items, sorted by aisle. She picks a store (Walmart, Target, Kroger, Whole Foods, Trader Joe's, Costco, Instacart, Amazon Fresh) and each item has a Find link to that store's search. Ticks, store and selections are remembered, and the list can be shared.
- **Food scale guidance.** A dismissible tip on the diary, plus hints in recipes and grams entry. Always optional.
- **Barcode food logging.** Scan a packaged food with the phone's back camera (it prefers the main back lens over ultra-wide or front, with a switch-camera button that remembers her choice, and a flashlight button where supported) (native BarcodeDetector on Android Chrome, the bundled ZXing reader on iPhone and everywhere else), scan from a photo, or type the number. Nutrition comes from Open Food Facts, a free open database; only the barcode is sent. Log by servings or grams to a meal. Products missing from the database can be added once from the label and are remembered. Also: food search, recent foods, and manual entries. Calories, protein, carbs and fat roll up into daily totals on Home and Meals.
- **Protein tracking** by marking meals as eaten, plus a **grocery list** for the next 7 days of meals that she can tick off and share.
- **Share cards** (PRs, streak, strength by phase): 1080x1350 branded images, shared through the phone's share menu or downloaded.
- **Installable app (PWA).** Home-screen icon and an offline app shell. A "Get the YOURS app" card on Home (until installed or dismissed), plus Profile and Reminders, opens a step-by-step guide for her phone: illustrated Share → Add to Home Screen → Add on iPhone Safari; "open in Safari first" with a copy-link button inside Instagram, TikTok, Chrome and other in-app browsers on iPhone; a one-tap Install button or Chrome menu steps on Android.
- **Privacy.** Check-in photos require a vault PIN (4-6 digits). Photos are encrypted on the device with AES-GCM (key derived from the PIN with PBKDF2). The vault locks whenever the app goes to the background and after 5 minutes idle; wrong PINs are throttled; photos stay blurred until tapped and are never included in exports. She can export her data as JSON and delete everything.

## Design

The look is editorial athletic: grainy, motion-blurred campaign posters, condensed display headlines (Anton), italic serif accents (Instrument Serif), tracked monospace captions (DM Mono), Inter for body text, Mrs Saint Delafield script for handwritten accents, and the Archivo Expanded wordmark. Bright studio posters (warm greige sweep tinted by phase) sit alongside darker motion posters, with four-corner micro captions, a taped coach-note card, curved text badges and a contact-sheet photo grid. All fonts are self-hosted in `public/fonts/` under the SIL Open Font License, so they work offline and make no third-party requests.

**Photography.** Posters currently use grainy motion-blur art in the brand palette. To use real campaign photos, add images to `public/img/` and set the paths in `IMAGERY` in `public/data.js` (`welcome`, each phase, and `session` for workouts). Grain and a legibility shade are applied automatically. Use photos you own or have licensed.

## Accounts, sync and community (Supabase)

`public/config.js` holds the Supabase project URL and its publishable key. With a key set, the app uses the cloud; with it empty, everything stays on the device as before.

- **Accounts across devices.** Email and password through Supabase Auth, with password reset. Her plan, logs, diary and settings sync as one private document per member (`user_data`); whichever copy changed last wins. Changes save on the device first and sync when online. Signing out clears the device's copy.
- **Guest and older accounts carry over.** A guest plan moves into the new account. An account created on a device before the cloud existed moves up automatically the first time she signs in with the same email and password.
- **Encrypted photo backup.** Optional, in Progress. Photos are encrypted on the phone with a key derived from a backup passphrase (PBKDF2, 600,000 rounds, AES-GCM) before upload to a private storage bucket. The passphrase never leaves the device, so neither you nor Supabase can view the photos. On a new phone she enters the passphrase once to restore. Forgetting it means the backup cannot be opened.
- **Real community.** Posts, comments, likes and direct messages are shared between all members, with live updates. Members can delete their own posts, report a post or a member (reports land in the `reports` table for you to review in the Supabase dashboard), and hide a member. There is no public member directory. You can message people from the feed or from existing conversations.
- **Delete account** removes her data, posts, messages and photo backup.

The database schema is in `supabase/schema.sql` and is already applied to the `yours.` project. Every table has row-level security: members can only read and change what they are allowed to.

**Before launch, in the Supabase dashboard:** Authentication > URL Configuration, set Site URL to your live address (for example your Vercel domain) and add it under Redirect URLs, so confirmation and password-reset emails link back to the app. The built-in email sender is rate-limited and for testing only; for real users, add your own SMTP provider under Authentication > Emails.

## Membership and payments (Stripe)

A 7-day free trial, then a monthly or yearly membership. Anyone can build their plan for free; the rest of the app needs a trial or a membership. Until the Stripe settings below are added, payments stay off and the app is open to everyone.

- **Trial with card upfront.** She picks monthly or yearly and enters her card on Stripe's secure checkout. She is charged on day 8 unless she cancels. One free trial per member.
- **Access** is open while the membership is trialing or active, and for 7 days while Stripe retries a failed card. Otherwise the app shows the membership screen; her data is kept.
- **Manage membership** in Profile opens Stripe's customer portal (cancel, switch plan, update card). Home shows a reminder in the last 2 days of the trial.
- **How it works.** `api/billing.js` creates Checkout and portal sessions for the signed-in member. `api/stripe-webhook.js` receives Stripe's updates (signature checked) and saves each member's status in the Supabase `subscriptions` table, which the app reads. Members can only read their own row; only the server can change it.
- **Complimentary access** (you, testers, partners): in Supabase, Table Editor > subscriptions, add a row with the member's `user_id` and status `comp`.

### Turning payments on

1. **Stripe account** at stripe.com (start in Test mode). Products > Add product "YOURS membership" with two recurring prices: monthly ($14.99) and yearly ($99). Copy each price ID (`price_...`).
2. **Webhook:** Developers > Webhooks > Add endpoint `https://yours-app-tau.vercel.app/api/stripe-webhook`, events `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy the signing secret (`whsec_...`).
3. **Customer portal:** Settings > Billing > Customer portal > Activate (allow cancelling and updating payment methods).
4. **Vercel** > Project > Settings > Environment Variables, then redeploy:
   - `STRIPE_SECRET_KEY` (`sk_test_...` or `sk_live_...`)
   - `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`
   - `STRIPE_WEBHOOK_SECRET`
   - `SUPABASE_SECRET_KEY` (Supabase > Project Settings > API Keys > secret key)
   - optional `APP_URL` (your live address, if it changes from yours-app-tau.vercel.app)

Test with Stripe's test card 4242 4242 4242 4242, then switch Stripe to live mode and replace the keys, price IDs and webhook secret with the live ones.

## Reminders and emails: setup

An hourly job (`api/cron.js`) decides who gets which reminder or email. Supabase runs it every hour (pg_cron and pg_net, see the end of `supabase/schema.sql`), so no paid Vercel plan is needed. Every send is logged in `sent_log`, so nothing goes out twice.

Vercel environment variables:
- `CRON_SECRET`: a long random string; the same value is stored in Supabase Vault as `yours_cron_secret`.
- `VAPID_PRIVATE_KEY`: the private half of the push key pair (the public half is `vapidPublicKey` in `public/config.js`).
- `RESEND_API_KEY` and `EMAIL_FROM` (for example `YOURS <hello@yourdomain.com>`): from resend.com, with your domain verified there. Without them, no emails are sent; reminders still work.

## How data is stored on the device

- Passwords for device-only accounts and the vault PIN are hashed with PBKDF2.
- Progress photos are in IndexedDB, encrypted with the vault PIN. They are resized to at most 1024 px and leave the device only when she taps **Analyze** (held in memory for that request only) or turns on encrypted backup.
- A 4-digit PIN deters casual snooping but would not stop a determined attacker with the device.

## AI coach

`api/coach.js` calls Claude through the Anthropic SDK. It handles coach chat, progress-photo review, and food estimates from a plate photo or her words (structured JSON output).

- Set `ANTHROPIC_API_KEY` in your Vercel project, or in your shell for local runs, to turn on the live coach. `ANTHROPIC_MODEL` is optional and defaults to `claude-opus-5-5`.
- Without a key, the app uses a built-in on-device coach. It gives phase-aware answers and reviews progress from logged data. Photo review and plate photos need the live coach; talk to log falls back to the on-device parser.

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
