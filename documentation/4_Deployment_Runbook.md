# Deployment Runbook

## 1. Introduction

Manual deployment of ClzMate (backend, frontend, optional backup service). There is no CI/CD pipeline. The project is in development; this runbook reflects the scripts and env vars present in the repository.

## 2. Prerequisites

- **Node.js >= 18** (Express 5 requirement; the backup service declares `engines.node >= 18`) and npm.
- **MongoDB** reachable from the backend (Atlas in current use).
- **Cloudinary account** (uploads).
- **SMTP account** (Gmail or custom SMTP) for OTP, reset, and enrollment emails.
- **Razorpay**: optional. Only `RAZORPAY_SECRET` is used (signature verification); there is no order creation (see section 8).
- Git on the deploy host.
- For the test suite: the first `npm test` downloads a MongoDB 7.0.14 binary through `mongodb-memory-server` (needs network access and disk space; cached afterwards).

Note: `package-lock.json` is gitignored (`**/package-lock.json`). `deploy.sh` uses `npm ci` only if a lockfile exists, otherwise `npm install`, so installs are not reproducible across deployments.

## 3. Environment Configuration

Never commit `.env*` files (only `.env.example` is tracked). Templates: `backend/.env.example`, `frontend/.env.example`, `backup/.env.example`. Env loading uses `dotenv` and `dotenv-flow` (so `.env.production`, `.env.local`, etc. are also read).

### 3.1 Backend (`backend/.env`)

| Variable | Required | Purpose |
| :--- | :--- | :--- |
| `PORT` | no | Default 5000 |
| `NODE_ENV` | no | `production` enables `trust proxy`, secure cookies and the strict startup checks below; `test` disables rate limiting |
| `DATABASE_URL` | yes | MongoDB connection string. The server connects before listening and exits 1 if it is unset or unreachable (10 s timeout) |
| `JWT_SECRET` | yes | JWT signing secret and OTP HMAC key. Production refuses to start below 32 characters; development warns below 16. Rotating it invalidates all sessions and pending OTPs |
| `JWT_EXPIRES` | no | Token lifetime, default `24h` |
| `CORS_ALLOWED_ORIGINS` | yes in production | Comma-separated origins; production refuses to start without it. With none set, every request that sends an `Origin` header gets 403 |
| `CORS_BLOCK_NO_ORIGIN` | no | `true` rejects requests with no `Origin` header; default `false` |
| `FRONTEND_URL` | for password reset | Public frontend URL; the emailed reset link is `${FRONTEND_URL}/update-password/<token>`. Replaces the old `API_URL`; falls back to `APP_DOMAIN` if unset |
| `MAX_UPLOAD_MB` | no | Per-file upload limit in MB, default 200 |
| `ALLOW_STUBBED_PAYMENT` | no | `true` lets paid enrollments succeed without a Razorpay signature, **only when `NODE_ENV` is not `production`**. Keep `false` otherwise (default) |
| `APP_DOMAIN` | no | Only used for the fallback sender `no-reply@<APP_DOMAIN>` when `MAIL_FROM_EMAIL` and `MAIL_USER` are unset |
| `CLOUD_NAME`, `API_KEY`, `API_SECRET` | yes | Cloudinary credentials |
| `FOLDER_NAME` | yes | Cloudinary folder prefix |
| `MAIL_SERVICE` | no | `gmail` selects the Gmail service; otherwise custom SMTP |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE` | for custom SMTP | Defaults: `smtp.gmail.com`, 587, `false` |
| `MAIL_USER`, `MAIL_PASS` | yes | SMTP credentials |
| `MAIL_TLS_REJECT_UNAUTHORIZED` | no | `false` disables TLS cert verification |
| `MAIL_FROM_NAME`, `MAIL_FROM_EMAIL` | no | Sender display name and address (defaults: `Up Dev Team`, `MAIL_USER`) |
| `RAZORPAY_KEY`, `RAZORPAY_SECRET` | `RAZORPAY_SECRET` for paid courses | With the secret set, `verifyPayment` for paid courses requires a valid signature, otherwise it returns 402. `RAZORPAY_KEY` is unused by the backend |

### 3.2 Frontend (`frontend/.env`)

| Variable | Purpose |
| :--- | :--- |
| `VITE_APP_BASE_URL` | Backend API base, e.g. `https://<api-host>/api/v1`. Baked in at build time. |
| `VITE_SNAPSHOT_URL` | Public Cloudinary snapshot: `https://res.cloudinary.com/<CLOUD_NAME>/raw/upload/<SNAPSHOT_FOLDER>/snapshot/snapshot.json`. Baked in at build time; empty disables the Cloudinary tier. |
| `SNAPSHOT_ATTEMPTS`, `SNAPSHOT_TIMEOUT_MS` | Build-time snapshot fetch retries (default 5) and per-request timeout (default 45000 ms; the first request wakes a sleeping API). |
| `SNAPSHOT_FORCE_OFFLINE` | `1` skips the live and Cloudinary tiers at build time (testing). |

Backend snapshot variables (in `backend/.env`): `SNAPSHOT_FOLDER` (default `FOLDER_NAME`; use one folder per environment), `SNAPSHOT_DEBOUNCE_MS` (default 8000), `RENDER_DEPLOY_HOOK_URL` (optional: the frontend static site's Render deploy hook, triggered after the published snapshot changes), `DEPLOY_HOOK_DEBOUNCE_MS` (default 300000).

### 3.3 Backup service (`backup/.env`)

Template: `backup/.env.example` (details in `backup/README.md`):

`MONGO_URI` (required), `DRIVE_FOLDER_ID` (required), `BACKUP_API_KEY` (required to start the HTTP API, at least 24 characters), `HOST` (bind address, default `127.0.0.1`), `PORT` (default 3500), `MONGO_DBS`, `BACKUP_DIR`, `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`, `TOKEN_FILE_PATH`, `RETENTION_COUNT` (default 10), `RESTORE_BATCH_SIZE` (default 1000), `SKIP_INITIAL_BACKUP` (`true` skips the backup at startup).

Credential JSON files and `drive_access_token.json` must stay out of git and be permission-restricted.

## 4. Backend Deployment

Pre-deploy check (needs dev dependencies, see section 2):

```bash
cd backend
npm test      # node test/run.js: in-memory MongoDB, about 30 s
```

```bash
cd backend
bash ./scripts/deploy.sh      # removes node_modules, cleans npm cache, npm ci / npm install --include=dev --legacy-peer-deps
npm run start:render          # node server.js  (also: start:prod)
```

- `deploy.sh` only installs dependencies; it prints "Running build" but runs no build command. `npm run build:render` is empty.
- `npm run build` (`scripts/build.js`) copies `package.json`, `package-lock.json`, `.env.production`, and `src/` into `dist/prod/`; `npm run build-exe` produces a `pkg` executable.
- Uploads use the OS temp directory (`os.tmpdir()`) for temporary files; make sure it has room for `MAX_UPLOAD_MB`-sized files.
- The backend exits on SIGTERM/SIGINT after closing the HTTP server, so process managers can restart it cleanly.
- Behind a TLS-terminating proxy set `NODE_ENV=production` (`trust proxy` = 1 so rate limiting sees client IPs; login cookie becomes `secure`).
- Behind a reverse proxy, forward the `Origin` header unchanged and add the frontend origin to `CORS_ALLOWED_ORIGINS`.

## 5. Frontend Deployment

```bash
cd frontend
# set VITE_APP_BASE_URL before building
bash ./scripts/deploy.sh      # same install flow, then npm run build:render
```

- Output is `frontend/dist/` (static files). Serve with any static host.
- The build runs `npm run snapshot` first and logs `[snapshot] SOURCE=live|cloudinary|previous-bundle|neutral-seed`. Deploy the backend first so `GET /api/v1/snapshot` exists; a build whose API is unreachable still succeeds and falls back to Cloudinary or the neutral seed.

### 5.1 Cold-start setup on Render (free API instance)

1. Backend env: `CLOUD_NAME`, `API_KEY`, `API_SECRET`, `SNAPSHOT_FOLDER=clzmate` (pick one name per environment). Deploy; about 3 s after boot the log shows `[snapshot] published <hash>` (or nothing new if unchanged).
2. Check `https://res.cloudinary.com/<CLOUD_NAME>/raw/upload/clzmate/snapshot/snapshot.json` returns JSON with `version: 1`.
3. Frontend static site env: `VITE_SNAPSHOT_URL` set to that URL, then redeploy the static site.
4. Optional: create a Deploy Hook on the static site and set it as `RENDER_DEPLOY_HOOK_URL` on the backend, so the bundled snapshot is rebuilt about 5 minutes after content changes.
5. Admin can force a republish with `POST /api/v1/admin/snapshot/publish?force=true`.
- SPA fallback: `frontend/public/_redirects` (Netlify/Render style). Other hosts need an equivalent rewrite to `index.html`.
- `npm run lint` must pass with zero warnings.

## 6. Backup Service

```bash
cd backup
npm install
npm run get-token   # one-time OAuth2 refresh token helper
npm run once        # single backup
npm start           # scheduled service + REST API
```

Schedule in `server.js` is `0 */12 * * *` (Asia/Colombo). The HTTP API refuses to start without `BACKUP_API_KEY` (>= 24 characters). Every route except `GET /health` needs `x-api-key: <key>` or `Authorization: Bearer <key>`; POSTs are limited to 10 per minute per IP; `/restore` with `dropExisting: true` additionally needs `confirm: "RESTORE"`. It binds to `HOST` (default `127.0.0.1`); only set `0.0.0.0` behind a firewall or TLS proxy. `npm run once` does not need the key.

## 7. Verification After Deploy

1. `GET <backend>/` returns `{ success: true, message: "ClzMate API" }`.
2. `GET <backend>/api/v1/site/stats` returns JSON with `success`.
3. From the frontend origin, `POST /api/v1/auth/login` succeeds (confirms CORS).
4. Upload a thumbnail on course creation (confirms Cloudinary) and request an OTP (confirms SMTP).

## 8. Known Deployment Gaps

- Razorpay order creation and the frontend checkout are not implemented. With `RAZORPAY_SECRET` unset (and `ALLOW_STUBBED_PAYMENT` off) paid enrollments return 402; free courses enroll normally. Do not market paid courses until a real order flow exists.
- No CI/CD and no health endpoint beyond `GET /`. Rate-limit counters are per-process memory (not shared across instances).
- Rollback is manual: redeploy the previous commit and reinstall; database changes are not versioned (no migrations).
