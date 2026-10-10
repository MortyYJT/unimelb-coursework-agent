import { describe, expect, it } from 'vitest';
import { CourseAssessmentsSchema, validateCourseAssessments } from '../../src/domain/course.js';

const course = { id: 'course-1', moduleId: 'module-1', code: 'COMP90099', name: 'Fictional computing', term: '2026-S1', assessmentsComplete: true };
const assessment = { id: 'assessment-1', courseId: course.id, name: 'Fictional assignment', kind: 'assignment' as const, weight: 40, isFinal: false, status: 'not_started' as const };
const final = { ...assessment, id: 'final-1', kind: 'exam' as const, weight: 60, isFinal: true };

describe('course assessment invariants', () => {
  it('course weights do not add up: message names the course and sum', () => {
    const result = CourseAssessmentsSchema.safeParse({ course, assessments: [assessment, { ...final, weight: 55 }] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('COMP90099');
      expect(result.error.message).toContain('95');
    }
  });
  it('two finals are rejected even for an incomplete list', () => {
    expect(() => validateCourseAssessments({ ...course, assessmentsComplete: false }, [{ ...assessment, isFinal: true }, final])).toThrow();
  });
  it('accepts a complete list and permits incomplete weights', () => {
    expect(() => validateCourseAssessments(course, [assessment, final])).not.toThrow();
    expect(() => validateCourseAssessments({ ...course, assessmentsComplete: false }, [assessment])).not.toThrow();
  });
  it('accepts decimal weights without binary floating point false failures', () => {
    const weights = [33.3, 33.3, 33.3, 0.1];
    expect(() => validateCourseAssessments(course, weights.map((weight, i) => ({ ...assessment, id: `decimal-${i}`, weight })))).not.toThrow();
  });
  it('rejects assessments belonging to another course', () => {
    expect(() => validateCourseAssessments(course, [{ ...assessment, courseId: 'other-course', weight: 100 }])).toThrow();
  });
  it('empty complete list is rejected; empty incomplete list is accepted', () => {
    expect(() => validateCourseAssessments(course, [])).toThrow();
    expect(() => validateCourseAssessments({ ...course, assessmentsComplete: false }, [])).not.toThrow();
  });
});
