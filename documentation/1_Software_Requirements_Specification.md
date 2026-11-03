# Software Requirements Specification (SRS)

## 1. Introduction

ClzMate is an e-learning and academy management platform. Tutors and academies publish recorded-content courses, run classrooms (topics, assignments, quizzes, announcements), and manage students. The system is under development and not in production use.

Status legend: **Implemented** (code present and covered by the automated suite unless noted), **Partial** (works with a stated limitation), **Not implemented** (stub or absent). "Covered" means a test in `backend/test` exercises it (see document 8); external services (Cloudinary, SMTP, Razorpay, Google Drive) are stubbed or never called in tests.

## 2. Roles

| Role | Signup | Notes |
| :--- | :--- | :--- |
| Student | Public | Enrolls in courses, joins classrooms as a member, submits work. |
| Instructor | Public; account starts with `approved = false` | Can log in immediately, but every `isInstructor` route returns 403 ("Instructor account is pending admin approval") until an admin sets `approved = true` (`POST /admin/updateUser`). Admins approve or revoke from the admin users page. |
| Admin | Not creatable through signup | Signup accepts only `Student` or `Instructor` (400 otherwise). Admins must be created directly in the database. |

`Parent` no longer exists (removed from the frontend constants and never in the schema enum).

Roles are enforced by backend middleware (`isStudent`, `isInstructor`, `isAdmin`; role mismatch is HTTP 403) and by frontend `RoleRoute` guards per route. The `auth` middleware re-loads the user on every request, so role, `active` and `approved` changes take effect immediately.

## 3. Functional Requirements

### 3.1 Account Management

| ID | Requirement | Status |
| :--- | :--- | :--- |
| 3.1.1 | Sign up (`/auth/signup`) with preferred name, optional first/last name, email, password (8-72 chars), confirm password, account type `Student` or `Instructor`, optional contact number. Creates an unverified user; the frontend then calls `/auth/sendotp`. | Implemented, covered |
| 3.1.2 | Email verification by a 6-digit OTP (`/auth/sendotp`, `/auth/verifyotp`): CSPRNG code stored only as an HMAC hash, 5-minute TTL, 60 s resend cooldown, 5 wrong attempts invalidate it, deleted after use. | Implemented, covered (mail is stubbed) |
| 3.1.3 | Log in with email and password; JWT returned and set as an httpOnly cookie. Requires `verified` and `active` (403 otherwise). Wrong email or password returns the same 401 "Invalid credentials". | Implemented, covered |
| 3.1.4 | Change password (old + new). Invalidates tokens issued before the change (`passwordChangedAt`). | Implemented, covered |
| 3.1.5 | Forgot/reset password by emailed link (`/auth/reset-password-token`, `/auth/reset-password`): sha256-hashed single-use token, 15-minute TTL, generic response that does not reveal whether the email exists. Link is built from `FRONTEND_URL`. | Implemented, covered (mail is stubbed) |
| 3.1.6 | Update profile fields and display picture (image types only, no SVG); delete own account (blocked with 409 for an instructor who still owns published courses with enrolled students); view limited public profile (`protectMe` hides details). | Implemented, covered |

### 3.2 Administration

| ID | Requirement | Status |
| :--- | :--- | :--- |
| 3.2.1 | Admin lists/searches (paginated), updates (`accountType`, `active`, `approved`) and deletes users (`/admin/*`). An admin cannot demote, deactivate or delete themselves. User deletion cascades to owned courses, enrollments, progress, notes and reviews. | Implemented, covered |
| 3.2.2 | Admin creates, updates and deletes course categories (delete is refused with 409 while the category has courses). | Implemented, covered |

### 3.3 Courses

| ID | Requirement | Status |
| :--- | :--- | :--- |
| 3.3.1 | Instructor creates, edits, publishes/unpublishes and deletes own courses (name, description, price, category, tags, thumbnail, instructions, `features`, `requiresApproval`). `editCourse` applies only a field allow-list. Deleting a course cascades to sections, sub-sections, progress, notes, reviews, cart entries and Cloudinary assets. | Implemented, covered (Cloudinary stubbed) |
| 3.3.2 | Instructor manages sections and sub-sections (video, PDF, HTML, external http(s) video URL, support materials). Every call checks the caller owns the parent course (admin bypass where the route admits admins). | Implemented, covered |
| 3.3.3 | Public catalog: paginated/filterable list of Published courses, details of a Published course (video URLs and support materials hidden), categories, category page. | Implemented, covered |
| 3.3.4 | Enrolled student tracks lecture completion per sub-section (once per sub-section). | Implemented, covered |
| 3.3.5 | Enrolled student (or owner/admin) saves and reads personal notes per course/section/sub-section. | Implemented, covered |
| 3.3.6 | Enrolled student rates (integer 1-5) and reviews a course once; public average rating (`GET /course/getAverageRating?courseId=`) and review list. | Implemented, covered |
| 3.3.7 | Cart: add (Published, not already enrolled), remove, clear, list. | Implemented, covered |
| 3.3.8 | Enrollment through the payment endpoints: free courses (`price === 0`) enroll directly. Paid courses require a valid Razorpay signature (HMAC with `RAZORPAY_SECRET`); otherwise `verifyPayment` returns 402. In non-production only, `ALLOW_STUBBED_PAYMENT=true` accepts paid enrollment without a gateway. There is no Razorpay order creation (`capturePayment` only totals the price). | **Partial**: signature check is implemented and covered; real Razorpay order flow and frontend checkout are not (the `razorpay` package is not a dependency). |
| 3.3.9 | Approval-based enrollment: for a `requiresApproval` course, enrollment (request endpoint or payment path) creates a Pending request; the owner/admin approves or rejects (`action: approve\|reject`), student sees own requests. | Implemented, covered |
| 3.3.10 | Signed Cloudinary download URLs (`/course/getAssetUrl`), issued only for assets belonging to a sub-section the caller is enrolled in or owns, a Published course thumbnail (or one the caller manages), or a stored profile image. | Implemented, covered (signing is local; Cloudinary itself is not called) |

### 3.4 Classrooms

Access is decided per classroom by `utils/classroomAccess.js`: **owner**, **coInstructor**, **member** (students), **guest**, plus **Admin** (global bypass). Staff = owner, coInstructor, admin. Non-members get 403.

| ID | Requirement | Status |
| :--- | :--- | :--- |
| 3.4.1 | Approved instructor creates a classroom (invite code, 16 hex chars); any authenticated user joins by code as a Student member; list own classrooms (owned/joined, search, paging); classroom overview. Invite code is hidden from non-staff. | Implemented, covered |
| 3.4.2 | Staff add/remove members (`POST /classroom/:id/add-member`, `remove-member`). Owner/admin adding an Instructor-type user makes them coInstructor; the owner cannot be removed; only owner/admin can remove a coInstructor. | Implemented, covered |
| 3.4.3 | Staff manage topics (create, update, delete, reorder) and topic items (create, update, delete, reorder, copy between topics, publish toggle). | Implemented, covered |
| 3.4.4 | Assignments: staff create, update, delete (cascades to submissions and files); members list/get published and targeted ones; students submit (not after `dueDate`, not when `lockSubmissions`, not once graded), staff list and grade (0..points) with feedback. `assigneeType` `all`/`selected`. One submission per student (unique index). | Implemented, covered |
| 3.4.5 | Quizzes: staff create, update, delete; screens of type multiple, truefalse, short, slider, poll, puzzle; reorder; students submit attempts graded **server-side**; one attempt per user per quiz (unique index; `finish: true` closes it); leaderboard. Students never receive `options[].correct` (short/slider options are emptied) until they finish an attempt. | Implemented, covered. `puzzle` screens are never marked correct by the evaluator. |
| 3.4.6 | Announcements per classroom (staff create, members list). | Implemented, covered |
| 3.4.7 | Classroom sessions (external meeting URLs), in-classroom messaging. | Not implemented: `ClassroomSession` and `Message` models exist, nothing uses them; no Socket.io. |

### 3.5 Dashboards and Site

| ID | Requirement | Status |
| :--- | :--- | :--- |
| 3.5.1 | Student dashboard (`GET /student/dashboard`, any authenticated user), approved-instructor dashboard (`/profile/instructorDashboard`), enrolled courses. | Implemented, covered |
| 3.5.2 | Public site statistics (`/site/stats`), cached in memory for 60 s. | Implemented, covered |
| 3.5.3 | Contact form (`POST /reach/contact`): validated, HTML-escaped, mailed to `MAIL_FROM_EMAIL` or `MAIL_USER`; 5 requests per 15 min per IP. | Implemented, covered (mail is stubbed) |

### 3.6 Operations

| ID | Requirement | Status |
| :--- | :--- | :--- |
| 3.6.1 | Scheduled MongoDB backup to Google Drive (every 12 h) with REST trigger/restore (separate `backup/` service). REST API requires `BACKUP_API_KEY` (min 24 chars) and binds to `HOST` (default `127.0.0.1`). | Implemented, independent of the main app, not covered by tests |

## 4. Non-Functional Requirements

| Area | Requirement | Status |
| :--- | :--- | :--- |
| Security | bcrypt password hashing (8-72 chars); JWT with per-request user reload (deleted/inactive user or token older than `passwordChangedAt` gives 401); helmet; CORS allow-list with explicit 403; rate limits (global 600/15 min, auth endpoints 20/15 min, contact 5/15 min); 1 MB JSON limit; upload size limit and extension/type guard; NoSQL operator-key stripping; HTML escaping in emails; ownership and classroom RBAC checks; production start refuses a short `JWT_SECRET` or missing `CORS_ALLOWED_ORIGINS`. | Implemented, largely covered |
| Reliability | JSON 404 and central error handler (no error text leaks on 5xx; `CastError`/validation/bad JSON map to 400); database connected before listening, process exits on failure; graceful shutdown on SIGTERM/SIGINT. | Implemented |
| Compatibility | Node.js >= 18 (Express 5). | Required |
| Testing | `cd backend && npm test`: in-memory MongoDB. No frontend or backup tests. See document 8. | Backend only |
| Performance, scalability | No measured targets. Only caching is the 60 s site-stats cache; several list endpoints still filter/paginate in memory. | Not assessed |
| Payments | Secure online payment. | Partial (see 3.3.8) |

## 5. Constraints

- JavaScript only (no TypeScript) in `backend/`, `frontend/`, `backup/`.
- Single Express process, MongoDB (Mongoose), Cloudinary for uploads, Nodemailer for email.
