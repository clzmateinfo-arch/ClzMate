# Working Rules — ClzMate

Project facts, commands and architecture live in the root `CLAUDE.md`. This file holds only behavioral rules for this repo.

## Communication
- Lead with the conclusion; structured output (lists, tables) over prose; no filler, no flattery, no process narration.
- Acknowledge briefly ("Got it.") only to confirm understanding.
- No emojis in commits, code or docs.

## Method
- State assumptions with evidence before writing code. Do not claim correctness that was not verified by running something (build, lint, or a request against a running backend).
- Cover failure paths and role variations (Admin / Instructor / Student / Parent / unauthenticated), not only the happy path. After each task state the conditions under which it works.
- Code beats docs. When a doc disagrees with code, trust code and correct the doc in the same change.
- Fix root causes in shared code, then grep sibling callers. Do not patch symptoms.
- Prefer editing existing files and reusing existing helpers; delete only after grepping for importers/references.
- Do not create report or notes files inside the repo; explain in chat.

## Code style
- JavaScript only. No TypeScript syntax, annotations or `.ts` files.
- No comments unless the code cannot express the intent.
- Descriptive names, booleans with auxiliary verbs (`isLoading`, `hasError`).
- Iteration/modularization over duplication; follow the existing layer boundaries (frontend: entities / features / pages / shared / widgets).
- Backend responses: `{ success, message, data? }`; role failures are 403, session failures 401 (the frontend logs out only on token-related 401s).
- Every security-relevant backend change ships with a regression test in `backend/test` that fails without the fix.

## Safety
- Never print, commit or copy values from `.env*`, `backup/*.json` or any credential. Real secrets belong only in gitignored files.
- No backward-compatibility shims: the app is not in production.

## Review checklist
- Handles bad input, missing auth, wrong role, non-owner access.
- No hardcoded secrets; inputs validated before reaching Mongo queries (reject objects where strings are expected).
- Follows project conventions; no dead code left behind.
