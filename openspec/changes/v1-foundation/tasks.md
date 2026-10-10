Issue mapping for dispatch: groups 1–2 are issue A (blocks the rest); groups 3, 4, and 5 are issues B, C, and D and run in parallel worktrees once A is merged. Every task is TDD: the failing test comes first, built from the scenarios in `specs/`.

## 1. Project scaffold and checks (issue A)

- [ ] 1.1 Add `package.json` (type module, Node >= 24, bin `coursework` → `dist/cli.js`) and `tsconfig.json` (strict, NodeNext); install `typescript`, `vitest`, `zod`, `commander`, `@types/node`
- [ ] 1.2 Add `npm run check` = `tsc --noEmit && vitest run`; make `.claude/check.sh` run it
- [ ] 1.3 Add `.github/workflows/ci.yml` running `npm ci && npm run check` on Node 24 for pull requests and pushes to `main`
- [ ] 1.4 Add `src/cli.ts` with commander and a `--version` flag; test that it prints the package version

## 2. Domain model (issue A)

- [ ] 2.1 `src/domain/schemas.ts`: zod schemas for Module, Course, Assessment, SourceItem, Citation, Step, Task, Change, Run with inferred types; tests for each scenario in `specs/domain-model` that covers parsing and invariants
- [ ] 2.2 Course weight check for completed courses (sum must be 100) with a message naming the course and the sum
- [ ] 2.3 `src/domain/progress.ts`: module progress (non-recurring steps only, 0 when empty)
- [ ] 2.4 `src/domain/grade.ts`: `projectGrade()` per `specs/domain-model` "Grade projection", including hurdle floor, `unreachable`, `secured`, and the nothing-graded case — **TODO(human) if the user opts in: implementer writes the tests and a stub that throws; the user writes the body**
- [ ] 2.5 Synthetic fixtures in `test/fixtures/` (fake course codes; no real course data)

## 3. Local store (issue B)

- [ ] 3.1 `src/store/repository.ts`: repository interface (save and load per entity, batch save, list changes since a sequence number, record run)
- [ ] 3.2 `src/store/sqlite.ts`: `node:sqlite` implementation with an in-memory option; batch saves in one transaction; zod parse on write and read
- [ ] 3.3 `src/store/migrations/`: migration runner on `PRAGMA user_version`; first migration creates all tables; refuse newer databases untouched
- [ ] 3.4 Default path `.local/coursework.db` with `COURSEWORK_HOME` override; create `.local/` if missing
- [ ] 3.5 Guard tests: no file outside `src/store/` imports `node:sqlite`; `git check-ignore` succeeds for `.local/coursework.db`

## 4. Agent envelope (issue C)

- [ ] 4.1 `src/protocol/errors.ts`: error code union and const table with `retryable` per code; `AUTH_EXPIRED` default `next` hint
- [ ] 4.2 `src/protocol/envelope.ts`: `ok()`, `fail()`, and `run()` (timing, `runId`, error mapping, `INTERNAL` with scrubbed message)
- [ ] 4.3 64 KiB bound: oversized data becomes `LIMIT_EXCEEDED` with a narrowing hint; tests for every scenario in `specs/agent-envelope`

## 5. Page capture (issue D)

- [ ] 5.1 Install `playwright`; `src/capture/lock.ts`: profile lock with `wx` file, pid holder, stale-lock cleanup; tests for both lock scenarios
- [ ] 5.2 `src/capture/snapshot.ts`: write `page.html`, `page.png`, `meta.json` under `.local/snapshots/<host>/<timestamp>-<slug>/`; strip query and fragment from the URL; unit-test the path and URL logic without a browser
- [ ] 5.3 `coursework capture`: persistent context on `.local/profiles/default` with `channel: 'chrome'`, fallback to bundled Chromium only after asking; terminal commands `s` (save active tab) and `q` (quit); never touch form fields
- [ ] 5.4 Guard test: `git check-ignore` succeeds for `.local/snapshots/` and `.local/profiles/`
- [ ] 5.5 Manual run by the user (not automatable): sign in to Canvas and Ed, save assignment, announcement, grades, and Ed lesson pages for each course; note in the PR how long the session lasted and whether MFA was asked
