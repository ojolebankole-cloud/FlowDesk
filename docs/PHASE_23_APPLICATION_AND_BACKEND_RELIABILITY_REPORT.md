# Phase 23 — Application Correctness & Backend Reliability

**Source of truth:** `FlowDesk-Phase-22-Advanced-Motion.zip`
**Scope:** Priority 1 application correctness and Priority 2 backend reliability.

## Implemented

### 1. Removed misleading browser-local business-data fallbacks

- The authenticated app no longer hydrates projects, tasks, customers, invoices, and calendar business records from the browser's scoped local-storage cache.
- The Home page now uses server-returned overview metrics and task data only.
- Failed overview/task requests show explicit unavailable states instead of silently substituting cached/demo values.
- The Dashboard no longer derives revenue, record counts, task progress, or recent activity from browser-local records when the API fails.
- Dashboard values show a waiting/unavailable state while the server request is pending or failed.
- Removed the task-count navigation badge that was previously derived from an intentionally empty local cache.
- Data export copy now accurately states that it exports device preferences, not a complete server-side workspace backup.

### 2. Replaced the obsolete task attachment interaction

- Removed the old HTTPS-URL attachment prompt and deprecated task-attachment API method/route.
- Task cards now upload attachments through the existing authenticated workspace FileAsset API.
- Task attachment uploads include the CSRF header required by the API's cookie-session protection.
- Task cards list uploaded task files with authenticated download links.
- Task file lookup is best-effort so a file entitlement/permission failure does not prevent the task board itself from loading.
- File uploads now enforce the subscription's `files` entitlement in addition to existing file type, signature, size, workspace quota and role checks.

### 3. Workspace and settings workflow improvements

- Replaced the browser `prompt()` workspace picker with an application modal.
- The modal supports switching between server-listed workspaces, creating a workspace, and accepting an invitation token.
- Workspace selection remains a device preference; workspace membership and records remain server-managed.
- Settings now surface workspace/member/invitation load errors instead of silently swallowing them.
- Settings validate workspace-edit permission before saving profile data, preventing a predictable partial save for non-admin members.
- Data/privacy export wording and contents now match the actual device-preferences-only export.
- Task creation and assignment now use real workspace-member data and member selectors instead of asking users to paste opaque member IDs.

### 4. Backend resource limits and entitlements

- Project creation checks the active subscription's plan limit before creating another active project.
- Workspace invitation creation counts both current members and unexpired pending invitations against the plan member allowance.
- Existing invitation acceptance member-limit validation remains in place.
- File upload requires a plan that includes the `files` feature.
- Analytics/report access requires a plan that includes the `reports` feature.
- AI chat requires a plan that includes the `ai` feature.
- AI chat now enforces a monthly workspace token ceiling: Business defaults to 500,000 tokens and Scale to 2,000,000 tokens. An operator can override the global ceiling with the `PlatformSetting` key `aiMonthlyTokenLimit` (positive numeric value). This is a baseline policy introduced in this phase and should be reviewed against actual provider pricing before launch.

### 5. Background processing reliability

- Calendar reminder delivery now claims each due reminder using a conditional database update inside a transaction before creating its notification. Concurrent worker instances cannot both claim the same undelivered reminder.
- Notification reminder creation now performs its recent-duplicate check and notification insert in one database transaction.
- Stripe API calls now have a 15-second timeout and return controlled service-unavailable errors for timeout/network failures.

### 6. Multi-tenant isolation review

Reviewed workspace-scoped data paths in project, task, file, report, calendar, invoice, customer, billing, and AI services. Existing workspace predicates and membership checks were retained. The updated task file listing is filtered by `entityType=TASK` and each card is further filtered by the task ID. This was a source review, not a live cross-tenant penetration test.

### 7. Migration structure review

- Reviewed the six ordered Prisma migration directories through Phase 20.
- A static model/table comparison found all 38 Prisma models have a corresponding `CREATE TABLE` statement in the migration history.
- Migration foreign-key and index statements were counted and reviewed for structural continuity.
- No migration was rewritten because the archive does not include a configured database or migration history from a live deployment.

## Verification performed

| Check | Result |
|---|---|
| Source archive extracted and inspected | Passed |
| Changed frontend/backend TypeScript files transpile syntax check | Passed (15 files) |
| Static Prisma model-to-migration table coverage | Passed (38/38 models) |
| Full frontend TypeScript typecheck | Not completed — dependencies are not installed |
| Frontend production build | Not completed — dependencies are not installed |
| Prisma schema validation | Not completed — Prisma CLI is not installed |
| Backend Nest build | Not completed — Nest CLI is not installed |
| Backend automated tests | Not completed — Jest is not installed |
| Live migration deploy/rollback | Not run — no database connection supplied |
| Stripe test-mode checkout/webhooks | Not run — no Stripe test credentials or webhook endpoint supplied |
| Cross-tenant integration tests | Not run — no running database/API test environment supplied |
| Multi-instance worker race test | Not run — requires a running database and multiple worker instances |

A dependency installation was attempted but timed out. The source-only TypeScript transpile check validates syntax, not type correctness or runtime behaviour.

## Remaining release blockers / operator actions

1. Install dependencies in a network-enabled build environment and run frontend typecheck/build, backend build, Prisma validate and automated tests.
2. Run `prisma migrate deploy` against a disposable PostgreSQL database, then test a clean install and an upgrade from a representative Phase 20 database snapshot.
3. Add integration tests for workspace isolation, invitation quota concurrency, project quota enforcement, AI entitlement/token limits, file entitlement, and reminder idempotency across multiple workers.
4. Confirm the AI token budgets against provider model prices and configure `aiMonthlyTokenLimit` deliberately.
5. Test Stripe Checkout, portal, cancellation, renewal, failed payment, duplicate webhook, and out-of-order webhook cases using Stripe test mode.
6. Implement durable email delivery/retry tracking. Existing worker email sends can still fail independently of in-app notification creation; this phase did not add a persistent mail queue.
7. The AI monthly limit is a preflight check, not an atomic token reservation. Simultaneous requests can temporarily exceed the configured ceiling; a durable usage reservation/queue is needed for strict financial enforcement.
8. Verify task attachment deletion/retention policies and malware scanning before enabling unrestricted production uploads.

## Conclusion

Priority 1 has been materially improved: business-data fallbacks have been removed from the active home/dashboard surfaces, the obsolete URL-based task attachment path has been replaced with the workspace file service, and workspace/settings flows are clearer and server-backed.

Priority 2 has received additional quota, entitlement, billing-network, and worker-idempotency protections. The code is not certified production-ready until the blocked build, database, integration, Stripe and multi-instance tests above are run in an environment with the required dependencies and services.
