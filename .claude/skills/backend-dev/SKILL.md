---
name: backend-dev
description: "Activates the ClzMate backend developer role. Use when working on anything in the backend/ directory — new routes, controllers, Mongoose models, auth middleware, email, file uploads, or debugging API behavior. Loads full verified knowledge of the Express monolith, all 19 schemas, auth chain, controller patterns, and all variation paths."
disable-model-invocation: false
---

# ClzMate Backend Developer

You are operating as the backend developer for ClzMate — an e-learning platform. This skill loads your full verified context for the `backend/` codebase.

---

## Stack (verified — do not assume alternatives)

- **Express.js 5.1.0** — NOT NestJS, not microservices, single monolith
- **MongoDB + Mongoose 8.18.3** — all persistence
- **jsonwebtoken 9.0.2** + **bcrypt 6.0.0** — auth
- **Cloudinary 2.7.0** + **express-fileupload 1.5.2** — file storage
- **Nodemailer 7.0.5** — email
- **Razorpay 2.9.6** — payment (INCOMPLETE — fully stubbed, do not use)
- **node-schedule 2.1.1** — installed, never used
- No NestJS, no TypeScript, no class-validator, no Swagger, no tests

---

## Before Writing Any Code — State These Assumptions

1. Does a route already exist for this operation? Check `src/routes/`.
2. Does a controller already exist? Check `src/controllers/`.
3. Does a Mongoose model already exist? Check `src/models/` (19 models — likely it does).
4. Is this behind `auth` middleware? Which role guard is needed?
5. Does this require Cloudinary upload? What resource type?
6. Does this send email? Which template?
7. What are the failure paths? (missing fields, wrong role, invalid ObjectId, document not found)

---

## Server Bootstrap (`server.js`)

Order of operations on startup:
1. `connectDB()` — Mongoose connect to `DATABASE_URL`
2. `cloudinaryConnect()` — configure Cloudinary from `CLOUD_NAME`, `API_KEY`, `API_SECRET`
3. Apply global middleware: CORS → OPTIONS handler → origin validation → `express.json()` → `cookieParser()` → `fileUpload({ useTempFiles: true, tempFileDir: '/tmp' })`
4. Mount 9 route modules at `/api/v1/{auth,profile,course,payment,admin,cart,student,classroom,site}`

---

## Authentication Middleware (`src/middleware/auth.js`)

**Token extraction order** (all three sources are valid — never assume only one):
1. `req.body.token`
2. `req.cookies.token`
3. `Authorization` header (strips `Bearer ` prefix and surrounding quotes)

**Middleware chain**:
- `auth` — verifies JWT, sets `req.user = { id, accountType, ...payload }`
- `isStudent` — requires `req.user.accountType === "Student"` (applied after `auth`)
- `isInstructor` — requires `req.user.accountType === "Instructor"`
- `isAdmin` — requires `req.user.accountType === "Admin"`

All return `401` on failure with `{ success: false, message: "..." }`.

**JWT** (`src/utils/jwt.js`):
- Sign: `signToken(payload, expiresIn)` — secret from `process.env.JWT_SECRET` (throws if missing)
- Default expiry: `process.env.JWT_EXPIRES || "24h"`
- Verify: `verifyToken(token)` — returns decoded payload or throws

---

## Route → Controller Pattern

Every route file in `src/routes/` requires its own controllers. Example:
```javascript
// src/routes/course.js
router.post('/createCourse', auth, isInstructor, course.createCourse);
router.get('/getAllCourses', course.getAllCourses);  // no auth = public
```

Controllers follow this exact pattern:
```javascript
exports.handlerName = async (req, res) => {
  try {
    // 1. Extract from req.body / req.params / req.query / req.user / req.files
    // 2. Validate required fields
    // 3. Validate ObjectIds with mongoose.isValidObjectId()
    // 4. Business logic
    // 5. Return { success: true, message: "...", data: ... }
  } catch (error) {
    console.error("Context:", error);
    return res.status(500).json({ success: false, message: "...", error: error.message });
  }
};
```

**Response shape** (must be consistent): `{ success: Boolean, message: String, data?: Any, error?: String }`

---

## All 19 Mongoose Models (do not duplicate)

Verified models in `src/models/`:

| Model | Key Fields | Key Relations |
|-------|-----------|---------------|
| `User` | preferredName, email, password(hashed), accountType, active, approved, verified | → Profile(1:1), → Course[], → CourseProgress[] |
| `Profile` | gender, dateOfBirth, about, contactNumber, protectMe | standalone |
| `Course` | courseName, instructor, courseContent[], price, thumbnail, status, requiresApproval, enrollmentRequests[] | → User, → Section[], → Category, → RatingAndReview[] |
| `Category` | name, description, courses[] | → Course[] |
| `Section` | sectionName, subSection[] | → SubSection[] |
| `SubSection` | title, timeDuration, description, supportMaterials[], externalVideoUrl | standalone |
| `CourseProgress` | courseID, userId, completedVideos[] | → Course, → User, → SubSection[] |
| `OTP` | email, otp, createdAt (TTL 5min) | auto-delete via TTL index |
| `RatingAndReview` | user, rating, review, course | → User, → Course |
| `Note` | userId, courseId, sectionId, subSectionId, content | → User, → Course/Section/SubSection |
| `Classroom` | title, owner, inviteCode(unique 4-byte hex), members[], coInstructors[], guests[] | → User |
| `Announcement` | classroom, author, title, body, pinned | → Classroom, → User |
| `Topic` | classroom, title, status, position, items[], assignmentsCount | → Classroom, → User |
| `Assignment` | topic, title, dueDate, points, attachments[], publish, assigneeType, lockSubmissions | → Topic, → User |
| `Submission` | assignment, student, content, attachments[], grade, feedback, gradedBy | → Assignment, → User |
| `Quiz` | topic, title, timeLimit, shuffle, screens[], publish | → Topic, → User |
| `Attempt` | quiz, user, answers[], totalPoints, startedAt, finishedAt | → Quiz, → User |
| `Message` | classroom, from, toUser(null=broadcast), content, attachments[] | → Classroom, → User — NO real-time layer |
| `ClassroomSession` | classroom, title, startAt, endAt, externalUrl | → Classroom, → User |

**Model creation utility** (`src/utils/createModel.js`):
```javascript
function createModel(name, schema) {
  return mongoose.models[name] || mongoose.model(name, schema);
}
```
Always use this. Prevents duplicate model registration on hot reload.

---

## Cloudinary — File Upload Flow

All uploads go through `src/utils/fileUploader.js`:

```javascript
// Upload
const result = await uploadFileToCloudinary(req.files.fieldName, folder, height, quality, opts);
// result = { secure_url, public_id, resource_type, ... }

// Delete
await deleteResourceFromCloudinary(publicId, resourceType);
```

Key facts:
- `express-fileupload` must be active (it is globally) — file arrives at `req.files.fieldName`
- Resource type auto-detected from mimetype: `image/` → "image", `video/` → "video", else "raw" or "auto"
- All uploads use `type: "authenticated"` — requires Cloudinary API auth, not public access
- `publicId` and `resourceType` must be stored alongside the URL on the model for later deletion
- Temp files land in `/tmp` — cleaned up by express-fileupload after response

**Store on model**:
```javascript
{
  url: result.secure_url,
  publicId: result.public_id,
  resourceType: result.resource_type,
  originalName: file.name,
  mimeType: file.mimetype,
  size: file.size
}
```

---

## Email — How It Works

`src/utils/mailSender.js`: `async function mailSender(email, title, bodyHtml)`

Transport selection (env var `MAIL_SERVICE`):
- `MAIL_SERVICE=gmail` → Gmail service using `MAIL_USER`/`MAIL_PASS`
- Otherwise → Custom SMTP: `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASS`

**OTP emails are NOT called directly in controllers**. They fire via a **pre-save hook on the OTP model**:
```javascript
// OTP model pre-save hook
otpSchema.pre('save', async function(next) {
  await mailSender(this.email, "OTP", otpTemplate(this.otp, ...));
  next();
});
```
Creating an OTP document automatically sends the email.

**Templates** in `src/mail/templates/`:
- `emailVerificationTemplate.js` → `otpTemplate(otp, name)` — OTP email, valid 3 min
- `passwordUpdate.js` → `passwordUpdated(email, name)` — after password change
- `courseEnrollmentEmail.js` → `courseEnrollmentEmail(courseName, name)` — after enrollment

---

## Validation Pattern (No class-validator — all inline)

Required field check pattern:
```javascript
const missing = ["fieldA", "fieldB"]
  .filter(f => req.body[f] === undefined || req.body[f] === null ||
    (typeof req.body[f] === "string" && req.body[f].trim() === ""))
  .map(f => f);
if (missing.length > 0) {
  return res.status(400).json({ success: false, message: `Required: ${missing.join(', ')}` });
}
```

ObjectId validation:
```javascript
if (!mongoose.isValidObjectId(id)) {
  return res.status(400).json({ success: false, message: "Invalid id" });
}
```

Email normalization (always apply):
```javascript
const email = String(req.body.email || "").toLowerCase().trim();
```

---

## Course Enrollment — Two Paths

### Path 1: Payment (currently non-functional)
`capturePayment` → `verifyPayment` → `enrollStudents()`

**Status**: Razorpay call is commented out in `payments.js`. `enrollStudents()` call also commented.
Do NOT treat this as working. The stub returns empty responses.

### Path 2: Request-based (`course.requiresApproval = true`)
1. Student: POST `/course/requestEnrollment` → pushes `{ user, status: "Pending" }` to `course.enrollmentRequests`
2. Instructor: GET `/course/enrollmentRequests/:courseId` → see pending requests
3. Instructor: POST `/course/enrollmentRequests/:courseId/:requestId/respond` with `{ status: "Approved"|"Rejected", note }` → on Approved, `enrollStudents()` runs

`enrollStudents(courseIds, userId)`:
- Pushes userId to `course.studentsEnrolled`
- Pushes courseId to `user.courses`
- Sends enrollment confirmation email

---

## Classroom Hierarchy

```
Classroom (owner + members with roles)
├── Announcement[]
├── Topic[] (ordered by position)
│   ├── items[] (inline: assignment/quiz/material/subsection/copied)
│   ├── Assignment[]
│   │   └── Submission[] (one per student)
│   └── Quiz[]
│       └── Attempt[] (one per student per attempt)
├── Message[]          ← model only, no real-time layer
└── ClassroomSession[] ← Zoom/Meet URLs with time window
```

**Invite code**: 4-byte hex string, unique, generated on classroom creation.
**Member roles**: `Instructor`, `CoInstructor`, `Student`, `Guest` — stored in `members[].role`.
**Temporary membership**: `members[].temporaryUntil` — date field, null = permanent.

---

## Quiz Scoring (`src/utils/quizz.js`)

Question types: `multiple`, `truefalse`, `short`, `slider`, `poll`, `puzzle`

Scoring includes:
- Base points per screen (`screen.properties.points`)
- Time bonus based on `timeTaken` vs `screen.properties.timeLimit`
- `answerMode`: `single` (one correct answer) or `multiple` (multiple correct answers)

Attempt stores per-answer: `correct`, `points`, `basePoints`, `timeTaken`, `timeBonus`.

---

## Environment Variables — All Consumed

| Required | Variable | Used In |
|----------|----------|---------|
| ✅ | `DATABASE_URL` | database.js |
| ✅ | `JWT_SECRET` | jwt.js |
| ✅ | `CLOUD_NAME` | cloudinary.js |
| ✅ | `API_KEY` | cloudinary.js |
| ✅ | `API_SECRET` | cloudinary.js |
| ✅ | `FOLDER_NAME` | course.js, subSection.js controllers |
| ✅ | `MAIL_USER` | mailSender.js |
| ✅ | `MAIL_PASS` | mailSender.js |
| ✅ | `API_URL` | resetPassword.js (reset link URL) |
| Optional | `PORT` | server.js (default 5000) |
| Optional | `JWT_EXPIRES` | jwt.js (default "24h") |
| Optional | `NODE_ENV` | server.js, mailSender.js |
| Optional | `MAIL_SERVICE` | mailSender.js ("gmail" or SMTP) |
| Optional | `CORS_ALLOWED_ORIGINS` | server.js (comma-separated) |
| Future | `RAZORPAY_KEY`, `RAZORPAY_SECRET` | payments.js (currently stubbed) |

---

## Known Issues — Do Not Assume These Work

| Issue | Location | Impact |
|-------|----------|--------|
| Payment fully stubbed | `payments.js` lines 58-59, 80 | `capturePayment`/`verifyPayment` return empty, enrollment not triggered |
| Razorpay config commented | `config/rajorpay.js` | Instance never created |
| Message model without transport | `models/message.js` | No WebSocket/Socket.io — model is dead code |
| node-schedule unused | `package.json` | Installed, never required anywhere |
| RatingAndReview typo | `models/ratingAndReview.js` line 12 | `reqired` typo — rating field NOT required |
| No test runner | `package.json` | `npm test` exits with error |
| Inconsistent HTTP status | Various controllers | Some 4xx errors return status 200 |

---

## Conditions Under Which Changes Work

Before marking any backend task done, verify:

1. **Route registered?** New routes must be added to the route file AND route file must be mounted in `server.js`.
2. **Auth guards correct?** Public endpoints need no guard. Role-specific endpoints need `auth` + `isRole`. Missing guard = security hole; wrong guard = broken feature.
3. **Token extraction works?** Token can come from 3 sources. Do not assume only body or only header.
4. **All required env vars set?** If a new feature needs a new env var, it must exist in `.env`. Server will not crash gracefully if `JWT_SECRET` is missing — it throws at startup.
5. **ObjectIds validated?** Any `req.params` or `req.body` ID must pass `mongoose.isValidObjectId()` before use.
6. **Document existence checked?** After `findById`, check if result is null before accessing properties.
7. **Cloudinary upload errors handled?** Upload can fail (network, quota, invalid file type). Wrap in try/catch and return 500 with message.
8. **Email failure non-blocking?** `mailSender` returns null on error. Enrollment/OTP should not fail the entire request if email fails — log and continue.
9. **Both enrollment paths tested?** Payment path is stubbed. Request-based path is functional. New enrollment logic must work for both.
10. **Classroom permissions?** Most classroom write operations are `auth+isInstructor`. Student-facing reads are `auth` only. Verify the correct guard.
11. **TTL index on OTP?** OTPs expire in 5 minutes automatically. Do not build logic assuming OTP persists longer.
