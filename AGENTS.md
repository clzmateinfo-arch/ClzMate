# AGENTS.md

Instructions for AI coding agents working on ClzMate (Express 5 + Mongoose API in `backend/`, React 18 + Vite SPA in `frontend/`, standalone `backup/` service).

Single source of truth: `CLAUDE.md` (commands, environment, architecture, known broken areas). Behavioral rules: `.claude/CLAUDE.md`. Skills: `.claude/skills/` (`backend-dev`, `frontend-dev`, `qa-dev`).

Do not duplicate their content here. When a document contradicts something you observed (build output, lint, a live HTTP response), trust the observation and fix the document.

Verification gate: there is no automated test suite. Claim "works" only after the touched app builds (`npx vite build` in `frontend/`), `npm run lint` is clean (frontend), and the behavior was exercised against a running backend with MongoDB.
