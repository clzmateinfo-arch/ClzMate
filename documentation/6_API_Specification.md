# API Specification

## 1. Introduction

All endpoints, rebuilt from `backend/src/routes/*.js` and the mounts in `backend/src/app.js`. Base path: `/api/v1`. Behavior below is covered by `backend/test` unless noted.

## 2. Conventions

### 2.1 Authentication

`auth` middleware reads the JWT from, in order: `Authorization` header, cookie `token`, `req.body.token` (a `Bearer ` prefix and surrounding quotes are stripped). `POST /auth/logout` clears the cookie. Login sets the `token` cookie (httpOnly, `sameSite=lax`, `secure` in production, 24 h) and also returns the token. The frontend sends `Authorization: Bearer <token>`.

After verifying the signature the middleware **loads the user** and sets `req.user = { id, email, accountType, approved }`. Role, `active` and `approved` are therefore read from the database, not the token.

### 2.2 Guards

| Guard | Meaning |
| :--- | :--- |
| none | Public |
| `auth` | Valid token for an existing, active user |
| `auth, isStudent` | `accountType` must be `Student` |
| `auth, isInstructor` | `accountType` must be `Instructor` **and** `approved === true` |
| `auth, isAdmin` | `accountType` must be `Admin` |

Controllers add resource-level checks on top of the guards (ownership, classroom role, enrollment); see the notes per section.

### 2.3 Status codes and Envelope

| Code | When |
| :--- | :--- |
| 401 | Token missing or undecodable ("Token is Missing", "Error while decoding token"); user deleted or deactivated ("Account not found or deactivated"); token issued before the last password change; wrong login credentials ("Invalid credentials"); wrong old password on change-password |
| 403 | Role guard failure ("This Page is protected only for ..."); unapproved instructor on an `isInstructor` route ("Instructor account is pending admin approval"); login of an unverified or deactivated account; resource-level denial (not owner, not enrolled, not a classroom member, not staff); CORS origin not allowed |
| 400 | Validation failure, invalid ObjectId (`CastError` becomes "Invalid id"), malformed JSON ("Malformed JSON body"), upload rejected by `uploadGuard` |
| 402 | `verifyPayment` for a paid course without a configured gateway |
| 404 | Unknown route (`Route not found: METHOD path`) or missing resource |
| 409 | Conflict: duplicate (verified email, existing review, finished quiz attempt, graded submission, answered enrollment request, category with courses, instructor with published courses and students on delete) |
| 429 | Rate limit exceeded (JSON `{ success: false, message }`) |
| 500 | Generic `"Internal server error"` style message; details are only logged |

Responses are `{ success, message?, data? }`; some endpoints add sibling keys (`token`, `user`, `courses`, `results`, `averageRating`, `url`, `updatedCourseDetails`), so payload keys still vary by controller. Errors never include `error.message` of unexpected failures.

### 2.4 Cross-cutting limits

| Concern | Behavior |
| :--- | :--- |
| Global rate limit | 600 requests per 15 min per IP |
| Auth rate limit | 20 per 15 min per IP on `signup`, `login`, `sendotp`, `verifyotp`, `reset-password-token`, `reset-password` (not `changepassword`) |
| Contact rate limit | 5 per 15 min per IP on `POST /reach/contact` |
| Limiters are disabled when `NODE_ENV=test` | |
| JSON body | 1 MB maximum |
| Uploads | Per-file limit `MAX_UPLOAD_MB` (default 200) with `abortOnLimit`; blocked extensions (`.exe .bat .cmd .com .msi .dll .scr .sh .ps1 .vbs .jar .php .apk .dmg`); fields `thumbnail`, `thumbnailImage`, `profileImage`, `image` accept only PNG, JPEG, GIF, WebP, AVIF (SVG rejected). Oversize status code is express-fileupload's default and is not tested |
| Sanitization | Keys starting with `$` or containing `.` are removed from body, query and params |
| CORS | `Origin` not in `CORS_ALLOWED_ORIGINS` gets 403 `{ success: false, message: "CORS origin not allowed" }`; no `Origin` is allowed unless `CORS_BLOCK_NO_ORIGIN=true` |

## 3. Endpoints

### 3.1 `/auth`

| Method | Path | Guard | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/auth/signup` | none (auth limiter) | Create an unverified user and profile. `accountType` must be `Student` or `Instructor` (400 otherwise; Instructor gets `approved: false`). Required: `preferredName`, `email`, `password`, `confirmPassword`, `accountType`. Password 8-72 chars. 409 if the email is already verified; an unverified email is overwritten. 201 |
| POST | `/auth/sendotp` | none (auth limiter) | Mail a 6-digit OTP. 409 if already verified, 429 within 60 s of the previous OTP, 502 if the mail could not be sent (nothing stored) |
| POST | `/auth/verifyotp` | none (auth limiter) | `{ email, otp }`. Sets `verified = true` and deletes the OTP. Wrong code increments `attempts`; after 5 attempts (or expiry) the OTP is deleted and the user must request a new one. 400 "Invalid or expired OTP" for unknown users |
| POST | `/auth/login` | none (auth limiter) | 401 "Invalid credentials" for unknown email or wrong password (same message and timing path), 403 unverified ("Please verify your email") or deactivated, else token + user (password and reset fields removed) |
| POST | `/auth/changepassword` | auth | `{ oldPassword, newPassword, confirmNewPassword }`; sets `passwordChangedAt`, so older tokens (including the current one) stop working; mails a notice |
| POST | `/auth/reset-password-token` | none (auth limiter) | `{ email }`; always 200 with a generic message. For active users stores a sha256-hashed token (15 min) and mails `FRONTEND_URL/update-password/<token>` |
| POST | `/auth/reset-password` | none (auth limiter) | `{ token, password, confirmPassword }`; single use; sets `passwordChangedAt`; 400 for invalid/expired token |

### 3.2 `/profile`

| Method | Path | Guard | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/profile/public/:id` | none | Limited public profile (name, image, about, join date; Instructors also their Published courses, max 50). `protectMe` returns only name and image. Inactive users are 404. No email or other private fields |
| DELETE | `/profile/deleteProfile` | auth | Delete own account and data; 409 for an instructor with published courses that have enrolled students |
| PUT | `/profile/updateProfile` | auth | Update names and profile fields (bounded lengths) |
| GET | `/profile/getUserDetails` | auth | Current user (password, token and reset fields excluded) |
| GET | `/profile/getEnrolledCourses` | auth | Enrolled courses with progress (`page`, `limit`, `search`) |
| PUT | `/profile/updateUserProfileImage` | auth | Upload display picture (`profileImage`, image only) |
| GET | `/profile/instructorDashboard` | auth, isInstructor | Per-course student counts and revenue |

### 3.3 `/payment`

| Method | Path | Guard | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/payment/capturePayment` | auth, isStudent | `{ coursesId: [ids] }` (1-50 valid ids). Returns `data: { totalAmount, currency: "USD", receipt }`. 404 if any course is missing/unpublished, 400 if already enrolled. No gateway order is created |
| POST | `/payment/verifyPayment` | auth, isStudent | `{ coursesId, razorpay_order_id, razorpay_payment_id, razorpay_signature }`. If every course has `price === 0`, enrolls. Otherwise: valid signature with `RAZORPAY_SECRET` enrolls; invalid signature 400; no secret/signature gives 402 unless `NODE_ENV != production` and `ALLOW_STUBBED_PAYMENT=true`. Returns `results[]` with `status` `enrolled`, `pending` (approval course), `already-enrolled` or failure |
| POST | `/payment/sendPaymentSuccessEmail` | auth, isStudent | `{ orderId, paymentId, coursesId }`; 403 unless the student is enrolled in all listed courses; amount computed server-side |

### 3.4 `/course`

Ownership: "owner/admin" means `canManageCourse` (course instructor, or Admin where the route admits admins). Because the instructor routes use `isInstructor`, only an approved Instructor reaches them; non-owners get 403.

| Method | Path | Guard | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/course/createCourse` | auth, isInstructor | Create course (multipart: `thumbnailImage`, `tag` and `instructions` as JSON arrays) |
| POST | `/course/editCourse` | auth, isInstructor | Owner only (403). Allow-listed fields only: name, description, whatYouWillLearn, price, tag, instructions, requiresApproval, features, category, thumbnail. Other fields (`instructor`, `studentsEnrolled`, ...) are ignored |
| POST | `/course/togglePublish` | auth, isInstructor | `{ courseId, publish: boolean }`, owner only |
| DELETE | `/course/deleteCourse` | auth, isInstructor | `{ courseId }` in the body; owner only; cascading delete |
| GET | `/course/getInstructorCourses` | auth, isInstructor | Own courses (`page`, `limit`, `search`) |
| POST | `/course/addSection` | auth, isInstructor | Owner of `courseId` only |
| POST | `/course/updateSection` | auth, isInstructor | Owner; section must belong to the course (404 otherwise) |
| POST | `/course/deleteSection` | auth, isInstructor | Owner; cascades to sub-sections and files |
| POST | `/course/addSubSection` | auth, isInstructor | Owner of the section's course; needs a file, material meta or `externalVideoUrl` (http/https only) |
| POST | `/course/updateSubSection` | auth, isInstructor | Owner; sub-section must belong to the section |
| POST | `/course/deleteSubSection` | auth, isInstructor | Owner; deletes files |
| GET | `/course/getAllCourses` | none | Published courses: `categoryId`/`category`, `instructorId`, `search`, `price` (`all\|free\|paid`), `sort` (`newest\|oldest\|price_asc\|price_desc\|popular\|students_desc\|students_asc`), `page`, `limit` (max 100) |
| POST | `/course/getCourseDetails` | none | `{ courseId }`; **Published only** (404 for Draft); video URLs, support materials and enrollment requests omitted |
| POST | `/course/getFullCourseDetails` | auth | Full content; 403 unless enrolled, owner or Admin; `enrollmentRequests` only for owner/admin |
| POST | `/course/updateCourseProgress` | auth, isStudent | `{ courseId, subSectionId }`; must be enrolled and the sub-section must belong to the course; 400 if already completed |
| POST | `/course/createCategory` | auth, isAdmin | Create category |
| POST | `/course/updateCategory` | auth, isAdmin | Update category |
| POST | `/course/deleteCategory` | auth, isAdmin | 409 while the category has courses |
| GET | `/course/showAllCategories` | none | List categories |
| POST | `/course/getCategoryPageDetails` | none | `{ categoryId }` -> `{ selectedCategory (published courses with instructor name and category name), mostSellingCourses }`; 404 if the category has no published courses |
| POST | `/course/createRating` | auth, isStudent | `{ courseId, rating (integer 1-5), review }`; enrolled only (403); 409 if already reviewed |
| GET | `/course/getAverageRating?courseId=` | none | Reads the **query string**. `{ success, averageRating }` |
| GET | `/course/getReviews` | none | Reviews, highest first (`limit` max 100) |
| POST | `/course/getAssetUrl` | auth | `{ url or publicId, expiresInSec? }` (60-3600 s). 403 unless the asset belongs to a sub-section the caller is enrolled in or owns, a Published course thumbnail (or one the caller manages), or a stored profile image |
| POST | `/course/getNote` | auth | Enrolled students, owner or Admin only |
| POST | `/course/saveNote` | auth | Same access rule; content max 20000 chars |
| POST | `/course/requestEnrollment` | auth, isStudent | Published course; creates (or re-opens) a Pending request; mails the instructor |
| GET | `/course/enrollmentRequests/:courseId` | auth, isInstructor | Owner only |
| POST | `/course/enrollmentRequests/:courseId/:requestId/respond` | auth, isInstructor | `{ action: "approve"\|"reject", note? }`, owner only; 409 if already answered; approve enrolls |
| GET | `/course/enrollment-requests` | auth, isStudent | Own requests |

### 3.5 `/admin`

| Method | Path | Guard | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/admin/getAllUsers` | auth, isAdmin | `{ q, page, limit }` (limit max 100); password/token fields excluded |
| POST | `/admin/updateUser` | auth, isAdmin | `{ userId, accountType?, active?, approved? }`; 400 if an admin demotes or deactivates themselves |
| POST | `/admin/deleteUser` | auth, isAdmin | `{ userId }`; not yourself; 409 for an instructor with published courses that have students; cascading cleanup |
| POST | `/admin/snapshot/publish` | auth, isAdmin | Rebuild and upload the public snapshot to Cloudinary; `?force=true` uploads even if unchanged. 502 on upload failure; `{ skipped: "cloudinary-not-configured" }` without credentials |
| GET | `/admin/snapshot/status` | auth, isAdmin | `{ enabled, url, lastPublishedHash, lastResult, isPublishing, isScheduled }` |

### 3.6 `/cart`

| Method | Path | Guard | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/cart/` | auth | Get cart |
| POST | `/cart/` | auth | `{ courseId }`; Published, not already enrolled or in cart |
| DELETE | `/cart/:courseId` | auth | Remove course |
| POST | `/cart/clear` | auth | Clear cart |

### 3.7 `/student`, `/site`, `/reach`

| Method | Path | Guard | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/student/dashboard` | auth | Dashboard for the caller's enrolled courses (any authenticated role) |
| GET | `/site/stats` | none | `{ totalStudents, mentors, courses, awards }`, cached 60 s in memory |
| POST | `/reach/contact` | none (5 per 15 min) | `{ firstName, lastName?, email, phone?, message }`; 400 on invalid input; mails `MAIL_FROM_EMAIL` or `MAIL_USER` (500 if neither is set or the mail fails) |

### 3.8 `/classroom`

All routes require `auth`; apart from creation they have no role guard. Authorization is by classroom role (`utils/classroomAccess.js`): **owner**, **coInstructor** (in `coInstructors[]` or member role Instructor/CoInstructor), **member** (role Student), **guest**, and **admin** (any Admin account). **Staff** = owner, coInstructor, admin. Non-members get 403 "You are not a member of this classroom"; actions marked *staff* give 403 "Only classroom staff can perform this action". Invalid ids give 400, unknown resources 404. Resource ids (topic, assignment, quiz, screen) are resolved to their classroom before the check.

Classroom core

| Method | Path | Access | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/classroom/create` | auth, isInstructor | `{ title, description? }`; creator becomes owner |
| GET | `/classroom/my` | auth | Own classrooms (`type=all\|owned\|joined`, `search`, `page`, `limit` max 100). Non-staff entries hide `inviteCode` and other users' details |
| POST | `/classroom/join` | auth | `{ inviteCode }`; any authenticated user joins as a Student member; idempotent |
| GET | `/classroom/:id` | member or staff | Classroom with members; invite code only for staff |
| POST | `/classroom/:id/add-member` | staff | `{ userIdToAdd }`. Owner/admin adding an Instructor-type user makes them coInstructor; otherwise Student |
| POST | `/classroom/:id/remove-member` | staff | `{ userIdToRemove }`. Owner cannot be removed (400); removing a coInstructor needs owner/admin (403) |
| GET | `/classroom/:classroomId/overview` | member or staff | Announcements, upcoming assignments (published and targeted for members), counts |

Announcements

| Method | Path | Access | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/classroom/:classroomId/announcements` | staff | Create |
| GET | `/classroom/:classroomId/announcements` | member or staff | List |

Topics and items

| Method | Path | Access | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/classroom/:classroomId/topics` | staff | Create topic |
| GET | `/classroom/:classroomId/topics` | member or staff | List (members see only items with status `published`) |
| PATCH | `/classroom/topics/:topicId` | staff | Update topic |
| DELETE | `/classroom/topics/:topicId` | staff | Delete topic with its assignments, quizzes and files |
| POST | `/classroom/:classroomId/topics/reorder` | staff | Reorder topics |
| POST | `/classroom/topics/:topicId/items` | staff | Create item (`type`, `title`, optional `content`, `link` (http/https), `refId`) |
| PATCH | `/classroom/topics/:topicId/items/:itemId` | staff | Update item, add/remove attachments |
| DELETE | `/classroom/topics/:topicId/items/:itemId` | staff | Delete item and its attachments; positions renumbered |
| POST | `/classroom/topics/:topicId/items/reorder` | staff | Reorder items |
| POST | `/classroom/topics/:topicId/items/:itemId/copy` | staff of both classrooms | `{ destTopicId }`; copy is created as draft |
| PATCH | `/classroom/topics/:topicId/items/:itemId/toggle` | staff | Toggle draft/published |

Assignments

| Method | Path | Access | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/classroom/topics/:topicId/assignments` | staff | Create (assignees must belong to the classroom) |
| GET | `/classroom/topics/:topicId/assignments` | member or staff | List (members: published and targeted only) |
| GET | `/classroom/topics/:topicId/assignments/published` | member or staff | Published list |
| GET | `/classroom/assignments/:assignmentId` | member or staff | Get (members: 404 if unpublished, 403 if not targeted) |
| PATCH | `/classroom/assignments/:assignmentId` | staff | Update |
| DELETE | `/classroom/assignments/:assignmentId` | staff | Delete with submissions and files |
| POST | `/classroom/assignments/:assignmentId/submit` | student member | 403 for staff/non-members, untargeted assignee, `lockSubmissions`, past `dueDate`; 409 once graded; 400 empty; resubmission replaces content/attachments |
| GET | `/classroom/assignments/:assignmentId/submission` | member or staff | Caller's own submission |
| GET | `/classroom/assignments/:assignmentId/submissions` | staff | All submissions |
| PATCH | `/classroom/assignments/:assignmentId/submissions/:submissionId` | staff | `{ grade (0..points or null), feedback }` |

Quizzes

| Method | Path | Access | Purpose |
| :--- | :--- | :--- | :--- |
| POST | `/classroom/topics/:topicId/quizzes` | staff | Create |
| GET | `/classroom/topics/:topicId/quizzes` | member or staff | List (members: published only, answer keys stripped) |
| GET | `/classroom/topics/:topicId/quizzes/published` | member or staff | Published list |
| GET | `/classroom/quizzes/:quizId` | member or staff | Members get 404 for unpublished quizzes and no `options[].correct` (short/slider options emptied) until they have a finished attempt |
| PATCH | `/classroom/quizzes/:quizId` | staff | Update |
| DELETE | `/classroom/quizzes/:quizId` | staff | Delete with attempts |
| POST | `/classroom/quizzes/:quizId/screens` | staff | Add screen |
| PATCH | `/classroom/quizzes/screens/:screenId` | staff | Update screen |
| DELETE | `/classroom/quizzes/:quizId/screens/:screenId` | staff | Delete screen |
| POST | `/classroom/quizzes/:quizId/screens/reorder` | staff | Reorder screens |
| POST | `/classroom/quizzes/:quizId/attempts` | member or staff | `{ answers: [{ screenId, provided, timeTaken }], finish? }`. Graded on the server; unknown/repeated screens ignored; one attempt per user (409 after `finish`); 403 for unpublished quizzes (non-staff) |
| GET | `/classroom/quizzes/:quizId/leaderboard` | member or staff | `{ board, me }` |

Route-order note: `GET /classroom/my` is declared before `GET /classroom/:id`, and the `/topics/...`, `/assignments/...`, `/quizzes/...` routes before the `/:id` and `/:classroomId` ones.

### 3.9 Root, health and snapshot

`GET /` returns `{ success: true, message: "ClzMate API" }` (not under `/api/v1`). Any unknown route returns the JSON 404.

| Method | Path | Guard | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/health` | none | `{ success: true, data: { status: "ok", uptime, timestamp } }`; the frontend wake-up probe |
| GET | `/snapshot` | none | Public snapshot `{ version: 1, generatedAt, hash, resources: { categories, newCourses, popularCourses, stats, reviews, course: { <id>: <getCourseDetails body> }, catalog: { <categoryId>: { selectedCategory } } } }`; cached 60 s, invalidated by content writes; 503 if it cannot be built. `hash` = first 12 hex chars of sha256(JSON of `resources`) |

Successful writes to course, category, rating, enrollment-response, payment-verify, profile and admin user endpoints schedule a debounced snapshot republish (8 s by default).

## 4. Frontend Calls and Backend Routes

Every endpoint constant in `frontend/src/app/config/apis.js` has a matching backend route (contact form, classroom item reorder/delete/copy and assignment delete are all routed now).

## 5. Known Limitations

- No Razorpay order creation; paid enrollment needs a signed payment or the non-production stub switch.
- `GET /student/dashboard` has no role guard (any authenticated user receives their own data).
- `getInstructorCourses` and `getEnrolledCourses` load all matching courses and paginate in memory.
- `puzzle` quiz screens are never scored correct.