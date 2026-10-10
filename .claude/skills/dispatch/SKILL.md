---
name: dispatch
description: Use when an approved OpenSpec change and scheduled plan exist and work should be handed to Codex, reviewed, turned into a PR, and queued for an async dsh quiz. Runs the multi-agent loop from AGENTS.md without automating the blocking human gate (design approval). Claude merges reviewed, green PRs.
---

# Dispatch loop (Claude Code as coordinator)

Read `AGENTS.md` ("Agents and human gates") and the guidelines section "Multi-agent collaboration" first. Never automate gate 1 (design approval). Merging is delegated to Claude (`note/decisions.md` #10). Learning quizzes are queued, never awaited.

## Preconditions

- The user approved the design (gate 1) in this session or in `note/handoff.md`, and the OpenSpec change id is known.
- The repository-local Git identity (`git config --local user.name/user.email`) is the public handle and noreply address. Placeholder identities left by rehearsals have leaked into pushed history before; check, and pass `-c user.name=... -c user.email=...` if it is wrong.
- `gh auth status` succeeds, and `codex` and `dsh` are on PATH. If one is missing, stop and tell the user.

## Steps

1. **Issues.** For each group of related plan steps, open an issue with `.github/ISSUE_TEMPLATE/task.md` (`gh issue create --template task.md ...`). Fill in scope and the `TODO(human)` parts.
2. **Workspace.** Give Codex a standalone clone, not a linked worktree: `git clone <origin-url> ../<repo>-<topic> && git -C ../<repo>-<topic> switch -c codex/<topic>`, then copy the repository-local Git identity into it. A linked worktree keeps its Git metadata in the main checkout's `.git/`, outside the `workspace-write` sandbox, so Codex cannot commit there. The sandbox has no network: install approved dependencies in the clone yourself before dispatching.
3. **Dispatch.** `codex exec --cd ../<repo>-<topic> --sandbox workspace-write -o <scratch>/codex-<issue>.md "<issue body> Follow AGENTS.md. Use TDD. Make one commit per plan step. Leave TODO(human) parts unimplemented. Do not push. End with a report: files changed, tests run with results, open questions."` Verify the flags with `codex exec --help` for the installed version. When running it in the background or from a script, redirect stdin (`< /dev/null`): otherwise `codex exec` waits on "Reading additional input from stdin..." and never starts. Fetch the finished branch from the clone into the main checkout before pushing.
4. **Check the delivery yourself.** In the clone, run the project check command, read the diff against the issue's scope, and confirm the commits. Do not trust the report alone.
5. **Review.** Use a fresh-context review (a subagent or the review command), limited to correctness and requirement gaps.
   - Changes needed: send the findings back with `codex exec resume --last` (or a new `codex exec` in the same clone). At most two rounds; then stop and hand over to the user.
   - Ready: push the branch (your guard hook applies), then `gh pr create` using the PR template, with `Closes #N`. Post the review summary as a PR comment.
6. **Merge.** Only when the review verdict is "ready to merge" and `gh pr checks <n> --watch` passes. Until CI exists, doc-only PRs may merge after review, and code PRs wait (list them in `note/handoff.md`). A PR carrying a design (`openspec/changes/**`, design docs) merges only if `note/decisions.md` records the user's pick and reason. Then `gh pr merge <n> --rebase --delete-branch` and fast-forward the local `main`. Tell the user in one line; do not wait for them.
7. **Queue a quiz (after the merge; non-blocking).** Follow the guidelines, "Multi-agent collaboration", Quiz. In short: in the main checkout, branch `dsh/quiz-<pr>` from the updated `main`, run `dsh headless` with a prompt that starts with `【<repo> · Stage <n>：<short title>】`, take the newest session id from `~/.dsh/sessions/<encoded-path>/`, and check that only `note/interview/<pr>.md` changed. Commit it for a docs PR, tell the user in one line that it is queued, and continue with the next issue. Do not wait.
8. **When the user answers (any time).** Mark each answer ✅/⚠️/❌ and add misses to the review list in the same file.
9. **Handoff.** Update `note/handoff.md`: issues and PRs in flight, the last verified state, and the next step.

## Record for the resume

Keep counts in `note/handoff.md` or the stage log: issues dispatched, PRs merged, review findings, rework rounds, and dispatch-to-merge time. These are the evidence behind any "multi-agent workflow" claim.
