# Phase 24 — Security & Production Infrastructure

## Implemented in source

### Priority 3: Security

1. **Redis rate limiting** — Added a Redis Lua-script-backed atomic counter middleware shared by API replicas. Login/registration routes use a tighter limit, AI routes have a dedicated limit, and general routes have a separate limit. Production refuses to start without Redis and returns 503 when the protection store is unavailable rather than silently failing open. Existing Nest throttling remains as an additional guard.
2. **Malware scanning** — Added ClamAV `INSTREAM` scanning before a file is accepted. Production rejects uploads if ClamAV is missing, unavailable, errors, or times out. Existing MIME/signature and size checks remain in place.
3. **Secret management** — Added `NAME_FILE` support for sensitive values so Docker/Kubernetes secret mounts can be read without putting secret values into source files. Production validation enforces Redis, object storage, metrics token, SMTP, TOTP and Stripe configuration. Added production environment templates and ignore rules. The operator must connect an actual secret manager/orchestrator; this repository does not create a cloud secret-manager account.
4. **Audit-log protection** — Added a migration that blocks UPDATE, DELETE and TRUNCATE against `AuditEvent` and indexes event timestamps. Production should use a distinct runtime database role without table ownership/DDL privileges; migrations must run using a separate deployment credential.
5. **Penetration testing readiness** — Added a manually triggered OWASP ZAP baseline workflow for an explicitly configured staging URL, plus dependency and Gitleaks CI checks. No live penetration test was performed: there was no deployed target, scope authorization or test credentials in this environment. A full authenticated test by an independent tester remains a launch gate.

### Priority 4: Production infrastructure

1. **Hosting/deployment** — Added `compose.production.yml`, a production API image, frontend Nginx image, SPA routing, same-origin `/api/` reverse proxy and private service networks. TLS termination and a public server/domain must be supplied by the operator.
2. **Database** — Added a PostgreSQL 16 service with persistent volume and health checks. Production API startup runs `prisma migrate deploy` before starting the server.
3. **Redis** — Added authenticated Redis 7 with append-only persistence and health checks. It is private and not host-published.
4. **Cloud/object storage** — Added AWS SDK S3-compatible storage integration. Production uploads are scanned, stored in a private S3 bucket, and downloaded through authenticated API streaming (not public URLs). Compose includes MinIO, bucket versioning, anonymous access disabled, and a bucket-scoped application policy. A managed S3 provider can replace MinIO by changing configuration.
5. **Email** — Retained and documented SMTP/Nodemailer production configuration. Provider account, SPF/DKIM/DMARC records, bounce monitoring and delivery verification must be configured by the operator.
6. **Monitoring** — Added readiness checks for PostgreSQL, Redis and object storage; authenticated Prometheus-format process metrics; and a Prometheus scrape service bound to host loopback. Infrastructure/database exporters, alertmanager, centralized logs and on-call alerts still need operator configuration.
7. **Backups/recovery** — Replaced plaintext-only database backup with `age`-encrypted backups, checksums, retention and optional off-site `rclone` replication. Added encrypted object-storage backup/restore scripts. Object bucket versioning is enabled in the MinIO stack. Schedule jobs, provision off-site storage, define RPO/RTO and perform restore drills before launch.

## Files added/changed

- `backend/src/redis-rate-limit.middleware.ts`
- `backend/src/files/malware-scanner.ts`
- `backend/src/secret-files.ts`
- `backend/src/files/files.service.ts` and `files.controller.ts`
- `backend/src/health/health.controller.ts`
- `backend/src/main.ts`, `app.module.ts`, `env.validation.ts`
- `backend/prisma/migrations/20261115010000_phase24_audit_immutability/migration.sql`
- `compose.production.yml`, `Dockerfile.frontend`, `deploy/nginx/default.conf`
- `deploy/minio/flowdesk-policy.json`, `deploy/prometheus/prometheus.yml`
- `backend/scripts/backup.sh`, `restore.sh`, `backup-objects.sh`, `restore-objects.sh`
- `.env.production.example`, `backend/.env.production.example`, `.dockerignore`, `backend/.dockerignore`
- `.github/workflows/security-audit.yml`
- `SECURITY_PRODUCTION_RUNBOOK.md`

## Verification performed

- TypeScript transpile/syntax checks passed for all changed TypeScript source files.
- Shell syntax checks passed for all four backup/restore scripts.
- YAML parsing passed for production Compose, Prometheus configuration and the security workflow.
- Static inspection of the S3 flow confirmed uploads are malware-scanned before object storage and downloads remain authenticated through the API.
- ZIP integrity checked after packaging.

## Not verified / external launch gates

- `npm install` timed out in this execution environment; therefore full NestJS typecheck/build, Prisma client generation, unit tests and integration tests were not run.
- No PostgreSQL, Redis, ClamAV, MinIO, SMTP or Stripe live/test services were available for runtime integration tests.
- No cloud host, domain, TLS certificate, managed database, managed bucket, SMTP account or secret-manager account was provisioned.
- OWASP ZAP was configured as an opt-in staging workflow but not executed; no independent penetration test was conducted.
- Backup scripts were syntax-checked but no real backup, off-site transfer or restore drill was run.

**Release decision:** The repository now contains the security integrations and a self-hosted production deployment blueprint. It is not certified production-ready until the external services are provisioned, full builds/tests pass, security testing is performed against authorized staging, and backup restoration is demonstrated.
