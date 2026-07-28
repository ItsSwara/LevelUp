// Vercel serverless function — the ONLY place the API key exists.
// The browser posts {system, messages, tools} here; we add the secret
// key server-side and forward to Anthropic. Locally, dev-api.mjs serves
// this same handler on port 8787.
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'POST only' }));
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not set on the server' }));
  }

  try {
    const { system, messages, tools } = req.body ?? {};
    const client = new Anthropic();

    const response = await client.beta.messages.create({
      model: process.env.MENTOR_MODEL || 'claude-opus-5',
      max_tokens: 1500,
      // If a safety classifier declines a request, re-serve it with
      // Anthropic's recommended fallback model instead of failing.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      messages,
      tools,
    });

    res.statusCode = 200;
    res.end(JSON.stringify({
      content: response.content,
      stop_reason: response.stop_reason,
    }));
  } catch (err) {
    res.statusCode = err?.status ?? 500;
    res.end(JSON.stringify({ error: err?.message ?? 'Unknown server error' }));
  }
}
