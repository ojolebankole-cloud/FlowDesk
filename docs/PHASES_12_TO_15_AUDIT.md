# Pre-implementation audit — Phases 12–15

Inspected the supplied Phase 8–11 source checkpoint before changes.

## Reusable existing foundations
- Prisma/PostgreSQL workspace schema and membership model.
- SessionGuard and WorkspaceRoleGuard.
- Existing MailService and SMTP environment support.
- Existing Notification model and task/calendar in-app notification writes.
- Existing invoice/payment/expense models and task/project/customer records.
- Existing API helper with cookie credentials and Vite `/api` proxy.
- Existing React feature-page and navigation patterns.

## Gaps found
- No dedicated report endpoint or export workflow.
- AI page had not been connected to an AI provider-backed persistent conversation API.
- No AI message/conversation/usage schema.
- Notification preferences and email reminder delivery were not complete; the old calendar reminder worker only covered in-process in-app event/task reminders.
- Task attachments represented external HTTPS references rather than actual uploaded bytes.
- No file metadata, workspace quota, secure file download, preview, trash or restore lifecycle.

## Architecture decisions
- Keep the existing modular NestJS monolith and Prisma/PostgreSQL database.
- Keep all new endpoints under `/api/v1/workspaces/:workspaceId/...`.
- Reuse session and workspace-role guards.
- Keep AI provider secrets exclusively in backend environment variables.
- Keep AI chat context workspace-scoped and read-only.
- Add notification preferences to the user identity, with notification records scoped by workspace and recipient.
- Add FileAsset metadata in PostgreSQL; store file bytes outside the public frontend tree.
- Use local disk for this development increment, with an explicit production migration path to private object storage.
