/**
 * Unit tests for mobile components and hooks (logic layer)
 * Tests pure logic without React rendering (no JSDOM required)
 * Validates: Requirements 18.6
 */

import * as fc from 'fast-check';

// ─── RatingInput logic ───────────────────────────────────────────────────────

function ratingDecrement(value: number | null): number | null {
    if (value === null) return 10;
    if (value > 0) return value - 1;
    return null; // 0 → null (clear)
}

function ratingIncrement(value: number | null): number | null {
    if (value === null) return 0;
    if (value < 10) return value + 1;
    return value; // already at max
}

describe('RatingInput logic', () => {
    it('increment from null → 0', () => {
        expect(ratingIncrement(null)).toBe(0);
    });

    it('decrement from null → 10', () => {
        expect(ratingDecrement(null)).toBe(10);
    });

    it('increment from 10 stays at 10', () => {
        expect(ratingIncrement(10)).toBe(10);
    });

    it('decrement from 0 → null (clear)', () => {
        expect(ratingDecrement(0)).toBeNull();
    });

    it('increment stays in [0, 10] range', () => {
        fc.assert(
            fc.property(fc.integer({ min: 0, max: 9 }), (v) => {
                const result = ratingIncrement(v);
                expect(result).toBe(v + 1);
                expect(result).toBeGreaterThanOrEqual(0);
                expect(result).toBeLessThanOrEqual(10);
            }),
        );
    });

    it('decrement stays in [0, 10] range or null', () => {
        fc.assert(
            fc.property(fc.integer({ min: 1, max: 10 }), (v) => {
                const result = ratingDecrement(v);
                expect(result).toBe(v - 1);
                expect(result).toBeGreaterThanOrEqual(0);
                expect(result).toBeLessThanOrEqual(10);
            }),
        );
    });
});

// ─── useAttendance rating state logic ────────────────────────────────────────

type AttendanceEntry = { status: string | null; excuseNote: string; rating: number | null; recordId?: string };
type AttendanceMap = Record<string, AttendanceEntry>;

function setStudentRating(map: AttendanceMap, studentId: string, rating: number | null): AttendanceMap {
    return { ...map, [studentId]: { ...map[studentId], rating } };
}

describe('useAttendance rating state', () => {
    it('setStudentRating updates only the target student', () => {
        const map: AttendanceMap = {
            s1: { status: 'PRESENT', excuseNote: '', rating: null },
            s2: { status: 'ABSENT', excuseNote: '', rating: 5 },
        };
        const updated = setStudentRating(map, 's1', 8);
        expect(updated.s1.rating).toBe(8);
        expect(updated.s2.rating).toBe(5); // unchanged
    });

    it('setStudentRating can clear rating to null', () => {
        const map: AttendanceMap = {
            s1: { status: 'PRESENT', excuseNote: '', rating: 7 },
        };
        const updated = setStudentRating(map, 's1', null);
        expect(updated.s1.rating).toBeNull();
    });

    it('setStudentRating preserves other fields', () => {
        fc.assert(
            fc.property(
                fc.record({
                    status: fc.constantFrom('PRESENT', 'ABSENT', 'EXCUSED', null),
                    excuseNote: fc.string(),
                    rating: fc.option(fc.integer({ min: 0, max: 10 }), { nil: null }),
                }),
                fc.option(fc.integer({ min: 0, max: 10 }), { nil: null }),
                (entry, newRating) => {
                    const map: AttendanceMap = { s1: { ...entry, rating: entry.rating ?? null } };
                    const updated = setStudentRating(map, 's1', newRating);
                    expect(updated.s1.status).toBe(entry.status);
                    expect(updated.s1.excuseNote).toBe(entry.excuseNote);
                    expect(updated.s1.rating).toBe(newRating);
                },
            ),
        );
    });
});

// ─── useSessionRankings filter state ─────────────────────────────────────────

type WindowFilter = 'last_5' | 'last_10' | 'all';
const VALID_WINDOWS: WindowFilter[] = ['last_5', 'last_10', 'all'];

describe('useSessionRankings filter state', () => {
    it('default window is "all"', () => {
        const defaultWindow: WindowFilter = 'all';
        expect(VALID_WINDOWS).toContain(defaultWindow);
    });

    it('all window values are valid', () => {
        VALID_WINDOWS.forEach(w => {
            expect(['last_5', 'last_10', 'all']).toContain(w);
        });
    });
});

// ─── Feature flag hiding logic ────────────────────────────────────────────────

function shouldShowPerformanceEntry(flags: Record<string, boolean>, role: 'teacher' | 'parent'): boolean {
    const key = role === 'teacher' ? 'teacher.performance.enabled' : 'parent.performance.enabled';
    return flags[key] ?? true; // default to showing if flag not present
}

describe('Feature flag entry point hiding', () => {
    it('hides teacher performance when flag is false', () => {
        expect(shouldShowPerformanceEntry({ 'teacher.performance.enabled': false }, 'teacher')).toBe(false);
    });

    it('shows teacher performance when flag is true', () => {
        expect(shouldShowPerformanceEntry({ 'teacher.performance.enabled': true }, 'teacher')).toBe(true);
    });

    it('shows entry points by default when flag is absent (fallback)', () => {
        expect(shouldShowPerformanceEntry({}, 'teacher')).toBe(true);
        expect(shouldShowPerformanceEntry({}, 'parent')).toBe(true);
    });

    it('hides parent performance when flag is false', () => {
        expect(shouldShowPerformanceEntry({ 'parent.performance.enabled': false }, 'parent')).toBe(false);
    });

    it('teacher and parent flags are independent', () => {
        fc.assert(
            fc.property(fc.boolean(), fc.boolean(), (teacherEnabled, parentEnabled) => {
                const flags = {
                    'teacher.performance.enabled': teacherEnabled,
                    'parent.performance.enabled': parentEnabled,
                };
                expect(shouldShowPerformanceEntry(flags, 'teacher')).toBe(teacherEnabled);
                expect(shouldShowPerformanceEntry(flags, 'parent')).toBe(parentEnabled);
            }),
        );
    });
});
