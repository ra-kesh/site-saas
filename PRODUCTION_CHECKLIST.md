# Production Readiness Checklist

Shared roadmap of outstanding work required to ship the multi-tenant SaaS to production. Grouped by theme with actionable items. Check items off as you complete them.

## 🔴 Critical Blockers

- [ ] Fix tenant-aware revalidation in `src/collections/Pages/hooks/revalidatePage.ts` and `src/collections/Posts/hooks/revalidatePost.ts` by deriving paths with `generateTenantContentPath`.
- [ ] Replace local filesystem media storage in `src/collections/Media.ts` with a persistent object-storage adapter (S3/R2/etc.) and configure CDN delivery.
- [ ] Restrict `POST /next/seed` (`src/app/(app)/next/seed/route.ts`) to super-admins, add rate limiting, and ensure the job runs idempotently.
- [ ] Harden auth registration flow (`src/modules/auth/server/procedures.ts`): wrap tenant+user creation in a transaction or cleanup routine, handle duplicate emails, and surface consistent errors.
- [ ] Add runtime guards for required env vars (`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ROOT_DOMAIN`, `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING`) in code paths like `src/lib/utils.ts` and `src/modules/tenants/ui/components/footer.tsx`.

## 🔐 Security & Authentication

- [ ] Implement rate limiting/throttling on login + register endpoints.
- [ ] Enforce password strength, add email verification, password-reset, and logout flows.
- [ ] Document cookie domain requirements and ensure HTTPS-only deployments before enabling multi-domain tenants.
- [ ] Audit collection access controls so tenant content can only be mutated by permitted users; rely on the multi-tenant plugin for scoping.
- [ ] Remove or secure demo routes like `src/app/my-route/route.ts`.

## 🏗️ Infrastructure & Configuration

- [ ] Produce `.env.example` enumerating all required secrets (`PAYLOAD_SECRET`, `DATABASE_URI`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_ROOT_DOMAIN`, `NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING`, `PREVIEW_SECRET`, etc.).
- [ ] Decide deployment topology (single app vs. Payload Cloud + Next front end) and script it (Dockerfile / IaC).
- [ ] Configure MongoDB for production: replica set, TLS, backups, monitoring, alerting.
- [ ] Replace `next build --turbopack` with stable compiler unless Turbopack is validated for prod.
- [ ] Establish health checks/readiness probes and uptime monitoring.
- [ ] Create operational runbooks for seeding, tenant teardown, and incident response.

## 🧭 Product & UX

- [ ] Replace placeholder marketing page (`src/app/(app)/(home)/page.tsx`) with onboarding/dashboard experience.
- [ ] Update default metadata in `src/app/(app)/layout.tsx`.
- [ ] Build tenant admin surfaces (dashboard, profile management, logout).
- [ ] Implement host-based tenant routing (middleware) if subdomain model is desired; normalize canonical URLs and generate per-tenant sitemaps.

## ✅ Testing, QA & CI/CD

- [ ] Add unit tests for utilities (e.g., tenant path helpers) and integration tests covering auth + seeding.
- [ ] Introduce end-to-end smoke tests (Playwright/Cypress) for tenant flows.
- [ ] Configure CI pipeline to run `lint`, `typecheck`, `test`, and `next build`.
- [ ] Add monitoring/error-reporting (Sentry/Bugsnag) and structured logging/metrics around TRPC + Payload calls.

## 📝 Documentation & Ops

- [ ] Replace `README.md` with project-specific setup, deployment, and tenant-management docs.
- [ ] Document environment requirements, provisioning steps, and operational procedures.
- [ ] Add guidance for rotating secrets, managing backups, and handling on-call incidents.

