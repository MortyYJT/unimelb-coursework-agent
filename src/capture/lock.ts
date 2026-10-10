import { closeSync, openSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { profilesDir } from '../config/data-dir.js';

// Temporary bridge until issue C supplies CourseworkError.
export class ProfileLockedError extends Error {
  readonly code = 'LOCKED';
  constructor(holder: string) {
    super(`Browser profile is locked by process ${holder || 'unknown'}.`);
    this.name = 'ProfileLockedError';
  }
}

function code(error: unknown): string | undefined {
  return (error as NodeJS.ErrnoException).code;
}

export function acquireProfileLock(): () => void {
  const path = join(profilesDir(), 'default.lock');
  for (;;) {
    let descriptor: number;
    try { descriptor = openSync(path, 'wx', 0o600); }
    catch (error) {
      if (code(error) !== 'EEXIST') throw error;
      let holder: string;
      let identity: ReturnType<typeof statSync>;
      try { identity = statSync(path); holder = readFileSync(path, 'utf8'); }
      catch (readError) { if (code(readError) === 'ENOENT') continue; throw readError; }
      const pid = Number(holder);
      if (!/^\d+$/.test(holder) || !Number.isSafeInteger(pid) || pid <= 0) throw new ProfileLockedError(holder);
      try { process.kill(pid, 0); }
      catch (probeError) {
        if (code(probeError) === 'ESRCH') {
          // Recheck the inode so a replacement lock is not mistaken for the stale one.
          try {
            const current = statSync(path);
            if (current.ino === identity.ino && current.dev === identity.dev) unlinkSync(path);
          } catch (removeError) { if (code(removeError) !== 'ENOENT') throw removeError; }
          continue;
        }
        if (code(probeError) !== 'EPERM') throw probeError;
      }
      throw new ProfileLockedError(holder);
    }
    try { writeFileSync(descriptor, String(process.pid)); }
    catch (error) { closeSync(descriptor); unlinkSync(path); throw error; }
    const identity = statSync(path);
    closeSync(descriptor);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      try {
        const current = statSync(path);
        if (current.ino === identity.ino && current.dev === identity.dev) unlinkSync(path);
      } catch (error) { if (code(error) !== 'ENOENT') throw error; }
    };
  }
}
