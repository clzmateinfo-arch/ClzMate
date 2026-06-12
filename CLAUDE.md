# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (`backend/`)
```bash
npm run dev          # Development with --watch (nodemon)
npm run start:dev    # Development without watch
npm run start:prod   # Production
npm run build        # Copy src → dist/prod/ for deployment
npm run build-exe    # Create standalone executable via pkg
```
No test runner is configured (`npm test` exits with error — no tests exist yet).

### Frontend (`frontend/`)
```bash
npm start            # Vite dev server (runs build first then vite)
npm run lint         # ESLint (0 warnings tolerance)
npm run build        # Clean + Vite production build → dist/
npm run preview      # Preview production build locally
```

### Backup service (`backup/`)
```bash
npm start            # Run backup service (scheduled + REST API)
npm run once         # Single backup run
npm run get-token    # OAuth2 token generation helper
```

---

## Architecture

This is a **monolithic Express.js + React SPA** — not NestJS, not microservices, despite the objective.txt description.

```
backend/     → Express.js API (port 5000) — single process, no service mesh
frontend/    → React 18 + Vite SPA — JavaScript, no TypeScript
backup/      → Independent Node.js backup service, not part of main app
```

### Backend layout

`server.js` bootstraps in this order: connect MongoDB → connect Cloudinary → apply global middleware → mount 9 route modules. No controllers are registered globally — each route file requires its own controllers.

```
src/
├── config/          # database.js, cloudinary.js, rajorpay.js (commented out)
├── controllers/     # 19 files, one per domain
├── models/          # 19 Mongoose schemas
├── routes/          # 9 route files mounted at /api/v1/{auth,profile,course,payment,admin,cart,student,classroom,site}
├── middleware/auth.js   # auth, isStudent, isInstructor, isAdmin
└── utils/           # jwt.js, mailSender.js, fileUploader.js, quizz.js, cloudinaryId.js
```

Token extraction order in `auth` middleware: `req.body.token` → `req.cookies.token` → `Authorization` header. All three forms are valid.

### Frontend layout

Architecture separates *domain state* from *UI* via three distinct layers:

```
entities/    # Redux slices + API thunk functions, one folder per domain
             # (auth, user, course, cart, classroom, student, admin, settings, contact, ui)
features/    # Feature-level UI blocks — imported by pages, not lazy-loaded
pages/       # All page components — ALL lazy-loaded via React.lazy()
shared/      # components, hooks, services/api/apiConnector.js, utils
widgets/     # Navbar, Footer
```

Path aliases in `vite.config.js`: `@` → `src/`, `@shared` → `src/shared/`, `@features` → `src/features/`.

Redux store combines: `auth`, `profile`, `course`, `cart`, `sidebar`, `classroom`. Cart and auth token are synced to `localStorage` manually inside their slices — no persistence middleware.

API calls go through `shared/services/api/apiConnector.js` — a single Axios instance that injects `Authorization: Bearer <token>` on every request and handles 401 redirects. All endpoint URLs are constants in `app/config/apis.js`.

### Data flow for a protected action (example: submit assignment)
1. Frontend `apiConnector` injects token → POST `/api/v1/classroom/assignments/:id/submit`
2. `auth` middleware extracts + verifies JWT → sets `req.user`
3. No role guard on submit — any authenticated user may attempt it
4. Controller checks assignment `assigneeType`/`assignees` and `lockSubmissions` manually
5. Creates `Submission` document, returns `{ success, data }`

### Key multi-model relationships
```
Course → Section → SubSection  (courseContent tree, progress tracked per SubSection)
Classroom → Topic → Assignment → Submission
                  → Quiz       → Attempt
                  → items[]    (inline materials, links, references)
Classroom → Announcement
Classroom → ClassroomSession   (external Zoom/Meet URLs)
```

### Course enrollment — two paths
- **Payment path**: Cart → `capturePayment` → `verifyPayment` → `enrollStudents()` → email sent. **Currently fully stubbed** — Razorpay call is commented out in `backend/src/controllers/payments.js` and in the frontend `studentFeaturesAPI`.
- **Request path**: `course.requiresApproval = true` → student POSTs `/course/requestEnrollment` → stored in `course.enrollmentRequests[]` → instructor responds via `/course/enrollmentRequests/:courseId/:requestId/respond` → on Approved, `enrollStudents()` runs.

### Role system
Three active roles: `Admin`, `Instructor`, `Student`. `Parent` exists in `ACCOUNT_TYPE_PUBLIC` (frontend constants) and can sign up, but has no dashboard routes. Role is enforced at both layers: `isStudent/isInstructor/isAdmin` middleware on the backend, route-level guards + sidebar filtering on the frontend.

### File uploads
All uploads go through `fileUploader.js` → Cloudinary with `type: "authenticated"`. Temp files land in `/tmp` via `express-fileupload`. The resource type (image/video/raw) is auto-detected from mimetype. Deletion requires `publicId` + `resourceType` — both are stored on the model alongside the URL.

### Email
`mailSender.js` selects transport by `MAIL_SERVICE` env var (`"gmail"` for Gmail service, otherwise custom SMTP). OTP emails are triggered by a Mongoose **pre-save hook** on the OTP model — not called explicitly in controllers. OTP TTL index auto-deletes documents after 5 minutes.

---

## Known gaps (do not assume these work)

| Area | Status |
|------|--------|
| Payment (Razorpay) | Stubbed — `// Fix Before Deploy` in payments.js |
| Real-time messaging | Message model exists, no Socket.io |
| 401 auto-logout | Broken — typo `messgae` in apiConnector.js line ~31 |
| Tests | None exist — `npm test` is a no-op |
| Parent role dashboard | Signup works, no routes after login |
| node-schedule | Installed, never used |

No CI/CD pipelines exist. Deployment is manual via `scripts/deploy.sh` + `scripts/build.js`.
