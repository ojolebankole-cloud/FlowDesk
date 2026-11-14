# Phase 21 — Security hardening

## Implemented

- HTTP hardening via Helmet: CSP, frame-ancestor denial, no object embedding, MIME sniffing protection, referrer policy, no `X-Powered-By`, and no-store API responses.
- Explicit CORS origin allow-list, credentials support, bounded preflight cache, and restricted request headers.
- CSRF defence for cookie-authenticated state-changing requests: same-origin allow-list plus a random double-submit token cookie/header checked with constant-time comparison. The web API client automatically sends `X-CSRF-Token` for unsafe methods. Logout clears both cookies.
- Global request throttling (120/minute), existing stricter auth endpoint throttles, and AI chat (8/minute) and upload (10/minute) limits.
- Global DTO validation rejects unknown fields and transforms validated values; auth DTOs constrain names, emails, passwords and one-time codes. AI chat bounds message and conversation ID inputs.
- Prisma ORM query construction is used throughout the inspected backend; no raw SQL execution was found in the source tree. Prisma parameterizes generated SQL. Do not introduce `$queryRawUnsafe`/`$executeRawUnsafe` with user input.
- Session cookies are HttpOnly, SameSite=Lax, Secure in production; production defaults to a `__Host-` cookie name. Session tokens are stored as SHA-256 hashes, expiration and active-user state are checked, and password reset revokes all sessions.
- Workspace role and membership checks remain enforced at controller/service boundaries; plan entitlements are checked in the workspace role guard. AI conversation queries are scoped by workspace and user.
- Uploads remain outside the public web root, have one-file/20 MiB limits, server-generated names/extensions, a MIME allow-list, content signature checks, checksums, workspace quota enforcement, and attachment relationship validation. Download responses use nosniff and safe content disposition.
- Production environment validation now requires HTTPS origins, a valid encrypted TOTP key, SMTP configuration, live Stripe credentials/webhook secret, and an explicit production cookie name.
- Added an operational backup script for PostgreSQL and upload storage with checksums and retention.

## Operational requirements / residual controls

1. Configure TLS at the reverse proxy/load balancer. Set `TRUST_PROXY=true` only when the API is behind a trusted proxy that overwrites forwarded headers.
2. Use a shared Redis-backed throttler store for multi-replica production. The bundled Nest throttler default store is process-local; per-instance limits are not a distributed abuse boundary.
3. Store production secrets in a managed secret manager (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, or equivalent). Rotate database, Stripe, SMTP, AI and TOTP keys; never commit `.env` files or expose secrets via `VITE_*` variables.
4. Run `backend/scripts/backup.sh` on a scheduled host with encrypted off-site backup storage. Restore with `DB_BACKUP=/path/to/flowdesk-<stamp>.sql.gz CONFIRM_DESTRUCTIVE_RESTORE=YES DATABASE_URL=... backend/scripts/restore.sh` (add `UPLOAD_BACKUP` and `UPLOAD_RESTORE_PARENT` to restore uploaded files). Test restores regularly; these scripts do not configure a scheduler, encryption-at-rest or a recovery-point objective.
5. Add malware scanning/quarantine and archive-bomb inspection before enabling arbitrary document uploads at scale. Current ZIP-based Office validation checks the ZIP signature, not the internal document structure.
6. Review platform-admin grants and role changes periodically; enforce MFA for privileged accounts operationally. Audit events should be retained and exported to tamper-resistant storage for production compliance.
7. The current origin+double-submit CSRF controls assume the web app and API share the configured trusted-origin relationship. If deploying cross-site, use a dedicated CSRF design and `SameSite=None; Secure` only with explicit threat review.

## Verification

The archive was inspected before changes. Build/test results are recorded in the handoff after running available checks. A production deployment is not security-certified by these code changes alone; complete the operational requirements above before handling real customer data.

## Validation status

Dependency installation was attempted in the execution environment but did not complete before its time limit. Therefore TypeScript compilation, automated tests, Prisma validation and a live penetration test could not be run here. Do not treat this handoff as a passed build or security certification; run the project build and test scripts in CI before deployment.
