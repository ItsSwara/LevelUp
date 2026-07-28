// Local stand-in for Vercel's serverless runtime. Loads .env, parses the
// JSON body like Vercel does, and hands off to the same api/mentor.js
// handler that runs in production. Vite proxies /api/* here (port 8787).
import http from 'node:http';
import fs from 'node:fs';
import handler from './api/mentor.js';

// Minimal .env loader (no dependency needed)
try {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* no .env yet — handler will return a clear error */ }

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/api/mentor')) {
    res.statusCode = 404;
    return res.end('Not found');
  }
  let body = '';
  for await (const chunk of req) body += chunk;
  try {
    req.body = body ? JSON.parse(body) : {};
  } catch {
    req.body = {};
  }
  await handler(req, res);
});

server.listen(8787, () => {
  console.log('[dev-api] mentor endpoint on http://localhost:8787/api/mentor');
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('[dev-api] WARNING: no ANTHROPIC_API_KEY found — create a .env file (see .env.example)');
  }
});
