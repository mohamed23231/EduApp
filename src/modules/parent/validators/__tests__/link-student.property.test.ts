// Feature: auth-baseline-parent-mvp, Property 9: Access Code Validation
/**
 * **Validates: Requirements 9.2**
 *
 * Property 9: Access Code Validation
 *
 * For any string that is empty, composed entirely of whitespace characters,
 * or trims to an empty string, the link student form SHALL reject submission
 * and not call the backend API.
 *
 * For any string that trims to a non-empty value, the form SHALL allow submission.
 */

import { describe, expect, test } from '@jest/globals';
import fc from 'fast-check';
import { linkStudentSchema } from '../link-student.schema';

describe('Property 9: Access Code Validation', () => {
    test('Property 9: Empty, whitespace-only, or trim-to-empty strings are rejected', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(''),
                    fc.string({ minLength: 1, maxLength: 20 }).map((s) => s.replace(/\S/g, ' ')),
                ),
                (accessCode) => {
                    const result = linkStudentSchema.safeParse({ accessCode });

                    // Should fail validation
                    expect(result.success).toBe(false);
                },
            ),
            { numRuns: 100 },
        );
    });

    test('Property 9: Non-empty strings that trim to non-empty are accepted', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
                (accessCode) => {
                    const result = linkStudentSchema.safeParse({ accessCode });

                    // Should pass validation
                    expect(result.success).toBe(true);
                    if (result.success) {
                        // The schema trims the access code
                        expect(result.data.accessCode).toBe(accessCode.trim());
                    }
                },
            ),
            { numRuns: 100 },
        );
    });

    test('Property 9: Whitespace-padded valid codes are trimmed and accepted', () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
                    fc.string({ maxLength: 5 }).map((s) => s.replace(/\S/g, ' ')),
                    fc.string({ maxLength: 5 }).map((s) => s.replace(/\S/g, ' ')),
                ),
                ([code, leadingSpace, trailingSpace]) => {
                    const accessCode = leadingSpace + code + trailingSpace;
                    const result = linkStudentSchema.safeParse({ accessCode });

                    // Should pass validation
                    expect(result.success).toBe(true);
                    if (result.success) {
                        // The schema trims the access code, so it should equal the trimmed version
                        expect(result.data.accessCode).toBe(accessCode.trim());
                    }
                },
            ),
            { numRuns: 100 },
        );
    });

    test('Property 9: Form rejects submission for invalid codes', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(''),
                    fc.constant('   '),
                    fc.constant('\t\t'),
                    fc.constant('\n\n'),
                    fc.string({ minLength: 1, maxLength: 20 }).map((s) => s.replace(/\S/g, ' ')),
                ),
                (accessCode) => {
                    const result = linkStudentSchema.safeParse({ accessCode });

                    // Should fail validation - form should reject submission
                    expect(result.success).toBe(false);
                },
            ),
            { numRuns: 100 },
        );
    });

    test('Property 9: Form allows submission for valid codes', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
                (accessCode) => {
                    const result = linkStudentSchema.safeParse({ accessCode });

                    // Should pass validation - form should allow submission
                    expect(result.success).toBe(true);
                },
            ),
            { numRuns: 100 },
        );
    });
});
