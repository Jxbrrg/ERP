# Summary.md

## Goal
- Deploy SynexERP (formerly NEXUS ERP) fully on Vercel with working demo login, JWT-based auth, and SQLite auto-seed in `/tmp`.

## Constraints & Preferences
- Frontend works in local dev (Vite proxy) and production (Vercel same-origin).
- No external database required — auto-seeded SQLite in `/tmp` when no `DATABASE_URL`.
- Google OAuth optional — hidden when credentials not configured.
- CEO user `1044619997@synexerp.com` exists with `ceo` role.
- Logo and brand name changed to SynexERP.

## Progress
### Done
- Rewrote entire backend from `cookie-session` + Passport `req.login()` to **JWT Bearer token auth**: `/auth/demo` returns `{ user, token }`, frontend stores token in `localStorage`, all API calls use `apiFetch()` helper with `Authorization: Bearer <token>` header.
- Created `client/src/api/fetch.js`: global fetch wrapper that auto-injects `Authorization` header from `localStorage.getItem('synex_token')`.
- Updated `authStore.js`: stores token, sends Bearer header on `/auth/me`, clears token on logout.
- Updated all 7 page components (`Dashboard`, `Employees`, `Inventory`, `Sales`, `Accounting`, `CRM`, `Projects`) and `Layout.jsx` to use `apiFetch()` instead of raw `fetch()` with `credentials: 'include'`.
- Fixed hardcoded `http://localhost:5000/api/notifications` in `Layout.jsx` to use `__API_URL__ + '/api/notifications'`.
- Rebranded NEXUS → SynexERP: updated `index.html` title/favicon, `Login.jsx`, `Layout.jsx` sidebar, `App.jsx` loading text, and all email domains from `@nexus.com` to `@synexerp.com`.
- Added SynexERP logo to `client/public/SynexERP.png`, referenced in Login and Layout with larger sizes (80px, 96px, 56px).
- **Root cause identified**: SQLite in `/tmp` + serverless = each Vercel instance creates its own DB with different UUIDs. JWT stored `user.id` (UUID) which only existed on the creating instance. Subsequent requests to different instances returned 401 because the UUID didn't exist.
- **Fix applied**: JWT now uses `{ email: user.email }` instead of `{ id: user.id }`. Auth middleware looks up by email (deterministic across all instances).
- Updated `passport.deserializeUser` and Google OAuth callbacks to use `email` instead of `id` in JWT.
- Added Google OAuth token redirect handling in `Login.jsx` (reads `?token=` from URL params).
- Fixed `server/seed.js`: was duplicating all `initDb()` / `seedData()` logic with `INSERT OR IGNORE`, causing FK constraint failures because seed IDs (UUIDs) didn't match auto-seed IDs. Rewritten to simply DELETE all rows then call `db.init()` which auto-seeds cleanly.
- Fixed `server/db-sqlite.js` `seedData()`: was using `users[0].id` from an in-memory array (different UUIDs than DB). Changed to query `SELECT id FROM users` from the actual DB.
- Email domains standardized to `@synexerp.com` in `db-sqlite.js`, `seed.js`, and `index.js`.

### In Progress
- Waiting for Vercel deploy limit to reset (100 deploys/day reached). Code pushed to `master` on GitHub with email-based JWT fix and seed fix.

### Blocked
- **Vercel deploy limit**: `Resource is limited - try again in 24 hours (more than 100, code: "api-deployments-free-per-day")`. Cannot deploy the email-based JWT fix until limit resets.

## Key Decisions
- **JWT Bearer token instead of cookies**: `cookie-session` + `passport.session()` doesn't reliably serialize session to cookie on Vercel serverless. Token stored in `localStorage` survives across instances.
- **`apiFetch` wrapper**: all components import `apiFetch` from `src/api/fetch.js` which auto-injects `Authorization: Bearer <token>` — no cookies, no credentials.
- **Email in JWT instead of UUID**: because SQLite is ephemeral per-instance on Vercel, UUIDs are non-deterministic across cold starts. Email is deterministic (same seed data every time).
- **Dark mode localStorage key**: changed from `nexus-dark` to `synex-dark`.
- **Token localStorage key**: `synex_token`.

## Next Steps
1. Wait for Vercel deploy limit to reset (~24h from last block), then auto-deploy from GitHub `master`.
2. OR user can manually redeploy latest deployment from Vercel dashboard (`https://vercel.com/jxbrrgs-projects/erp/deployments`).
3. Optionally set up Neon/PostgreSQL for persistent cross-instance data: add `DATABASE_URL` env var on Vercel.
4. Optionally configure Google OAuth: set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CALLBACK_URL`.

## Critical Context
- **Root cause of 401 after login**: `cookie-session` with serverless — session cookie wasn't reliably set/sent. JWT Bearer token in `localStorage` eliminated this entirely.
- **Root cause of dashboard blank after login**: even after successful login, subsequent API calls failed because each Vercel instance has its own SQLite in `/tmp` with different UUIDs. JWT referenced a UUID that only existed on the creating instance.
- **Email-based JWT fix**: `{ email: user.email }` instead of `{ id: user.id }` — email is deterministic across all instances because auto-seed creates the same users every time.
- **Deploy limit**: 100 deploys/day on Vercel free plan. We've exhausted it with iterative debugging deploys.
- **seed.js simplified**: no longer duplicates all insert logic. Just DELETEs all rows and calls `db.init()` which triggers the auto-seed (`initDb` → `seedData`).
- **FK seed bug fixed**: `seedData()` queries `SELECT id FROM users` from the actual DB instead of using a locally-generated UUID array. Fix applied in both `db-sqlite.js` and `seed.js`.
- Live production URL: `https://erp-teal-phi.vercel.app` (still running pre-fix code until next deploy).

## Relevant Files
- `server/index.js`: JWT auth middleware, `/auth/demo` returns `{ user, token }`, Google OAuth callback redirects with `?token=`.
- `server/db-sqlite.js`: `seedData()` queries `SELECT id FROM users` for `createdBy` instead of local array. Email domains → `@synexerp.com`.
- `server/seed.js`: Rewritten — DELETEs all rows then calls `db.init()` to auto-seed. No duplicate seed logic.
- `client/src/api/fetch.js`: global `apiFetch(url, options)` — wraps `fetch()` with `Authorization: Bearer <token>` header.
- `client/src/store/authStore.js`: manages `synex_token` in localStorage, `checkAuth()` sends Bearer header, `login()` stores token from response.
- `client/src/pages/Login.jsx`: updated for Google OAuth token redirect, uses SynexERP logo, shows `@synexerp.com` demo emails.
- `client/src/components/Layout.jsx`: SynexERP sidebar logo, fixed hardcoded localhost:5000 API calls, uses `apiFetch`.
- `client/public/SynexERP.png`: logo file.
- `client/index.html`: title `SynexERP`, favicon points to `SynexERP.png`.
