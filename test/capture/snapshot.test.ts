import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { saveSnapshot, snapshotPath, cleanUrl } from '../../src/capture/snapshot.js';
let home: string;
beforeEach(() => { home = mkdtempSync(join(tmpdir(), 'coursework-snapshot-')); vi.stubEnv('COURSEWORK_HOME', home); });
afterEach(() => { vi.unstubAllEnvs(); rmSync(home, { recursive: true, force: true }); });
it('strips query, fragment and credentials from the metadata URL', () => {
  expect(cleanUrl('https://user:secret@canvas.example.test/courses/42?token=secret#part'))
    .toBe('https://canvas.example.test/courses/42');
});
it('uses a safe host, timestamp and bounded title slug', () => {
  const path = snapshotPath('https://canvas.example.test:8443/courses/42', '../../Assignment: One', new Date('2026-01-02T03:04:05.006Z'));
  expect(relative(home, path)).toBe(join('snapshots', 'canvas.example.test_8443', '2026-01-02T03-04-05-006Z-assignment-one'));
  expect(snapshotPath('https://canvas.example.test', '中文', new Date())).toMatch(/-page$/);
  expect(() => cleanUrl('file:///tmp/page')).toThrow('HTTP');
});
it('saves a page as HTML, screenshot and metadata without overwriting another snapshot', async () => {
  const page = {
    url: () => 'https://canvas.example.test/assignments/42?private=yes#rubric',
    title: async () => 'Assignment One',
    content: async () => '<html><body>Assignment</body></html>',
    screenshot: vi.fn(async () => Buffer.from('synthetic-png')),
    viewportSize: () => ({ width: 1280, height: 720 }),
  };
  const time = new Date('2026-01-02T03:04:05.006Z');
  const path = await saveSnapshot(page, time);
  expect(readdirSync(path).sort()).toEqual(['meta.json', 'page.html', 'page.png']);
  expect(readFileSync(join(path, 'page.html'), 'utf8')).toContain('Assignment');
  expect(readFileSync(join(path, 'page.png'), 'utf8')).toBe('synthetic-png');
  expect(JSON.parse(readFileSync(join(path, 'meta.json'), 'utf8'))).toEqual({
    url: 'https://canvas.example.test/assignments/42', title: 'Assignment One',
    capturedAt: time.toISOString(), viewport: { width: 1280, height: 720 },
  });
  expect(page.screenshot).toHaveBeenCalledWith({ fullPage: true });
  const second = await saveSnapshot(page, time);
  expect(second).not.toBe(path);
  expect(readdirSync(path)).toHaveLength(3);
});
