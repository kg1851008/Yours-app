// Local dev server. On Vercel, public/ is served statically and api/coach.js runs as a function.
const express = require('express');
const path = require('path');
const coach = require('./api/coach');
const food = require('./api/food');

const app = express();
app.use(express.json({ limit: '12mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.all('/api/coach', coach);
app.get('/api/food', food);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`YOURS running on http://localhost:${PORT}`));
