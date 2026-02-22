// Feature: auth-baseline-parent-mvp, Property 8: Student List Rendering Completeness
/**
 * Property 8: Student List Rendering Completeness
 *
 * For any non-empty array of Student objects returned by the API, the parent dashboard
 * and student list screens SHALL render every student's name. The count of rendered
 * student items SHALL equal the length of the input array.
 *
 * This property test generates random non-empty arrays of Student objects and verifies:
 * 1. Every student's name is rendered in the list
 * 2. The count of rendered items equals the array length
 * 3. No students are missing or duplicated
 *
 * Validates: Requirements 8.3, 10.1
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as fc from 'fast-check';
import { StudentListScreen } from '../student-list-screen';
import { useStudents } from '../../hooks';
import type { Student } from '../../types/student.types';

// Mock dependencies
jest.mock('expo-router');
jest.mock('react-i18next');
jest.mock('../../hooks');
jest.mock('../../services/error-utils', () => ({
    extractErrorMessage: jest.fn((_error, _t) => 'Test error message'),
}));

const mockRouter = {
    push: jest.fn(),
};

const mockT = (key: string) => key;

// ─── Arbitraries ────────────────────────────────────────────────────────────

/**
 * Generate a random Student object
 */
const studentArbitrary = fc.record({
    id: fc.uuid(),
    fullName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    schoolName: fc.option(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        { nil: undefined },
    ),
});

/**
 * Generate a non-empty array of Student objects
 */
const nonEmptyStudentArrayArbitrary = fc.uniqueArray(studentArbitrary, {
    minLength: 1,
    maxLength: 20,
    selector: student => student.id,
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('StudentListScreen - Property 8: Student List Rendering Completeness', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useTranslation as jest.Mock).mockReturnValue({ t: mockT });
    });

    it('should render every student name in a non-empty student array', () => {
        fc.assert(
            fc.property(nonEmptyStudentArrayArbitrary, (students: Student[]) => {
                (useStudents as jest.Mock).mockReturnValue({
                    data: students,
                    isLoading: false,
                    error: null,
                    refetch: jest.fn(),
                });

                render(<StudentListScreen />);

                // Verify every student's name is rendered at least once
                for (const student of students) {
                    expect(screen.queryAllByText(student.fullName).length).toBeGreaterThan(0);
                }
            }),
            { numRuns: 100 },
        );
    });

    it('should render exactly as many student items as in the input array', () => {
        fc.assert(
            fc.property(nonEmptyStudentArrayArbitrary, (students: Student[]) => {
                (useStudents as jest.Mock).mockReturnValue({
                    data: students,
                    isLoading: false,
                    error: null,
                    refetch: jest.fn(),
                });

                render(<StudentListScreen />);

                const nameFrequency = new Map<string, number>();
                students.forEach((student) => {
                    nameFrequency.set(student.fullName, (nameFrequency.get(student.fullName) ?? 0) + 1);
                });

                for (const [name, count] of nameFrequency.entries()) {
                    expect(screen.queryAllByText(name).length).toBe(count);
                }
            }),
            { numRuns: 100 },
        );
    });

    it('should render school names when available for all students', () => {
        fc.assert(
            fc.property(nonEmptyStudentArrayArbitrary, (students: Student[]) => {
                (useStudents as jest.Mock).mockReturnValue({
                    data: students,
                    isLoading: false,
                    error: null,
                    refetch: jest.fn(),
                });

                render(<StudentListScreen />);

                // Verify school names are rendered when available
                for (const student of students) {
                    if (student.schoolName) {
                        expect(screen.queryAllByText(student.schoolName).length).toBeGreaterThan(0);
                    }
                }
            }),
            { numRuns: 100 },
        );
    });

    it('should render duplicate names according to their frequency', () => {
        fc.assert(
            fc.property(nonEmptyStudentArrayArbitrary, (students: Student[]) => {
                (useStudents as jest.Mock).mockReturnValue({
                    data: students,
                    isLoading: false,
                    error: null,
                    refetch: jest.fn(),
                });

                render(<StudentListScreen />);

                const nameFrequency = new Map<string, number>();
                students.forEach((student) => {
                    nameFrequency.set(student.fullName, (nameFrequency.get(student.fullName) ?? 0) + 1);
                });

                for (const [name, count] of nameFrequency.entries()) {
                    expect(screen.queryAllByText(name).length).toBe(count);
                }
            }),
            { numRuns: 100 },
        );
    });
});
