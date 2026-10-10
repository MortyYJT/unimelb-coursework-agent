import type { Task } from './schemas.js';

/** Tasks supplied by the caller belong to the module being measured. */
export function moduleProgress(tasks: readonly Task[]): number {
  let total = 0;
  let completed = 0;
  for (const task of tasks) {
    if (task.repeat !== undefined) continue;
    for (const step of task.steps) {
      total += 1;
      if (step.done) completed += 1;
    }
  }
  return total === 0 ? 0 : completed / total;
}
