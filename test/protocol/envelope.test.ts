import { expect, it } from 'vitest';
import { CourseworkError } from '../../src/protocol/errors.js';
import { fail, ok, run } from '../../src/protocol/envelope.js';

it('success envelope has data, a runId and no error', () => {
  const envelope = ok('list', { items: [] });
  expect(envelope).toMatchObject({ protocol: 'coursework.agent/v1', ok: true,
    command: 'list', data: { items: [] }, meta: { durationMs: 0 } });
  expect(envelope).not.toHaveProperty('error');
  expect(envelope.meta.runId).toMatch(/^[0-9a-f-]{36}$/);
  expect(ok('list', null).meta.runId).not.toBe(envelope.meta.runId);
});

it('failure envelope has a known error and no data', () => {
  const envelope = fail('get', 'NOT_FOUND', 'Missing.');
  expect(envelope).toMatchObject({ protocol: 'coursework.agent/v1', ok: false,
    command: 'get', error: { code: 'NOT_FOUND', message: 'Missing.', retryable: false } });
  expect(envelope).not.toHaveProperty('data');
  expect(envelope.meta.runId).toBeTruthy();
});

it('unknown envelope codes fail the TypeScript build', () => {
  if (false) {
    // @ts-expect-error Only the spec's error codes are accepted.
    fail('get', 'UNKNOWN', 'Invalid code.');
  }
});

it('run maps a typed NOT_FOUND error and preserves its hint', async () => {
  const envelope = await run('get', () => {
    throw new CourseworkError('NOT_FOUND', 'Missing.', 'Check the id.');
  });
  expect(envelope).toMatchObject({ ok: false, error: {
    code: 'NOT_FOUND', message: 'Missing.', retryable: false, next: 'Check the id.',
  } });
  expect(envelope).not.toHaveProperty('data');
});

it('expired login envelope asks the user to sign in', async () => {
  expect(fail('sync', 'AUTH_EXPIRED', 'Session expired.')).toMatchObject({
    error: { retryable: false, next: 'Ask the user to sign in again.' },
  });
  expect(await run('sync', async () => {
    throw new CourseworkError('AUTH_EXPIRED', 'Session expired.');
  })).toMatchObject({ error: { code: 'AUTH_EXPIRED',
    retryable: false, next: 'Ask the user to sign in again.' } });
  for (const next of ['', 'Sign in automatically.']) {
    expect(fail('sync', 'AUTH_EXPIRED', 'Session expired.', next)).toMatchObject({
      error: { next: 'Ask the user to sign in again.' },
    });
  }
});

it('unexpected thrown errors expose no file paths, stack traces or secrets', async () => {
  const message = '/private/example/config.json C:\\private\\config.json secret=synthetic-secret';
  for (const thrown of [new Error(message), message, { code: 'NOT_FOUND', message }, null]) {
    const envelope = await run('sync', () => { throw thrown; });
    expect(envelope).toMatchObject({ ok: false,
      error: { code: 'INTERNAL', message: 'An unexpected error occurred.', retryable: false } });
    expect(JSON.stringify(envelope)).not.toContain(message);
    expect(envelope).not.toHaveProperty('error.stack');
  }
});

it('run awaits asynchronous work and measures its duration', async () => {
  const envelope = await run('list', async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return { count: 1 };
  });
  expect(envelope).toMatchObject({ ok: true, data: { count: 1 } });
  expect(envelope.meta.durationMs).toBeGreaterThanOrEqual(5);
  expect(Number.isFinite(envelope.meta.durationMs)).toBe(true);
  expect(envelope.meta.runId).toBeTruthy();
  expect(await run('list', () => 42)).toMatchObject({ ok: true, data: 42 });
});
