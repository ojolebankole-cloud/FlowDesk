# FlowDesk implementation report — Phases 8–11

## Scope delivered
This increment continues the supplied Phases 0–7 archive. It adds backend modules, Prisma schema changes and frontend screens wired to the API for task management, CRM, invoicing/finance, calendar and notifications.

## Phase 8 — Task management
Implemented:
- Workspace-scoped task list, create, update, delete and detail route.
- Status, priority, due/start dates, estimated effort, project link and assignee.
- Assignee membership validation.
- One-level subtasks.
- Directed task dependencies with cycle rejection.
- Comments with author identity.
- Attachment reference metadata with HTTPS URL validation.
- Board, list, calendar-style and timeline-style views, with an in-page task creation form.
- Assignment and due-soon in-app notifications.
- Notification inbox and read state.

Boundaries:
- Attachment endpoint stores a secure HTTPS reference, not file bytes. Binary uploads, virus scanning, signed URLs and storage quota are Phase 15.
- Task assignee selection currently asks for the workspace member's user ID; a polished member picker is a UI enhancement.
- Task recurrence and time tracking are not part of this phase.

## Phase 9 — CRM and customers
Implemented:
- Server-backed customer create/read/update/delete.
- Contact details, company, category, address, website and profile notes.
- Search and category filtering.
- Customer creation form, profile cards, contact details, category, customer notes with author/time history.
- Manual contact/activity logging.
- Customer activity timeline.
- Customer-to-project and customer-to-invoice relationships.
- Customer history endpoint and frontend profile cards/actions.
- Workspace isolation and role enforcement.

Boundaries:
- Import/export, bulk operations, email campaign integrations and advanced CRM pipelines are not included.
- Customer deletion cascades notes and activity records; invoices/projects preserve their own data by setting customer relation to null.

## Phase 10 — Invoicing and financial management
Implemented:
- Invoice create/list/detail/update, issue and void lifecycle.
- Line items, quantity, unit price and calculated amounts.
- Discount and tax rate validation; rounded currency calculations.
- Currency code per invoice and payment.
- Partial and full payment recording with overpayment protection.
- Invoice status progression and overdue marking on invoice listing.
- Expense create/list/delete.
- Revenue, expense and net reports separated by currency (no false cross-currency sum).
- Print-ready invoice document in browser with “Print / Save as PDF”.
- Frontend invoice creation form, invoice/expense screens, payment action, print action and per-currency finance summary.

Boundaries:
- Payment records are manual ledger entries; no gateway or webhook is connected.
- No FX conversion is performed.
- The PDF is generated through browser print-to-PDF, not a server-side PDF engine.
- Refunds, credit notes, tax jurisdiction rules, invoice email delivery and expense edit workflow remain future enhancements.
- Invoice financial line changes are blocked after any payment is recorded.

## Phase 11 — Calendar and scheduling
Implemented:
- In-page event creation form plus event update/delete.
- Month grid, week grid and day view.
- Task due dates and project milestones shown alongside events.
- Basic DAILY, WEEKLY and MONTHLY recurrence expansion from stored iCalendar-style rules.
- Reminder metadata and an in-process worker that creates in-app event reminders.
- Due-within-24-hours task notifications.
- Notification inbox with read state.
- Workspace scoping and role checks.

Boundaries:
- The recurrence engine intentionally supports a limited RRULE subset; it is not a full RFC 5545 recurrence implementation (e.g. complex BYDAY/BYSETPOS/timezone exceptions).
- Reminders run in the API process. For production, move delivery to a durable queue/worker so reminders survive restarts and multiple replicas do not race.
- Notifications are in-app only; email/push delivery and Google/Outlook calendar sync are future integrations.
- Timezone-aware recurrence edge cases need integration testing before production.

## Verification status
- All changed TypeScript/TSX files passed TypeScript transpilation syntax diagnostics (zero syntax errors).
- Archive source continuity was preserved from the provided Phases 4–7 project.
- A full semantic TypeScript build, Prisma schema validation/client generation, PostgreSQL migration execution, Jest tests and browser/API integration tests were not run because this environment has no installed project dependencies and registry access was unavailable.
- The migration is supplied but must be applied to a test database and validated before relying on runtime behaviour. Do not deploy this increment to production without that verification.

## Required next verification
1. Install dependencies from the project root and backend.
2. Run `npm run db:validate`, `npm run db:generate`, then apply migrations to a fresh test database.
3. Run frontend and backend production builds.
4. Run Jest, including the invoice arithmetic unit tests.
5. Exercise task CRUD, assignee membership, subtask lifecycle, dependency cycle rejection, comments, attachments, notification read state.
6. Test customer isolation, note/activity timeline and customer-project/invoice relationships.
7. Test invoice totals, tax/discount boundaries, partial payments, overpayment rejection, overdue marking and mixed-currency reporting.
8. Test calendar recurrence boundaries, reminder delivery, timezone behaviour and workspace isolation.
