# FlowDesk implementation report — Phases 4–7

## Executive summary

This release adds server-backed profile and workspace identity, workspace membership and invitation flows, role-aware service authorization, project management APIs, project milestones/activity, and a database-backed dashboard aggregation endpoint. The frontend now loads the authenticated user's workspace list, allows workspace switching/creation/invitation acceptance, scopes its remaining browser preview records by user + workspace, saves profile/workspace identity to the API, exposes team management in Settings, uses the server dashboard endpoint, and uses the server project API for the Projects board.

This is an implementation increment, not a claim that the entire FlowDesk product is finished. Phases 8–23 remain outstanding. A clean install, Prisma generation/migration, build and end-to-end test run could not be completed in this environment because dependencies are not installed and package registry access was unavailable. Do not treat the release as production-certified until the verification checklist below passes.

## Phase 4 — User profiles and workspace management

### Implemented
- User profile read/update endpoints: `GET /api/v1/users/me`, `PATCH /api/v1/users/me`.
- Profile fields: display name, HTTPS avatar URL, bio, timezone. Avatar binary upload is intentionally deferred to the file-storage phase.
- Workspace creation, listing, retrieval and editing.
- New registrations automatically receive a personal OWNER workspace.
- Workspace switching in the frontend; selected workspace is remembered locally.
- Workspace membership listing.
- Invitation creation with a hashed, seven-day acceptance token; invitee must authenticate with the invited email address.
- Transactional invitation email delivery through the existing SMTP mail service; development mode logs the invitation link and surfaces the token for local testing.
- Invitation listing and revocation.
- Invitation acceptance and role assignment.
- Member removal with owner/admin restrictions.
- Workspace IDs are required on workspace-scoped APIs and membership is checked server-side.

### Boundaries
- Production invitation email requires valid SMTP settings. Without SMTP, development mode logs the link and exposes the token in the inviter UI. Verify the email flow and token expiry before public launch.
- Workspace selection is integrated, but the legacy Tasks, Customers, Invoices, Calendar and Analytics CRUD screens still use browser preview records. They are not yet persisted to PostgreSQL. The browser preview store is now separated by user and workspace to prevent accidental cross-workspace display on the same browser.

## Phase 5 — Roles and permissions

### Implemented
- Workspace role matrix: OWNER, ADMIN, MANAGER, MEMBER, VIEWER.
- Central permission definitions in `backend/src/common/roles.ts`.
- Workspace membership authorization checks in workspace/project services.
- Project creation/update/archive/delete restrictions enforced both by route-level role guards and service-level checks.
- Workspace edit restrictions.
- Invitation and role-assignment restrictions.
- Ownership cannot be granted through ordinary invitation or role assignment.
- Team settings UI supports invite creation, role updates and member removal.
- Unit tests for key permission-matrix expectations.

### Boundaries
- The role guard is available as a Nest guard, while current workspace services also enforce the role checks directly. Future modules must use the same permission vocabulary and must not rely on frontend visibility for security.
- Ownership transfer, custom roles, and a full permission-administration UI are not implemented.

## Phase 6 — Home and dashboard

### Implemented
- Dashboard and Home call `GET /api/v1/workspaces/:workspaceId/dashboard/overview`.
- Server verifies workspace membership before returning data.
- Real server aggregates for active projects, paid revenue, paid/outstanding invoice counts and amount, newly created customers, task status counts, upcoming events and recent projects.
- Date range filtering in the dashboard UI (7 days, 30 days, 12 months).
- Revenue series built from paid invoice records and paid dates; no estimated revenue is generated. Totals avoid combining currencies: mixed-currency revenue is reported as separate currency buckets, and the single-total KPI is withheld when currencies differ.
- Task progress and record distribution use server aggregates where those records exist.
- Dashboard AI entry point remains accessible.

### Boundaries
- Task, customer, invoice and calendar database models are present, but their full CRUD APIs and frontend screens are scheduled for their later feature phases. Until then those server-side KPI categories may correctly show zero.
- Expenses, profit, conversion rates and other metrics are not invented or displayed as if they were real.
- Dashboard AI link opens the current assistant interface; a working AI provider/context service remains Phase 13.

## Phase 7 — Project management

### Implemented
- PostgreSQL project model with workspace isolation.
- Project create/list/detail/update/archive/delete endpoints.
- Search by project name/description.
- Project status and priority.
- Start/due dates, budget, currency, progress and assignee fields.
- Project milestones with completion action.
- Project activity records for create/update/archive/milestone events.
- Server-side membership and role enforcement.
- Frontend project board now reads and writes through the server API.
- Project detail panel shows milestones and recent project activity.

### Boundaries
- Project assignment currently stores a user ID but a dedicated assignee picker/member validation UI is still needed.
- Task relationships exist in the schema, but task CRUD, subtasks, comments, dependencies and time tracking belong to Phase 8.
- Project file attachments belong to Phase 15.
- Permanent delete is restricted to OWNER/ADMIN; archive is available to OWNER/ADMIN/MANAGER.

## Database and migration

Added migration:
`backend/prisma/migrations/20261114213000_workspaces_projects_dashboard/migration.sql`

It extends User and Workspace, adds invitation, project, milestone, project activity, task, customer, invoice and calendar-event tables, enums, indexes and foreign keys.

## API inventory

### Profiles
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`

### Workspaces
- `GET /api/v1/workspaces`
- `POST /api/v1/workspaces`
- `GET /api/v1/workspaces/:workspaceId`
- `PATCH /api/v1/workspaces/:workspaceId`
- `GET /api/v1/workspaces/:workspaceId/members`
- `POST /api/v1/workspaces/:workspaceId/invitations`
- `POST /api/v1/workspaces/invitations/accept`
- `PATCH /api/v1/workspaces/:workspaceId/members/:memberId/role`
- `DELETE /api/v1/workspaces/:workspaceId/members/:memberId`

### Projects
- `GET /api/v1/workspaces/:workspaceId/projects?q=`
- `POST /api/v1/workspaces/:workspaceId/projects`
- `GET /api/v1/workspaces/:workspaceId/projects/:projectId`
- `PATCH /api/v1/workspaces/:workspaceId/projects/:projectId`
- `POST /api/v1/workspaces/:workspaceId/projects/:projectId/archive`
- `DELETE /api/v1/workspaces/:workspaceId/projects/:projectId`
- `POST /api/v1/workspaces/:workspaceId/projects/:projectId/milestones`
- `POST /api/v1/workspaces/:workspaceId/projects/:projectId/milestones/:milestoneId/complete`

### Dashboard
- `GET /api/v1/workspaces/:workspaceId/dashboard/overview?from=&to=`

## Required verification before production

1. Install frontend and backend dependencies from lockfiles (lockfiles should be generated and committed in the next verification pass).
2. Run `npx prisma validate` and `npx prisma generate`.
3. Apply migrations to a fresh PostgreSQL database using `npx prisma migrate deploy`.
4. Build frontend and backend with TypeScript checks enabled.
5. Run backend unit tests.
6. Test cross-workspace access denial using two accounts and two workspaces.
7. Test role matrix against every mutating endpoint.
8. Test invitation expiration, email mismatch, duplicate membership and token reuse.
9. Test project CRUD, milestone lifecycle, archive and permanent deletion.
10. Test dashboard totals against seeded records, including date boundaries and paid invoice dates.
11. Add invitation email delivery, avatar uploads, task/customer/invoice/calendar CRUD before calling the full app production-ready.
