## ADDED Requirements

### Requirement: Storage sits behind a repository interface
All reads and writes SHALL go through a repository interface. Only one implementation, backed by `node:sqlite`, SHALL know about SQL. Code outside the storage module MUST NOT import `node:sqlite`.

#### Scenario: In-memory store for tests
- **WHEN** a test opens the store with the in-memory option
- **THEN** it gets a working repository with the full schema and no file on disk

#### Scenario: SQL stays inside storage
- **WHEN** the check command runs
- **THEN** a test fails if any file outside `src/store/` imports `node:sqlite`

### Requirement: Versioned migrations
The store SHALL apply numbered migrations in order on open and record the applied version. Opening an up-to-date database SHALL apply nothing. Opening a database with a newer version than the code knows MUST fail without modifying it.

#### Scenario: Fresh database
- **WHEN** the store opens a path with no database
- **THEN** it creates the file, applies every migration, and records the latest version

#### Scenario: Database from newer code
- **WHEN** the recorded version is higher than the latest migration
- **THEN** opening fails with an error naming both versions and the file is unchanged

### Requirement: Data lives in .local only
The default database path SHALL be `.local/coursework.db` relative to the project root, overridable by the `COURSEWORK_HOME` environment variable. The `.local/` directory MUST be ignored by git.

#### Scenario: Default location
- **WHEN** no override is set
- **THEN** the store resolves to `.local/coursework.db` and creates `.local/` if missing

#### Scenario: Git ignores local data
- **WHEN** the check command runs
- **THEN** a test confirms `git check-ignore .local/coursework.db` succeeds

### Requirement: Writes validate before storing
The repository SHALL parse every entity with its domain schema before writing and MUST reject invalid entities without a partial write.

#### Scenario: Rejected write leaves no trace
- **WHEN** a batch of three tasks where the third is invalid is saved
- **THEN** the save fails and none of the three tasks is stored
