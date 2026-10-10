import { join } from 'node:path';

export interface CapturePage {
  isClosed(): boolean;
  evaluate(expression: string): Promise<boolean>;
}
export interface CaptureContext<P extends CapturePage> {
  pages(): P[];
  close(): Promise<void>;
}
export function prepareCommands(commands: AsyncIterable<string>): AsyncIterable<string> {
  // Subscribe before launch so an early terminal close is retained by the iterator.
  const iterator = commands[Symbol.asyncIterator]();
  return { [Symbol.asyncIterator]: () => iterator };
}
export async function confirmBundledBrowser(
  terminal: { question(prompt: string, options: { signal: AbortSignal }): Promise<string> },
  signal: AbortSignal,
): Promise<boolean> {
  if (signal.aborted) return false;
  try {
    const answer = await terminal.question('Chrome is unavailable. Use installed bundled Chromium? [y/N] ', { signal });
    return /^y(es)?$/i.test(answer.trim());
  } catch (error) {
    if (signal.aborted) return false;
    throw error;
  }
}
export function launchSettings(home: string) {
  return { profile: join(home, 'profiles', 'default'), options: { headless: false, channel: 'chrome' } };
}

export async function activePage<P extends CapturePage>(context: Pick<CaptureContext<P>, 'pages'>): Promise<P | undefined> {
  const pages = context.pages().filter(page => !page.isClosed());
  // Terminal focus can make hasFocus false; visibility still identifies the selected tab.
  for (const expression of ['document.hasFocus()', 'document.visibilityState === "visible"']) {
    for (const page of [...pages].reverse()) {
      try { if (await page.evaluate(expression)) return page; }
      catch { /* A tab can close or navigate while it is being selected. */ }
    }
  }
  return pages.at(-1);
}

export async function captureSession<P extends CapturePage>(
  context: CaptureContext<P>, commands: AsyncIterable<string>,
  save: (page: P) => Promise<string>, log: (message: string) => void,
): Promise<void> {
  try {
    log('Sign in and navigate by hand. Enter s to save the active tab, q to quit.');
    for await (const line of commands) {
      const command = line.trim().toLowerCase();
      if (command === 'q') break;
      if (command !== 's') { log('Enter s to save or q to quit.'); continue; }
      const page = await activePage(context);
      if (!page) { log('No open page to save.'); continue; }
      try { log(`Saved snapshot: ${await save(page)}`); }
      catch { log('Unable to save this page; try again after it finishes loading.'); }
    }
  } finally { await context.close(); }
}
