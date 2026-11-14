# Phase 25 — OpenRouter AI provider integration

## Source inspected

Implemented against `FlowDesk-Phase-24-Security-Production-Infrastructure.zip`. The existing backend already contained a NestJS AI controller/service, conversation/message persistence, workspace membership and role checks, Business/Scale subscription gating, monthly token usage accounting, a global/request-level throttle, and an AI settings description. The provider adapter was OpenAI-compatible in shape but defaulted to `https://api.openai.com/v1` and `gpt-4o-mini`; it did not include OpenRouter attribution headers or provider-specific error handling. The actual AI Assistant route uses the authenticated backend service in `src/features/workspace/FeaturePages.tsx`. A separate older `AIPage` in `WorkspaceViews.tsx` contains a browser-entered arbitrary endpoint and is not the routed `/ai` page.

## Implemented

1. Switched the backend AI provider default and supported provider to OpenRouter.
2. Configured the OpenRouter API base URL (`https://openrouter.ai/api/v1`) and the current free Nemotron model ID (`nvidia/nemotron-3-ultra-550b-a55b:free`). The model ID and base URL remain environment-configurable.
3. Kept calls server-side through the existing authenticated NestJS route. The API key is read from `AI_API_KEY` or `AI_API_KEY_FILE`; no frontend `VITE_*` variable, browser storage, source constant, or client bundle contains the key.
4. Added OpenRouter `HTTP-Referer` (when `APP_URL`/`WEB_ORIGIN` is configured) and `X-Title: FlowDesk` request headers.
5. Added safe, actionable handling for invalid credentials, payment-required responses, rate limits, provider errors, network timeouts, malformed JSON and empty responses. Raw upstream error bodies are not returned to users.
6. Retained conversation history, per-user/workspace access controls, subscription gating, rate limiting and token usage persistence. The API response now also returns provider/model identifiers.
7. Added `AI_INCLUDE_WORKSPACE_CONTEXT`, defaulting to `false`. When disabled, workspace projects/tasks/customer/payment snapshots are not sent to the upstream model. This is a deliberate privacy default because the selected free NVIDIA endpoint warns users not to submit confidential or personal data and says requests may be logged/used to improve NVIDIA services. The user's actual prompt is still sent to OpenRouter.
8. Updated development/production environment templates, README, API documentation and production runbook. Added validation for the supported provider and workspace-context flag.
9. Fixed a duplicate `MalwareScanner` import in `backend/src/app.module.ts` discovered during the source inspection.

## Provider and privacy notes

The configured default is listed by OpenRouter as free for input/output tokens at the time of implementation. Free model capacity, availability, model routing and request quotas can change; this is not unlimited service or a production SLA. The selected upstream free endpoint explicitly warns against sending confidential information or personal data and discloses provider logging/improvement use. Do not enable `AI_INCLUDE_WORKSPACE_CONTEXT=true` for real customer/workspace records until current provider terms, applicable privacy obligations, notices and approvals have been reviewed. A paid/private endpoint or self-hosted model may be more appropriate for confidential production data.

## Required deployment secret

Set these values in the backend deployment environment (or equivalent secret manager):

```env
AI_PROVIDER=openrouter
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
AI_API_KEY=<your newly rotated OpenRouter key>
AI_INCLUDE_WORKSPACE_CONTEXT=false
```

The API key was intentionally not copied into this archive or chat. Use `AI_API_KEY_FILE` for a read-only mounted secret. Rotate the key immediately if it is ever exposed.

## Verification and remaining launch gates

- TypeScript transpilation/syntax checks passed for the modified `ai.service.ts`, `env.validation.ts`, and `app.module.ts`; duplicate import-binding scan across backend source passed.
- Environment validation smoke checks passed: valid OpenRouter configuration accepted; unsupported provider and invalid privacy-flag values rejected.
- YAML parsing passed for production Compose, Prometheus configuration and the security workflow; all three AI environment templates contain the expected OpenRouter settings.
- No provider key pattern was found in the project source/templates.
- `npm install --no-audit --no-fund` timed out after 180 seconds. Consequently, full dependency-backed TypeScript builds/typechecks and automated Jest tests could not be run. Prisma client generation/validation also could not be run. The direct `tsc` attempts report missing installed modules/types and the absent generated Prisma Client, so they do not establish a clean full-project typecheck.
- A live OpenRouter request was **not** performed because the replacement API key was not provided to the execution environment (and should remain private); therefore credentials, live model availability, rate limits and an end-to-end authenticated chat are not certified here.
- Live database/Redis/Stripe/S3/SMTP/ClamAV integration tests remain required before deployment.
- Production launch still requires all Phase 24 infrastructure, billing, privacy, monitoring, backup/restore, TLS, and security-testing gates.


## Follow-up hardening (connection verification)

- Added `usage: { include: true }` to the chat-completions request so OpenRouter is explicitly asked to return token usage for FlowDesk accounting.
- Added a dependency-free backend smoke-test command: `npm run ai:smoke` (run from `backend/`). It reads `AI_API_KEY` or `AI_API_KEY_FILE`, makes a minimal generic test prompt, and never prints the secret.
- The smoke test must be run in the deployment/runtime environment after the secret is configured; it was not run here because the replacement key is intentionally not available to this workspace.
