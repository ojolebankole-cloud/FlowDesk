# FlowDesk security and production deployment runbook (Phase 24)

## What this phase adds

- Redis-backed, atomic, per-IP/per-method/per-route request limits shared across API replicas. Production startup refuses to run without `REDIS_URL`; a Redis outage returns 503 instead of silently bypassing abuse controls.
- ClamAV `INSTREAM` malware scanning before a file is accepted. In production, scanner absence or failure rejects the upload (fail closed).
- S3-compatible object storage for production uploads, with authenticated API-streamed downloads (the bucket remains private and internal endpoints are never exposed to browsers). The Compose stack supplies private MinIO as an S3-compatible deployment target; a managed S3-compatible provider can be substituted through the same `S3_*` configuration.
- Docker/Kubernetes secret-file support using `NAME_FILE` variables. Never commit production `.env` files or credentials. Prefer a cloud secret manager or orchestrator secret store and rotate credentials.
- Append-only `AuditEvent` database triggers rejecting UPDATE, DELETE and TRUNCATE, plus a timestamp index.
- Readiness checks for PostgreSQL, Redis and object storage, authenticated Prometheus-format process metrics, and Prometheus scrape configuration.
- A production Compose topology for PostgreSQL, Redis, ClamAV, MinIO, API, frontend and Prometheus. Database/cache/scanner/object storage are on a private network and are not host-published. Configure the API database login as a runtime account without ownership/DDL privileges; run migrations with a separate deployment credential so the append-only audit trigger cannot be disabled by the runtime account.
- Encrypted database backup using `age`, checksum manifests, retention, optional off-site replication through an encrypted `rclone` remote, and guarded restore.

## Production deployment prerequisites

1. Provision a hardened Linux host or managed container platform, a DNS domain, TLS termination (Caddy/Traefik/cloud load balancer), firewall rules, and an operational on-call owner.
2. Create `.env.production` from `.env.production.example` and `backend/.env.production` from `backend/.env.production.example`. Use long unique generated credentials; use URL-safe hexadecimal passwords for PostgreSQL and Redis because the Compose file constructs connection URLs from them. Set `METRICS_TOKEN` to at least 32 random characters. Restrict file permissions (`chmod 600`). These files are examples, not credentials.
3. Set `WEB_ORIGIN`, `APP_URL`, `VITE_API_URL`, SMTP settings, Stripe live credentials, OpenRouter AI credentials, and the TOTP encryption key. Production validation intentionally refuses to start without core security and provider configuration.
4. Point DNS and TLS reverse proxy to the frontend service. The included Nginx configuration proxies same-origin `/api/` requests to the private API service; keep `VITE_API_URL=/api/v1` so the browser and session/CSRF cookies remain same-origin. Do not expose PostgreSQL, Redis, MinIO console, ClamAV or Prometheus publicly. Prometheus is bound to loopback in the Compose file; access it through an authenticated SSH tunnel or private VPN.
5. Start with `docker compose --env-file .env.production -f compose.production.yml up -d --build`. Inspect logs and `/api/v1/health/ready`; run Prisma migrations via the API container entrypoint. Configure external SMTP and verify email delivery before enabling registrations.
6. For managed object storage, replace `S3_ENDPOINT` with the provider endpoint (or unset it for AWS S3), use a dedicated least-privilege bucket policy, enable encryption-at-rest and versioning, and use a dedicated access key. MinIO in this stack is a self-hosted S3-compatible service, not an externally managed cloud account.
7. Configure `BACKUP_AGE_RECIPIENT`, install `age` and `rclone` on the backup runner, and set `BACKUP_REMOTE` to an encrypted off-site remote. Run backups on a schedule, alert on failures, and conduct restore drills. For S3 object data, configure provider-side versioning/replication and lifecycle policy; database backups alone do not back up user-uploaded objects.
8. SMTP is configured through the existing Nodemailer service. Use a transactional email provider, SPF/DKIM/DMARC, bounce monitoring, and delivery alerts. This code does not create a provider account or DNS records.

## OpenRouter AI provider

Set `AI_PROVIDER=openrouter`, `AI_BASE_URL=https://openrouter.ai/api/v1`, `AI_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free`, and `AI_API_KEY` on the backend only (or mount `AI_API_KEY_FILE`). The API calls OpenRouter's `/chat/completions` endpoint; the key is never sent to the browser. The default `AI_INCLUDE_WORKSPACE_CONTEXT=false` prevents FlowDesk from adding workspace project/task/customer/payment snapshots to prompts. The user's actual message is still sent to the selected upstream model. The currently selected free Nemotron endpoint explicitly warns against sending confidential information or personal data and states that prompts may be logged/used to improve NVIDIA services. Do not enable workspace context for production customer data unless provider terms, data processing, privacy notices, and user/customer approvals have been reviewed. Free model availability and rate limits are not an uptime or capacity guarantee.

## Secrets

`backend/src/secret-files.ts` supports `DATABASE_URL_FILE`, `REDIS_URL_FILE`, `POSTGRES_PASSWORD_FILE`, `REDIS_PASSWORD_FILE`, `SMTP_PASSWORD_FILE`, `TOTP_ENCRYPTION_KEY_FILE`, `STRIPE_SECRET_KEY_FILE`, `STRIPE_WEBHOOK_SECRET_FILE`, `AI_API_KEY_FILE`, `S3_SECRET_ACCESS_KEY_FILE`, `MINIO_ROOT_PASSWORD_FILE`, and `METRICS_TOKEN_FILE`. Mount secrets read-only and set the matching `*_FILE` variable. Do not pass secrets through `VITE_*` variables, source control, image build arguments, logs, or client-side code.

## Security testing / penetration testing

A genuine penetration test requires a deployed, authorized staging target and explicit scope. No external target, credentials, cloud account or permission to attack a live host were supplied in this development environment, so no live penetration test is claimed as completed. Before launch:

- Run dependency and secret scans in CI; remediate critical/high findings.
- Run OWASP ZAP baseline and authenticated ZAP/API tests against staging.
- Run an independent penetration test covering IDOR/cross-workspace access, session fixation/theft, CSRF, stored/reflected XSS, SSRF, upload parser/polyglot attacks, webhook replay/signature bypass, rate-limit bypass, privilege escalation and password-reset flows.
- Test Redis outage behaviour (API must fail closed), ClamAV unavailable/infected test files (upload must fail), object-store permission isolation, signed URL expiry, and audit-log mutation rejection.
- Verify no secrets or personal data appear in logs, metrics or error responses.

## Operational alerts and recovery objectives

Monitor API readiness, 5xx rate, 429 rate, Redis availability, database connections/latency, object storage errors, malware scanner health, SMTP delivery/bounces, Stripe webhook failures, queue/worker failures, disk usage, backup age and restore-drill success. Define and approve RPO/RTO with the business owner; do not assume the sample 30-day local retention is an adequate business recovery policy.

## Important limitations

This repository includes deployment templates and integrations, not a provisioned hosting account. No domain, TLS certificate, managed database, cloud bucket, SMTP account, Stripe account or secret-manager account is created by source-code changes. The included Compose stack is a self-hosted reference deployment; production operators must deploy, configure, patch, monitor and test it. Prometheus collects basic process metrics; add infrastructure/database/exporter metrics and an alert manager before production.
