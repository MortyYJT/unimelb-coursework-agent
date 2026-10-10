import { z } from 'zod';
import type { Assessment, Course } from './schemas.js';

export const GradeBandSchema = z.enum(['H1', 'H2A', 'H2B', 'H3', 'P']);
export type GradeBand = z.infer<typeof GradeBandSchema>;
export const GRADE_BANDS = { H1: 80, H2A: 75, H2B: 70, H3: 65, P: 50 } as const satisfies Record<GradeBand, number>;

export const GradeNeedSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('score'), value: z.number(), setByHurdle: z.boolean() }),
  z.object({ status: z.literal('unreachable') }),
  z.object({ status: z.literal('secured') }),
  z.object({ status: z.literal('unavailable'), reason: z.enum(['nothing_graded', 'no_final', 'final_graded']) }),
]);
export type GradeNeed = z.infer<typeof GradeNeedSchema>;

export const GradeProjectionSchema = z.object({
  gradedWeight: z.number(),
  earned: z.number(),
  currentAverage: z.number().nullable(),
  need: GradeNeedSchema,
});
export type GradeProjection = z.infer<typeof GradeProjectionSchema>;

export function projectGrade(course: Course, assessments: readonly Assessment[], band: GradeBand): GradeProjection {
  throw new Error('TODO(human)');
}
