---
name: frontend-dev
description: "Activates the ClzMate frontend developer role. Use when working on anything in the frontend/ directory — new pages, components, Redux state, API integration, routing, UI, forms, or debugging frontend behavior. Loads full verified knowledge of the React/Vite/Redux stack, folder conventions, known bugs, and all variation paths."
disable-model-invocation: false
---

# ClzMate Frontend Developer

You are operating as the frontend developer for ClzMate — an e-learning platform. This skill loads your full verified context for the `frontend/` codebase.

---

## Stack (verified — do not assume alternatives)

- **React 18.2.0** — JavaScript only, no TypeScript, no tsconfig.json
- **Vite 7.1.9** — build tool, dev server
- **React Router DOM 7.8.0** — all routing
- **Redux Toolkit 2.8.2** + **react-redux 9.2.0** — all state
- **Tailwind CSS 4.1.11** — all styling, no component library (no MUI, no Ant Design)
- **Axios 1.11.0** — all HTTP via `shared/services/api/apiConnector.js`
- **react-hot-toast 2.5.2** — notifications, bottom-right position
- **lucide-react** + **react-icons** — icons
- **framer-motion 12.23.12** — animations
- **react-hook-form 7.62.0** — available but NOT universally used; some forms use controlled state instead

---

## Folder Conventions (verified structure)

```
frontend/src/
├── app/                    # Bootstrap only: main.jsx, App.jsx, router.jsx, store/, layouts/, config/
│   ├── config/apis.js      # ALL endpoint URL constants — add new endpoints here
│   ├── config/dashboard-links.js  # Sidebar nav links filtered by role
│   └── routes/router.jsx   # ALL routes defined here — ALL pages lazy-loaded
├── entities/               # Redux slice + API thunk functions per domain
│   ├── auth/               # authSlice + authAPI (login, signup, OTP, password reset)
│   ├── user/               # userSlice + userAPI
│   ├── course/             # courseSlice + courseAPI
│   ├── cart/               # cartSlice + cartAPI
│   ├── classroom/          # classroomSlice + classroomAPI
│   ├── student/            # studentFeaturesAPI (no slice — uses courseSlice)
│   ├── admin/              # adminAPI
│   ├── settings/           # settingsAPI
│   ├── contact/            # contactAPI
│   └── ui/                 # sidebarSlice only
├── features/               # Feature-level UI blocks — NOT lazy-loaded, imported by pages
├── pages/                  # Page components — ALL wrapped in React.lazy()
├── shared/
│   ├── components/ui/      # Base UI: Button, Input, Textarea, Select, Avatar, CourseCard, etc.
│   ├── components/app/     # App components: PlayerPanel, NotePanel, Whiteboard, SandboxPanel
│   ├── components/feedback/# ConfirmationModal, CustomToast, RatingStars
│   ├── components/navigation/ # Loading, Pagination, ScrollToTop, Tab
│   ├── services/api/apiConnector.js  # Axios instance
│   └── styles/             # theme.css, base.css
├── widgets/                # Navbar, Footer
└── utils/constants.js      # ACCOUNT_TYPE, ACCOUNT_TYPE_PUBLIC
```

**Path aliases** (always use these, never relative `../../../`):
- `@` → `src/`
- `@shared` → `src/shared/`
- `@features` → `src/features/`

---

## Before Writing Any Code — State These Assumptions

1. Which layer does this belong in? (entities / features / pages / shared / widgets)
2. Does a similar component or utility already exist in `shared/`?
3. Does an API endpoint constant already exist in `app/config/apis.js`?
4. Does Redux state already exist for this domain in `entities/`?
5. Does a route already exist in `router.jsx`?

Verify each by reading the actual file before adding duplicates.

---

## Redux — Verified Slice State

### `state.auth` (authSlice)
```javascript
{ signupData: null, loading: false, token: localStorage.token }
```
Token is read from `localStorage.token` on init. Set via `dispatch(setToken(token))`.

### `state.profile` (userSlice)
```javascript
{ user: localStorage.user, loading: false }
```
`user.accountType` is the source of truth for role checks.

### `state.course` (courseSlice)
```javascript
{
  step: 1,           // Course wizard: 1=Info, 2=Builder, 3=Publish
  course: null,      // Course being created/edited
  editCourse: false,
  paymentLoading: false,
  courseSectionData: [],
  courseEntireData: [],
  completedLectures: [],
  totalNoOfLectures: 0,
  drawMode: false    // Whiteboard (Excalidraw) toggle
}
```

### `state.cart` (cartSlice)
```javascript
{ cart: [], total: 0, totalItems: 0 }  // Also synced to localStorage manually
```
Cart is synced to `localStorage.cart`, `localStorage.total`, `localStorage.totalItems` inside the slice. No persistence middleware.

### `state.sidebar` (sidebarSlice)
```javascript
{ openSideMenu: false, screenSize: undefined, courseViewSidebar: false }
```

### `state.classroom` (classroomSlice)
```javascript
{
  step: 1,
  assignment: null, editAssignment: false,
  quiz: null, editQuiz: false,
  linkCourse: null, editLinkCourse: false
}
```

---

## API Layer — How It Works

**Single Axios instance**: `shared/services/api/apiConnector.js`

```javascript
apiConnector(method, url, bodyData, headers, params)
```

- **Request interceptor**: Auto-injects `Authorization: Bearer <token>` from `localStorage.token`
- **Response interceptor**: On 401, checks for "token" in message → clears localStorage + redirects to `/login`

**KNOWN BUG** — Response interceptor has a typo (`messgae` instead of `message`) on line ~31. The 401 auto-logout **does not trigger reliably**. Do not rely on it without fixing this first.

**All endpoint URLs** are constants in `app/config/apis.js`. Never hardcode URLs in components.

---

## Routing — All Routes and Guards

All pages are lazy-loaded: `const Page = lazy(() => import('@/pages/...'))`

**Route guard logic**:
- `OpenRoute` — unauthenticated only. If `state.auth.token` exists → redirect to `/dashboard`
- `ProtectedRoute` — authenticated only. If `state.auth.token` is null → redirect to `/`
- `RedirectToRole` — maps `user.accountType` to role dashboard:
  - `Admin` → `/dashboard/admin-controls/users`
  - `Student` → `/dashboard/student`
  - `Instructor` → `/dashboard/instructor`
  - Fallback → `/dashboard/student`

**Layouts** wrap routes:
- `AuthLayout` — minimal, no nav/sidebar
- `MainLayout` — MainNavbar + Footer + ScrollToTop + BackToTop
- `UserLayout` — UserSidebar + content
- `CourseLayout` — CourseSidebar + content
- `ClassLayout` — ClassSidebar + content

---

## Role-Based UI

Account types (from `utils/constants.js`):
```javascript
ACCOUNT_TYPE = { STUDENT: "Student", PARENT: "Parent", INSTRUCTOR: "Instructor", ADMIN: "Admin" }
ACCOUNT_TYPE_PUBLIC = { STUDENT: "Student", PARENT: "Parent" }  // public signup only
```

**Parent role**: Signup works. No dashboard routes exist. A Parent user who logs in lands on the generic `/dashboard` which has no matching case in `RedirectToRole` — falls through to `/dashboard/student` route which may error. Treat Parent as incomplete.

Role-specific sidebar links: filtered in `app/config/dashboard-links.js` by `type: ACCOUNT_TYPE.X`.

---

## Auth Flow — Full Paths

### Happy path (new user):
1. Sign up form → `dispatch(register())` → POST `/auth/signup` → server creates User + auto-sends OTP
2. Navigate to `/verify-email` → OTP entry → POST `/auth/verifyotp` → `User.verified = true`
3. Navigate to `/login` → POST `/auth/login` → `{ token, user }` stored in Redux + localStorage
4. Redirect to `/dashboard` → `RedirectToRole` → role-specific dashboard

### Variation — OTP expired:
OTP model TTL = 5 minutes. If user takes > 5 min, OTP is deleted from MongoDB. `verifyotp` will return error. Frontend must handle this and offer re-send.

### Variation — token expired during session:
JWT default expiry = 24h. On next API call, server returns 401. The interceptor typo means auto-logout may not fire. User may see broken state (auth selectors show user logged in, but API calls fail).

### Variation — existing user tries to sign up again:
Signup controller checks email uniqueness. Returns 400. Frontend must show the error.

---

## Course Creation Flow (Multi-Step Wizard)

Step state lives in `courseSlice.step` (1, 2, or 3).

- Step 1: Course info form — thumbnail uploaded to Cloudinary, course created in DB
- Step 2: Section/SubSection builder — each SubSection can have video (Cloudinary), support materials, external video URL
- Step 3: Publish — set Draft/Published status, toggle `requiresApproval`

**Edit mode**: `courseSlice.editCourse = true` and `courseSlice.course` pre-populated. Same wizard, `PATCH` instead of `POST`.

---

## Course Viewing Panels

Route: `/view-course/:courseId/section/:sectionId/sub-section/:subSectionId`

Available panels:
- `PlayerPanel` — video or `externalVideoUrl`
- `SectionSidebar` — navigation
- `NotePanel` — markdown notes, saved per SubSection
- `SupportFilesPanel` — file downloads
- `SandboxPanel` — only rendered if `course.features.sandboxEnabled === true`
- `Whiteboard` (Excalidraw) — toggled by `dispatch(setDrawMode(true))`

**Progress**: POST to `LECTURE_COMPLETION_API` marks SubSection as done. No partial progress — binary completed/not.

---

## Classroom UI Architecture

Classroom pages under `/classroom/:classroomId/`:
- `overview` — announcements + members
- `classwork` — Topics list → items (assignments, quizzes, materials, links)
- `view` — student view of classroom

Quiz player at `/classroom/:classroomId/quizz/:quizId/play` — separate full-screen route.

Assignment manage/edit reuses `ManageAssignment.jsx` for both create (`/manage-assignment/:topicId`) and edit (`/assignment/:assignmentId/edit`).

---

## UI Conventions

- **No component library** — all layout/UI via Tailwind classes
- **Primary brand color**: `#5046e4` (violet-600), `#7C3AED` (purple)
- **Icons**: prefer `lucide-react` for general icons, `react-icons` for specialized (VSCode, FA, etc.)
- **Animations**: use `framer-motion` for complex; Tailwind `transition`/`animate-` for simple hover/show
- **Toasts**: always use `react-hot-toast` — never alert() or console.error for user feedback
- **Confirmation dialogs**: use `ConfirmationModal` from `shared/components/feedback/`
- **Images**: use `Img` component from `shared/components/ui/` (lazy-loaded wrapper)
- **Loading states**: use `Loading` from `shared/components/navigation/`

---

## Known Issues — Verify Before Assuming These Work

| Issue | Location | Impact |
|-------|----------|--------|
| 401 auto-logout broken | `apiConnector.js` line ~31 typo `messgae` | Expired tokens don't auto-logout |
| Payment flow stubbed | `studentFeaturesAPI` — explicit bypass comment | `buyCourse()` does not use Razorpay |
| Double `await` | `InstructorDashboard.jsx` line ~30 | Works but wrong — fix if touching that file |
| Duplicate component | `CreateEditAssignment.jsx` vs `ManageAssignment.jsx` | Both exist — use `ManageAssignment` |
| Parent no dashboard | `RedirectToRole` fallback → student route | Parent users land on wrong page |
| No error boundary | App-level | Uncaught errors crash entire tree |
| Cart dual source | Redux + localStorage manually synced | Can diverge on multi-device or hard refresh |

---

## Conditions Under Which Changes Work

Before marking any frontend task done, verify:

1. **Token present?** — Protected routes and API calls require `state.auth.token`. If token is null, components may render empty or redirect.
2. **Role correct?** — Role-gated routes/components check `state.profile.user.accountType`. Wrong role = wrong UI or redirect.
3. **API endpoint exists?** — New calls must have a matching backend route. Check `api_routes.md` memory.
4. **Lazy loading?** — All new page components must be wrapped in `React.lazy()` in `router.jsx`.
5. **Redux slice updated?** — New state must have slice + action + selector. Not just a component's local state.
6. **Both happy path and error path?** — Every API call can fail. Handle `success: false` responses and network errors.
7. **All three roles tested?** — A UI change visible to one role may break or be invisible to others.
8. **OTP path vs direct login path?** — New user flow differs from returning user. Test both.
9. **Mobile layout?** — Tailwind is mobile-first. Check responsive breakpoints.
