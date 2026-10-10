## ADDED Requirements

### Requirement: User-driven capture in a headed browser
`coursework capture` SHALL open a visible Playwright browser on the persistent profile at `.local/profiles/default`. The user SHALL sign in and navigate by hand. The tool MUST NOT read, type, store, or log passwords or one-time codes.

#### Scenario: Start capture
- **WHEN** the user runs `coursework capture`
- **THEN** a visible browser opens on the persistent profile and the terminal explains how to save a page

### Requirement: Save the current page as a snapshot
While capture runs, the user SHALL be able to save the current page with a terminal command. Each snapshot SHALL be written under `.local/snapshots/<host>/<timestamp>-<slug>/` with the rendered HTML, a full-page screenshot, and a `meta.json` holding the URL, title, capture time, and viewport. The URL in `meta.json` MUST have query strings and fragments removed.

#### Scenario: Save a page
- **WHEN** the user saves a Canvas assignment page
- **THEN** a snapshot folder appears with `page.html`, `page.png`, and `meta.json`, and the URL has no query string

#### Scenario: Snapshots stay local
- **WHEN** the check command runs
- **THEN** a test confirms git ignores `.local/snapshots/`

### Requirement: One process per browser profile
Capture SHALL hold an exclusive lock on the profile directory while running. A second process using the same profile MUST fail fast with a `LOCKED` error naming the holder's process id. A lock left by a dead process SHALL be cleared automatically.

#### Scenario: Second capture
- **WHEN** a capture is running and the user starts another
- **THEN** the second exits with `LOCKED` and the first keeps running

#### Scenario: Stale lock
- **WHEN** the lock file names a process id that no longer exists
- **THEN** a new capture removes the lock and starts
