// Reminders and emails, decided once an hour by api/cron.js.
// Everything is evaluated in each member's own time zone, and every send is logged in `sent_log`
// so a reminder or email never goes out twice. Notification text is deliberately discreet:
// nothing about periods, cycle phase, weight or health appears on a lock screen.

const L = require('../public/logic.js');

// Defaults she can change in Profile → Reminders. Hours are her local time (0-23).
const REMINDERS = {
  workout: { label: "Today's workout", hour: 17, title: 'Time to train', body: "Today's session is ready when you are.", url: '/?open=workouts' },
  checkin: { label: 'Check-in day', hour: 9, title: "It's check-in day", body: 'Photos, weigh-in and three quick questions. Then your plan for next week.', url: '/?open=checkin' },
  weigh: { label: 'Morning weigh-in', hour: 7, title: 'Morning weigh-in', body: 'Before breakfast is best. Ten seconds.', url: '/?open=home' },
  meals: { label: 'Log your food', hour: 20, title: "Log today's food", body: 'Snap your plate or just say what you ate.', url: '/?open=meals' },
  // Two days before a predicted period. Worded so nothing personal shows on a lock screen.
  cycle: { label: 'Lighter week ahead', hour: 9, title: 'A lighter week is coming', body: 'Your plan eases off in a couple of days. A good moment to plan your week around it.', url: '/?open=home' },
};

// Her local date and hour, from an IANA time zone like "America/Chicago".
function localNow(tz, now) {
  let parts;
  try {
    parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz || 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(now || new Date()).map((p) => [p.type, p.value]));
  } catch { return localNow('America/New_York', now); }
  const date = new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  return { date, key: L.dateKey(date), hour: Number(parts.hour) % 24, weekday: parts.weekday };
}

// Is this reminder useful right now? (No nagging when it is already done.)
function due(kind, data, date) {
  if (!data || !data.onboarded) return false;
  const key = L.dateKey(date);
  if (kind === 'workout') {
    const w = L.workoutFor(data, date);
    if (!w || w.id === 'rest') return false;
    return !(data.workouts || []).some((x) => x.date === key);
  }
  if (kind === 'checkin') return L.weeklyDue(data, date) && (date.getDay() === L.checkinDay(data));
  if (kind === 'weigh') return data.weighDaily !== false && !(data.checkins || []).some((c) => c.date === key);
  if (kind === 'meals') return !((data.foodLog || {})[key] || []).length;
  if (kind === 'cycle') { const c = L.cycleInfo(data.profile || {}, date); return !c.steady && !c.late && c.daysToPeriod === 2; }
  return false;
}

// Which reminders fire for this member this hour.
function remindersNow(data, now) {
  const prefs = (data && data.reminders) || {};
  if (!prefs.on) return [];
  const local = localNow(prefs.tz, now);
  return Object.keys(REMINDERS).filter((kind) => {
    const p = prefs[kind] || {};
    if (p.on === false) return false;
    const hour = Number.isInteger(p.hour) ? p.hour : REMINDERS[kind].hour;
    return hour === local.hour && due(kind, data, local.date);
  }).map((kind) => ({ kind, period: local.key, ...REMINDERS[kind] }));
}

// ISO week like "2026-W40", used to send the weekly summary once.
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return `${d.getUTCFullYear()}-W${String(Math.ceil(((d - start) / 864e5 + 1) / 7)).padStart(2, '0')}`;
}

// Weekly summary goes out Monday at 8am her time.
function weeklyEmailNow(data, now) {
  const local = localNow(data && data.reminders && data.reminders.tz, now);
  return local.weekday === 'Mon' && local.hour === 8 ? { period: isoWeek(local.date), local } : null;
}

// Two days before a free trial turns into a paid membership: an honest heads-up with what she has done so far.
// Skipped when she has already cancelled. Returns null when no reminder is due.
function trialReminder(row, data, now) {
  if (!row || row.status !== 'trialing' || row.cancel_at_period_end || !row.trial_end) return null;
  const hours = (new Date(row.trial_end).getTime() - (now || new Date()).getTime()) / 36e5;
  if (hours <= 24 || hours > 48) return null;
  const workouts = ((data && data.workouts) || []).length;
  const prs = ((data && data.prs) || []).length;
  const done = workouts ? `So far: ${workouts} workout${workouts === 1 ? '' : 's'}${prs ? ` and ${prs} personal record${prs === 1 ? '' : 's'}` : ''}. ` : '';
  return { kind: 'trial', period: String(row.trial_end).slice(0, 10), title: 'Your free trial ends in 2 days', body: `${done}Keep going, or cancel anytime in Profile before then.`, url: '/?open=settings' };
}

module.exports = { REMINDERS, localNow, due, remindersNow, isoWeek, weeklyEmailNow, trialReminder };
