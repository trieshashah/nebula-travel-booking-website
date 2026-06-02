// ── utils/parseBody.js ────────────────────────────────────────────
// Manually reads and parses the JSON body from an incoming request.
'use strict';

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk.toString();
      if (raw.length > 1_000_000) {         // 1 MB guard
        req.destroy();
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      if (!raw.trim()) { resolve({}); return; }
      try { resolve(JSON.parse(raw)); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

module.exports = parseBody;
