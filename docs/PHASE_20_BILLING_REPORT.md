# FlowDesk Phase 20 — Billing and subscriptions

## Checkpoint and scope

Implemented against the actual `FlowDesk-Phases-16-19-Implemented.zip` archive. This change preserves the Phase 16–19 codebase and adds a Stripe-backed subscription foundation.

## Delivered

- Plan catalogue: Free, Starter, Business and Scale, with monthly/yearly integer-cent prices, member/project/storage limits and feature entitlements.
- Workspace subscription lifecycle records: incomplete, trialing, active, past due, canceled, unpaid and expired; period boundaries and cancel-at-period-end state.
- Workspace billing customer records and provider customer IDs.
- Hosted Stripe Checkout Session creation; provider secrets stay in backend environment variables.
- Stripe Billing Portal session creation for payment method and provider-side billing management.
- Cancellation-at-period-end and resume operations.
- Stripe webhook signature verification using the raw request body, timestamp tolerance and constant-time HMAC comparison.
- Webhook event idempotency using unique provider event IDs. Failed processing removes the event marker so Stripe can retry.
- Billing invoice/payment history populated only from provider-confirmed invoice events.
- Workspace owner/admin billing page with plan catalogue, status, cancellation controls, portal access and invoice links.
- Platform administration billing overview for subscription status and aggregate counts.
- Backend entitlement checks for AI, reports and file-write routes; member and project count caps are enforced at the workspace authorization boundary.
- Audit events for checkout creation, cancellation/resume and processed provider events.
- Prisma migration and a billing catalogue unit test.

## Plan pricing caveat

The catalogue currently contains proposed USD defaults in `backend/src/billing/billing.service.ts`: Starter $12/$120, Business $29/$290, Scale $79/$790 (monthly/yearly). These are implementation defaults, not a commercially approved price list. Confirm currency, tax treatment, local pricing, plan limits and published prices before enabling live checkout. The Free plan is the default for workspaces without an active paid subscription.

## Provider setup

Set these server-only values in `backend/.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=https://your-frontend.example
```

Create a Stripe webhook endpoint at `POST /api/v1/billing/webhooks/stripe` and subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

For local development, use Stripe CLI forwarding to the webhook endpoint and its generated signing secret. Do not use test credentials in production. Configure live credentials only after checkout, cancellation, portal and webhook verification have been tested in a controlled environment.

## Database deployment

After installing dependencies and configuring PostgreSQL:

```bash
npm --prefix backend run prisma:validate
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:deploy
```

## Known limitations / follow-up

- The plan catalogue is code-defined, not yet an editable database-backed catalogue; plan pricing and entitlements require a release to change.
- Stripe is the implemented provider adapter. No second provider is wired.
- Checkout creates Stripe inline recurring prices per session; stable reusable Stripe Price IDs and product catalogue synchronization are recommended before launch.
- Taxes, coupons, proration previews, seat-based billing, metered usage, refunds, disputes, dunning emails and manual/offline payment workflows are not implemented.
- Provider webhooks are the authority for subscription activation and invoice/payment records. Existing active subscriptions cannot create a second checkout; plan changes are routed through the hosted billing portal to avoid accidental duplicate subscriptions. The browser return URL never activates a subscription.
- Admin billing is visibility-only; platform operators cannot impersonate customers or manually mark payments successful.
- Feature entitlements are enforced for AI, reports and file writes, and member/project caps are enforced. Other per-plan resource limits (notably storage byte caps) still need enforcement in their respective service write paths.
- Existing workspaces default to Free unless an active subscription record exists. Free limits may require migration or customer grandfathering policy before launch.
- The subscription webhook handler currently expects the Stripe subscription ID on invoice events in the standard string form; verify against the selected Stripe API version and expand object handling if required.
- Billing invoice links are provider-hosted URLs; access control relies on Stripe's hosted URL behavior.

## Verification status

- Source archive integrity: passed before editing (`unzip -t` reported no errors).
- TypeScript/TSX syntax transpilation: passed for 72 `.ts`/`.tsx` files; 0 syntax diagnostics.
- Root and backend `package.json`: valid JSON.
- Frontend `npm run typecheck`: blocked; project dependencies are absent (`react`, `react-router-dom`, `lucide-react`, `vite` and their types could not be resolved). The command exited 1.
- Frontend `npm run build`: blocked by the same missing dependencies; exited 1.
- Backend `npm --prefix backend run build`: not run successfully; `nest` executable is unavailable (exit 127).
- Prisma validation/client generation/migration execution: not run; `prisma` executable and generated client are unavailable (exit 127).
- Jest tests: not run; `jest` executable is unavailable (exit 127).
- PostgreSQL integration, browser/API end-to-end checks and Stripe test-mode checkout/webhook verification: not run; no configured database, dependencies or provider credentials are available.
- No live Stripe checkout or webhook delivery is claimed.
