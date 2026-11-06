# Student DevOps Hub

A modern SaaS dashboard where students register software projects and monitor CI/CD builds, automated tests, deployments, and application health from one place. The frontend is fully wired to a real backend: **Node.js + Express + Prisma + Supabase Postgres, with authentication provided by Supabase Auth (email/password).**

## Architecture

- **Frontend**: React 18 + Vite, Tailwind CSS, React Router 6, Lucide React, Axios
- **Backend**: Node.js 18+ (ESM), Express 4, Prisma 5 ORM, Supabase PostgreSQL, Supabase Auth (`@supabase/supabase-js`)
- **Layout**: Separate `frontend/` and `backend/` folders

```
Students-DevOps-Hub/
├── backend/
│   ├── package.json
│   ├── .env.example                      # copy to .env and fill in Supabase credentials
│   ├── prisma/
│   │   ├── schema.prisma                 # User / Project / PipelineRun / TestReport / Deployment
│   │   ├── migrations/                   # SQL migrations (apply with prisma migrate deploy)
│   │   └── sql/
│   │       ├── profile-trigger.sql       # auth.users → "User" profile sync triggers
│   │       └── rls.sql                   # Row Level Security policies
│   ├── src/
│   │   ├── server.js                     # boot + graceful shutdown
│   │   ├── app.js                        # middleware, single /api/health, routers
│   │   ├── config/                       # prisma.js, supabase.js (clients, token verify + cache)
│   │   ├── routes/                       # auth.js, profile.js, projects.js
│   │   ├── controllers/                  # authController, profileController, projectController
│   │   ├── services/                     # authService, projectService (business logic)
│   │   ├── middleware/                   # auth.js (authenticate), validate.js (Joi)
│   │   ├── utils/                        # errors.js (AppError + response envelope)
│   │   └── tests.js helpers             # (tests live in backend/tests/)
│   └── tests/
│       ├── unit.test.js                  # offline: envelopes, error mapping, Joi schemas
│       ├── api.test.js                   # live auth + CRUD + guards
│       └── ownership.test.js             # live cross-user authorization + safety
├── frontend/
│   ├── package.json
│   ├── .env.example                      # VITE_API_BASE=http://localhost:3000/api
│   ├── vite.config.js, tailwind.config.js
│   └── src/
│       ├── App.jsx                       # route map + protected/public-only routes + error boundary
│       ├── api/
│       │   ├── client.js                 # THE service layer: axios + envelope unwrap + authApi/projectApi
│       │   └── session.js                # single owner of access/refresh token storage
│       ├── hooks/                        # useAuth.jsx (AuthProvider), useApi.js
│       ├── pages/                        # Landing, Login, Signup, ForgotPassword, ResetPassword,
│       │                                 # VerifyEmail, Dashboard, MyProjects, AddProject, EditProject,
│       │                                 # ProjectDetail, Settings, NotFound
│       └── components/                   # layout/, ui/, forms/ProjectForm, ErrorBoundary
└── README.md
```

## API (implemented in `backend/`)

| Method | Endpoint                        | Auth | Notes |
| ------ | ------------------------------- | ---- | ----- |
| GET    | `/api/health`                    | No   | Checks DB connectivity (`SELECT 1`); `200 service: ok` or `503 SERVICE_UNAVAILABLE` |
| POST   | `/api/auth/signup`               | No   | Supabase Auth signup + profile row; returns `tokens` **or** `needsEmailVerification: true` |
| POST   | `/api/auth/login`                | No   | Returns `{ user, tokens: { access_token, refresh_token } }`; **403 `EMAIL_NOT_VERIFIED`** before confirmation |
| POST   | `/api/auth/refresh`              | No   | Refresh-token grant; returns new `{ user, tokens }` |
| POST   | `/api/auth/logout`               | Yes  | Ends the local Supabase session |
| POST   | `/api/auth/change-password`      | Yes  | Validates current password, then `updateUser({ password })` |
| POST   | `/api/auth/forgot-password`      | No   | `resetPasswordForEmail(email, { redirectTo: CLIENT_URL + '/reset-password' })` — never reveals account existence |
| POST   | `/api/auth/reset-password`       | No   | Tokens from the recovery link hash; sets the new password |
| POST   | `/api/auth/resend-verification`  | No   | Re-sends the signup verification email |
| GET    | `/api/profile`                    | Yes  | Session-derived profile (creates the row if missing) |
| PATCH  | `/api/profile`                    | Yes  | Update `name` / `avatar_url` only |
| GET    | `/api/projects/dashboard`         | Yes  | `{ stats, recentProjects, recentPipelines, recentDeployments }` |
| POST   | `/api/projects`                   | Yes  | Create; **201** |
| GET    | `/api/projects`                   | Yes  | `{ items, pagination: { page, limit, total, totalPages } }`; search / filter / sort |
| GET    | `/api/projects/:id`               | Yes  | Includes recent pipelines (each with `test_reports`, `deployments`), top-level `test_reports`/`deployments`, and `_counts` |
| PATCH  | `/api/projects/:id`               | Yes  | Update |
| DELETE | `/api/projects/:id`               | Yes  | Delete |
| GET    | `/api/projects/:id/pipelines`     | Yes  | Paginated pipeline history |
| GET    | `/api/projects/:id/tests`         | Yes  | Test report views |
| GET    | `/api/projects/:id/deployments`   | Yes  | Paginated deployments |

**Conventions**

- Every response is an envelope: success `{ "success": true, "data": { ... } }`, failure `{ "success": false, "error": { "code", "message", "details?" } }`.
- Every `/api/projects` request requires `Authorization: Bearer <access_token>`; tokens are verified with `supabase.auth.getUser()` and cached for 60 s.
- Malformed `:id` (not a UUID) → **400 VALIDATION_ERROR**; valid-but-not-owned (or absent) → **404 PROJECT_NOT_FOUND** (no 403 information leak).
- Pagination defaults: 12 (projects), 20 (pipelines/deployments); max 50.
- CORS allows only `CLIENT_URL` (+ `http://localhost:5173` in dev). Helmet, morgan, 1 MB JSON body limit retained.
- Pipelines/test reports/deployments are read-only in this phase — the UI shows their honest empty states. Webhook ingestion is planned next.

## Backend setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com) and enable **Email** auth in *Authentication → Providers*.
2. Grab the settings listed in `backend/.env.example`:
   - `DATABASE_URL` (session-pooler) and `DIRECT_URL` (direct) — *Project Settings → Database → Connection string*
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY` — *Project Settings → API*
   - `SUPABASE_SERVICE_KEY` — same page (*service_role*, secret)
3. Generate a prisma client and apply migrations (migrations run over `DIRECT_URL`):

   ```bash
   cd backend
   cp .env.example .env    # then edit with your project's values
   npm install
   npm run prisma:generate
   npm run prisma:migrate  # or: npx prisma migrate deploy (must be run with real credentials)
   ```
4. Apply the SQL utilities after Prisma migrations (both are idempotent):

   ```bash
   # run from backend/ (uses the direct, non-pooled connection)
   npx prisma db execute --file prisma/sql/profile-trigger.sql --url "$DIRECT_URL"
   npx prisma db execute --file prisma/sql/rls.sql            --url "$DIRECT_URL"
   ```

   - `backend/prisma/sql/profile-trigger.sql` — keeps the public `"User"` profile row in sync with `auth.users` (create/update/delete).
   - `backend/prisma/sql/rls.sql` — Row Level Security defense-in-depth for direct PostgREST access.
5. Start the API:

   ```bash
   npm run dev     # http://localhost:3000
   npm start       # production-style boot
   npm test        # Jest + Supertest integration tests
   ```

`GET /api/health` reports live database connectivity: `200 { data: { status: "ok", database: "connected" } }` or `503 SERVICE_UNAVAILABLE` if the database is not reachable — the server still boots in that state and logs a warning.

### Backend env vars

| Variable            | Purpose |
| ------------------- | ------- |
| `DATABASE_URL`      | Supabase session-pooler connection used by Prisma at runtime |
| `DIRECT_URL`        | Direct connection used for Prisma migrations (`datasource db.directUrl`) |
| `SUPABASE_URL`      | Supabase project URL (`https://<ref>.supabase.co`) |
| `SUPABASE_ANON_KEY` | anon/public key — token verification via `supabase.auth.getUser()` |
| `SUPABASE_SERVICE_KEY` | service_role key — server-only admin operations |
| `PORT`              | API port (default 3000) |
| `NODE_ENV`          | `development` / `production` |
| `CLIENT_URL`        | Allowed CORS origin + reset-password redirect base |

## Frontend setup

```bash
cd frontend
cp .env.example .env     # VITE_API_BASE=http://localhost:3000/api
npm install
npm run dev              # http://localhost:5173
npm run lint             # 0 errors / 0 warnings expected
npm run build            # production bundle
```

All network traffic flows through `src/api/client.js`. Pages never call `fetch()` or use axios directly. On any 401 the unwrapped envelope error is surfaced, the session is cleared, and the user is redirected to `/login` (returning to the original page afterwards). The refresh token is stored beside the access token under the same remember-me policy (`localStorage` / `sessionStorage`).

## Auth flows (implemented end to end)

- **Signup** → if the Supabase project requires email confirmation, the API returns `needsEmailVerification: true` and the SPA navigates to `/verify-email` ("check your inbox"). Otherwise tokens are stored and the user lands on the dashboard.
- **Login before confirming** → the API rejects with `403 EMAIL_NOT_VERIFIED`; the Login page shows the reason **and a "Resend verification email"** button (`POST /api/auth/resend-verification`).
- **Forgot password** → email link targets `${CLIENT_URL}/reset-password`; the SPA reads `access_token` / `refresh_token` from the URL hash and sets the new password through `POST /api/auth/reset-password`.
- **Change password (Settings)** → validates the current password, then updates it with an authenticated client (`POST /api/auth/change-password`).
- **Token refresh** → `POST /api/auth/refresh` rotates `{ user, tokens }`.

## Tests

Backend: `npm test` (Jest + Supertest, ESM). Three suites, **54 tests**:

| Suite | Contents | Needs credentials |
| ----- | -------- | ----------------- |
| `tests/unit.test.js` | Error envelope helpers, Prisma error mapping, all Joi schemas (defaults, stripping, unsafe sort/limit rejection) | No — always runs |
| `tests/api.test.js` | Live auth + CRUD: signup probe, wrong/right login, `EMAIL_NOT_VERIFIED` 403, profile GET/PATCH, project CRUD, dashboard, pipelines/tests, 400/404 semantics, refresh, change-password, logout, route guards | Yes (skips visibly with reasons) |
| `tests/ownership.test.js` | **Cross-user authorization**: second user cannot list/read/update/delete another user's project or read its pipelines/tests/deployments (404, no existence leak), body `owner_id` is ignored, invalid payload/query rejection, forgot-password non-enumeration, garbage reset/refresh tokens fail safely, owner data intact afterwards | Yes (skips visibly) |

The live suites use the Supabase **service-role admin API** to create throwaway confirmed users (never touching existing rows) and delete them in `afterAll`; the signup probe deletes the account it creates. A test run leaves the database exactly as it found it (verified: after a run only the real account remains, zero projects).

## QA audit (end-to-end, executed)

**Commands (all run from the repo root/packages):**

```bash
cd backend && npm install && npx prisma generate && npx prisma migrate deploy && npm test
cd frontend && npm install && npm run lint && npm run build && npm run dev
cd backend && npm run dev
```

**Results:**

- `npm test` → **54/54 passed** (3 suites), DB left clean afterwards
- `npm run lint` (frontend) → **0 errors / 0 warnings**
- `npm run build` (frontend) → production bundle built (≈361 kB JS / 33 kB CSS)
- `npx prisma validate` → schema valid; `npx prisma migrate status` → **"Database schema is up to date"** (1 migration applied)
- Live DB audit (read-only queries): all 5 tables have RLS enabled + 7 policies; 6 foreign keys with expected `CASCADE`/`SET NULL`; all schema indexes present (`User_email`, `Project_owner_id/repo_url/project_type`, `PipelineRun_project_id/status/github_run_id`, `TestReport_pipeline_id/project_id`, `Deployment_project_id/environment/status`); 3 auth triggers enabled
- `GET /api/health` → **200** `database: "connected"`; protected routes without a token → **401**; unknown route → **404** envelope
- Production bundle scanned for `SUPABASE_SERVICE_KEY`, anon-key suffix, `service_role`, `postgresql://` and the DB password → **clean** (only `VITE_API_BASE` is exposed); `.env` files are gitignored and `backend/prisma/migrations/` is now tracked (it had been ignored)

**Bugs found by the audit and fixed:**

1. `ProjectDetail` read `data.project` from an already-unwrapped payload → project page crashed into the error boundary. Now reads the project directly and shows the 404 state when absent.
2. `Settings` effect depended on `user.email/user.name` while `user` can still be `null` right after login → crash. Now optional-chained, and `AuthProvider.login()` hydrates the profile via `GET /api/profile` immediately.
3. `signup` treated autoconfirmed users as unverified (`confirmed_at` is null when Supabase uses `email_confirmed_at`) and returned tokens together with `needsEmailVerification: true`. Flag now matches `login`.
4. `forgot-password` mapped Supabase's "email address is invalid" 400 to `401 INVALID_CREDENTIALS`; now `400 VALIDATION_ERROR`, while unknown-but-valid addresses still return `200 { sent: true }` (no account enumeration).
5. Auth logs printed raw email addresses; they are masked now.
6. Earlier: delete-profile trigger compared `text` to `uuid` (every user deletion failed with 500 and left an orphan profile) — fixed with explicit casts.
7. Stray root `package.json`/`package-lock.json`/`node_modules` (single unused dependency) removed; test suites now clean up the users they create.

**Current Supabase project setting (observed):** *Confirm email* is **disabled**, so signup returns tokens and logs in immediately. The unconfirmed-user path (`403 EMAIL_NOT_VERIFIED`) is still verified by creating an unconfirmed user through the admin API.

## What was verified — and what was NOT verified

**Verified against a live Supabase project (executed):**

- `npx prisma migrate deploy` → initial migration applied to the real database
- `prisma/sql/profile-trigger.sql` applied → `on_auth_user_created`, `on_auth_user_email_updated`, `on_auth_user_deleted` triggers present; the profile row appears automatically after signup
- `prisma/sql/rls.sql` applied → RLS enabled on all 5 tables, 7 policies created
- `npm test` → **54/54 passed** across 3 suites (see the QA audit section for coverage and the ownership tests)
- `GET /api/health` against the live database → **200** `{ status: "ok", database: "connected" }`
- Frontend `npm run lint` (0 errors/warnings) and `npm run build` (production bundle) pass
- Both servers running together: frontend `http://localhost:5173`, backend `http://localhost:3000`
- Migration status: up to date; indexes, foreign keys, RLS policies and auth triggers inspected directly in Postgres

**NOT VERIFIED (requires a real inbox or a browser):**

- Real email delivery and the click-through of the signup confirmation link (the project currently has email confirmation disabled; the `needsEmailVerification` and `403 EMAIL_NOT_VERIFIED` paths are verified through the API)
- The forgot-password email → `/reset-password#access_token=…&refresh_token=…` click-through end to end (the endpoint, link parsing and token-based reset are implemented and tested with valid/garbage tokens, but no real emailed link was clicked)
- Browser-level manual UI walk-through and responsive rendering at desktop/tablet/mobile breakpoints (lint/build pass and the layout uses responsive Tailwind breakpoints across 18 files; no browser automation is installed in this environment)
- Frontend network-failure UX is implemented (axios timeout 15 s, "Cannot reach the server…" message, error states with retry) and reviewed, but not exercised with a browser against a stopped backend
- Pipeline/deployment/test ingestion: these endpoints are read-only and return honest empty states — no webhook integration exists yet

> Note on connection strings: `DATABASE_URL` may use the **transaction pooler** (port `6543` + `?pgbouncer=true`, as in the supplied env) or the **session pooler** (port `5432`). `DIRECT_URL` must point at the direct/non-pooled connection (`5432`) for migrations. If the password contains `/`, `@`, `#`, etc., it must be URL-encoded in the URI (e.g. `15/09/2004` → `15%2F09%2F2004`).

## Remaining setup / hardening tasks

- **Email**: for production, keep *Confirm email* enabled, configure a custom SMTP provider, and set the Supabase **Site URL / redirect allowlist** to `http://localhost:5173/**` (dev) or your real origin; then click-test the confirmation and reset links. Running tests against a live project sends no emails except the optional forgot-password probe.
- **Test database**: the live suites isolate themselves with throwaway users and clean up, but they still run against the configured project. For CI, point `DATABASE_URL`/`SUPABASE_*` at a dedicated Supabase test project.
- **Auth hardening**: add rate limiting (e.g. `express-rate-limit`) to `/api/auth/*`, enable Supabase CAPTCHA, and consider refreshing tokens client-side before expiry (the API already exposes `/api/auth/refresh`).
- **CORS**: `http://localhost:5173` is always allowed in addition to `CLIENT_URL`; remove it for production deployments.
- **CI/CD ingestion**: pipeline runs, test reports and deployments are read-only with honest empty states; a GitHub Actions webhook + `github_run_id` ingestion endpoint is still to be built.
- **Unused column**: `Project.project_type` exists in the schema/DB but is not accepted by the API/UI yet.
- **Browser QA**: run a manual responsive pass (desktop/tablet/mobile) and a network-failure pass in a real browser; no browser automation is installed here.

## Installation & run (summary)

### Prerequisites
- Node.js 18+
- npm
- A Supabase project (free tier is enough)

### Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in Supabase credentials
npm run prisma:generate
npm run prisma:migrate
npm run dev            # http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_BASE=http://localhost:3000/api
npm run dev            # http://localhost:5173
```

## License

MIT
