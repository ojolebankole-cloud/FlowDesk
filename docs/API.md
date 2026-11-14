# FlowDesk API v1 — Phase 2/3

All endpoints are under `/api/v1`. Browser session endpoints require the `flowdesk_session` HttpOnly cookie unless marked public.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | Public | API + PostgreSQL readiness |
| POST | `/auth/register` | Public | Create pending account; send verification email |
| POST | `/auth/verify-email` | Public | Consume verification token |
| POST | `/auth/login` | Public | Verify credentials; optionally require TOTP/recovery code; set session cookie |
| POST | `/auth/forgot-password` | Public | Request a generic password-reset response |
| POST | `/auth/reset-password` | Public | Consume reset token, update password and revoke sessions |
| GET | `/auth/me` | Session | Current user profile |
| POST | `/auth/logout` | Session | Revoke current session and clear cookie |
| POST | `/auth/2fa/setup` | Session | Generate TOTP secret and otpauth URI |
| POST | `/auth/2fa/enable` | Session | Verify TOTP and return one-time recovery codes |
| POST | `/auth/2fa/disable` | Session | Verify TOTP then disable 2FA |
| GET | `/auth/sessions` | Session | List current user's sessions |
| DELETE | `/auth/sessions/:id` | Session | Revoke one of current user's sessions |

## Local development email
If SMTP is not configured and `NODE_ENV` is not `production`, verification/reset links are written to the API process log for local testing. In production, SMTP must be configured; the service refuses to pretend an email was delivered.

## Login with 2FA
First submit email and password. If a second factor is required, the response contains `requiresTwoFactor: true`. Submit the same email/password plus `totpCode` (or a one-use recovery code) to complete login. The challenge marker is a UI state only; password verification is repeated on the second request.

## Phase 4–7 endpoints

All endpoints below require the server-managed session cookie except the existing public auth endpoints. Workspace endpoints verify membership before returning data or changing records.

### Profile
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me` — accepts `name`, `avatarUrl` (HTTPS URL), `bio`, `timezone`.

### Workspaces and members
- `GET /api/v1/workspaces`
- `POST /api/v1/workspaces` — `{ "name": "Design Studio", "description": "..." }`
- `GET /api/v1/workspaces/:workspaceId`
- `PATCH /api/v1/workspaces/:workspaceId`
- `GET /api/v1/workspaces/:workspaceId/members`
- `GET /api/v1/workspaces/:workspaceId/invitations`
- `POST /api/v1/workspaces/:workspaceId/invitations` — `{ "email": "member@example.com", "role": "MEMBER" }`
- `DELETE /api/v1/workspaces/:workspaceId/invitations/:invitationId`
- `POST /api/v1/workspaces/invitations/accept` — `{ "token": "..." }`
- `PATCH /api/v1/workspaces/:workspaceId/members/:memberId/role` — `{ "role": "MANAGER" }`
- `DELETE /api/v1/workspaces/:workspaceId/members/:memberId`

### Projects
- `GET /api/v1/workspaces/:workspaceId/projects?q=term`
- `POST /api/v1/workspaces/:workspaceId/projects`
- `GET /api/v1/workspaces/:workspaceId/projects/:projectId`
- `PATCH /api/v1/workspaces/:workspaceId/projects/:projectId`
- `POST /api/v1/workspaces/:workspaceId/projects/:projectId/archive`
- `DELETE /api/v1/workspaces/:workspaceId/projects/:projectId`
- `POST /api/v1/workspaces/:workspaceId/projects/:projectId/milestones`
- `POST /api/v1/workspaces/:workspaceId/projects/:projectId/milestones/:milestoneId/complete`

### Dashboard
- `GET /api/v1/workspaces/:workspaceId/dashboard/overview?from=ISO_DATE&to=ISO_DATE`


## Phase 8 — Tasks
All routes require a valid session and workspace membership/permission.
- `GET /api/v1/workspaces/:workspaceId/tasks?q=&status=&view=`
- `POST /api/v1/workspaces/:workspaceId/tasks`
- `GET /api/v1/workspaces/:workspaceId/tasks/:id`
- `PATCH /api/v1/workspaces/:workspaceId/tasks/:id`
- `DELETE /api/v1/workspaces/:workspaceId/tasks/:id`
- `POST /api/v1/workspaces/:workspaceId/tasks/:id/subtasks`
- `POST /api/v1/workspaces/:workspaceId/tasks/:id/dependencies`
- `DELETE /api/v1/workspaces/:workspaceId/tasks/:id/dependencies/:dependencyId`
- `POST /api/v1/workspaces/:workspaceId/tasks/:id/comments`
- `POST /api/v1/workspaces/:workspaceId/tasks/:id/attachments` (secure HTTPS reference metadata; binary uploads are Phase 15)
- `GET /api/v1/workspaces/:workspaceId/notifications`
- `POST /api/v1/workspaces/:workspaceId/notifications/:id/read`

## Phase 9 — CRM
- `GET /api/v1/workspaces/:workspaceId/customers?q=&category=`
- `POST /api/v1/workspaces/:workspaceId/customers`
- `PATCH /api/v1/workspaces/:workspaceId/customers/:id`
- `DELETE /api/v1/workspaces/:workspaceId/customers/:id`
- `POST /api/v1/workspaces/:workspaceId/customers/:id/notes`
- `POST /api/v1/workspaces/:workspaceId/customers/:id/activities`
- `GET /api/v1/workspaces/:workspaceId/customers/:id/history`

## Phase 10 — Finance
- `GET /api/v1/workspaces/:workspaceId/invoices?q=&status=`
- `POST /api/v1/workspaces/:workspaceId/invoices`
- `GET /api/v1/workspaces/:workspaceId/invoices/:id`
- `PATCH /api/v1/workspaces/:workspaceId/invoices/:id`
- `POST /api/v1/workspaces/:workspaceId/invoices/:id/send`
- `POST /api/v1/workspaces/:workspaceId/invoices/:id/payments`
- `POST /api/v1/workspaces/:workspaceId/invoices/:id/void`
- `GET /api/v1/workspaces/:workspaceId/expenses`
- `POST /api/v1/workspaces/:workspaceId/expenses`
- `DELETE /api/v1/workspaces/:workspaceId/expenses/:id`
- `GET /api/v1/workspaces/:workspaceId/financial-report?from=&to=`

Invoice PDF presentation is rendered as a print-ready browser document; users can choose “Save as PDF” in the print dialog. A server-side PDF rendering service is not included in this increment. Payments are manually recorded ledger entries; no external payment gateway is connected.

## Phase 11 — Calendar and notifications
- `GET /api/v1/workspaces/:workspaceId/calendar/events?from=&to=`
- `POST /api/v1/workspaces/:workspaceId/calendar/events`
- `PATCH /api/v1/workspaces/:workspaceId/calendar/events/:id`
- `DELETE /api/v1/workspaces/:workspaceId/calendar/events/:id`
- `GET /api/v1/workspaces/:workspaceId/notifications`
- `POST /api/v1/workspaces/:workspaceId/notifications/:id/read`

Calendar supports monthly, weekly and daily views, dated tasks, project milestones, event CRUD, basic DAILY/WEEKLY/MONTHLY recurrence rules and in-app event/task reminders. External calendar provider sync (Google/Outlook) is not connected; recurrence supports a deliberately limited RRULE subset rather than the full RFC feature set.

## Phases 12–15 endpoints

- `GET /workspaces/:workspaceId/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD` — workspace financial/productivity/customer report.
- `GET /workspaces/:workspaceId/ai/conversations` — current user's conversations.
- `GET /workspaces/:workspaceId/ai/conversations/:id` — conversation history.
- `POST /workspaces/:workspaceId/ai/chat` — `{ "message": "...", "conversationId": "optional" }`.
- `GET /workspaces/:workspaceId/ai/usage` — owner/admin token usage summary.

The AI API calls OpenRouter from the backend using `AI_API_KEY`; the browser never receives the provider key. The default free model is `nvidia/nemotron-3-ultra-550b-a55b:free`. `AI_INCLUDE_WORKSPACE_CONTEXT=false` is the safe default for this free upstream endpoint; when false, FlowDesk does not attach project/task/customer/payment snapshots to the prompt. The user's message is still sent to OpenRouter.
- `GET /workspaces/:workspaceId/notifications` — notifications.
- `PATCH /workspaces/:workspaceId/notifications/:id/read` and `POST .../read-all` — read state.
- `GET/PATCH /workspaces/:workspaceId/notifications/preferences/me` — per-user preferences.
- `GET /workspaces/:workspaceId/files` — active file metadata; `?trash=true` lists trashed files.
- `POST /workspaces/:workspaceId/files/upload` — multipart `file`, optional `entityType` (`PROJECT`, `TASK`, `CUSTOMER`) and `entityId`.
- `GET /workspaces/:workspaceId/files/:id/download` — authenticated download; `?inline=true` previews supported MIME types.
- `DELETE /workspaces/:workspaceId/files/:id` — move to 30-day trash; `POST .../:id/restore` — restore.

## Phases 16–19: settings and platform administration

- `GET /api/v1/users/me/preferences` — read cross-device personal preferences.
- `PATCH /api/v1/users/me/preferences` — update validated theme, locale, date format, week start, compact layout, email digest and product-update preferences.
- `GET /api/v1/admin/overview` — platform counts and storage usage (platform administrators/support).
- `GET /api/v1/admin/users?q=&page=&limit=` — searchable, paginated user directory.
- `PATCH /api/v1/admin/users/:id` — suspend/reactivate users; platform role changes require `SUPER_ADMIN`. Suspension revokes sessions.
- `GET /api/v1/admin/workspaces?q=&page=&limit=` — searchable, paginated workspace directory with owner and usage counts.
- `PATCH /api/v1/admin/workspaces/:id` — update workspace name or set ACTIVE/SUSPENDED.
- `GET /api/v1/admin/settings` — read non-secret platform configuration.
- `PATCH /api/v1/admin/settings` — update operational flags and defaults; requires `SUPER_ADMIN`.
- `GET /api/v1/admin/audit?page=&limit=` — recent audit events.

Migration: `20261114240000_phases_16_19`. Platform roles are distinct from workspace roles. Never promote an account by editing the database from a public client; initial platform administrators must be provisioned through a trusted operator/database procedure.

## Billing and subscriptions — Phase 20

- `GET /api/v1/billing/plans` — public plan catalogue.
- `GET /api/v1/billing/workspaces/:workspaceId` — workspace subscription, plan, billing customer and invoice history (workspace owner/admin only).
- `POST /api/v1/billing/workspaces/:workspaceId/checkout` — create hosted provider checkout (`{ "planCode": "STARTER|BUSINESS|SCALE", "interval": "month|year" }`).
- `POST /api/v1/billing/workspaces/:workspaceId/cancel` — schedule cancellation at period end.
- `POST /api/v1/billing/workspaces/:workspaceId/resume` — reverse a scheduled cancellation.
- `POST /api/v1/billing/workspaces/:workspaceId/portal` — create hosted billing portal session.
- `POST /api/v1/billing/webhooks/stripe` — raw-body signature-verified Stripe webhook endpoint.
- `GET /api/v1/admin/billing` — platform billing overview for platform administrators.

Checkout and subscription activation are provider-controlled. The frontend return URL does not change subscription status. Configure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` only on the backend.
