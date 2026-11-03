# ClzMate

E-learning / academy management platform: courses, classrooms, assignments, quizzes, materials.

| Project | Stack |
|---|---|
| `backend/` | Express 5, Mongoose 8, JWT, Cloudinary, Nodemailer (port 5000) |
| `frontend/` | React 18, Vite, Redux Toolkit, Tailwind v4 (JavaScript) |
| `backup/` | Mongo -> Google Drive backup service (see `backup/README.md`) |

## Run locally

```bash
cd backend && cp .env.example .env && npm install && npm run start:dev
cd frontend && cp .env.example .env && npm install --legacy-peer-deps && npm start
```

Fill `.env` with your own values (`JWT_SECRET` at least 32 random characters). Never commit `.env*` files or credential JSON.

Backend tests: `cd backend && npm test`.

## Deploy (Render)

```bash
bash ./scripts/deploy.sh   # in backend/ or frontend/
npm run start:render       # backend
```

Details, environment variables, architecture and known gaps: `CLAUDE.md`. Design documents: `documentation/`.
