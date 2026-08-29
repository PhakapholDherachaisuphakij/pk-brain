import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
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

// Enable gzip/brotli compression for fast transfer and minimal bandwidth
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Health Check
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
  console.log(`🧠 PK Brain running in unified ultra-low-resource mode on http://0.0.0.0:${PORT}`);
});
