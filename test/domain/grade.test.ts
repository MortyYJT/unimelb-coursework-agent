import { describe, expect, it } from 'vitest';
import { projectGrade } from '../../src/domain/grade.js';
import type { Assessment, Course } from '../../src/domain/schemas.js';

const course: Course = { id: 'course-1', moduleId: 'module-1', code: 'COMP90099', name: 'Fictional computing', term: '2026-S1', assessmentsComplete: true };
function item(id: string, weight: number, score?: number, isFinal = false, hurdleMin?: number): Assessment {
  return { id, courseId: course.id, name: `Fictional ${id}`, kind: isFinal ? 'exam' : 'assignment', weight, score, isFinal, hurdleMin, status: score === undefined ? 'not_started' : 'graded' };
}
const assessments = [item('a', 10, 82), item('b', 15, 88), item('c', 10, 74), item('d', 25), item('final', 40, undefined, true)];

it('leaves grade projection for the human to implement', () => {
  expect(() => projectGrade(course, assessments, 'H1')).toThrow('TODO(human)');
});

// Enable these executable specification tests when the human implements the body.
describe.skip('grade projection scenarios (human implementation pending)', () => {
  it('needed final score', () => {
    const result = projectGrade(course, assessments, 'H1');
    expect(result.gradedWeight).toBe(35);
    expect(result.earned).toBeCloseTo(28.8, 1);
    expect(result.currentAverage).toBeCloseTo(82.29, 2);
    expect(result.need.status).toBe('score');
    if (result.need.status === 'score') {
      expect(result.need.value).toBeCloseTo(76.6, 1);
      expect(result.need.setByHurdle).toBe(false);
    }
  });
  it('hurdle sets the floor', () => {
    const result = projectGrade(course, [assessments[0]!, assessments[1]!, assessments[2]!, item('d', 25, 60), item('final', 40, undefined, true, 40)], 'P');
    expect(result.need).toEqual({ status: 'score', value: 40, setByHurdle: true });
  });
  it('out of reach and secured', () => {
    expect(projectGrade(course, [item('a', 60, 0), item('final', 40, undefined, true)], 'H1').need).toEqual({ status: 'unreachable' });
    expect(projectGrade(course, [item('a', 80, 90), item('final', 20, undefined, true)], 'P').need).toEqual({ status: 'secured' });
  });
  it('hurdle beats secured', () => {
    expect(projectGrade(course, [item('a', 80, 90), item('final', 20, undefined, true, 50)], 'P').need).toEqual({ status: 'score', value: 50, setByHurdle: true });
  });
  it('nothing graded yet', () => {
    const result = projectGrade(course, [item('a', 60), item('final', 40, undefined, true)], 'H1');
    expect(result.currentAverage).toBeNull();
    expect(result.need).toEqual({ status: 'unavailable', reason: 'nothing_graded' });
  });
  it('no final or final already graded', () => {
    expect(projectGrade(course, [item('a', 100, 80)], 'H1').need).toEqual({ status: 'unavailable', reason: 'no_final' });
    expect(projectGrade(course, [item('a', 60, 80), item('final', 40, 70, true)], 'H1').need).toEqual({ status: 'unavailable', reason: 'final_graded' });
  });
  it('several unavailable reasons: nothing graded takes precedence', () => {
    expect(projectGrade(course, [item('a', 100)], 'H1').need).toEqual({ status: 'unavailable', reason: 'nothing_graded' });
  });
});
