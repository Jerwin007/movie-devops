const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

const SECRET   = process.env.JWT_SECRET    || 'mysecret';
const AUTH     = process.env.AUTH_URL      || 'http://auth-service:3001';
const ML       = process.env.ML_URL        || 'http://ml-recommender-service:3002';
const FALLBACK = process.env.FALLBACK_URL  || 'http://fallback-recommender-service:3003';
const ML_V2    = process.env.ML_V2_URL     || 'http://ml-recommender-v2-service:3004';

function auth(req, res, next) {
  const h = req.headers['authorization'];
  if (!h) return res.status(401).json({ error: 'No token provided' });
  try { req.user = jwt.verify(h.replace('Bearer ', ''), SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ── AUTH ROUTES ──────────────────────────────────────────
app.post('/register', async (req, res) => {
  try { const r = await axios.post(AUTH + '/register', req.body); res.json(r.data); }
  catch (e) { res.status(e.response?.status || 500).json(e.response?.data || { error: 'Auth service error' }); }
});

app.post('/login', async (req, res) => {
  try { const r = await axios.post(AUTH + '/login', req.body); res.json(r.data); }
  catch (e) { res.status(e.response?.status || 500).json(e.response?.data || { error: 'Auth service error' }); }
});

// ── MOVIE ROUTES ─────────────────────────────────────────
app.get('/movies', auth, async (req, res) => {
  try {
    const q = new URLSearchParams(req.query).toString();
    const r = await axios.get(ML + '/movies?' + q, { timeout: 5000 });
    res.json(r.data);
  } catch { res.status(503).json({ error: 'Movie service unavailable' }); }
});

app.get('/movies/:id', auth, async (req, res) => {
  try {
    const r = await axios.get(ML + '/movies/' + req.params.id, { timeout: 3000 });
    res.json(r.data);
  } catch { res.status(404).json({ error: 'Movie not found' }); }
});

// ── RECOMMEND (Canary: 20% → v2, fallback on error) ─────
app.get('/recommend', auth, async (req, res) => {
  const genre = req.query.genre || 'sci-fi';
  const target = Math.random() < 0.2 ? ML_V2 : ML;
  try {
    const r = await axios.get(target + '/recommend?genre=' + genre, { timeout: 4000 });
    res.json(r.data);
  } catch {
    try {
      const r = await axios.get(FALLBACK + '/recommend?genre=' + genre, { timeout: 4000 });
      res.json(r.data);
    } catch { res.status(503).json({ error: 'All recommender services unavailable' }); }
  }
});

// ── SIMULATE FAILURE ─────────────────────────────────────
app.post('/simulate-failure', auth, async (req, res) => {
  try { const r = await axios.post(ML + '/simulate-failure'); res.json(r.data); }
  catch { res.status(500).json({ error: 'Could not simulate failure' }); }
});

// ── HEALTH PROXY ENDPOINTS (for frontend monitoring) ─────
// These let the browser check downstream service health via the gateway
app.get('/auth/health', async (req, res) => {
  try { const r = await axios.get(AUTH + '/health', { timeout: 3000 }); res.json(r.data); }
  catch { res.status(503).json({ error: 'auth-service unreachable' }); }
});

app.get('/ml/health', async (req, res) => {
  try { const r = await axios.get(ML + '/health', { timeout: 3000 }); res.json(r.data); }
  catch { res.status(503).json({ error: 'ml-recommender unreachable' }); }
});

app.get('/ml2/health', async (req, res) => {
  try { const r = await axios.get(ML_V2 + '/health', { timeout: 3000 }); res.json(r.data); }
  catch { res.status(503).json({ error: 'ml-recommender-v2 unreachable' }); }
});

app.get('/fallback/health', async (req, res) => {
  try { const r = await axios.get(FALLBACK + '/health', { timeout: 3000 }); res.json(r.data); }
  catch { res.status(503).json({ error: 'fallback-recommender unreachable' }); }
});

app.get('/health', (req, res) => res.json({ status: 'api-gateway OK' }));

app.listen(3000, () => console.log('API Gateway on port 3000'));
