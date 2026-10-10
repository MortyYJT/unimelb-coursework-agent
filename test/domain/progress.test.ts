import { expect, it } from 'vitest';
import { moduleProgress } from '../../src/domain/progress.js';
import type { Task } from '../../src/domain/schemas.js';

function task(id: string, done: boolean[], repeat?: Task['repeat']): Task {
  return { id, moduleId: 'module-1', title: 'Fictional study', source: 'manual', repeat,
    steps: done.map(done => ({ title: 'Read', estimateMinutes: 5, done, citations: [] })) };
}

it('progress of a module counts non-recurring steps, not tasks', () => {
  expect(moduleProgress([task('a', [true, false]), task('b', [true, true, false]), task('daily', [true], 'daily'), task('weekly', [false], 'weekly')])).toBe(3 / 5);
});

it('module with no counted steps returns zero', () => {
  expect(moduleProgress([])).toBe(0);
  expect(moduleProgress([task('daily', [true], 'daily')])).toBe(0);
});

it('all incomplete and all completed steps yield zero and one', () => {
  expect(moduleProgress([task('a', [false])])).toBe(0);
  expect(moduleProgress([task('a', [true, true])])).toBe(1);
});
