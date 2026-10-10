import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { acquireProfileLock, ProfileLockedError } from '../../src/capture/lock.js';
import { profilesDir } from '../../src/config/data-dir.js';
let home: string;
beforeEach(() => { home = mkdtempSync(join(tmpdir(), 'coursework-lock-')); vi.stubEnv('COURSEWORK_HOME', home); });
afterEach(() => { vi.unstubAllEnvs(); rmSync(home, { recursive: true, force: true }); });
it('rejects a second capture with LOCKED and preserves the first holder', () => {
  const release = acquireProfileLock();
  const path = join(profilesDir(), 'default.lock');
  expect(readFileSync(path, 'utf8')).toBe(String(process.pid));
  expect(() => acquireProfileLock()).toThrow(ProfileLockedError);
  try { acquireProfileLock(); } catch (error) {
    expect(error).toMatchObject({ code: 'LOCKED', message: expect.stringContaining(String(process.pid)) });
  }
  expect(readFileSync(path, 'utf8')).toBe(String(process.pid));
  release(); release();
  expect(existsSync(path)).toBe(false);
});
it('reclaims a stale lock naming an exited process', () => {
  const child = spawnSync(process.execPath, ['-e', '']);
  expect(child.status).toBe(0);
  const path = join(profilesDir(), 'default.lock');
  writeFileSync(path, String(child.pid));
  const release = acquireProfileLock();
  expect(readFileSync(path, 'utf8')).toBe(String(process.pid));
  release();
});
it('fails closed on a malformed lock rather than deleting another holder', () => {
  const path = join(profilesDir(), 'default.lock');
  writeFileSync(path, '');
  expect(() => acquireProfileLock()).toThrow(ProfileLockedError);
  expect(readFileSync(path, 'utf8')).toBe('');
});
