# FlowDesk

FlowDesk is a workspace-based business management web application built with React, TypeScript, Vite, NestJS, Prisma and PostgreSQL.

## Development

- Frontend: `npm install && npm run dev`
- Backend: `cd backend && npm install`, configure `backend/.env`, then `npm run start:dev`
- Prisma: from root, `npm run db:validate`, `npm run db:generate`; apply committed migrations with `cd backend && npx prisma migrate deploy`.
- Backend tests: `npm run api:test`
- Frontend production build: `npm run build`
- Backend production build: `npm run api:build`

Vite proxies `/api` to `http://127.0.0.1:4000` during local development.

## AI configuration (OpenRouter)

FlowDesk's server-side AI integration uses OpenRouter's OpenAI-compatible Chat Completions endpoint. Create a key at https://openrouter.ai/settings/keys and configure `AI_PROVIDER=openrouter`, `AI_BASE_URL=https://openrouter.ai/api/v1`, `AI_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free`, and `AI_API_KEY` in the backend environment only. The key is also supported through `AI_API_KEY_FILE` for Docker/Kubernetes secret mounts. Never expose provider credentials through frontend `VITE_*` variables, source control, browser storage, or client bundles.

**Free-model privacy warning:** free upstream model endpoints may log prompts or use submitted content to improve provider services. FlowDesk therefore defaults `AI_INCLUDE_WORKSPACE_CONTEXT=false`, which prevents the API from attaching workspace project/task/customer/payment snapshots to prompts. User-entered prompt text is still sent to the provider. Only set `AI_INCLUDE_WORKSPACE_CONTEXT=true` after reviewing the current OpenRouter and upstream model provider terms, privacy requirements, and obtaining any required customer/workspace approval. Do not send confidential or personal data to the selected free Nemotron endpoint. Free-model availability, rate limits, and upstream behaviour can change; this is not an unlimited or guaranteed production SLA.

## Files

Local development uploads are stored in the backend storage directory. Configure `WORKSPACE_STORAGE_LIMIT_BYTES` to change the per-workspace quota. Local disk is not appropriate for multi-instance production deployments; use private object storage and a durable retention/backup policy.

## Documentation

- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/PHASES_0_TO_3_REPORT.md`
- `docs/PHASES_4_TO_7_REPORT.md`
- `docs/PHASES_8_TO_11_REPORT.md`
- `docs/PHASES_12_TO_15_REPORT.md`

## Phases 16–19
The latest implementation adds account-synced personal preferences and a role-protected platform administration console. Apply the new migration with `npm --prefix backend run prisma:deploy` after configuring `DATABASE_URL`, then regenerate Prisma Client with `npm run db:generate`. Platform administrator accounts must be provisioned by a trusted operator; ordinary users cannot promote themselves. See `docs/PHASES_16_TO_19_REPORT.md` for scope and verification limits.

## Billing and subscriptions (Phase 20)

FlowDesk includes a Stripe-hosted subscription flow. Configure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in the backend environment, then configure Stripe to send checkout, subscription and invoice events to `/api/v1/billing/webhooks/stripe`. Do not expose these values through `VITE_*` variables. See `docs/PHASE_20_BILLING_REPORT.md` for the event list, plan price caveats, migration steps and production limitations. The in-code USD prices are proposed defaults and must be approved before live billing.


## Security operations (Phase 21)

See `docs/PHASE_21_SECURITY_REPORT.md` for the hardening inventory, production deployment requirements, and backup/restore procedures. Use the scripts in `backend/scripts/` for PostgreSQL and upload backups. Production requires HTTPS, trusted `WEB_ORIGIN` values, managed secrets, and `__Host-flowdesk_session`.

### Verify the OpenRouter connection

After setting `AI_API_KEY` (or mounting a secret and setting `AI_API_KEY_FILE`) in the backend environment, run this from the `backend` directory:

```bash
npm run ai:smoke
```

The command sends a generic test prompt, prints the returned model and token usage, and never prints the API key. Do not put the key in frontend variables, source control, screenshots, or chat messages.
