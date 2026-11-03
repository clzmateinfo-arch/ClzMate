---
name: qa-dev
description: "Activates the ClzMate QA role. Use when asked to test, verify, review, audit, write test plans, investigate bugs, or validate that a feature works correctly end-to-end. Loads verified knowledge of the backend test suite, feature behavior, role matrix, known gaps, and the conditions under which each flow works or fails."
disable-model-invocation: false
---

# ClzMate QA Engineer

QA for ClzMate (e-learning platform). Code is the source of truth; verify against it, never against this file alone.

## Principles

- Backend has an automated suite: `cd backend && npm test` (about 30 s, in-memory MongoDB, `node:test` + supertest; the summary line prints the current count). Frontend and `backup/` have no tests; `npm test` in `frontend/` does not exist.
- Do not claim correctness without running something: `npm test`, `npm run build` and `npm run lint` (frontend), or a real request against a running instance (use a free port, not 5000).
- Always test the unhappy path: missing data, wrong role, not the owner, not a member, invalid ObjectId, failed network, rate limit.
- State conditions (role, auth state, data state) with every "works".
- Record a defect as a failing test first, then fix.

## Test suite (`backend/test`)

| File | Covers |
| :--- | :--- |
| `auth.test.js` | signup, OTP, login, auth middleware, change password, reset |
| `classroom.test.js` | classroom RBAC, topics/items, assignments, submissions, grading, quizzes, attempts, cascades |
| `course.test.js` | courses, sections, sub-sections, access, assets, ratings, categories, notes, approval flow, delete cascade |
| `payment.test.js` | capture/verify payment, email, cart |
| `profile-admin.test.js` | profile, public profile, admin users, site stats, dashboards |
| `uploads.test.js`, `smoke.test.js`, `contact.test.js` | upload guard, JSON 404/CORS/sanitizing, contact form |

Helpers: `helpers.js` (`createUser`, `asUser`, `api`, `sentMails`), `seed.js`, `stubFileUploader.js`. Run one file: `npm test -- test/auth.test.js`.

Not covered: real Cloudinary, SMTP and Razorpay; Google Drive/`backup/`; rate limiting (disabled when `NODE_ENV=test`); helmet headers; upload size limit; startup checks and shutdown; the whole frontend.

## System boundaries

Browser SPA -> Express API (port 5000) -> MongoDB; Cloudinary (authenticated assets), Nodemailer (OTP, reset, enrollment, payment, contact). `backup/` is independent. Each boundary can fail on its own; `mailSender` returns `null` instead of throwing.

## Known limits (do not test as working)

| Feature | Status |
| :--- | :--- |
| Razorpay order flow / checkout | Not implemented. Only HMAC signature verification exists. Paid `verifyPayment` -> 402 unless a valid signature with `RAZORPAY_SECRET`, or non-production `ALLOW_STUBBED_PAYMENT=true`. Free courses (price 0) enroll. The frontend `buyCourse` sends no signature |
| Real-time messaging, classroom sessions | Absent (`Message`, `ClassroomSession` models unused) |
| Instructor approval in the UI | Missing; only `POST /admin/updateUser {approved:true}` |
| Puzzle quiz screens | Never scored correct |
| Frontend auto-logout on "Account not found or deactivated" / "Session expired after password change" | Does not fire (message does not match the interceptor keywords); "Token is Missing"/"Error while decoding token" do |
| Frontend/backup tests, CI | None |

## Role matrix

Role guard failure is **403**; no/invalid token or deactivated/deleted user is **401**.

| Guard | Student | Instructor (approved) | Instructor (unapproved) | Admin | No token |
| :--- | :--- | :--- | :--- | :--- | :--- |
| none | allow | allow | allow | allow | allow |
| `auth` | allow | allow | allow | allow | 401 |
| `isStudent` | allow | 403 | 403 | 403 | 401 |
| `isInstructor` | 403 | allow | 403 | 403 | 401 |
| `isAdmin` | 403 | 403 | 403 | allow | 401 |

Roles are `Student`, `Instructor`, `Admin`; `Parent` does not exist. Signup accepts only Student or Instructor. States to test per feature: anonymous, Student, approved Instructor, unapproved Instructor, Admin, expired token, token issued before a password change, deactivated user, deleted user.

## Feature checks

### Auth
| Scenario | Expected |
| :--- | :--- |
| Signup Student/Instructor | 201, user unverified; Instructor `approved:false` |
| Signup `Admin` or `Parent` | 400 |
| Password < 8 or > 72, mismatch, bad email, object instead of string | 400 |
| Signup with verified email | 409; unverified email is overwritten |
| `sendotp` twice within 60 s | second 429; mail failure 502 |
| Wrong OTP | 400, `attempts` +1; after 5, OTP wiped, correct code then fails |
| Correct OTP | `verified:true`, OTP deleted, replay fails |
| Login unverified / deactivated | 403 |
| Login wrong password or unknown email | identical 401 "Invalid credentials" |
| Login response | no `password`, `token`, reset fields |
| Change/reset password | `passwordChangedAt` set; older tokens 401 |
| Reset token | hashed in DB, 15 min, single use, generic response for unknown email, link uses `FRONTEND_URL` |
| 21st auth request in 15 min from one IP | 429 (not testable under `NODE_ENV=test`) |

### Courses
| Scenario | Expected |
| :--- | :--- |
| Student or unapproved instructor creates course | 403 |
| Instructor B edits/deletes A's course, section or sub-section | 403 |
| `editCourse` with `studentsEnrolled`/`instructor` | Ignored |
| Negative price, missing thumbnail, SVG/non-image thumbnail, executable upload | 400 |
| `getCourseDetails` on Draft | 404; Published hides video URLs/support materials |
| `getFullCourseDetails` as non-enrolled user | 403; owner/Admin/enrolled allowed |
| Delete course | Cascades to sections, progress, notes, reviews, cart refs |
| `updateCourseProgress` | Enrolled only; sub-section must belong to course; repeat 400 |
| Rating | integer 1-5, enrolled only, once (409); average via `GET /course/getAverageRating?courseId=` |
| `getAssetUrl` | Enrolled/owner sub-section assets, Published thumbnail, profile image; else 403; expiry clamped 60-3600 s |
| Category delete with courses | 409 |

### Enrollment and payment
| Scenario | Expected |
| :--- | :--- |
| Free course `verifyPayment` | Enrolled, progress created once, email sent, repeat -> `already-enrolled` |
| Paid course without signature (production, or flag off) | 402, no enrollment |
| Forged signature | 400 |
| Valid HMAC with `RAZORPAY_SECRET` | Enrolled |
| Mixed free + paid | Whole request needs a valid signature (402/400 otherwise), nothing enrolled |
| Any course unpublished or missing | 404, nothing enrolled |
| `requiresApproval` course | Pending request, no enrollment; duplicate request stays single |
| Respond approve/reject | Owner only; `action` is `approve`/`reject`; 409 if already answered |
| `ALLOW_STUBBED_PAYMENT=true` with `NODE_ENV=production` | Still 402 |

### Classrooms (roles: owner, coInstructor, member, guest, admin)
| Scenario | Expected |
| :--- | :--- |
| Student/unapproved instructor creates classroom | 403 |
| Join by code | Any authenticated user becomes Student member; idempotent; bad code 404 |
| Non-member reads anything | 403 |
| Student view of classroom/members | No `inviteCode`, no other users' emails |
| Staff-only actions by member (topics, items, assignments, quizzes, announcements, grading, add/remove member) | 403 |
| Owner removal | 400; co-instructor removed by co-instructor 403 |
| Assignment draft / not targeted | Student 404 / 403 |
| Submit: staff, locked, past due, already graded | 403 / 403 / 403 / 409 |
| Grade outside 0..points, or submission from another assignment | 400 / 404 |
| Quiz fetch as student | No `options[].correct` until a finished attempt; unpublished 404 |
| Attempt | Graded on server; repeated/unknown screens ignored; second attempt document refused; after `finish` 409 |
| Delete topic/assignment/quiz | Cascades (submissions, attempts, files) |

### Admin, profile, site
| Scenario | Expected |
| :--- | :--- |
| Admin updates/deletes self | 400 |
| Admin delete instructor with published courses that have students | 409; otherwise cascade |
| Deactivate user | Their existing token becomes 401 immediately |
| Public profile | Name, image, about only; `protectMe` hides more; no email |
| Delete own account | 409 for instructor with published courses + students |
| `GET /site/stats` | Public, cached 60 s |
| `POST /reach/contact` | Escaped HTML mail; validation 400; 6th request in 15 min 429 |

### Cross-cutting
| Scenario | Expected |
| :--- | :--- |
| Unknown route | JSON 404 `Route not found` |
| Malformed JSON / invalid ObjectId | 400 |
| Body with `$ne` or dotted keys | Keys stripped, no injection |
| Disallowed `Origin` | 403 `CORS origin not allowed` |
| Body > 1 MB | Rejected |
| Unexpected error | 500 with generic message, no internals |
| Backend start with unreachable DB / production with short `JWT_SECRET` or empty `CORS_ALLOWED_ORIGINS` | Process exits 1 |

## Frontend verification

| Condition | How |
| :--- | :--- |
| Role guard | Open a role-restricted URL as another role -> redirect to `/dashboard` |
| Token absent | Clear `localStorage.token` -> `ProtectedRoute` goes to `/login` |
| 401 "Token is Missing"/"Error while decoding token" | Interceptor clears session, goes to `/login` |
| 403 (e.g. unapproved instructor) | Error shown, user stays logged in |
| Unverified login | 403 -> new OTP sent -> `/verify-email` |
| Network failure / 500 | Toast with message, no crash (`ErrorBoundary` for render errors) |
| Signup roles | Only Student and Instructor offered |

## Security checklist for new/changed endpoints

- Guard and resource-level check present (owner, classroom role, enrollment)? 403 vs 401 correct?
- ObjectIds validated; request body whitelisted; regex input escaped (`buildSearchRegex`).
- Uploads: type/size guarded, `uploadGuard` field names covered.
- No secrets or `error.message` returned or logged; user text escaped in email HTML.
- Tests added/updated and `npm test` green.
