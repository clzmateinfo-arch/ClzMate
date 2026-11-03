# Functional and Non-Functional Requirements

## 1. Introduction

Summary of what ClzMate does and the quality attributes it can be claimed to meet, checked against the code and the backend test suite. Per-requirement detail and status: document 1.

## 2. Functional Requirements

### 2.1 Implemented Features

- **Accounts**: signup (Student or Instructor; password 8-72 characters), emailed 6-digit OTP verification (hashed, rate-limited, 5 attempts), login (JWT, also set as httpOnly cookie; requires verified and active account), change password, forgot/reset password by emailed single-use link, profile update, display picture, account deletion, limited public profile.
- **Roles**: Admin, Instructor, Student. Instructors start unapproved and cannot use instructor routes until an admin approves them. Admins are not creatable through signup. `Parent` was removed.
- **Admin**: list/search, update (`accountType`, `active`, `approved`) and delete users (with cascading cleanup); create, update, delete categories.
- **Courses**: create/edit/publish/delete with ownership checks; sections and sub-sections with Cloudinary-hosted video, PDF, HTML, support materials, or external video URL; catalog and category pages (Published only); cart; lecture progress; per-lesson notes; integer 1-5 ratings and reviews (enrolled students, once per course).
- **Enrollment**: free courses enroll directly; paid courses need a valid Razorpay signature (or the non-production `ALLOW_STUBBED_PAYMENT` switch); courses with `requiresApproval` create a request that the owner approves or rejects; the student lists own requests.
- **Classrooms**: create, invite-code join, member add/remove, overview; topics with items (create, update, delete, reorder, copy, publish toggle); assignments with submissions, grading and feedback; quizzes (six screen types) with server-side grading, attempts and leaderboard; announcements. Access is by classroom role (owner, coInstructor, member, guest, admin).
- **Contact form**: `POST /reach/contact` mails the site owner.
- **Dashboards**: student, instructor, enrolled courses; public site stats.
- **Backup**: independent service that backs up MongoDB to Google Drive, API protected by `BACKUP_API_KEY`.

### 2.2 Not Implemented or Limited

- **Payment (Razorpay)**: no order creation and no frontend checkout; only signature verification exists. Paid enrollment is unavailable (402) unless `RAZORPAY_SECRET` is configured and a valid signature is supplied, or the non-production stub switch is on.
- **Instructor approval**: admins approve or revoke instructors from the admin users page ("Approve instructor" / "Revoke approval", `POST /admin/updateUser` with `approved`).
- **Real-time messaging, classroom sessions**: models only, no code.
- **Puzzle quiz screens**: accepted and stored, never scored as correct.
- **Parent role, Parent dashboard**: removed/absent.
- **Frontend and backup automated tests**: none (backend suite only).

## 3. Non-Functional Requirements

| Attribute | Current state | Verified basis |
| :--- | :--- | :--- |
| Security | bcrypt hashing; JWT with per-request user reload (inactive/deleted user and tokens issued before a password change are rejected); role guards (403) and `isInstructor` approval check; ownership checks on courses/sections/sub-sections; classroom RBAC; helmet; CORS allow-list; rate limits (global 600/15 min, auth endpoints 20/15 min, contact 5/15 min); 1 MB JSON body limit; upload size limit and file-type guard; operator-key stripping; escaped email HTML; hashed OTP and reset tokens; startup refuses weak `JWT_SECRET` in production. | Code review and `npm test` |
| Payment security | Signature verification with constant-time compare; no unverified paid enrollment in production. Order creation absent. | `payments.js`, `payment.test.js` |
| Performance | No measurements. In-memory 60 s cache for site stats only; several list endpoints (instructor courses, enrolled courses) filter and paginate in memory. No performance claim is made. | Code review |
| Scalability | Stateless JWT allows multiple instances, but rate-limit counters, the stats cache and upload temp files are per instance; single MongoDB. No scaling work done. | Code review |
| Usability | Tailwind UI; role-filtered sidebar; toast feedback. No usability or responsiveness testing. | Code review |
| Reliability | Per-controller try/catch; central JSON error handler and 404; database connected before listen (fail-fast); graceful shutdown; backup service exists. | Code review, `smoke.test.js` |
| Maintainability | JavaScript only; layered frontend (`entities/features/pages/shared/widgets`); no service layer in backend, shared rules in `src/utils`; ESLint on frontend only. | Code review |
| Testability | Backend: 147 `node:test` + supertest tests against in-memory MongoDB (`npm test`). Frontend and backup: none. See document 8. | Repository |
| Compatibility | Node.js >= 18. | Express 5 |
