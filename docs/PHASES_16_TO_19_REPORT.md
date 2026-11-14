# FlowDesk implementation report — Phases 16–19

## Source checkpoint
Continued from `FlowDesk-Phases-12-15-Implemented.zip`, preserving the prior React/Vite frontend, NestJS API, PostgreSQL/Prisma data model, workspace isolation and all features from phases 0–15.

## Phase 16 — Complete Settings
- Persisted personal preferences in `UserPreference`, linked to the authenticated account and synchronized through `GET/PATCH /users/me/preferences`.
- Preferences include theme selection, locale, date format, week start, compact layout, email digest and product-update preference.
- Existing profile and workspace identity editing retained; team invitations/roles, 2FA, recovery codes, active-session revocation, appearance, AI server configuration, data export and sign-out remain in Settings.
- Profile, workspace and preferences use authenticated APIs; browser-only cache export is clearly labeled as such.

## Phase 17 — Admin console foundation
- Added platform administration navigation and a dedicated administration workspace.
- Platform access is separate from workspace roles. API endpoints enforce platform role checks server-side; UI visibility is only a convenience, not authorization.
- Overview reports registered/active users, workspaces, active sessions, active files and stored bytes.
- Added searchable audit history view and persistent audit events for administrative changes.

## Phase 18 — Admin user and workspace management
- Searchable, paginated user directory with status and platform role.
- Administrators can suspend/reactivate accounts; suspension revokes active sessions.
- Only super administrators can change platform roles. Self-role changes are blocked, and the last active super administrator cannot be demoted or suspended.
- Workspace directory includes owner and membership/project/task/file counts; administrators can suspend/reactivate a workspace and correct its name.
- Suspended workspaces are blocked by workspace membership/service checks, not merely hidden in the UI.

## Phase 19 — Admin platform configuration
- Added database-backed, allowlisted configuration for registration, maintenance mode/message, support email, public announcement, AI availability, email delivery and default workspace storage quota.
- Only `SUPER_ADMIN` can change platform configuration. Credentials, SMTP passwords and AI API keys are intentionally not exposed or editable through this UI; they remain server environment secrets.
- Registration, maintenance gate, AI availability, email delivery and default storage quota are wired to the stored configuration.
- Every administrative configuration change is written to the audit log.

## Migration
`backend/prisma/migrations/20261114240000_phases_16_19/migration.sql` adds `WorkspaceStatus`, workspace suspension fields, `UserPreference` and `PlatformSetting`.

## Validation and honest limitations
- TypeScript/TSX syntax transpilation: 68 source files checked, zero syntax diagnostics.
- Package JSON and migration file integrity are checked when packaging.
- Full semantic TypeScript builds, Prisma schema validation/client generation, database migration execution, automated tests and live browser/API tests were not run because project dependencies and a configured PostgreSQL environment are not available in this execution environment.
- Platform roles are not self-service. A trusted operator must provision the first `ADMIN`/`SUPER_ADMIN` account out of band. No insecure public bootstrap endpoint has been added.
- The announcement is stored and exposed in admin configuration; a global announcement banner/client delivery mechanism is not yet implemented.
- Locale/date format/compact layout are persisted preferences; broad application-wide localization and compact-density styling are not fully applied across every existing screen yet.
- Maintenance mode is enforced at authenticated API session checks. Public marketing/static frontend availability and a dedicated maintenance landing page are not part of this phase.
- Email digest preference is persisted, but scheduled digest generation/delivery is not yet implemented.
- Default quota applies to new file upload checks; it is a default policy and does not retroactively resize existing workspaces. Per-workspace quota overrides are not yet included.
