/**
 * Unit tests for localization strings
 * Verifies EN and AR strings exist for all new feature keys
 * Validates: Requirements 18.7
 */

import en from '../translations/en.json';
import ar from '../translations/ar.json';

// Helper to get nested value by dot-path
function get(obj: any, path: string): unknown {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

const REQUIRED_KEYS = [
    // Notification keys (backend localization)
    'parent.notifications.absence.title',
    'parent.notifications.absence.body',

    // Rating UI keys
    'teacher.attendance.rating',
    'teacher.attendance.noRating',
    'teacher.attendance.ratingLabel',

    // Ranking keys
    'teacher.rankings.topStudents',
    'teacher.rankings.ranking',
    'teacher.rankings.averageRating',
    'teacher.rankings.ratedSessions',
    'teacher.rankings.insufficientData',
    'teacher.rankings.insufficientDataDescription',
    'teacher.rankings.noRatings',
    'teacher.rankings.trend.up',
    'teacher.rankings.trend.down',
    'teacher.rankings.trend.stable',
    'teacher.rankings.filterLast5',
    'teacher.rankings.filterLast10',
    'teacher.rankings.filterAll',

    // Teacher performance keys
    'teacher.performance.studentPerformance',
    'teacher.performance.average',
    'teacher.performance.highest',
    'teacher.performance.lowest',
    'teacher.performance.ratedCount',
    'teacher.performance.noRatingLabel',
    'teacher.performance.emptyState',
    'teacher.performance.emptyStateHint',

    // Parent performance keys
    'parent.performance.title',
    'parent.performance.average',
    'parent.performance.highest',
    'parent.performance.lowest',
    'parent.performance.ratedCount',
    'parent.performance.noRating',
    'parent.performance.emptyState',
    'parent.performance.emptyStateHint',
    'parent.performance.lowScoreNote',
];

describe('Localization strings', () => {
    describe('EN translations', () => {
        REQUIRED_KEYS.forEach((key) => {
            it(`should have key: ${key}`, () => {
                const value = get(en, key);
                expect(value).toBeDefined();
                expect(typeof value).toBe('string');
                expect((value as string).length).toBeGreaterThan(0);
            });
        });
    });

    describe('AR translations', () => {
        REQUIRED_KEYS.forEach((key) => {
            it(`should have key: ${key}`, () => {
                const value = get(ar, key);
                expect(value).toBeDefined();
                expect(typeof value).toBe('string');
                expect((value as string).length).toBeGreaterThan(0);
            });
        });
    });

    describe('ratingLabel interpolation', () => {
        it('EN ratingLabel should contain {{value}} placeholder', () => {
            expect(en.teacher.attendance.ratingLabel).toContain('{{value}}');
        });

        it('AR ratingLabel should contain {{value}} placeholder', () => {
            expect((ar as any).teacher.attendance.ratingLabel).toContain('{{value}}');
        });
    });

    describe('notification body interpolation', () => {
        it('EN absence body should contain {{studentName}} and {{sessionDate}}', () => {
            expect(en.parent.notifications.absence.body).toContain('{{studentName}}');
            expect(en.parent.notifications.absence.body).toContain('{{sessionDate}}');
        });

        it('AR absence body should contain {{studentName}} and {{sessionDate}}', () => {
            expect(ar.parent.notifications.absence.body).toContain('{{studentName}}');
            expect(ar.parent.notifications.absence.body).toContain('{{sessionDate}}');
        });
    });
});
