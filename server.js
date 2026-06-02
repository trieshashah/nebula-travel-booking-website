// ── server.js — Nebula Travel Backend ────────────────────────────
'use strict';

const http     = require('http');
const path     = require('path');
const fs       = require('fs');
const dispatch = require('./backend/router');

const PORT = process.env.PORT || 3000;

// ── CORS Headers ──────────────────────────────────────────────────
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, token, authorization');
  res.setHeader('Access-Control-Max-Age',       '86400');
}

// ── Static File MIME Map ──────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
};

// ── Static File Server ────────────────────────────────────────────
const FRONTEND_DIR = path.join(__dirname, 'frontend');

function serveStatic(req, res) {
  let filePath = path.join(FRONTEND_DIR, req.url.split('?')[0]);

  // Default to index.html
  if (filePath.endsWith('/') || !path.extname(filePath)) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Fallback: send index.html for client-side routing
      const index = path.join(FRONTEND_DIR, 'index.html');
      fs.readFile(index, (e2, d2) => {
        if (e2) { res.writeHead(404); res.end('404 Not Found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(d2);
      });
      return;
    }
    const ext  = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

// ── HTTP Server ───────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  setCORSHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url;
  console.log(`[${new Date().toLocaleTimeString('en-IN')}] ${req.method} ${url}`);

  // API routes → router
  if (url.startsWith('/api/')) {
    await dispatch(req, res);
    return;
  }

  // Everything else → static frontend files
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║        ✦ NEBULA TRAVEL BACKEND ONLINE ✦          ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`  API:      http://localhost:${PORT}/api`);
  console.log(`  Frontend: http://localhost:${PORT}`);
  console.log(`  Env:      ${process.env.NODE_ENV || 'development'}`);
  console.log('──────────────────────────────────────────────────\n');
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`✗ Port ${PORT} already in use. Set PORT env variable.`);
  } else {
    console.error('✗ Server error:', err.message);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT',  () => { console.log('\n✦ Shutting down...'); server.close(() => process.exit(0)); });
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
