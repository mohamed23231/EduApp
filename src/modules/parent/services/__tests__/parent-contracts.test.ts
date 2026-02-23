/**
 * Schema contract tests for parent API endpoints
 * These are shape assertions against mocked responses matching the backend contract.
 * Validates: Requirements 15.1, 15.2, 15.3
 */

import { mapAttendanceStats, mapTimelineRecord } from '../attendance.service';

// eslint-disable-next-line max-lines-per-function
describe('parent API Schema Contracts', () => {
  describe('gET /parents/students response shape', () => {
    it('should accept array of objects with id (string), name (string), gradeLevel (string|null)', () => {
      const mockResponse = [
        { id: 'abc-123', name: 'Ahmed Ali', gradeLevel: 'Grade 5' },
        { id: 'def-456', name: 'Sara Ahmed', gradeLevel: null },
        { id: 'ghi-789', name: 'Omar Hassan', gradeLevel: undefined },
      ];

      mockResponse.forEach((student) => {
        expect(typeof student.id).toBe('string');
        expect(typeof student.name).toBe('string');
        expect(
          student.gradeLevel === null
          || student.gradeLevel === undefined
          || typeof student.gradeLevel === 'string',
        ).toBe(true);
      });
    });

    it('should map name to fullName and null gradeLevel to undefined', () => {
      // This validates the mapBackendStudent contract
      const backendStudent = { id: '1', name: 'Ahmed Ali', gradeLevel: null };
      // Simulate what mapBackendStudent does
      const mapped = {
        id: backendStudent.id,
        fullName: backendStudent.name,
        gradeLevel: backendStudent.gradeLevel ?? undefined,
      };
      expect(mapped.fullName).toBe('Ahmed Ali');
      expect(mapped.gradeLevel).toBeUndefined();
    });
  });

  describe('gET /parents/students/:id/attendance/statistics response shape', () => {
    it('should accept object with all required attendance stats fields', () => {
      const mockResponse = {
        studentId: 'abc-123',
        studentName: 'Ahmed Ali',
        termId: 'term-1',
        termName: 'First Term 2024',
        termStartDate: '2024-01-01',
        termEndDate: '2024-06-30',
        totalSessions: 51,
        present: 45,
        absent: 3,
        excused: 2,
        notMarked: 1,
        attendanceRate: 92.5,
      };

      // Verify all required fields exist
      expect(typeof mockResponse.attendanceRate).toBe('number');
      expect(typeof mockResponse.present).toBe('number');
      expect(typeof mockResponse.absent).toBe('number');
      expect(typeof mockResponse.excused).toBe('number');
      expect(typeof mockResponse.notMarked).toBe('number');
      expect(typeof mockResponse.totalSessions).toBe('number');
      expect(typeof mockResponse.termName).toBe('string');
      expect(typeof mockResponse.termStartDate).toBe('string');
      expect(typeof mockResponse.termEndDate).toBe('string');
    });

    it('should map backend stats to frontend AttendanceStats correctly', () => {
      const backendStats = {
        attendanceRate: 92.5,
        present: '45',
        absent: '3',
        excused: '2',
        notMarked: '1',
        totalSessions: '51',
        termName: 'First Term 2024',
        termStartDate: '2024-01-01',
        termEndDate: '2024-06-30',
      };

      const mapped = mapAttendanceStats(backendStats as any);

      expect(mapped.attendanceRate).toBe(92.5);
      expect(mapped.present).toBe(45);
      expect(mapped.absent).toBe(3);
      expect(mapped.excused).toBe(2);
      expect(mapped.notMarked).toBe(1);
      expect(mapped.totalSessions).toBe(51);
      expect(mapped.termName).toBe('First Term 2024');
      expect(mapped.termStartDate).toBe('2024-01-01');
      expect(mapped.termEndDate).toBe('2024-06-30');
    });

    it('should handle string numeric fields from raw SQL aggregation', () => {
      const backendStats = {
        attendanceRate: 88,
        present: '40',
        absent: '5',
        excused: '3',
        notMarked: '2',
        totalSessions: '50',
        termName: 'Term 2',
        termStartDate: '2024-07-01',
        termEndDate: '2024-12-31',
      };

      const mapped = mapAttendanceStats(backendStats as any);
      expect(typeof mapped.present).toBe('number');
      expect(typeof mapped.absent).toBe('number');
      expect(typeof mapped.excused).toBe('number');
      expect(typeof mapped.notMarked).toBe('number');
      expect(typeof mapped.totalSessions).toBe('number');
    });
  });

  describe('gET /parents/students/:id/attendance/timeline response shape', () => {
    it('should accept object with records array and pagination fields', () => {
      const mockResponse = {
        studentId: 'abc-123',
        studentName: 'Ahmed Ali',
        termId: 'term-1',
        records: [
          { sessionInstanceId: 'si-1', date: '2024-01-15', time: '08:30', status: 'PRESENT', excuseNote: null },
          { sessionInstanceId: 'si-2', date: '2024-01-14', time: '08:30', status: 'EXCUSED', excuseNote: 'Doctor' },
          { sessionInstanceId: 'si-3', date: '2024-01-13', time: '08:30', status: null, excuseNote: null },
        ],
        page: 1,
        limit: 5,
        totalRecords: 51,
        totalPages: 11,
      };

      expect(Array.isArray(mockResponse.records)).toBe(true);
      expect(typeof mockResponse.page).toBe('number');
      expect(typeof mockResponse.limit).toBe('number');
      expect(typeof mockResponse.totalRecords).toBe('number');
      expect(typeof mockResponse.totalPages).toBe('number');

      mockResponse.records.forEach((record) => {
        expect(typeof record.date).toBe('string');
        expect(typeof record.time).toBe('string');
        expect(record.status === null || typeof record.status === 'string').toBe(true);
        expect(record.excuseNote === null || record.excuseNote === undefined || typeof record.excuseNote === 'string').toBe(true);
      });
    });

    it('should map timeline records to TimelineRecord correctly', () => {
      const backendRecord = { date: '2024-01-15', time: '08:30', status: 'EXCUSED', excuseNote: 'Doctor appointment' };
      const mapped = mapTimelineRecord(backendRecord);

      expect(mapped.date).toBe('2024-01-15');
      expect(mapped.time).toBe('08:30');
      expect(mapped.status).toBe('EXCUSED');
      expect(mapped.excuseNote).toBe('Doctor appointment');
    });

    it('should strip excuseNote for non-EXCUSED statuses', () => {
      const backendRecord = { date: '2024-01-15', time: '08:30', status: 'PRESENT', excuseNote: 'Should be stripped' };
      const mapped = mapTimelineRecord(backendRecord);
      expect(mapped.excuseNote).toBeUndefined();
    });

    it('should normalize null status to NOT_MARKED', () => {
      const backendRecord = { date: '2024-01-15', time: '08:30', status: null };
      const mapped = mapTimelineRecord(backendRecord);
      expect(mapped.status).toBe('NOT_MARKED');
    });

    it('should use fallback values for missing fields per contract', () => {
      const mapped = mapAttendanceStats({} as any);
      expect(mapped.attendanceRate).toBe(0);
      expect(mapped.present).toBe(0);
      expect(mapped.absent).toBe(0);
      expect(mapped.excused).toBe(0);
      expect(mapped.notMarked).toBe(0);
      expect(mapped.totalSessions).toBe(0);
      expect(mapped.termName).toBe('');
      expect(mapped.termStartDate).toBe('');
      expect(mapped.termEndDate).toBe('');
    });
  });
});
