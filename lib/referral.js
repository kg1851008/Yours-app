// Referrals: "Give a friend 2 extra trial weeks and get a free month."
// - Every member has a 6-character invite code (table referral_codes).
// - A brand-new member who opens an invite link and signs up claims it (table referrals, status 'joined').
//   Her free trial is then 21 days instead of 7 (api/billing.js).
// - When her membership first becomes active (her first real payment), the referral is 'earned' and the
//   inviter gets one month's price as Stripe account credit, which pays her next bill ('rewarded').
//   An inviter without a membership yet keeps it as 'earned' and it is applied when she joins.
// Both tables are only read and written here, with the Supabase secret key.

const crypto = require('node:crypto');
const B = require('./billing');

const BONUS_DAYS = 14;          // extra trial days for the invited friend
const CLAIM_WINDOW_DAYS = 7;    // only new accounts can claim an invite
const MAX_REWARDS = 12;         // free months per inviter
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I/L

const validCode = (code) => typeof code === 'string' && /^[A-HJ-NP-Z2-9]{6}$/.test(code);
function newCode() {
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

// Pure rules (unit tested).
function canClaim({ user, code, owner, existing, sub, now }) {
  if (!validCode(code)) return 'That invite code is not valid.';
  if (!owner) return 'That invite code is not valid.';
  if (owner === user.id) return 'You can\'t use your own invite code.';
  if (existing) return 'You have already used an invite.';
  if (sub && (sub.trial_used || ['trialing', 'active', 'past_due', 'comp'].includes(sub.status))) return 'Invites are for new members.';
  const age = user.created_at ? ((now || Date.now()) - new Date(user.created_at).getTime()) / 864e5 : 0;
  if (age > CLAIM_WINDOW_DAYS) return 'Invites are for new members.';
  return null;
}
const trialDaysFor = (referral) => 7 + (referral && referral.status === 'joined' ? BONUS_DAYS : 0);

async function codeFor(userId) {
  const rows = await B.sbRest(`referral_codes?user_id=eq.${userId}&select=code`);
  if (rows && rows[0]) return rows[0].code;
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    try {
      await B.sbRest('referral_codes', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { user_id: userId, code } });
      return code;
    } catch (e) {
      if (e.status !== 409) throw e; // code taken (or a parallel request made hers): try again
      const again = await B.sbRest(`referral_codes?user_id=eq.${userId}&select=code`);
      if (again && again[0]) return again[0].code;
    }
  }
  throw new Error('could not make an invite code');
}
async function ownerOf(code) {
  if (!validCode(code)) return null;
  const rows = await B.sbRest(`referral_codes?code=eq.${code}&select=user_id`);
  return rows && rows[0] ? rows[0].user_id : null;
}
async function referralOf(userId) {
  const rows = await B.sbRest(`referrals?referred_id=eq.${userId}&select=*`);
  return (rows && rows[0]) || null;
}
async function stats(userId) {
  const rows = await B.sbRest(`referrals?referrer_id=eq.${userId}&select=status`);
  const count = (st) => (rows || []).filter((r) => st.includes(r.status)).length;
  return { joined: (rows || []).length, paid: count(['earned', 'rewarded']), rewarded: count(['rewarded']) };
}

async function claim(user, code) {
  code = String(code || '').trim().toUpperCase();
  const [owner, existing, sub] = await Promise.all([ownerOf(code), referralOf(user.id), B.getRow(user.id).catch(() => null)]);
  const why = canClaim({ user, code, owner, existing, sub });
  if (why) return { ok: false, error: why };
  try {
    await B.sbRest('referrals', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: { referrer_id: owner, referred_id: user.id, code, status: 'joined' } });
  } catch (e) {
    if (e.status === 409) return { ok: false, error: 'You have already used an invite.' };
    throw e;
  }
  return { ok: true, bonusDays: BONUS_DAYS };
}

// One month's price as credit on the inviter's Stripe customer. The idempotency key makes retries safe.
async function creditInviter(referral, customerId) {
  const s = B.stripe();
  const price = await s.prices.retrieve(process.env.STRIPE_PRICE_MONTHLY);
  await s.customers.createBalanceTransaction(customerId, { amount: -price.unit_amount, currency: price.currency, description: 'YOURS invite reward: one free month' }, { idempotencyKey: `yours-referral-${referral.id}` });
  await B.sbRest(`referrals?id=eq.${referral.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { status: 'rewarded', rewarded_at: new Date().toISOString() } });
}

// The invited friend paid: mark it earned (once) and reward the inviter if she has a Stripe customer.
async function onFriendPaid(referredId) {
  const rows = await B.sbRest(`referrals?referred_id=eq.${referredId}&status=eq.joined`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: { status: 'earned', earned_at: new Date().toISOString() } });
  const ref = rows && rows[0];
  if (!ref) return null;
  const done = await B.sbRest(`referrals?referrer_id=eq.${ref.referrer_id}&status=eq.rewarded&select=id`);
  if ((done || []).length >= MAX_REWARDS) {
    await B.sbRest(`referrals?id=eq.${ref.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: { status: 'void' } });
    return 'capped';
  }
  const inviter = await B.getRow(ref.referrer_id).catch(() => null);
  if (inviter && inviter.customer_id) { await creditInviter(ref, inviter.customer_id); return 'rewarded'; }
  return 'earned';
}

// The inviter now has a Stripe customer: apply rewards she earned before (capped).
async function applyEarned(userId, customerId) {
  const rows = await B.sbRest(`referrals?referrer_id=eq.${userId}&status=eq.earned&select=*&order=id`);
  const done = await B.sbRest(`referrals?referrer_id=eq.${userId}&status=eq.rewarded&select=id`);
  let left = MAX_REWARDS - (done || []).length;
  for (const ref of rows || []) {
    if (left-- <= 0) break;
    await creditInviter(ref, customerId);
  }
}

module.exports = { BONUS_DAYS, CLAIM_WINDOW_DAYS, MAX_REWARDS, validCode, newCode, canClaim, trialDaysFor, codeFor, ownerOf, referralOf, stats, claim, onFriendPaid, applyEarned };
