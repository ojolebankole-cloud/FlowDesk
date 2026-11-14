#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const baseUrl = (process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
const model = process.env.AI_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free';
let apiKey = process.env.AI_API_KEY?.trim();
if (!apiKey && process.env.AI_API_KEY_FILE) {
  try { apiKey = readFileSync(process.env.AI_API_KEY_FILE, 'utf8').trim(); }
  catch { console.error('Unable to read AI_API_KEY_FILE. Check the mounted secret path and permissions.'); process.exit(2); }
}
if (!apiKey) {
  console.error('Missing AI_API_KEY or AI_API_KEY_FILE. Set it in the backend environment; do not paste it into source code.');
  process.exit(2);
}

try {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'FlowDesk connection test',
      ...(process.env.APP_URL ? { 'HTTP-Referer': process.env.APP_URL } : {}),
    },
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({
      model,
      max_tokens: 40,
      temperature: 0,
      usage: { include: true },
      messages: [{ role: 'user', content: 'Connection test. Reply with exactly: FlowDesk OpenRouter connection successful.' }],
    }),
  });

  if (!response.ok) {
    const status = response.status;
    let message = '';
    try { message = (await response.json())?.error?.message || ''; } catch {}
    console.error(`OpenRouter request failed (HTTP ${status}). ${message || 'Check the API key, model availability, account limits and provider status.'}`);
    process.exit(1);
  }

  const data = await response.json();
  const answer = data?.choices?.[0]?.message?.content;
  if (typeof answer !== 'string' || !answer.trim()) {
    console.error('OpenRouter responded but returned no text.');
    process.exit(1);
  }
  console.log('OpenRouter connection: SUCCESS');
  console.log(`Model returned: ${data.model || model}`);
  console.log(`Response: ${answer.trim()}`);
  if (data.usage) console.log(`Usage: ${data.usage.prompt_tokens ?? '?'} input / ${data.usage.completion_tokens ?? '?'} output tokens`);
  else console.log('Usage metadata was not returned by the upstream provider.');
} catch (error) {
  console.error(`OpenRouter connection test failed: ${error instanceof Error ? error.message : 'Network or runtime error'}`);
  process.exit(1);
}
