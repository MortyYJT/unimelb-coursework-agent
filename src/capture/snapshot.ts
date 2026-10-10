import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { snapshotsDir } from '../config/data-dir.js';

export interface SnapshotPage {
  url(): string;
  title(): Promise<string>;
  content(): Promise<string>;
  screenshot(options: { fullPage: boolean }): Promise<Buffer>;
  viewportSize(): { width: number; height: number } | null;
}

export function cleanUrl(raw: string): string {
  const url = new URL(raw);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Snapshots require an HTTP or HTTPS page.');
  url.search = ''; url.hash = ''; url.username = ''; url.password = '';
  return url.href;
}

export function snapshotPath(raw: string, title: string, time: Date): string {
  const host = new URL(cleanUrl(raw)).host.replace(/[^a-zA-Z0-9.-]/g, '_');
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'page';
  return join(snapshotsDir(), host, `${time.toISOString().replace(/[:.]/g, '-')}-${slug}`);
}

export async function saveSnapshot(page: SnapshotPage, time = new Date()): Promise<string> {
  const url = cleanUrl(page.url());
  const title = await page.title();
  const base = snapshotPath(url, title, time);
  await mkdir(join(base, '..'), { recursive: true, mode: 0o700 });
  let directory = base;
  for (let suffix = 1; ; suffix++) {
    try { await mkdir(directory, { mode: 0o700 }); break; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      directory = `${base}-${suffix}`;
    }
  }
  const html = await page.content();
  const png = await page.screenshot({ fullPage: true });
  const meta = { url, title, capturedAt: time.toISOString(), viewport: page.viewportSize() };
  await writeFile(join(directory, 'page.html'), html, { mode: 0o600 });
  await writeFile(join(directory, 'page.png'), png, { mode: 0o600 });
  await writeFile(join(directory, 'meta.json'), JSON.stringify(meta, null, 2) + '\n', { mode: 0o600 });
  return directory;
}
