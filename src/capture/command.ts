import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { chromium, type BrowserContext } from 'playwright';
import { dataDir } from '../config/data-dir.js';
import { acquireProfileLock } from './lock.js';
import { saveSnapshot } from './snapshot.js';
import { captureSession, launchSettings, prepareCommands, confirmBundledBrowser } from './session.js';

export async function capture(): Promise<void> {
  const release = acquireProfileLock();
  const terminal = createInterface({ input: stdin, output: stdout });
  const commands = prepareCommands(terminal);
  let stopped = false;
  const cancellation = new AbortController();
  terminal.once('close', () => { stopped = true; cancellation.abort(); });
  let context: BrowserContext | undefined;
  const stop = () => { stopped = true; terminal.close(); void context?.close().catch(() => {}); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  terminal.on('SIGINT', stop);
  try {
    const settings = launchSettings(dataDir());
    try { context = await chromium.launchPersistentContext(settings.profile, settings.options); }
    catch (error) {
      if (stopped) return;
      // Only missing Chrome warrants offering the already-installed bundled browser.
      if (!(error instanceof Error) || !/not found|doesn.t exist|executable.*missing/i.test(error.message)) throw error;
      if (!stdin.isTTY || !stdout.isTTY) throw new Error('Chrome is unavailable. Run capture in a terminal to choose bundled Chromium.');
      if (!await confirmBundledBrowser(terminal, cancellation.signal)) return;
      context = await chromium.launchPersistentContext(settings.profile, { headless: false });
    }
    if (stopped) return;
    context.once('close', () => terminal.close());
    await captureSession(context, commands, saveSnapshot, console.log);
  } finally {
    terminal.close();
    try { await context?.close(); }
    finally {
      process.removeListener('SIGINT', stop);
      process.removeListener('SIGTERM', stop);
      release();
    }
  }
}
