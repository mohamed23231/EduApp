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

import type { Student } from '../../types/student.types';
import { render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import * as fc from 'fast-check';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useAttendanceStats, useStudents } from '../../hooks';
import { StudentListScreen } from '../student-list-screen';

// The list screen renders a virtualized FlatList of (now heavier) StudentCards.
// In the headless renderer FlatList only mounts its initial window, so larger
// generated arrays would drop names. Swap FlatList for an eager, non-virtualizing
// stub so the "every student renders" property is exercised fully — on device the
// remaining rows render on scroll, which is correct.
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const ReactLib = require('react');
  function EagerFlatList(props: {
    data?: unknown[];
    renderItem: (info: { item: unknown; index: number }) => React.ReactNode;
    keyExtractor?: (item: unknown, index: number) => string;
    ListHeaderComponent?: React.ReactNode;
    ListEmptyComponent?: React.ReactNode;
  }) {
    const { data = [], renderItem, keyExtractor, ListHeaderComponent, ListEmptyComponent } = props;
    const children: React.ReactNode[] = [];
    if (ListHeaderComponent)
      children.push(ReactLib.createElement(ReactLib.Fragment, { key: 'header' }, ListHeaderComponent));
    if (data.length === 0 && ListEmptyComponent)
      children.push(ReactLib.createElement(ReactLib.Fragment, { key: 'empty' }, ListEmptyComponent));
    data.forEach((item, index) => {
      const k = keyExtractor ? keyExtractor(item, index) : `row-${index}`;
      children.push(ReactLib.createElement(ReactLib.Fragment, { key: k }, renderItem({ item, index })));
    });
    return ReactLib.createElement(RN.View, null, children);
  }
  return new Proxy(RN, {
    get(target, prop) {
      if (prop === 'FlatList')
        return EagerFlatList;
      return Reflect.get(target, prop);
    },
  });
});

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
  gradeLevel: fc.option(
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Render the list for a generated student array, then run `assert` against the
 * rendered tree. Always unmounts afterwards so render trees don't accumulate
 * across the 100 property iterations (the heavier StudentCard otherwise
 * exhausts the heap).
 */
function withRenderedStudents(students: Student[], assert: () => void): void {
  (useStudents as jest.Mock).mockReturnValue({
    data: students,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  });

  const view = render(<StudentListScreen />);
  try {
    assert();
  }
  finally {
    view.unmount();
  }
}

/** Each student's card is rendered at least once (keyed by accessibilityLabel). */
function assertEveryNamePresent(students: Student[]): void {
  for (const student of students) {
    expect(screen.queryAllByLabelText(student.fullName).length).toBeGreaterThan(0);
  }
}

/** Rendered card count per name matches the frequency of that name in the input. */
function assertNameFrequencyMatches(students: Student[]): void {
  const nameFrequency = new Map<string, number>();
  students.forEach((student) => {
    nameFrequency.set(student.fullName, (nameFrequency.get(student.fullName) ?? 0) + 1);
  });

  for (const [name, count] of nameFrequency.entries()) {
    expect(screen.queryAllByLabelText(name).length).toBe(count);
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('studentListScreen - Property 8: Student List Rendering Completeness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useTranslation as jest.Mock).mockReturnValue({ t: mockT });
    (useAttendanceStats as jest.Mock).mockReturnValue({
      data: { attendanceRate: 92 },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  // Each StudentCard now shows a Monogram of the student's initials, so the raw
  // name string can appear twice in the tree (name + matching initials). The
  // per-student identity contract is the card's accessibilityLabel (== fullName),
  // so queries target that label rather than incidental text nodes.
  it('should render every student name in a non-empty student array', () => {
    fc.assert(
      fc.property(nonEmptyStudentArrayArbitrary, (students: Student[]) => {
        withRenderedStudents(students, () => assertEveryNamePresent(students));
      }),
      { numRuns: 100 },
    );
  });

  it('should render exactly as many student items as in the input array', () => {
    fc.assert(
      fc.property(nonEmptyStudentArrayArbitrary, (students: Student[]) => {
        withRenderedStudents(students, () => assertNameFrequencyMatches(students));
      }),
      { numRuns: 100 },
    );
  });

  it('should render all student names even when gradeLevel is missing or present', () => {
    fc.assert(
      fc.property(nonEmptyStudentArrayArbitrary, (students: Student[]) => {
        // Names remain the stable UI contract regardless of optional fields
        withRenderedStudents(students, () => assertEveryNamePresent(students));
      }),
      { numRuns: 100 },
    );
  });

  it('should render duplicate names according to their frequency', () => {
    fc.assert(
      fc.property(nonEmptyStudentArrayArbitrary, (students: Student[]) => {
        withRenderedStudents(students, () => assertNameFrequencyMatches(students));
      }),
      { numRuns: 100 },
    );
  });
});
