import { describe, expect, test } from '@jest/globals';
import fc from 'fast-check';
import { linkStudentSchema } from '../../validators/link-student.schema';

// Feature: auth-baseline-parent-mvp, Property 9: Access Code Validation

describe('LinkStudentScreen Property Tests', () => {
  test('whitespace-only access codes are invalid, non-empty trimmed codes are valid', () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        const result = linkStudentSchema.safeParse({ accessCode: value });
        const expected = value.trim().length > 0;
        expect(result.success).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });
});
