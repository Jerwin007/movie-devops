const express = require('express');
const axios = require('axios');
const app = express();

const SERVICES = [
  { name: 'auth-service',               url: process.env.AUTH_URL     || 'http://auth-service:3001',               path: '/health' },
  { name: 'ml-recommender-v1',          url: process.env.ML_URL       || 'http://ml-recommender-service:3002',      path: '/health' },
  { name: 'fallback-recommender',       url: process.env.FALLBACK_URL || 'http://fallback-recommender-service:3003', path: '/health' },
  { name: 'ml-recommender-v2 (canary)', url: process.env.ML_V2_URL    || 'http://ml-recommender-v2-service:3004',   path: '/health' },
  { name: 'api-gateway',                url: process.env.GW_URL       || 'http://api-gateway:3000',                 path: '/health' },
];

async function checkService(svc) {
  const start = Date.now();
  try {
    const res = await axios.get(svc.url + svc.path, { timeout: 3000 });
    return { name: svc.name, status: 'UP', latency: Date.now() - start, detail: res.data };
  } catch (e) {
    return { name: svc.name, status: 'DOWN', latency: Date.now() - start, detail: e.message };
  }
}

app.get('/health', (req, res) => res.json({ status: 'monitoring-service OK' }));

app.get('/status', async (req, res) => {
  const results = await Promise.all(SERVICES.map(checkService));
  res.json({ timestamp: new Date().toISOString(), services: results });
});

app.get('/', async (req, res) => {
  const results = await Promise.all(SERVICES.map(checkService));
  const rows = results.map(s => {
    const color = s.status === 'UP' ? '#22c55e' : '#ef4444';
    const badge = s.status === 'UP' ? '🟢' : '🔴';
    return `<tr>
      <td>${badge} ${s.name}</td>
      <td style="color:${color};font-weight:700">${s.status}</td>
      <td>${s.latency}ms</td>
      <td style="color:#888;font-size:12px">${typeof s.detail === 'object' ? JSON.stringify(s.detail) : s.detail}</td>
    </tr>`;
  }).join('');
  const allUp = results.every(s => s.status === 'UP');
  res.send(`<!DOCTYPE html>
<html><head>
  <title>🎬 Movie App - Monitoring</title>
  <meta http-equiv="refresh" content="15">
  <style>
    body{font-family:Arial,sans-serif;background:#0a0a0f;color:#f0f0f5;padding:32px;margin:0}
    h1{color:#e50914;margin-bottom:4px}
    p{color:#888;font-size:14px;margin-bottom:24px}
    .badge{display:inline-block;padding:6px 16px;border-radius:999px;font-size:13px;font-weight:700;margin-bottom:24px}
    .badge.ok{background:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.3)}
    .badge.warn{background:rgba(239,68,68,0.15);color:#ef4444;border:1px solid rgba(239,68,68,0.3)}
    table{width:100%;border-collapse:collapse;background:#13131a;border-radius:12px;overflow:hidden}
    th{text-align:left;padding:14px 16px;background:#1c1c26;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px}
    td{padding:14px 16px;border-top:1px solid rgba(255,255,255,0.06);font-size:14px}
    .ts{color:#555;font-size:12px;margin-top:16px}
    .auto{color:#3b82f6;font-size:12px;margin-top:8px}
  </style>
</head><body>
  <h1>🎬 Movie Recommender — Service Monitor</h1>
  <p>Real-time health status of all microservices</p>
  <div class="badge ${allUp ? 'ok' : 'warn'}">${allUp ? '✅ All Systems Operational' : '⚠️ Some Services Down'}</div>
  <table>
    <thead><tr><th>Service</th><th>Status</th><th>Latency</th><th>Detail</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="ts">Last checked: ${new Date().toISOString()}</div>
  <div class="auto">⟳ Auto-refreshes every 15 seconds</div>
</body></html>`);
});

app.listen(3005, () => console.log('Monitoring service on port 3005'));
