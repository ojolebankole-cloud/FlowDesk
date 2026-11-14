# FlowDesk implementation report — Phases 12–15

This increment continues from `FlowDesk-Phases-8-11-Implemented.zip`. It preserves the existing React/Vite frontend, NestJS API, Prisma/PostgreSQL schema and previously implemented modules.

## Source audit findings
- Existing backend modules already covered authentication, workspaces, projects, tasks, customers, invoices, calendar and basic in-app notifications.
- Existing analytics/dashboard aggregates were limited and did not provide a dedicated report API.
- Existing AI UI was not connected to a provider-backed conversation service.
- Notifications were primarily in-app; email preferences and scheduled reminder dispatch were absent.
- Task attachment records stored external HTTPS references rather than uploaded file bytes.
- The project did not have a workspace-scoped file asset/storage lifecycle.

## Phase 12 — Analytics and reporting
Implemented `GET /api/v1/workspaces/:workspaceId/reports/summary?from=&to=` with validated custom date ranges and workspace membership enforcement. The report includes financial totals grouped by currency (collected payments, expenses, profit, billed and outstanding), a revenue trend, task status distribution, project status distribution, customer growth, and record counts. A frontend analytics page consumes the API and exports a CSV report.

Important accounting boundary: revenue is cash collected from payment ledger records, not merely invoice totals. Different currencies are never combined. Profit is calculated as collected revenue minus recorded expenses. This is an operational report, not statutory accounting or tax advice.

## Phase 13 — FlowDesk AI
Implemented a server-side OpenAI-compatible chat integration configurable through `AI_PROVIDER`, `AI_BASE_URL`, `AI_MODEL` and `AI_API_KEY`. The API key remains on the backend and must never be placed in a `VITE_*` variable. Workspace members with `ai:use` permission can create conversations, retrieve chat history and ask questions. The service retrieves bounded workspace context (projects, tasks, customer count and paid-payment totals by currency), stores user/assistant messages and records token usage. AI usage summaries are restricted to owners/admins. The frontend now provides conversation history and chat UI.

Boundaries: an AI provider/key is not bundled; a valid provider account and server environment configuration are required. Context retrieval is a bounded first implementation, not full semantic/vector search. Provider pricing/cost estimates are not calculated. AI cannot execute workspace mutations. The configured provider endpoint is trusted administrator configuration. The request has a 45-second timeout.

## Phase 14 — Notifications
Implemented per-user notification preferences (in-app/email and task/project/invoice/workspace categories), notification list/read/read-all endpoints, email dispatch for task assignment and project activity, workspace invitation email delivery (existing), and a backend reminder worker for due-soon assigned tasks and invoices. The reminder worker checks preferences and suppresses duplicate reminders within a 20-hour window. Notification state remains workspace- and user-scoped.

Boundaries: delivery is email plus in-app; push notifications are not implemented. The reminder worker runs in-process and should be moved to a durable queue/worker for horizontally scaled production. SMTP configuration is required for actual email delivery; development mode logs mail payloads. Invoice reminders currently notify workspace owners/admins, not external customers.

## Phase 15 — Files and document management
Implemented workspace-scoped upload/list/download/preview/trash/restore endpoints. Uploads are limited to 20 MiB each and accepted MIME types are allowlisted with basic file-signature checks. Metadata includes checksum, size, MIME type, uploader and optional PROJECT/TASK/CUSTOMER relationship. Workspace quota defaults to 512 MiB and is configurable through `WORKSPACE_STORAGE_LIMIT_BYTES`. Files moved to trash are retained for 30 days; a cleanup routine purges expired metadata and local bytes. Downloads and previews require authenticated workspace membership and are served with content-type/nosniff headers. The frontend provides upload, relation tagging, list, preview, download and trash actions.

Boundaries: storage is local disk under `backend/storage/uploads`, suitable for local development/single-node deployment only. Production should use private S3-compatible object storage with signed URLs, malware scanning, backup/versioning and durable retention. Preview is supported for PDF, common images and plain text via browser inline display; Office document conversion previews are not included. File relationship tags are validated against workspace records. Upload quotas are enforced on current metadata but concurrent uploads need a transactional quota reservation for strict race-free enforcement. Existing TaskAttachment external-reference records remain for backward compatibility; the new FileAsset model is the preferred actual-file system.

## Database changes
Added `AiConversation`, `AiMessage`, `AiUsage`, `NotificationPreference` and `FileAsset` models plus migration `20261114230000_phases_12_15`. Added the required User and Workspace relations. The migration must be applied to a real PostgreSQL database after Prisma validation/client generation.

## Security and permissions
Added `reports:read`, `ai:use`, `files:read` and `files:write` permissions to workspace roles. Viewer is read-only for AI/files. All new APIs use session and workspace-role guards; file reads additionally verify workspace ownership of the metadata record. Provider secrets are server-side only.

## Verification status
- 62 TypeScript/TSX source files were run through TypeScript transpilation diagnostics: zero syntax diagnostics.
- Archive integrity was checked after packaging.
- Full semantic frontend/backend builds, Prisma validation/client generation, PostgreSQL migration execution, Jest tests and live API/browser tests were not run because dependencies are not installed in this environment and registry access is unavailable.
- Do not treat this increment as production-certified until the verification checklist below passes.

## Required verification before release
1. Install frontend and backend dependencies, including `multer` and `@types/multer`.
2. Run `npm run db:validate` and `npm run db:generate`.
3. Apply migrations to a fresh PostgreSQL database and to a copy of the prior development database.
4. Run frontend and backend production builds and all Jest tests.
5. Verify report totals against known invoice/payment/expense fixtures, including mixed currencies and boundary dates.
6. Test AI provider failure, timeout, missing key, workspace context isolation, conversation ownership and token usage persistence.
7. Test SMTP success/failure, notification preferences, due-soon reminders, duplicate suppression and worker restart behaviour.
8. Test file MIME/signature rejection, 20 MiB limit, quota, cross-workspace denial, preview/download headers, trash/restore and 30-day purge.
9. Move storage to private object storage and reminder delivery to a durable queue before multi-instance production deployment.
