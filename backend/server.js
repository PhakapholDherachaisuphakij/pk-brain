import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { chatRouter } from './routes/chat.js';
import { knowledgeRouter } from './routes/knowledge.js';
import { portfolioRouter } from './routes/portfolio.js';
import { webhooksRouter } from './routes/webhooks.js';
import { uploadRouter } from './routes/upload.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5174;
const MASTER_PIN = process.env.PK_BRAIN_PIN || '2525';
const SESSION_SECRET = process.env.SESSION_SECRET || 'pk-brain-secure-token-' + MASTER_PIN;

// Generate auth token
const generateToken = (pin) => {
  return crypto.createHmac('sha256', SESSION_SECRET).update(pin).digest('hex');
};
const VALID_TOKEN = generateToken(MASTER_PIN);

// Enable gzip/brotli compression for fast transfer and minimal bandwidth
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Health Check (Public)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'PK Brain Backend API',
    model: process.env.TYPHOON_MODEL || 'typhoon-v2.5-30b-a3b-instruct',
    memory_usage_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    uptime_seconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Auth Verification Route
app.post('/api/auth/verify', (req, res) => {
  const { pin } = req.body;
  if (pin && pin.toString().trim() === MASTER_PIN.toString().trim()) {
    return res.json({ success: true, token: VALID_TOKEN });
  }
  return res.status(401).json({ success: false, error: 'รหัสผ่าน Master Passcode ไม่ถูกต้อง' });
});

// Check Token Route
app.get('/api/auth/check', (req, res) => {
  const authHeader = req.headers['authorization'] || req.headers['x-pk-brain-token'];
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;
  if (token === VALID_TOKEN) {
    return res.json({ authenticated: true });
  }
  return res.status(401).json({ authenticated: false });
});

// Auth Gate Middleware for Protected API Routes
app.use('/api', (req, res, next) => {
  // Allow public health and auth endpoints
  if (req.path === '/health' || req.path === '/auth/verify' || req.path === '/auth/check' || req.path.startsWith('/webhooks')) {
    return next();
  }

  const authHeader = req.headers['authorization'] || req.headers['x-pk-brain-token'];
  const token = authHeader ? authHeader.replace('Bearer ', '') : null;

  if (!token || token !== VALID_TOKEN) {
    return res.status(401).json({ error: '🔒 ไม่อนุญาตให้เข้าถึง: กรุณากรอกรหัสผ่าน Master Passcode ก่อนใช้งาน' });
  }

  next();
});

// Register API routes
app.use('/api/chat', chatRouter);
app.use('/api/knowledge', knowledgeRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/upload', uploadRouter);

// Serve Production Frontend Static Bundle directly from Express
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist, {
    maxAge: '1d',
    etag: true
  }));

  // Fallback for React SPA Client Routing
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🧠 PK Brain running in unified secure mode on http://0.0.0.0:${PORT}`);
});
