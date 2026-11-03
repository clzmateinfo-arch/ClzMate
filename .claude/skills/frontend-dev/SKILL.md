---
name: frontend-dev
description: "Activates the ClzMate frontend developer role. Use when working on anything in the frontend/ directory — new pages, components, Redux state, API integration, routing, UI, forms, or debugging frontend behavior. Loads verified knowledge of the React/Vite/Redux stack, folder conventions, route guards, auth flow, and known gaps."
disable-model-invocation: false
---

# ClzMate Frontend Developer

Frontend developer for ClzMate (e-learning platform). Verified context for `frontend/`. Code is the source of truth; re-read before relying on this.

## Stack

- React 18.2 (JavaScript only, no TypeScript), Vite 7, React Router DOM 7, Redux Toolkit 2.8 + react-redux 9, Tailwind CSS 4 (no component library), Axios 1.11, react-hook-form (not used everywhere), framer-motion, react-hot-toast, **react-icons** (there is no `lucide-react`), Excalidraw (whiteboard), chart.js, swiper.
- Commands in `frontend/`: `npm start` (vite), `npm run lint` (ESLint 9, 0 warnings), `npm run build`. No test runner or tests in the frontend; backend has a suite (`cd backend && npm test`).
- Env: only `VITE_APP_BASE_URL` (e.g. `http://localhost:5000/api/v1`, see `frontend/.env.example`), baked in at build time.

## Folder conventions

```
frontend/src/
├── app/            main.jsx, App.jsx (ErrorBoundary), routes/router.jsx, store/rootReducer.js, layouts/, config/
│   └── config/     apis.js (ALL endpoint constants), dashboard-links.js (role-filtered sidebar), class-links.js, course-links.js, navbar-links.js
├── entities/       <domain>/model/ slice + API thunks: auth, user, course, cart, classroom, student, admin, settings, conatct (sic), ui (sidebarSlice)
├── features/       feature UI blocks imported by pages (auth/ui has OpenRoute, ProtectedRoute, RoleRoute and the auth forms)
├── pages/          ALL lazy-loaded in router.jsx: auth, main, user, admin, course, classroom, common
├── shared/         components/{ui,app,feedback,navigation}, services/api/apiConnector.js, hooks, utils, styles
├── widgets/        Navbar, Footer
└── utils/constants.js   ACCOUNT_TYPE, ACCOUNT_TYPE_PUBLIC, COURSE_STATUS
```

Path aliases: `@` -> `src/`, `@shared` -> `src/shared/`, `@features` -> `src/features/`. Use them instead of deep relative imports.

## Before writing code, state assumptions

1. Layer: entities / features / pages / shared / widgets?
2. Similar component or helper already in `shared/`? Endpoint constant already in `app/config/apis.js`? Slice/thunk already in `entities/`? Route already in `router.jsx`?
3. Which roles reach it, and what does the backend return for the others (403)?

## Redux (`app/store/rootReducer.js`: `auth`, `profile`, `course`, `cart`, `sidebar`, `classroom`)

- `auth`: `{ signupData, loading, token }`; token is JSON in `localStorage.token`.
- `profile`: `{ user, loading }`; `user.accountType` drives role checks; mirrored in `localStorage.user`.
- `course`: wizard `step`, `course`, `editCourse`, `courseSectionData`, `courseEntireData`, `completedLectures`, `totalNoOfLectures`, `paymentLoading`, `drawMode`.
- `cart`: `{ cart, total, totalItems }`, mirrored to localStorage inside the slice (no persistence middleware).
- `sidebar`: `openSideMenu`, `screenSize`, `courseViewSidebar`. `classroom`: wizard `step` plus `assignment`/`quiz`/`linkCourse` and their `edit*` flags.
- `main.jsx` clears Redux when another tab removed `localStorage.token` (visibilitychange).

## API layer

`shared/services/api/apiConnector.js`: `apiConnector(method, url, bodyData, headers, params)` over one Axios instance (`withCredentials`). Never hardcode URLs; add constants to `app/config/apis.js`.

- Request interceptor injects `Authorization: Bearer <localStorage.token>`.
- Response interceptor: **401** (outside `/login`) whose message contains `token`, `missing`, `decoding` or `unauthorized` clears `token`/`user` and redirects to `/login`. Backend 401 messages "Account not found or deactivated" and "Session expired after password change..." match none of these, so they do not auto-logout. **403 never logs out** (role denied, unapproved instructor, not a member/owner).
- Backend errors are `{ success:false, message }`; surface `error.response.data.message`. 429 means a rate limit was hit.
- Interceptors also feed `shared/services/api/requestActivity.js` (slow-request tracking for `ServerStatusIndicator`, successful-write listeners). Pass `skipActivityTracking: true` in the axios config to opt out.

## Public data and cold starts (`shared/snapshot/`)

Public, unauthenticated reads must go through `usePublicResource(key)` (or `getPublicResource(key)` outside React), never a direct `apiConnector` call: the free Render API sleeps and a direct call blanks the page for up to a minute. The hook returns `{ data, source: "snapshot"|"cache"|"live"|"none", isSettled, isNotFound }`; render `data` as soon as it exists, show a loader only while `!isSettled`.

- Keys and their live requests: `resources.js` (`categories`, `newCourses`, `popularCourses`, `stats`, `reviews`, `course:<id>`, `catalog:<id>`). Adding one needs the same key in backend `utils/snapshotPublisher.js` `buildSnapshot`.
- Tiers in `dataCache.js`: bundled `bundled.json` (generated at build, gitignored, origin-checked in `bundled.js`, else `neutral.json`) -> `localStorage` `clz:cache:*` -> Cloudinary `VITE_SNAPSHOT_URL` after 1.2 s without live data (hash-verified) -> live. Live always wins; 4xx on a `course:`/`catalog:` key means not found.
- Successful writes matching `isContentMutationUrl` clear the local cache and refetch mounted keys. Keep that regex in sync with the backend `CONTENT_MUTATION_PATH`.
- Never put logged-in or personal data in a public resource.

## Routing and guards (`app/routes/router.jsx`)

- `OpenRoute`: logged in -> `/dashboard`. `ProtectedRoute`: no token -> `/login`.
- `RoleRoute allowedRoles={[ACCOUNT_TYPE.X]}`: no token -> `/login`; profile not loaded -> `Loading`; wrong role -> `/dashboard`. Every role-specific route uses it. The backend is still the authority.
- `/dashboard` index -> `RedirectToRole` (Admin `/dashboard/admin-controls/users`, Instructor `/dashboard/instructor`, otherwise `/dashboard/student`; 5 s timeout falls back to `/`).
- Role map: Admin: `admin-controls/users`, `admin-controls/categories`. Student: `student`, `enrolled-courses`, `enrollments/pending`, `my-classrooms`. Instructor: `instructor`, `add-course`, `my-courses`, `edit-course/:courseId`, `course/:courseId/requests`, `classrooms`. Shared: `my-profile`, `settings`. Classroom routes under `/classroom/:classroomId/`: `overview` (Instructor, Student), `classwork*` (Instructor), `view` (Student), `quizz/:quizId/play` (Instructor, Student). `/view-course/:courseId/section/:sectionId/sub-section/:subSectionId` is protected, any role.
- Layouts: `AuthLayout`, `MainLayout`, `UserLayout`, `CourseLayout`, `ClassLayout`. All pages are `React.lazy`; new pages must be too.

## Roles

`ACCOUNT_TYPE = { STUDENT, INSTRUCTOR, ADMIN }`; `ACCOUNT_TYPE_PUBLIC = { STUDENT, INSTRUCTOR }` (signup form). **Parent no longer exists.** Instructors sign up unapproved: they can log in, but instructor APIs return 403 until an admin sets `approved` (admins approve or revoke from the admin users page, `features/admin/ui/UsersPanel.jsx`, via `POST /admin/updateUser`). Admin accounts are not creatable from the UI.

## Auth flow (`entities/auth/model/authAPI.js`)

1. `register()` -> POST `/auth/signup` (password 8-72, Student|Instructor) creates an unverified user, then calls `sendOtp()` -> POST `/auth/sendotp` -> navigate `/verify-email`.
2. `verifyOtp()` -> POST `/auth/verifyotp` -> `/login`. Handle 400 (wrong/expired; 5 wrong tries invalidate the code) and 429 (60 s resend cooldown).
3. `login()` -> `{ token, user }` into Redux + localStorage -> `/dashboard`. A 403 "Please verify your email" triggers a fresh OTP and `/verify-email`; any other 403 (deactivated) is toasted; wrong credentials are a uniform 401.
4. Reset: `getPasswordResetToken` (generic response) -> emailed link `FRONTEND_URL/update-password/:id` -> `/auth/reset-password` with `{ token, password, confirmPassword }`. Changing or resetting a password invalidates older tokens, so the user must log in again.

## Course creation and viewing

- Wizard in `courseSlice.step`: 1 info (thumbnail upload, image types only), 2 section/sub-section builder (uploads, `externalVideoUrl` must be http/https), 3 publish (Draft/Published, `requiresApproval`). Edit mode uses `editCourse` (POST `/course/editCourse`, allow-listed fields).
- Viewing: `PlayerPanel`, `SectionSidebar`, `NotePanel` (per sub-section), `SupportFilesPanel`, `SandboxPanel` (only if `course.features.sandboxEnabled`), `Whiteboard` (`drawMode`). Files are fetched through `POST /course/getAssetUrl` (signed, short-lived, enrolled/owner only). Progress: `LECTURE_COMPLETION_API` once per sub-section (second call is 400).
- Enrollment: `buyCourse` in `studentFeaturesAPI.js` posts `{ coursesId, requiresApproval }` straight to `/payment/verifyPayment` (no `capturePayment`, no Razorpay fields). Free courses enroll; paid courses get the backend 402 "Payment gateway not configured" toast unless the backend runs non-production with `ALLOW_STUBBED_PAYMENT=true`. Approval courses create pending requests (`/dashboard/enrollments/pending`, instructors respond at `course/:courseId/requests` with `action: "approve"|"reject"`).

## Classroom UI

`ManageAssignment.jsx` serves create (`manage-assignment/:topicId`) and edit (`assignment/:assignmentId/edit`); `ManageQuiz`, `ManageLinkCourse` likewise. Staff-only actions (create/update/delete topics, items, assignments, quizzes, grading, add/remove member) get 403 for non-staff; students only receive published, targeted work and quizzes without answer keys. Quiz grading is server-side; do not compute scores on the client.

## UI conventions

- Tailwind classes only; brand violet `#5046e4`/`#7C3AED`.
- Toasts: prefer `showToast` from `shared/components/feedback/CustomToast`; some thunks still call `react-hot-toast` directly (Toaster is bottom-right in `main.jsx`). No `alert()`.
- Confirmations: `ConfirmationModal` (`shared/components/feedback`). Images: `Img` (`shared/components/ui`). Loading: `Loading` (`shared/components/navigation`). Errors: `ErrorBoundary` wraps the app.
- Icons: `react-icons`. Animation: framer-motion for complex, Tailwind transitions for simple.

## Known gaps

| Gap | Where |
| :--- | :--- |
| No Razorpay checkout: paid courses fail with 402 unless backend dev flag is set | `entities/student/model/studentFeaturesAPI.js` |
| Cart dual source (Redux + localStorage) can diverge | `cartSlice` |
| No frontend tests | repo |

## Done checklist

1. Token and role: behavior correct for Student, Instructor (approved and unapproved), Admin, anonymous; 401 vs 403 handled.
2. Endpoint exists in `backend/src/routes` and constant is in `apis.js`; both success and error responses handled.
3. New page lazy-loaded and wrapped in the right `RoleRoute`.
4. State in a slice/thunk, not ad hoc.
5. `npm run lint` clean (0 warnings) and `npm run build` succeeds; mobile layout checked.
