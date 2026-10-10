import { expect, it, vi } from 'vitest';
import { PassThrough } from 'node:stream';
import { createInterface } from 'node:readline/promises';
import { activePage, captureSession, launchSettings, prepareCommands, confirmBundledBrowser } from '../../src/capture/session.js';

async function* commands(...lines: string[]) { yield* lines; }
function fakePage(focused = false) {
  return { isClosed: () => false, evaluate: vi.fn(async () => focused) };
}
it('start capture explains manual sign-in and uses the headed persistent profile', () => {
  expect(launchSettings('/synthetic/home')).toEqual({
    profile: '/synthetic/home/profiles/default', options: { headless: false, channel: 'chrome' },
  });
});
it('s saves the focused tab, q closes the context, and no form APIs are needed', async () => {
  const first = fakePage(true); const last = fakePage();
  const context = { pages: () => [first, last], close: vi.fn(async () => {}) };
  const save = vi.fn(async () => '/synthetic/snapshot');
  const log = vi.fn();
  await captureSession(context, commands('s', 'q', 's'), save, log);
  expect(save).toHaveBeenCalledExactlyOnceWith(first);
  expect(log.mock.calls.flat().join(' ')).toMatch(/sign in.*s.*q/i);
  expect(context.close).toHaveBeenCalledOnce();
});
it('falls back to the most recent tab when terminal focus leaves all pages unfocused', async () => {
  const first = fakePage(); const last = fakePage();
  expect(await activePage({ pages: () => [first, last] })).toBe(last);
});
it('keeps the session available after a save fails and closes on terminal EOF', async () => {
  const context = { pages: () => [fakePage()], close: vi.fn(async () => {}) };
  const save = vi.fn().mockRejectedValueOnce(new Error('synthetic failure')).mockResolvedValueOnce('/synthetic/snapshot');
  const log = vi.fn();
  await captureSession(context, commands('s', 's'), save, log);
  expect(save).toHaveBeenCalledTimes(2);
  expect(log).toHaveBeenCalledWith('Unable to save this page; try again after it finishes loading.');
  expect(context.close).toHaveBeenCalledOnce();
});
it('reports no open page without trying to save', async () => {
  const save = vi.fn(); const log = vi.fn();
  await captureSession({ pages: () => [], close: async () => {} }, commands('s', 'q'), save, log);
  expect(save).not.toHaveBeenCalled();
  expect(log).toHaveBeenCalledWith('No open page to save.');
});
it('selects the visible tab when Chrome loses focus to the terminal', async () => {
  const selected = { isClosed: () => false, evaluate: vi.fn(async (expression: string) => expression.includes('visibilityState')) };
  const background = fakePage();
  expect(await activePage({ pages: () => [selected, background] })).toBe(selected);
});
it('closes the browser even when terminal input fails', async () => {
  const context = { pages: () => [], close: vi.fn(async () => {}) };
  async function* failingCommands(): AsyncIterable<string> { throw new Error('terminal closed unexpectedly'); }
  await expect(captureSession(context, failingCommands(), vi.fn(), vi.fn())).rejects.toThrow('terminal closed unexpectedly');
  expect(context.close).toHaveBeenCalledOnce();
});

it('remembers terminal EOF that occurs before the browser is ready', async () => {
  const input = new PassThrough();
  const terminal = createInterface({ input });
  const commands = prepareCommands(terminal);
  terminal.close();
  const context = { pages: () => [], close: vi.fn(async () => {}) };
  await captureSession(context, commands, vi.fn(), vi.fn());
  expect(context.close).toHaveBeenCalledOnce();
  input.destroy();
});

it('fallback asks first and accepts only an explicit affirmative answer', async () => {
  const question = vi.fn().mockResolvedValueOnce('no').mockResolvedValueOnce('yes');
  const signal = new AbortController().signal;
  expect(await confirmBundledBrowser({ question }, signal)).toBe(false);
  expect(await confirmBundledBrowser({ question }, signal)).toBe(true);
  expect(question).toHaveBeenCalledTimes(2);
});
it('cancels a pending fallback question when the terminal closes', async () => {
  const input = new PassThrough(); const output = new PassThrough();
  const terminal = createInterface({ input, output });
  const controller = new AbortController();
  const answer = confirmBundledBrowser(terminal, controller.signal);
  terminal.close(); controller.abort();
  expect(await answer).toBe(false);
  input.destroy(); output.destroy();
});
