const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const db = new sqlite3.Database(':memory:');
const JWT_SECRET = 'your-secret-key-change-this';

db.serialize(() => {
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    fitness_level TEXT,
    goal TEXT,
    cycle_length INTEGER
  )`);
});

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function(err) {
    if (err) return res.status(400).json({ error: 'Email already exists' });
    const token = jwt.sign({ email }, JWT_SECRET);
    res.json({ token });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (!user) return res.status(400).json({ error: 'User not found' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Wrong password' });
    const token = jwt.sign({ email }, JWT_SECRET);
    res.json({ token });
  });
});

app.post('/api/onboarding', verifyToken, (req, res) => {
  const { fitness_level, goal, cycle_length } = req.body;
  db.run('UPDATE users SET fitness_level = ?, goal = ?, cycle_length = ? WHERE email = ?',
    [fitness_level, goal, cycle_length, req.user.email], (err) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ success: true });
    });
});

app.get('/api/user', verifyToken, (req, res) => {
  db.get('SELECT * FROM users WHERE email = ?', [req.user.email], (err, user) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(user);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
