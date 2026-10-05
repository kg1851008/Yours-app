// Local dev server. On Vercel, public/ is served statically and api/coach.js runs as a function.
const express = require('express');
const path = require('path');
const coach = require('./api/coach');
const food = require('./api/food');
const billing = require('./api/billing');
const stripeWebhook = require('./api/stripe-webhook');

const app = express();
// Stripe needs the raw body to verify its signature, so this route comes before the JSON parser.
app.post('/api/stripe-webhook', express.raw({ type: '*/*' }), stripeWebhook);
app.use(express.json({ limit: '12mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.all('/api/coach', coach);
app.get('/api/food', food);
app.all('/api/billing', billing);
app.all('/api/cron', require('./api/cron'));
app.all('/api/push-test', require('./api/push-test'));
app.all('/api/referral', require('./api/referral'));
app.all('/api/event', require('./api/event'));
app.all('/api/stats', require('./api/stats'));
app.all('/api/email-unsubscribe', require('./api/email-unsubscribe'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`YOURS running on http://localhost:${PORT}`));
