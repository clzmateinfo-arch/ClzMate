---
name: backend-dev
description: "Activates the ClzMate backend developer role. Use when working on anything in the backend/ directory — new routes, controllers, Mongoose models, auth middleware, email, file uploads, or debugging API behavior. Loads verified knowledge of the Express monolith, all 19 schemas, the hardened auth chain, controller patterns, classroom RBAC, and the test suite."
disable-model-invocation: false
---

# ClzMate Backend Developer

Backend developer for ClzMate (e-learning platform). Verified context for `backend/`. Code is the source of truth; re-read before relying on this.

## Stack

- Express 5.1, Mongoose 8, `jsonwebtoken`, `bcrypt`, `helmet`, `express-rate-limit`, `cors`, `cookie-parser`, `express-fileupload`, Cloudinary, Nodemailer. JavaScript only, no TypeScript, no Swagger.
- Not installed: `razorpay` SDK, `node-schedule`. `config/rajorpay.js` is a commented-out leftover.
- Tests: `cd backend && npm test` (see Testing).

## Before writing code, state assumptions

1. Route already exists? (`src/routes/`) Controller? (`src/controllers/`) Model? (`src/models/`, 19)
2. Guard: `auth` plus which role guard, and which resource-level check (ownership, classroom role, enrollment)?
3. Cloudinary upload? Email? Failure paths (missing fields, wrong role, invalid ObjectId, not found, not owner)?
4. Existing helper to reuse? (`utils/validators.js`, `courseAccess.js`, `classroomAccess.js`, `enrollment.js`)

## Startup and middleware

`server.js`: `assertSecurityConfig()` -> `await connectDB()` (exits 1 on failure) -> `cloudinaryConnect()` -> `createApp().listen()`; SIGTERM/SIGINT close the server. Production refuses `JWT_SECRET` < 32 chars or empty `CORS_ALLOWED_ORIGINS`.

`src/app.js` `createApp()` (no I/O; tests import it): helmet -> cors + Origin allow-list (403 JSON) -> `globalLimiter` (600/15 min) -> `express.json({limit:"1mb"})` -> cookieParser -> fileUpload (`MAX_UPLOAD_MB`, default 200, `os.tmpdir()`) -> `uploadGuard` -> `sanitizeRequest` -> routes -> JSON 404 -> `errorHandler` (CastError/ValidationError/bad JSON -> 400, 5xx hidden as "Internal server error").

Mounts under `/api/v1`: `auth`, `profile`, `payment`, `course`, `admin`, `cart`, `student`, `site`, `classroom`, `reach` (contact). A new route file must be required and mounted in `app.js`.

Limiters: `authLimiter` 20/15 min on signup, login, sendotp, verifyotp, reset-password-token, reset-password; contact route 5/15 min; all skipped when `NODE_ENV=test`.

## Auth (`src/middleware/auth.js`)

- Token order: `Authorization` header first, then cookie `token`, then `req.body.token` (strips `Bearer ` and quotes). The header must win: a stale login cookie must never override an explicit header. `POST /auth/logout` clears the cookie.
- `auth` verifies the JWT then **loads the user**: missing or `active:false` -> 401; token `iat` older than `passwordChangedAt` -> 401. Sets `req.user = { id, email, accountType, approved }` (from the DB, not the token).
- `isStudent`, `isAdmin`, `isInstructor` return **403**. `isInstructor` also requires `approved` (403 "pending admin approval").
- Signup allows only `Student|Instructor` (Instructor starts `approved:false`); admins are created in the DB. Password policy 8-72 (`utils/passwordPolicy.js`).
- Login: verified + active required (403), identical 401 "Invalid credentials" for unknown email/wrong password (dummy bcrypt compare).
- JWT: `utils/jwt.js` `signToken/verifyToken`, secret `JWT_SECRET`, expiry `JWT_EXPIRES` (24h).
- OTP: `auth.sendOTP` mails a `crypto.randomInt` 6-digit code, then stores `otpHash` (HMAC with `JWT_SECRET`). 60 s resend cooldown (429), mail failure 502, 5 attempts then wipe, deleted after verify, TTL 5 min (fixed `default: Date.now`). No model hooks.
- Reset: `User.token` (select:false) holds sha256 of the emailed token, 15 min, single use, generic response, link `FRONTEND_URL/update-password/<token>`. Password change/reset sets `passwordChangedAt`.

## Controller pattern

```javascript
exports.handler = async (req, res) => {
  try {
    if (!isObjectId(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendServerError(res, "label", error, "Client-safe message");
  }
};
```

- Helpers: `isObjectId`, `isObjectIdArray`, `escapeHtml`, `buildSearchRegex`, `sendServerError` (`utils/validators.js`); `isNonEmptyString`, `escapeRegex` (`middleware/sanitize.js`).
- Never return `error.message` for 5xx. Whitelist fields from `req.body` (no mass assignment). Escape user text placed in email HTML.
- Classroom controllers use `HttpError` + `sendError` from `utils/classroomAccess.js` (maps 11000 -> 409, Validation/CastError -> 400).
- Response: `{ success, message?, data? }`; several endpoints add sibling keys.

## Ownership and RBAC

- Courses: `utils/courseAccess.js` `canManageCourse(req, course)` (owner or Admin), `isEnrolledOrOwner`, `findCourseForSection`. `section`/`subSection` controllers verify the caller owns the parent course and that child ids belong to the parent (404 otherwise). `editCourse` applies an allow-list. `getCourseDetails` returns Published only and hides video URLs/support materials. `getFullCourseDetails`, notes: enrolled, owner or Admin. `getAssetUrl` authorizes per asset (enrolled/owner sub-section, Published thumbnail, profile image).
- Classrooms: `utils/classroomAccess.js`. Roles: owner, coInstructor, member, guest, admin (Admin bypass). Staff = owner/coInstructor/admin. Use `assertMember(classroom, req.user)` / `assertStaff(...)` after loading context (`loadTopicContext`, `loadAssignmentContext`, `loadQuizContext`, `loadScreenContext`). Only `POST /classroom/create` has a role guard (`isInstructor`); `/join` is open to any authenticated user (becomes Student member).
- Students: `submitAssignment` only role `member`, targeted, published, unlocked, before due date, not graded. Quiz answers graded server-side (`utils/quizz.js`), `stripQuizAnswerKeys` for non-staff until a finished attempt; one `Attempt` per (quiz,user), one `Submission` per (assignment,student) via unique indexes.
- Invite code: 16 hex chars (`crypto.randomBytes(8)`), hidden from non-staff.
- Cascades: `utils/courseCleanup.js`, `utils/userCleanup.js`; `deleteUserWithData` returns `{deleted:false}` (409) for an instructor with published courses that have students.

## Enrollment and payment (`utils/enrollment.js`, `controllers/payments.js`)

- `enrollStudentInCourses`: per course (Published only): already enrolled -> `already-enrolled`; `requiresApproval` -> Pending request + instructor email; else `completeEnrollment` (atomic `$ne` claim, `CourseProgress` upsert, email).
- `verifyPayment`: all courses `price===0` -> enroll; else valid Razorpay HMAC with `RAZORPAY_SECRET` -> enroll, invalid -> 400, none -> 402 unless `NODE_ENV!=="production"` and `ALLOW_STUBBED_PAYMENT==="true"`. `capturePayment` only totals prices (no gateway order).
- Approval: `POST /course/enrollmentRequests/:courseId/:requestId/respond` with `{ action: "approve"|"reject", note }`; 409 if already answered.

## Uploads (`utils/fileUploader.js`, `middleware/uploadGuard.js`)

- `uploadFileToCloudinary(file, folder, height, quality, opts)` always `type:"authenticated"`; resource type from mimetype. Store `url`, `publicId`, `resourceType`, `originalName`, `mimeType`, `size`; delete with `deleteResourceFromCloudinary(publicIdOrUrl, resourceType)`.
- `uploadGuard` rejects empty files, blocked extensions, and non-images (incl. SVG) in fields `thumbnail|thumbnailImage|profileImage|image`.

## Email (`utils/mailSender.js`)

`mailSender(to, subject, html)` returns the nodemailer info or `null` on any failure (never throws). `MAIL_SERVICE=gmail` uses Gmail, else SMTP (`MAIL_HOST/PORT/SECURE`). Decide per caller whether `null` is fatal (`sendOTP` answers 502; enrollment mail is best-effort). Templates in `src/mail/templates/`.

## Public snapshot (`utils/snapshotPublisher.js`, `controllers/snapshot.js`)

Keeps the site usable while the free Render instance cold-starts. `buildSnapshot()` runs the public controllers in-process (fake req/res) so the snapshot equals the live API; it must stay deterministic (no random or time-dependent fields, or the hash changes on every build and every wake re-uploads) and must contain public data only. Published as a public raw Cloudinary file `<SNAPSHOT_FOLDER>/snapshot/snapshot.json`, single-flight, 8 s debounce after successful writes matched by `CONTENT_MUTATION_PATH` (add new public-data mutations there and in the frontend `resources.js` regex), skipped when the hash is unchanged, then optional `RENDER_DEPLOY_HOOK_URL`. Routes: `GET /api/v1/health`, `GET /api/v1/snapshot` (60 s cache), admin `POST /admin/snapshot/publish`, `GET /admin/snapshot/status`. Tests blank Cloudinary env vars in `test/helpers.js`; never let a test publish for real.

## Models (19, `src/models/`, always via `utils/createModel`)

User (email unique+lowercase, `active`, `approved`, `verified`, `passwordChangedAt`, `token` select:false), Profile, Course (`price` min 0, `requiresApproval`, embedded `enrollmentRequests`), Category, Section, SubSection, CourseProgress, OTP (`email`, `otpHash`, `attempts`, TTL), RatingAndReview (rating Number 1-5, unique user+course), Note, Classroom, Announcement, Topic (embedded `items`), Assignment, Submission (unique assignment+student), Quiz (embedded `screens`), Attempt (unique quiz+user), Message and ClassroomSession (unused, no real-time layer).

## Env vars (`backend/.env.example`)

Required: `DATABASE_URL`, `JWT_SECRET`, `CLOUD_NAME`, `API_KEY`, `API_SECRET`, `FOLDER_NAME`, `MAIL_USER`, `MAIL_PASS`, `FRONTEND_URL` (reset link; replaces `API_URL`), `CORS_ALLOWED_ORIGINS` (required in production).
Optional: `PORT`, `NODE_ENV`, `JWT_EXPIRES`, `CORS_BLOCK_NO_ORIGIN`, `APP_DOMAIN`, `MAX_UPLOAD_MB`, `ALLOW_STUBBED_PAYMENT` (non-production only), `MAIL_SERVICE`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_TLS_REJECT_UNAUTHORIZED`, `MAIL_FROM_NAME`, `MAIL_FROM_EMAIL`, `RAZORPAY_SECRET` (signature check), `RAZORPAY_KEY` (unused).

## Testing

`npm test` = `node test/run.js`: in-memory mongod, `node:test` + supertest, serial. Files in `backend/test`: `auth`, `classroom`, `course`, `payment`, `profile-admin`, `uploads`, `smoke`, `contact` (`*.test.js`), helpers `helpers.js` (`createUser`, `asUser`, `api`, `sentMails`), `seed.js`, `stubFileUploader.js`. Mail and Cloudinary are stubbed; rate limits are off. Single file: `npm test -- test/auth.test.js`. Add or update a test for every behavior change; run the whole suite before declaring done.

## Done checklist

1. Route registered and mounted; guard and resource check correct (403 for wrong role/non-owner/non-member, 401 only for authentication).
2. ObjectIds validated (`isObjectId`), null checks after `find*`, no `$`-keys trusted, no mass assignment.
3. User text escaped in emails; no secrets or `error.message` in responses or logs.
4. New env var added to `.env.example` and documented.
5. `npm test` passes; docs in `documentation/` updated when endpoints or behavior change.
