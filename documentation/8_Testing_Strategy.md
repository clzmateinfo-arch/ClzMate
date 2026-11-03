# Testing Strategy

## 1. Introduction

**Current state:** `backend/` has an automated suite (`node:test` + supertest + `mongodb-memory-server`; the run prints the current count). `frontend/` and `backup/` have **no tests**; the only frontend automated check is `npm run lint` (ESLint 9, zero warnings).

Verification gate for any change: `npm test` (backend), `npm run build` and `npm run lint` (frontend), and, for behavior the suite does not cover, driving a real running instance (boot the backend on a free port and call the API, or open the built frontend).

## 2. Backend Suite

### 2.1 How to run

```bash
cd backend
npm test                                 # node test/run.js, all test/**/*.test.js, about 30 s
npm test -- test/auth.test.js            # one or more specific files
```

`test/run.js` starts one shared in-memory MongoDB (`MONGOMS_VERSION` default 7.0.14; the binary is downloaded on first run), then spawns `node --test --test-concurrency=1 --test-timeout=120000 <files>` with `NODE_ENV=test` and `TEST_MONGO_URI`. The exit code is the test result. No `.env` file, real database or network service is needed apart from that first binary download.

### 2.2 Layout and helpers

| File | Purpose |
| :--- | :--- |
| `test/run.js` | Runner described above |
| `test/helpers.js` | Sets test env (`JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, `MAIL_USER`), replaces `utils/mailSender` through `require.cache` with a recorder (`sentMails`), connects Mongoose to a per-process database, builds the app with `createApp()`, and exports `createUser({ accountType, verified, approved, active })`, `tokenFor`, `asUser(user)` (supertest with a Bearer token), `api()` (anonymous), `resetDatabase()`, `DEFAULT_PASSWORD` |
| `test/seed.js` | Fixture builders: `createCategory`, `createCourse`, `enrollRecord`, `addSection`, `addSubSection` |
| `test/stubFileUploader.js` | Replaces `utils/fileUploader` (no Cloudinary calls); records `uploads` and `deletions`; configures fake Cloudinary credentials so URL signing runs locally |

Rate limiters are skipped when `NODE_ENV=test`, so tests do not exercise the 429 behavior.

### 2.3 What is covered

| File | Tests | Areas |
| :--- | :--- | :--- |
| `auth.test.js` | 35 | Signup (role allow-list, password policy, email normalization, unverified overwrite vs verified 409, operator bodies); OTP (hash-only storage, 60 s cooldown, 5-attempt lockout, replay, enumeration); login (verified/active checks, uniform failure, no secret leakage); auth middleware (deleted/inactive users, garbage tokens, 403 role and unapproved instructor); change password (token invalidation); password reset (hashed token, single use, expiry, operator tokens, session kill) |
| `classroom.test.js` | 38 | Authentication on every route; creation (approved instructors, 16-hex invite code); membership (join, add/remove, co-instructor rules); view hiding of emails/invite code; overview, announcements, topics, items (reorder/copy/delete); assignments (targeting, due date, lock, resubmission, grading bounds, cross-assignment grading); quizzes (answer-key stripping, unpublished hidden, server-side grading, one attempt, leaderboard); topic/assignment cascades; unique indexes; no internal error leakage |
| `course.test.js` | 29 | Course create/edit allow-list, section/sub-section ownership and cascades, `getFullCourseDetails` access, public details (Published only) and listing/search, progress, `getAssetUrl` authorization and expiry clamp, ratings, categories, notes, enrollment approval workflow, `deleteCourse` cascade |
| `payment.test.js` | 15 | `capturePayment`, `verifyPayment` (free, paid without payment, forged vs valid HMAC, mixed carts, approval courses, unpublished, stub flag only outside production), `sendPaymentSuccessEmail`, cart |
| `profile-admin.test.js` | 15 | User details, public profile (limited fields, `protectMe`), profile image, profile update, instructor dashboard, account deletion (and its 409 rule), admin user management (self-protection), site stats cache, student dashboard |
| `snapshot.test.js` | 20 | Health check; public snapshot (all resources, verifiable and stable hash, drafts excluded, no emails/password hashes/enrollment requests, catalog courses carry instructor and category names, empty database); admin-only publish/status; republish scheduled only after successful content writes (mutation matcher); publisher single-flight, debounce, unchanged-skip, force, upload failure and retry, build failure never uploads, boot sync (unchanged, stale, missing, unreachable); frontend rebuild hook (once per change, failures logged, skipped when unset). Cloudinary itself is not called (credentials blanked in `test/helpers.js`) |
| `uploads.test.js` | 6 | `uploadGuard`: real image accepted, executables, spoofed-mimetype and SVG rejected on image fields, empty files |
| `smoke.test.js` | 5 | JSON 404, protected route without token, valid token, CORS rejection, operator-key stripping |
| `contact.test.js` | 3 | Contact form escaping, optional fields, validation |

### 2.4 What is NOT covered

- Real Cloudinary uploads, deletions and signed URL delivery (stubbed; signing is computed locally with fake credentials).
- Real SMTP delivery and template rendering through nodemailer (`mailSender` is replaced; tests assert the recorded recipient/subject/body).
- Real Razorpay: only the HMAC signature logic with a test secret is covered. There is no order flow to test.
- Rate limiting (disabled under test), helmet header contents, `MAX_UPLOAD_MB` oversize behavior, graceful shutdown, `server.js` startup checks (`assertSecurityConfig`, fail-fast DB connect).
- The `backup/` service (Google Drive, restore) and `scripts/` build/deploy.
- The entire frontend: Redux slices, `apiConnector` interceptor, `ProtectedRoute`/`RoleRoute`, forms, pages.
- Classroom quiz edge cases for `puzzle` screens (never scored correct), performance and load.

## 3. Manual Verification (frontend and external services)

### 3.1 Role Matrix

Role-guard failures are HTTP 403; missing or invalid tokens are 401. "Instr (unapproved)" is an Instructor with `approved = false`.

| Action | Student | Instructor | Instr (unapproved) | Admin | Anonymous |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Browse catalog, course details, categories, `/site/stats`, `/reach/contact` | allow | allow | allow | allow | allow |
| Cart, `/student/dashboard`, `/classroom/my`, `/classroom/join`, profile endpoints | allow | allow | allow | allow | 401 |
| `createCourse`, section/sub-section CRUD (own course), `togglePublish`, `deleteCourse`, `getInstructorCourses` | 403 | allow (owner only) | 403 | 403 | 401 |
| Category create/update/delete, `/admin/*` | 403 | 403 | 403 | allow | 401 |
| `updateCourseProgress`, `createRating`, `requestEnrollment`, `GET /course/enrollment-requests`, payment endpoints | allow | 403 | 403 | 403 | 401 |
| Enrollment-request list / respond | 403 | allow (owner only) | 403 | 403 | 401 |
| `POST /classroom/create` | 403 | allow | 403 | 403 | 401 |
| Classroom reads and writes | by classroom role (owner/coInstructor/member/guest), Admin has staff access everywhere; non-members 403 | | | | 401 |
| `GET /profile/instructorDashboard` | 403 | allow | 403 | 403 | 401 |

Token forms to exercise on a protected route: `Authorization: Bearer <t>`, cookie `token`, `body.token`.

### 3.2 Flow Checklist

1. Signup -> OTP email -> verify -> login -> change password -> forgot password -> reset (check the mailed link uses `FRONTEND_URL`).
2. Instructor: signup, confirm 403 "pending admin approval", approve via `POST /admin/updateUser`, then create course -> section -> sub-section with upload -> publish -> edit -> unpublish -> delete.
3. Student: add to cart -> enroll (free course; paid course needs a signature or `ALLOW_STUBBED_PAYMENT=true` in development) -> watch, mark complete -> note -> rate.
4. Approval flow: set `requiresApproval`, student requests, instructor approves/rejects, student sees status.
5. Classroom: create -> join by code -> topic -> item toggle -> assignment (assignees `all` and `selected`, `lockSubmissions`) -> submit -> grade -> quiz (each screen type) -> attempt -> leaderboard -> announcement.
6. Admin: list/search/update/delete users; category CRUD.
7. Negative inputs: missing fields, invalid ObjectIds, wrong role, expired token, CORS origin not in allow-list (expect 403), more than 20 auth-endpoint requests from one IP within 15 minutes (expect 429) on a non-test instance.
8. Frontend: visiting a role-restricted URL as another role redirects to `/dashboard`; a 403 does not log the user out; a 401 "Token is Missing" or "Error while decoding token" logs out and goes to `/login`; "Account not found or deactivated" does not trigger the automatic logout (message mismatch in `apiConnector.js`).
9. Backup service: `npm run once`, `GET /health`, `GET /backups` with `x-api-key`.

## 4. Regression Policy

- A defect is recorded as a failing test first, then fixed; the suite is the regression guard for the security hardening (ownership, RBAC, payment, OTP, reset, upload guard, answer keys).
- Run `npm test` in `backend/` before every merge that touches `backend/`; run `npm run lint` and `npm run build` in `frontend/` for frontend changes. There is no CI pipeline; these are run locally.

## 5. Proposed (not in place)

- Frontend: Vitest + React Testing Library + `jsdom`, MSW for API mocking. Targets: Redux slices in `entities/*`, the `apiConnector` interceptor, `ProtectedRoute`/`OpenRoute`/`RoleRoute`, signup and login forms.
- Backend gaps worth adding: rate-limit behavior with the limiter enabled, `assertSecurityConfig`, upload size limit, and the `puzzle` evaluator.
- End-to-end (later): Playwright against a local backend with a seeded in-memory database, covering the section 3.2 flows per role.
- CI to run `npm test`, `npm run lint` and `npm run build` on each pull request.
