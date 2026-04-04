const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());

const SECRET = process.env.JWT_SECRET || 'mysecret';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo-service:27017/movieapp';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

app.post('/register', async (req, res) => {
  try {
    const { username, password, name } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ error: 'Username taken' });
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashed, name: name || username });
    res.json({ message: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ username, name: user.name }, SECRET, { expiresIn: '24h' });
    res.json({ token, username, name: user.name });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

app.get('/users/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch { res.json({ count: 0 }); }
});

app.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'auth-service OK', database: dbStatus });
});

app.listen(3001, () => console.log('Auth service on port 3001'));
