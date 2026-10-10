import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { beforeAll, expect, it } from 'vitest';

beforeAll(() => { execFileSync('npm', ['run', 'build'], { stdio: 'pipe' }); });

it('coursework --version prints the package version', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
  expect(execFileSync(process.execPath, [cli, '--version'], { encoding: 'utf8' }))
    .toBe(`${pkg.version}\n`);
});


it('second capture exits with status 3 and names the holder before launching a browser', () => {
  const home = mkdtempSync(join(tmpdir(), 'coursework-cli-'));
  try {
    mkdirSync(join(home, 'profiles'));
    const lock = join(home, 'profiles', 'default.lock');
    writeFileSync(lock, String(process.pid));
    const cli = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
    const result = spawnSync(process.execPath, [cli, 'capture'], {
      env: { ...process.env, COURSEWORK_HOME: home }, encoding: 'utf8', timeout: 5000,
    });
    expect(result.status).toBe(3);
    expect(result.stderr).toContain(`locked by process ${process.pid}`);
    expect(readFileSync(lock, 'utf8')).toBe(String(process.pid));
  } finally { rmSync(home, { recursive: true, force: true }); }
});
