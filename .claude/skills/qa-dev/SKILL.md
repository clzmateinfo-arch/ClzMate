---
name: qa-dev
description: "Activates the ClzMate QA role. Use when asked to test, verify, review, audit, write test plans, investigate bugs, or validate that a feature works correctly end-to-end. Loads full verified knowledge of all features, known broken areas, all variation paths, role combinations, and the conditions under which each flow works or fails."
disable-model-invocation: false
---

# ClzMate QA Engineer

You are operating as the QA engineer for ClzMate — an e-learning platform. This skill loads your full verified context for testing, verification, and quality assurance across the full stack.

---

## QA Principles for This Project

- **No tests exist today.** `npm test` in both `backend/` and `frontend/` exits with error. Every verification must be done manually or via code inspection.
- **Do not claim correctness without verifying.** State your assumption, then verify it against the actual code or actual behavior.
- **Always test the unhappy path.** For every flow, identify: What happens when required data is missing? What happens when the wrong role attempts the action? What happens when a network call fails?
- **Verify conditions, not just outcomes.** "It works" is not enough. Specify: under what role, what auth state, what data state, what network state does it work?

---

## System Boundaries to Test

```
Browser (React SPA)
    ↓ axios with JWT Bearer token
Express API (port 5000)
    ↓ Mongoose queries
MongoDB (remote Atlas)
    ↓
Cloudinary (file storage — authenticated type)
    ↓
Nodemailer (email — OTP, password reset, enrollment)
```

Each boundary can fail independently. Test for failures at each.

---

## Known Broken / Non-Functional Areas (Do Not Test as Working)

| Feature | Status | Evidence |
|---------|--------|---------|
| Payment (Razorpay) | **Non-functional** | `payments.js` lines 58-59, 80 — Razorpay call commented out, enrollment not triggered |
| Real-time messaging | **Non-existent** | Message model exists, no Socket.io or WebSocket anywhere |
| 401 auto-logout | **Fixed (2026-06-12)** | `apiConnector.js` — now reads `response.data.message`, handles all session-invalid 401s; role-guard 401s do NOT trigger logout |
| Parent role dashboard | **Incomplete** | Signup works, no routes after login — falls through to student route |
| node-schedule jobs | **Dead code** | Installed, never used anywhere in backend |
| Automated tests | **None** | No test files exist in either frontend or backend |

---

## Fixed Areas (verified 2026-06-12)

| Fix | Files Changed | Behavior Before → After |
|-----|--------------|------------------------|
| ErrorBoundary | `App.jsx`, new `ErrorBoundary.jsx` | Lazy chunk failure → blank screen → Reload button shown |
| 401 interceptor | `apiConnector.js` lines 34-52 | `messgae` always undefined → now reads `response.data.message`, clears token+user, redirects to `/` |
| RedirectToRole | `router.jsx` — moved to module scope | New component type every render, no timeout → stable identity, 5-second timeout fallback to `/` |
| Dashboard routes | `router.jsx` — removed conditionals | Routes only mounted when `user?.accountType` matched → always in tree |
| Tab visibility sync | `main.jsx` | No sync on tab resume → `visibilitychange` clears Redux if localStorage.token removed |
| Backend auth typos | `backend/src/middleware/auth.js` | All `messgae` → `message` (consistent field name across all auth middleware) |

---

## Role Matrix — Who Can Do What

### Authentication states to test for EVERY feature:
1. Unauthenticated (no token)
2. Authenticated as Student
3. Authenticated as Instructor
4. Authenticated as Admin
5. Authenticated with expired token (JWT > 24h old)
6. Authenticated as Parent (edge case — incomplete role)

### Backend auth guard combinations:
| Guard | Student | Instructor | Admin | No token |
|-------|---------|-----------|-------|----------|
| No guard (public) | ✅ | ✅ | ✅ | ✅ |
| `auth` only | ✅ | ✅ | ✅ | 401 |
| `auth + isStudent` | ✅ | 401 | 401 | 401 |
| `auth + isInstructor` | 401 | ✅ | 401 | 401 |
| `auth + isAdmin` | 401 | 401 | ✅ | 401 |

---

## Feature-by-Feature Test Matrix

### 1. User Registration & Authentication

**Sign Up flow:**
| Scenario | Expected |
|----------|----------|
| All required fields filled, Student type | Success → OTP sent → navigate to /verify-email |
| Missing `preferredName` | 400 — Required fields missing |
| Password ≠ confirmPassword | 400 — Password mismatch |
| Email already registered | Handled in controller — duplicate error |
| Invalid email format | Depends on controller validation (verify actual behavior) |
| Account type = Instructor | Success — same flow |
| Account type = Admin | Not available via public signup form |

**OTP Verification:**
| Scenario | Expected |
|----------|----------|
| Correct OTP within 5 min | Success → verified=true → navigate to /login |
| Correct OTP after 5 min | MongoDB TTL deleted OTP → 400/404 error |
| Wrong OTP | Error returned from server |
| OTP resend | Re-triggers sendOTP — new OTP created, old one may still exist until TTL |

**Login:**
| Scenario | Expected |
|----------|----------|
| Valid credentials, Student | Success → token+user → /dashboard/student |
| Valid credentials, Instructor | Success → /dashboard/instructor |
| Valid credentials, Admin | Success → /dashboard/admin-controls/users |
| Valid credentials, Parent | Success → falls through to /dashboard/student (incomplete) |
| Wrong password | 401 from server |
| Email not found | 401 from server |
| Unverified email (`verified: false`) | Verify controller behavior — may or may not block login |

**Token expiry during session:**
| Scenario | Expected |
|----------|----------|
| Make API call after JWT expires (>24h) | Server returns 401 |
| Frontend interceptor behavior | **BROKEN** — typo in `messgae` means auto-logout may not fire |
| User experience | May see silent failures or stale auth state |

---

### 2. Course Lifecycle

**Course creation (Instructor):**
| Scenario | Expected |
|----------|----------|
| Complete valid form, Step 1 | Course created in Draft, thumbnail uploaded to Cloudinary |
| Missing course name | Validation error |
| Thumbnail > allowed size | Cloudinary upload behavior (verify limit) |
| Non-video file as main video | Cloudinary resource_type detection handles it |
| Student tries to create course | 401 from `isInstructor` guard |
| No auth | 401 from `auth` guard |

**Course enrollment:**
| Scenario | Expected |
|----------|----------|
| Payment path (student clicks buy) | **BROKEN** — stub returns empty, enrollment not triggered |
| Request path (`requiresApproval=true`) | Student POSTs request → appears in instructor dashboard |
| Instructor approves request | `enrollStudents()` runs → student added to course |
| Instructor rejects request | Request status → "Rejected", student not enrolled |
| Student requests same course twice | Verify if duplicate request is blocked in controller |
| Non-student requests enrollment | `isStudent` guard → 401 |

**Course viewing (enrolled student):**
| Scenario | Expected |
|----------|----------|
| SubSection has `externalVideoUrl` | PlayerPanel uses external URL |
| SubSection has Cloudinary video | PlayerPanel uses Cloudinary authenticated URL |
| SubSection has no video at all | PlayerPanel handles gracefully (verify) |
| `course.features.sandboxEnabled = false` | SandboxPanel not rendered |
| `course.features.sandboxEnabled = true` | SandboxPanel rendered |
| `course.features.notesEnabled = true` | NotePanel rendered |
| Student not enrolled tries to access | `getFullCourseDetails` checks enrollment — verify behavior |

**Course progress:**
| Scenario | Expected |
|----------|----------|
| Mark SubSection complete | POST `/course/updateCourseProgress` → added to `CourseProgress.completedVideos` |
| Mark same SubSection complete again | Verify: duplicate check or idempotent |
| Student marks another student's progress | Controller uses `req.user.id` — not possible via normal flow |

---

### 3. Classroom System

**Classroom creation and joining:**
| Scenario | Expected |
|----------|----------|
| Instructor creates classroom | 4-byte hex `inviteCode` generated, owner set |
| Student joins via valid invite code | Added to `members[]` with role=Student |
| Student joins via invalid invite code | 404 or 400 error |
| Same user joins same classroom twice | Verify: duplicate member check in controller |
| Non-authenticated user tries to join | 401 from `auth` guard |

**Announcements:**
| Scenario | Expected |
|----------|----------|
| Instructor creates announcement | Created, visible to all members |
| Student tries to create announcement | 401 from `isInstructor` guard |
| Non-member tries to read announcements | `auth` guard passes but controller should check membership |

**Assignment flow:**
| Scenario | Expected |
|----------|----------|
| `publish=false` assignment | Not visible to students (published list filtered) |
| `publish=true` assignment | Visible via published endpoint |
| `assigneeType="all"` | All classroom members can submit |
| `assigneeType="selected"`, student not in assignees | Verify controller behavior on submit attempt |
| `lockSubmissions=true` | Submission attempt rejected |
| Student submits after `dueDate` | Verify if late submission blocked or allowed |
| Instructor grades submission | `grade`, `feedback`, `gradedBy`, `gradedAt` set on Submission |
| Student views their own submission | GET `/classroom/assignments/:id/submission` using `req.user.id` |
| Student views another student's submission | Should not be possible via the single-submission endpoint |
| Instructor views all submissions | GET `/classroom/assignments/:id/submissions` with `isInstructor` guard |

**Quiz flow:**
| Scenario | Expected |
|----------|----------|
| Quiz `publish=false` | Not in published list |
| `shuffle=true` | Screens served in random order to student |
| `timeLimit=0` on quiz level | No global time limit |
| `timeLimit=0` on screen level | No per-question time limit |
| `answerMode="single"` with multiple selections | Server should validate — verify behavior |
| `answerMode="multiple"` | Multiple correct answers scored |
| Student submits attempt | `Attempt` created with all answers scored, `finishedAt` set |
| Student tries to submit twice | Verify if multiple attempts allowed or blocked |
| Leaderboard after attempts | GET `/classroom/quizzes/:quizId/leaderboard` — ordered by `totalPoints` |

---

### 4. Admin Operations

| Scenario | Expected |
|----------|----------|
| Admin lists all users | POST `/admin/getAllUsers` (auth+isAdmin) |
| Student tries to access admin routes | 401 from `isAdmin` |
| Admin deletes a user | User document removed — verify cascade behavior on courses/progress |
| Admin creates category | POST `/course/createCategory` (auth+isAdmin) |
| Instructor tries to create category | 401 |

---

### 5. Cart Operations

| Scenario | Expected |
|----------|----------|
| Add course to cart | Added to `User.cart` + Redux + localStorage |
| Add same course twice | Verify: duplicate check in controller |
| Remove course from cart | Removed from all three locations |
| Clear cart | All items removed |
| Unauthenticated cart access | 401 — cart requires auth |
| Cart after logout | `resetCart()` action in Redux, localStorage cleared — verify |
| Cart on re-login | Loaded from server via `getCart` — may differ from pre-logout localStorage |

---

### 6. Profile & Settings

| Scenario | Expected |
|----------|----------|
| Update profile image | PUT `/profile/updateUserProfileImage` — Cloudinary upload, `user.image` updated |
| Delete account | DELETE `/profile/deleteProfile` — user document removed |
| `protectMe=true` on Profile | `getPublicProfile` should hide sensitive fields |
| `protectMe=false` | Public profile shows full info |
| Change password | Old password verified before new password set, confirmation email sent |
| Password reset token expired | Token stored with `resetPasswordTokenExpires` — expired tokens rejected |

---

### 7. File Uploads (All Endpoints)

| Scenario | Expected |
|----------|----------|
| Valid image upload | `resource_type="image"`, stored in Cloudinary `FOLDER_NAME/` |
| Valid video upload | `resource_type="video"` |
| PDF/document upload | `resource_type="raw"` |
| No file in request | `req.files` is undefined — controller must handle gracefully |
| File upload to Cloudinary fails | Network error / quota — try/catch must return 500 |
| Delete file — invalid publicId | `deleteResourceFromCloudinary` handles gracefully |
| Delete file — wrong resourceType | Tries multiple types as fallback |

---

### 8. Email Delivery

| Scenario | Expected |
|----------|----------|
| OTP email on signup | Pre-save hook fires — email sent before controller response |
| OTP email when MAIL_PASS wrong | `mailSender` returns null — verify OTP document still created |
| Enrollment email on payment | Payment is stubbed — email never sent via payment path |
| Enrollment email on request approval | Email sent after `enrollStudents()` called |
| Password reset email | Sent by `resetPasswordToken` controller |
| Email server unreachable | `mailSender` returns null — must not crash the request |

---

## API Response Contract Verification

Every API response must have `{ success: Boolean, message: String }`. Verify:

| Status | `success` | Scenario |
|--------|----------|----------|
| 200 | `true` | Successful operation |
| 400 | `false` | Validation failure, missing fields |
| 401 | `false` | No token, invalid token, wrong role |
| 404 | `false` | Document not found |
| 500 | `false` | Unexpected server error |

**Known inconsistency**: Some controllers return `res.status(200).json({ success: false, ... })` for 4xx conditions. Flag these when found.

---

## Security Verification Checklist

For any new or modified endpoint, verify:

- [ ] Is the endpoint accidentally public when it should be protected?
- [ ] Can Student A access Student B's data by changing IDs in the request?
- [ ] Does the controller verify that the authenticated user owns the resource (not just that they're authenticated)?
- [ ] Are MongoDB ObjectIds validated before use in queries?
- [ ] Is user input used in regex without escaping? (ReDoS risk)
- [ ] Are file uploads validated for type and size before Cloudinary upload?
- [ ] Is the JWT secret hard-coded anywhere? (Should only come from `process.env.JWT_SECRET`)
- [ ] Are there any `console.log` statements that print sensitive data (tokens, passwords)?

---

## Frontend Behavior Verification

When verifying frontend behavior, test these conditions in combination:

| Condition | How to verify |
|-----------|--------------|
| Token present, valid | Normal logged-in session |
| Token present, expired | Manually set expired JWT in localStorage |
| Token absent | Clear localStorage.token |
| User object present, wrong role | Manually modify localStorage.user.accountType |
| API call returns `success: false` | Mock or intercept with network throttling |
| API call returns 500 | Kill backend server |
| API call returns 401 | Use expired token — interceptor now fires for session-invalid 401s (token/missing/decoding keywords); role-guard 401s ("protected only for X") do NOT trigger logout |
| Slow network | Browser DevTools → Network throttling |

---

## Conditions Summary — When Each Area Works

| Area | Works When | Fails When |
|------|-----------|-----------|
| Auth (login/signup) | Valid credentials, server running, email configured | MAIL_PASS wrong (OTP fails), JWT_SECRET missing (server crash) |
| Course viewing | User enrolled, course Published, SubSection has video | User not enrolled, course Draft, video deleted from Cloudinary |
| Payment enrollment | **Never — fully stubbed** | Always |
| Request-based enrollment | `requiresApproval=true`, instructor approves | Instructor rejects, duplicate request |
| Classroom features | User is member, correct role guard | Non-member, wrong role, `publish=false` content |
| Quiz submission | Quiz `publish=true`, user is member | `publish=false`, `timeLimit` exceeded (if enforced) |
| Assignment submission | `publish=true`, not `lockSubmissions` | `lockSubmissions=true`, not in `assignees` (when `assigneeType="selected"`) |
| File uploads | Cloudinary configured, valid file type | Missing `CLOUD_NAME`/`API_KEY`/`API_SECRET`, invalid file |
| Email | SMTP/Gmail configured, credentials valid | Wrong credentials (returns null — non-blocking) |
| Admin routes | `accountType === "Admin"` | Any other role |
