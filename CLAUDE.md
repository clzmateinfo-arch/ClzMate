# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

ClzMate: e-learning / academy management platform (courses, classrooms, assignments, quizzes). Three independent npm projects, no root `package.json`, no workspaces. The app is in development, not in use: breaking changes are fine, no backward compatibility required.

```
backend/    Express 5 + Mongoose 8 API, CommonJS, port 5000
frontend/   React 18 + Vite + Redux Toolkit + Tailwind v4 SPA, JavaScript only (no TypeScript, no .ts files)
backup/     Standalone ESM service: Mongo -> EJSON tar.gz -> Google Drive, not part of the app
```

## Commands

Run inside each project directory.

| Where | Command | Notes |
|---|---|---|
| backend | `npm test` | `node test/run.js`: boots one in-memory `mongod` (first start ~1 min on Windows), runs `node:test` + supertest over `test/**/*.test.js`. Run one file: `node test/run.js test/auth.test.js`. |
| backend | `npm run start:dev` | `NODE_ENV=development node server.js`. No auto-reload (`npm run dev` passes `--watch` after the script name and does NOT watch); `npm run prod` uses nodemon. |
| backend | `npm run start:prod` / `start:render` | `node server.js`. Refuses to start in production if `JWT_SECRET` < 32 chars or `CORS_ALLOWED_ORIGINS` is empty. |
| backend | `npm run build` | Copies `package*.json`, `.env.production`, `src/` to `dist/prod/` (not `server.js`). `build-exe` needs `pkg` (not in package.json). |
| frontend | `npm start` | `vite` only. `npm run dev` builds first then serves. |
| frontend | `npm run build` | `rimraf` clean + `npm run snapshot` + `vite build` -> `dist/`. |
| frontend | `npm run snapshot` | Writes the gitignored `src/shared/snapshot/bundled.json` (see "Cold-start snapshot"). Never fails the build. |
| frontend | `npm run lint` | ESLint 9 flat config on `src`, 0 warnings tolerated. |
| frontend | `npm install --legacy-peer-deps` | Required (deploy.sh uses it). |
| backup | `npm start`, `npm run once`, `npm run get-token` | Scheduler + REST (needs `BACKUP_API_KEY`) / single run / OAuth helper. |

Frontend has no tests. "Works" means: backend `npm test` green, frontend `npm run lint` + `npm run build` green, and the behavior driven against a running backend. `package-lock.json` is gitignored.

## Environment

Secrets live only in untracked `.env*` files. Templates (tracked): `backend/.env.example`, `frontend/.env.example`, `backup/.env.example`.

Backend: `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES`, `CORS_ALLOWED_ORIGINS` (comma list; a request with a non-listed `Origin` gets 403), `CORS_BLOCK_NO_ORIGIN`, `FRONTEND_URL` (base of the password-reset link), `APP_DOMAIN` (mail from-domain), `MAIL_TRANSPORT` (`gmail-api` | `smtp`; default `gmail-api` when the three `GMAIL_*` vars are set), `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `MAX_UPLOAD_MB`, `ALLOW_STUBBED_PAYMENT`, `CLOUD_NAME`, `API_KEY`, `API_SECRET`, `FOLDER_NAME`, `MAIL_SERVICE`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASS`, `MAIL_TLS_REJECT_UNAUTHORIZED`, `MAIL_FROM_NAME`, `MAIL_FROM_EMAIL`, `RAZORPAY_KEY`, `RAZORPAY_SECRET`, `SNAPSHOT_FOLDER` (Cloudinary folder of the public snapshot, default `FOLDER_NAME`), `SNAPSHOT_DEBOUNCE_MS`, `SNAPSHOT_BUILD_CONCURRENCY` (parallel Mongo reads while building the snapshot, default 6), `RENDER_DEPLOY_HOOK_URL` (optional static-site rebuild after content changes), `DEPLOY_HOOK_DEBOUNCE_MS`.
Frontend (baked in at build time): `VITE_APP_BASE_URL` (e.g. `http://localhost:5000/api/v1`), `VITE_SNAPSHOT_URL` (`https://res.cloudinary.com/<CLOUD_NAME>/raw/upload/<SNAPSHOT_FOLDER>/snapshot/snapshot.json`); build-only: `SNAPSHOT_ATTEMPTS`, `SNAPSHOT_TIMEOUT_MS`, `SNAPSHOT_FORCE_OFFLINE`.
Backup: `MONGO_URI`, `DRIVE_FOLDER_ID`, `BACKUP_API_KEY` (>= 24 chars) required; see `backup/README.md`.

Deploy is manual: `scripts/deploy.sh` in each project (Render: `start:render`, `build:render`). SPA fallback: `frontend/public/_redirects`. Node >= 18.

## Backend architecture

`server.js` only boots: `assertSecurityConfig` -> `await connectDB()` -> `cloudinaryConnect()` -> `createApp().listen()` (fail-fast exit 1 on error, graceful SIGTERM), then snapshot `syncOnBoot()` after 3 s. The app itself is `src/app.js` `createApp()` (no side effects, used by tests): helmet -> cors + Origin allow-list (403) -> rate limit (global 600/15 min; `authLimiter` 20/15 min on auth routes; skipped when `NODE_ENV=test`) -> `express.json` 1mb -> cookie-parser -> express-fileupload (`MAX_UPLOAD_MB`, os tmpdir) -> `uploadGuard` (blocked executable extensions, image-only fields `thumbnail*`/`profileImage`/`image`, no SVG) -> `sanitizeRequest` (strips `$`/dotted keys from body/query/params) -> `republishOnContentMutation` -> `/api/v1/health`, `/api/v1/snapshot` -> mounts `/api/v1/{auth,profile,payment,course,admin,cart,student,site,classroom,reach}` -> JSON 404 -> `errorHandler` (CastError/validation -> 400, 5xx hides details).

- Layout: `src/{routes,controllers,models,middleware,utils,config}`; 10 route files, ~18 controllers, 19 models via `utils/createModel`. Shared logic in `utils/`: `classroomAccess` (RBAC), `enrollment` (single enrollment path), `userCleanup`/`courseCleanup` (cascades), `validators` (ObjectId, escaped regex), `passwordPolicy`. Response shape `{ success, message, data? }`; payload keys vary by endpoint, so grep the frontend consumer before changing one.
- Auth: `middleware/auth.js` reads the JWT from the `Authorization: Bearer` header, then `req.cookies.token`, then `req.body.token` (header first so a stale login cookie cannot override it; `POST /auth/logout` clears the cookie), then loads the user: deleted/inactive -> 401; token issued before `User.passwordChangedAt` -> 401. `req.user = { id, email, accountType, approved }`. `isStudent/isInstructor/isAdmin` return 403 (`isInstructor` also needs `approved`). Frontend 401 handler logs out only on token-related 401 messages.
- Signup/login: public roles are `Student` and `Instructor` (Instructor starts `approved:false`; Admins are never self-created). Password 8-72 chars. Login needs `verified` and `active` (403 otherwise), uniform "Invalid credentials". OTP: `crypto.randomInt`, stored as HMAC (`otpHash`), 60 s resend cooldown, 5 attempts, deleted after use, TTL 5 min. Password reset: sha256-hashed single-use token in `User.token` (`select:false`), 15 min, generic response, link `FRONTEND_URL/update-password/:token`.
- Domain: Course -> Section -> SubSection (progress in CourseProgress); Classroom -> Topic (embedded `items[]`) -> Assignment -> Submission, Topic -> Quiz -> Attempt; Announcement per Classroom. `Message` and `ClassroomSession` models exist but nothing imports them.
- Classroom RBAC: every handler resolves the classroom (from topic/assignment/quiz) and checks role via `classroomAccess` (owner / coInstructor / member / guest, Admin bypass). Students never receive `options[].correct`; quiz attempts are graded server-side; invite-code joins are plain members.
- Enrollment: payment path `capturePayment` -> `verifyPayment` -> `utils/enrollment`: price-0 courses enroll; paid courses return 402 unless a valid Razorpay signature (`RAZORPAY_SECRET`) or `ALLOW_STUBBED_PAYMENT=true` outside production. Approval path: `course.requiresApproval` -> `requestEnrollment` -> instructor `.../enrollmentRequests/:courseId/:requestId/respond` -> same helper.
- Uploads: `utils/fileUploader.js` -> Cloudinary `type: "authenticated"`; stored `secure_url` is only usable after signing via `POST /course/getAssetUrl` (authorized per course access, expiry clamped). Models keep `publicId` + `resourceType` for deletion.
- Email: `utils/mailSender.js` (returns null on failure, never throws; callers must check) + `src/mail/templates`. Render free instances block outbound SMTP (ports 25/465/587), so production sends through the Gmail API over HTTPS (OAuth refresh token from `node scripts/get-gmail-refresh-token.js`, scope `gmail.send`, access token cached). SMTP remains for local or paid hosting (pooled, 10-15 s timeouts).

## Cold-start snapshot (Render free tier)

The free API sleeps after 15 min idle and Render holds requests while it boots (30-60 s). Public pages never wait for it; ported from islandbook.lk. Read order, newest wins, live always replaces:
1. Bundled snapshot: `npm run snapshot` (part of `build`) fetches `GET /api/v1/snapshot` (wake retries) -> else Cloudinary `VITE_SNAPSHOT_URL` -> else previous `bundled.json` of the same API origin -> else `neutral.json`. Hash-verified, stamped with `source`; `bundled.js` ignores a bundle from another API origin.
2. `localStorage` (`clz:cache:<key>`): last good live value, scoped to the API origin.
3. Cloudinary snapshot: fetched only if no live data arrived within 1.2 s; rejected unless newer than the bundle and its sha256 matches `hash`.
4. Live API: `usePublicResource(key)` revalidates every mount; network errors start the `/api/v1/health` probe (also fired on app load to wake the server).

- Backend `utils/snapshotPublisher.js` builds the snapshot by running the public controllers in-process (cannot drift from the API): `categories`, `newCourses`, `popularCourses`, `stats`, `reviews`, `course[id]` (published only), `catalog[categoryId]` (`selectedCategory` only). Deterministic (hash-stable); refuses to publish on any source error. Publishes a public raw file `<SNAPSHOT_FOLDER>/snapshot/snapshot.json` (overwrite + CDN invalidate), single-flight, debounced after content writes (`republishOnContentMutation`, allow-list of mutation paths shared with `frontend/src/shared/snapshot/resources.js`), boot sync skips unchanged data, then optionally POSTs `RENDER_DEPLOY_HOOK_URL` (debounced). Admin: `POST /api/v1/admin/snapshot/publish[?force=true]`, `GET /api/v1/admin/snapshot/status`.
- Frontend keys live in `shared/snapshot/resources.js` (`categories`, `newCourses`, `popularCourses`, `stats`, `reviews`, `course:<id>`, `catalog:<id>`). A new public resource needs the key there and the same key in `buildSnapshot`. Logged-in pages stay live; `ServerStatusIndicator` shows "Waking up the server…" for slow requests and "Updating content…" while cached content refreshes.
- Only public data may enter the snapshot (it is a public URL). `test/snapshot.test.js` asserts no emails, password hashes, drafts or enrollment requests.

## Frontend architecture

`src/{app,entities,features,pages,shared,widgets}`. `pages` compose `features`/`widgets`/`shared`; `entities/<domain>` own Redux slices + API thunks; `shared` is domain-agnostic (known violation: `shared/components/app/*` import `entities/course`).

- `app/main.jsx` builds the store from `app/store/rootReducer.js` (slices `auth`, `profile`, `course`, `cart`, `sidebar`, `classroom`), devtools only in DEV. Token/user/cart mirrored to `localStorage` manually (`token` stored JSON-stringified; interceptor sends `Bearer <that>`).
- All HTTP goes through `shared/services/api/apiConnector.js` (axios, `withCredentials`); token-related 401 clears storage and redirects to `/login`; 403 does not log out. Endpoint URLs: `app/config/apis.js`; classroom URLs are built inline in `entities/classroom/classroomAPI.js`.
- `app/routes/router.jsx`: pages lazy-loaded. Guards in `features/auth/ui`: `ProtectedRoute`, `OpenRoute`, `RoleRoute` (per-route allowed roles; wrong role -> `/dashboard` -> `RedirectToRole`). The backend remains the real enforcement.
- Styling: Tailwind v4 via `@tailwindcss/vite` (CSS-first: `src/app/index.css`, `shared/styles/theme.css`). Toasts: `react-hot-toast` through the project's `showToast`. Icons: `react-icons`. Aliases: `@` -> `src`, `@shared`, `@features`.
- Folder typos kept for import stability: `entities/conatct`, `features/courceManager`.

## Known limits (verified 2026-10-11; do not assume these work)

- Razorpay checkout is not integrated (`config/rajorpay.js` is a stub): paid courses cannot be bought in production; a paid course with `requiresApproval` can still be requested and approved without payment.
- Not exercised against real services: Cloudinary, SMTP, Razorpay, Google Drive, Atlas. Tests stub mail and Cloudinary.
- No logout/revocation for JWTs besides password change/deactivation; JWT is kept in `localStorage` (XSS-readable). Rate limit counters are in-memory per instance.
- Pagination in `getInstructorCourses`, `getEnrolledCourses`, `getMyEnrollmentRequests` is in memory. `User.email` unique and several new unique indexes will fail to build on a dev DB that already holds duplicates.
- No Parent role (frontend constants removed; backend enum `Admin|Instructor|Student`). No Socket.io (the `Message` model is unused). No frontend tests.
- Real secrets that were once committed (old README, `backup/*.json`) remain in git history and must be rotated.

## Conventions

- Conventional commits `type(scope): description`; scopes: `auth`, `course`, `classroom`, `cart`, `payment`, `admin`, `profile`, `student`, `backup`, `frontend`, `backend`, `config`. No emojis in commits.
- No comments unless the code cannot say it; no TypeScript; descriptive boolean names (`isLoading`, `hasError`).
- New backend behavior needs a request-level test in `backend/test` (see `test/helpers.js`: `createUser`, `asUser`, `api`).
- Skills: `.claude/skills/{backend-dev,frontend-dev,qa-dev}`. Optional UI-design skills live in `.agents/skills` and user-level `~/.claude/skills`.
- Docs under `documentation/` are secondary; when they disagree with code, trust code and fix the doc.
