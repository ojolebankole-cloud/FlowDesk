export function validateEnvironment(values: Record<string, unknown>) {
  const env = { ...values };
  if (!env.DATABASE_URL || typeof env.DATABASE_URL !== 'string') throw new Error('DATABASE_URL is required.');
  if (env.PORT !== undefined && (!Number.isInteger(Number(env.PORT)) || Number(env.PORT) < 1 || Number(env.PORT) > 65535)) throw new Error('PORT must be a valid TCP port.');
  if (env.SESSION_TTL_DAYS !== undefined && (!Number.isInteger(Number(env.SESSION_TTL_DAYS)) || Number(env.SESSION_TTL_DAYS) < 1 || Number(env.SESSION_TTL_DAYS) > 90)) throw new Error('SESSION_TTL_DAYS must be between 1 and 90.');
  if (env.WEB_ORIGIN !== undefined) {
    if (typeof env.WEB_ORIGIN !== 'string' || !env.WEB_ORIGIN.trim()) throw new Error('WEB_ORIGIN must contain at least one trusted origin.');
    for (const item of env.WEB_ORIGIN.split(',')) {
      let url: URL;
      try { url = new URL(item.trim()); } catch { throw new Error('Every WEB_ORIGIN entry must be a valid absolute URL.'); }
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('WEB_ORIGIN entries must be origin-only HTTP(S) URLs.');
      if (env.NODE_ENV === 'production' && url.protocol !== 'https:') throw new Error('WEB_ORIGIN must use HTTPS in production.');
    }
  }
  if (env.AI_BASE_URL && typeof env.AI_BASE_URL === 'string') {
    let url: URL;
    try { url = new URL(env.AI_BASE_URL); } catch { throw new Error('AI_BASE_URL must be a valid URL.'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('AI_BASE_URL must be a credential-free HTTP(S) URL.');
    if (env.NODE_ENV === 'production' && url.protocol !== 'https:') throw new Error('AI_BASE_URL must use HTTPS in production.');
  }
  for (const key of ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'AI_API_KEY']) if (env[key] !== undefined && typeof env[key] !== 'string') throw new Error(`${key} must be a string.`);
  if (env.AI_PROVIDER !== undefined && env.AI_PROVIDER !== 'openrouter') throw new Error('AI_PROVIDER must be openrouter.');
  if (env.AI_INCLUDE_WORKSPACE_CONTEXT !== undefined && !['true', 'false'].includes(String(env.AI_INCLUDE_WORKSPACE_CONTEXT))) throw new Error('AI_INCLUDE_WORKSPACE_CONTEXT must be true or false.');
  if (env.REDIS_URL !== undefined) {
    try { const url = new URL(String(env.REDIS_URL)); if (!['redis:', 'rediss:'].includes(url.protocol)) throw new Error(); }
    catch { throw new Error('REDIS_URL must be a valid redis:// or rediss:// URL.'); }
  }
  if (env.NODE_ENV === 'production') {
    for (const key of ['POSTGRES_PASSWORD', 'REDIS_PASSWORD', 'S3_SECRET_ACCESS_KEY', 'SMTP_PASSWORD']) if (env[key] && String(env[key]).length < 16) throw new Error(`${key} must contain at least 16 characters.`);
    if (typeof env.METRICS_TOKEN !== 'string' || env.METRICS_TOKEN.length < 32) throw new Error('METRICS_TOKEN of at least 32 characters is required in production.');
    if (typeof env.REDIS_URL !== 'string' || !env.REDIS_URL) throw new Error('REDIS_URL is required in production.');
    if (!env.CLAMAV_HOST) throw new Error('CLAMAV_HOST is required in production.');
    if (!env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) throw new Error('S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY are required in production.');
    if (typeof env.WEB_ORIGIN !== 'string' || !env.WEB_ORIGIN.trim()) throw new Error('WEB_ORIGIN is required in production.');
    if (!env.SMTP_HOST || !env.SMTP_FROM) throw new Error('SMTP_HOST and SMTP_FROM are required in production.');
    if (typeof env.TOTP_ENCRYPTION_KEY !== 'string' || !/^[a-f0-9]{64}$/i.test(env.TOTP_ENCRYPTION_KEY)) throw new Error('TOTP_ENCRYPTION_KEY must be a 32-byte hex key in production.');
    if (typeof env.STRIPE_SECRET_KEY !== 'string' || !env.STRIPE_SECRET_KEY.startsWith('sk_live_')) throw new Error('A live STRIPE_SECRET_KEY is required in production.');
    if (typeof env.STRIPE_WEBHOOK_SECRET !== 'string' || !env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) throw new Error('STRIPE_WEBHOOK_SECRET is required in production.');
    if (env.COOKIE_NAME && env.COOKIE_NAME !== '__Host-flowdesk_session') throw new Error('Production COOKIE_NAME must be __Host-flowdesk_session.');
  }
  return env;
}
