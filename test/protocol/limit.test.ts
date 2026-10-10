import { expect, it } from 'vitest';
import { CourseworkError } from '../../src/protocol/errors.js';
import { fail, ok, run } from '../../src/protocol/envelope.js';

const limit = 64 * 1024;
const bytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value), 'utf8');

it('70 KiB of data becomes a bounded LIMIT_EXCEEDED failure with a narrowing hint', async () => {
  const data = 'x'.repeat(70 * 1024);
  for (const envelope of [ok('list', data), await run('list', () => data)]) {
    expect(envelope).toMatchObject({ ok: false, command: 'list',
      error: { code: 'LIMIT_EXCEEDED', retryable: false, next: 'Narrow the request and try again.' } });
    expect(envelope).not.toHaveProperty('data');
    expect(bytes(envelope)).toBeLessThanOrEqual(limit);
  }
});

it('allows exactly 64 KiB and rejects one more byte including envelope overhead', () => {
  const length = limit - bytes(ok('list', ''));
  const exact = ok('list', 'x'.repeat(length));
  expect(exact.ok).toBe(true);
  expect(bytes(exact)).toBe(limit);
  expect(ok('list', 'x'.repeat(length + 1))).toMatchObject({
    ok: false, error: { code: 'LIMIT_EXCEEDED' },
  });
});

it('counts UTF-8 bytes and JSON escaping rather than source character count', () => {
  for (const data of ['界'.repeat(23 * 1024), '\n'.repeat(33 * 1024)]) {
    expect(data.length).toBeLessThan(limit);
    expect(ok('list', data)).toMatchObject({ ok: false, error: { code: 'LIMIT_EXCEEDED' } });
  }
});

it('bounds oversized error messages, hints and command names too', async () => {
  const large = 'x'.repeat(70 * 1024);
  for (const envelope of [fail('get', 'NOT_FOUND', large),
    fail('get', 'NOT_FOUND', 'Missing.', large), ok(large, null),
    await run('get', () => { throw new CourseworkError('NOT_FOUND', large); })]) {
    expect(envelope).toMatchObject({ ok: false, error: { code: 'LIMIT_EXCEEDED' } });
    expect(bytes(envelope)).toBeLessThanOrEqual(limit);
  }
});

it('serialization failures become scrubbed INTERNAL envelopes without throwing', async () => {
  const circular: { self?: unknown } = {};
  circular.self = circular;
  const throws = { toJSON() { throw new Error('synthetic-secret'); } };
  for (const data of [circular, 1n, throws]) {
    for (const envelope of [ok('list', data), await run('list', () => data)]) {
      expect(envelope).toMatchObject({ ok: false,
        error: { code: 'INTERNAL', message: 'An unexpected error occurred.' } });
      expect(bytes(envelope)).toBeLessThanOrEqual(limit);
    }
  }
});

it('keeps a data field after JSON serialization for commands returning undefined', async () => {
  for (const envelope of [ok('list', undefined), await run('list', () => undefined)]) {
    expect(JSON.parse(JSON.stringify(envelope))).toMatchObject({ ok: true, data: null });
  }
});

it('includes the required null data field in the size bound', () => {
  const length = limit - bytes(ok('', undefined));
  expect(bytes(ok('x'.repeat(length), undefined))).toBe(limit);
  expect(ok('x'.repeat(length + 1), undefined)).toMatchObject({
    ok: false, error: { code: 'LIMIT_EXCEEDED' },
  });
});

it('materializes toJSON once so later serialization cannot bypass the bound', () => {
  let calls = 0;
  const data = { toJSON() { return ++calls === 1 ? 'small' : 'x'.repeat(70 * 1024); } };
  const envelope = ok('list', data);
  expect(bytes(envelope)).toBeLessThanOrEqual(limit);
  expect(bytes(envelope)).toBeLessThanOrEqual(limit);
  expect(calls).toBe(1);
});
