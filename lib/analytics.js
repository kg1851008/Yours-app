// Privacy-respecting usage counts. Each event is just a name and a date: no user id, email, device id,
// IP address or health data is stored. The app only sends names from this list, and browsers that ask
// not to be tracked (Do Not Track / Global Privacy Control) send nothing.

const B = require('./billing');

const EVENTS = {
  // Funnel (sent once per device per day for views, once per device for the rest)
  app_open: 'Opened the app',
  landing_view: 'Saw the landing page',
  signup_start: 'Tapped Get started',
  onboarding_done: 'Built a plan',
  account_created: 'Created an account',
  checkout_start: 'Opened checkout',
  // Server side, from Stripe
  trial_started: 'Started a free trial',
  membership_paid: 'First payment',
  membership_canceled: 'Membership ended',
  // Engagement
  workout_done: 'Finished a workout',
  weekly_checkin: 'Weekly check-in',
  program_start: 'Started a program',
  exercise_swap: 'Swapped an exercise',
  photo_compare: 'Compared photos',
  badge_earned: 'Earned a badge',
  share_card: 'Made a share card',
  install_done: 'Added to Home Screen',
  library_open: 'Opened the exercise library',
  exercise_view: 'Viewed an exercise guide',
  workout_created: 'Built a custom workout',
  measurement_logged: 'Logged measurements',
  // Invites
  invite_opened: 'Opened an invite link',
  invite_claimed: 'Joined with an invite',
  invite_shared: 'Shared an invite',
};
const FUNNEL = ['landing_view', 'signup_start', 'onboarding_done', 'account_created', 'checkout_start', 'trial_started', 'membership_paid'];

const valid = (name) => typeof name === 'string' && Object.prototype.hasOwnProperty.call(EVENTS, name);

async function record(name) {
  if (!valid(name) || !B.supabaseConfigured()) return false;
  await B.sbRest('events', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { name } });
  return true;
}

// Stripe status change -> funnel event (null when nothing worth counting changed).
function subscriptionEvent(before, after) {
  const was = before && before.status;
  const now = after && after.status;
  if (!now || now === was) return null;
  if (now === 'trialing' && !(before && before.trial_used)) return 'trial_started';
  if (now === 'active' && was !== 'past_due') return 'membership_paid';
  if (['canceled', 'unpaid', 'incomplete_expired'].includes(now) && ['trialing', 'active', 'past_due'].includes(was)) return 'membership_canceled';
  return null;
}

module.exports = { EVENTS, FUNNEL, valid, record, subscriptionEvent };
