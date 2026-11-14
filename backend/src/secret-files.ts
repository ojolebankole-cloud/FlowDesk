import { readFileSync } from 'fs';

/** Docker/Kubernetes secret-file support; *_FILE values override plaintext environment values. */
export function loadSecretFiles(env: NodeJS.ProcessEnv = process.env): void {
  const keys = ['DATABASE_URL','REDIS_URL','POSTGRES_PASSWORD','REDIS_PASSWORD','SMTP_PASSWORD','TOTP_ENCRYPTION_KEY','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','AI_API_KEY','S3_SECRET_ACCESS_KEY','MINIO_ROOT_PASSWORD','METRICS_TOKEN'];
  for (const key of keys) {
    const file = env[`${key}_FILE`];
    if (!file) continue;
    const value = readFileSync(file, 'utf8').trim();
    if (!value) throw new Error(`${key}_FILE points to an empty secret file.`);
    env[key] = value;
  }
}
