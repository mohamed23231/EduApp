import type { ApiSuccess } from '@/shared/types/api';
import { unwrapData } from '@/shared/services/api-utils';
import { mapAttendanceStats, mapTimelineRecord, normalizeAttendanceStatus } from '../attendance.service';

// eslint-disable-next-line max-lines-per-function
describe('attendance.service', () => {
  describe('normalizeAttendanceStatus', () => {
    it('passes through valid PRESENT status', () => {
      expect(normalizeAttendanceStatus('PRESENT')).toBe('PRESENT');
    });
    it('passes through valid ABSENT status', () => {
      expect(normalizeAttendanceStatus('ABSENT')).toBe('ABSENT');
    });
    it('passes through valid EXCUSED status', () => {
      expect(normalizeAttendanceStatus('EXCUSED')).toBe('EXCUSED');
    });
    it('passes through valid NOT_MARKED status', () => {
      expect(normalizeAttendanceStatus('NOT_MARKED')).toBe('NOT_MARKED');
    });
    it('returns NOT_MARKED for null', () => {
      expect(normalizeAttendanceStatus(null)).toBe('NOT_MARKED');
    });
    it('returns NOT_MARKED for undefined', () => {
      expect(normalizeAttendanceStatus(undefined)).toBe('NOT_MARKED');
    });
    it('returns NOT_MARKED for arbitrary string', () => {
      expect(normalizeAttendanceStatus('UNKNOWN')).toBe('NOT_MARKED');
    });
    it('returns NOT_MARKED for empty string', () => {
      expect(normalizeAttendanceStatus('')).toBe('NOT_MARKED');
    });
  });

  describe('mapAttendanceStats', () => {
    it('parses numeric string fields correctly', () => {
      const result = mapAttendanceStats({
        attendanceRate: '92.5',
        present: '45',
        absent: '3',
        excused: '2',
        notMarked: '1',
        totalSessions: '51',
        termName: 'Term 1',
        termStartDate: '2024-01-01',
        termEndDate: '2024-06-30',
      } as any);
      expect(result.attendanceRate).toBe(92.5);
      expect(result.present).toBe(45);
      expect(result.absent).toBe(3);
      expect(result.excused).toBe(2);
      expect(result.notMarked).toBe(1);
      expect(result.totalSessions).toBe(51);
    });

    it('clamps negative values to 0', () => {
      const result = mapAttendanceStats({
        present: '-5',
        absent: -3,
        excused: '-1',
        notMarked: -2,
        totalSessions: '-10',
        attendanceRate: 50,
      } as any);
      expect(result.present).toBe(0);
      expect(result.absent).toBe(0);
      expect(result.excused).toBe(0);
      expect(result.notMarked).toBe(0);
      expect(result.totalSessions).toBe(0);
    });

    it('clamps attendanceRate above 100 to 100', () => {
      const result = mapAttendanceStats({ attendanceRate: 150 } as any);
      expect(result.attendanceRate).toBe(100);
    });

    it('clamps attendanceRate below 0 to 0', () => {
      const result = mapAttendanceStats({ attendanceRate: -10 } as any);
      expect(result.attendanceRate).toBe(0);
    });

    it('defaults missing fields to 0 or empty string', () => {
      const result = mapAttendanceStats({} as any);
      expect(result.attendanceRate).toBe(0);
      expect(result.present).toBe(0);
      expect(result.absent).toBe(0);
      expect(result.excused).toBe(0);
      expect(result.notMarked).toBe(0);
      expect(result.totalSessions).toBe(0);
      expect(result.termName).toBe('');
      expect(result.termStartDate).toBe('');
      expect(result.termEndDate).toBe('');
    });

    it('floors float count values to integers', () => {
      const result = mapAttendanceStats({ present: '45.9', absent: 3.7 } as any);
      expect(result.present).toBe(45);
      expect(result.absent).toBe(3);
    });
  });

  describe('mapTimelineRecord', () => {
    it('preserves excuseNote when status is EXCUSED', () => {
      const result = mapTimelineRecord({
        date: '2024-01-15',
        time: '08:30',
        status: 'EXCUSED',
        excuseNote: 'Doctor appointment',
      });
      expect(result.excuseNote).toBe('Doctor appointment');
      expect(result.status).toBe('EXCUSED');
    });

    it('strips excuseNote when status is PRESENT', () => {
      const result = mapTimelineRecord({
        date: '2024-01-15',
        time: '08:30',
        status: 'PRESENT',
        excuseNote: 'Should be stripped',
      });
      expect(result.excuseNote).toBeUndefined();
    });

    it('strips excuseNote when status is ABSENT', () => {
      const result = mapTimelineRecord({
        date: '2024-01-15',
        time: '08:30',
        status: 'ABSENT',
        excuseNote: 'Should be stripped',
      });
      expect(result.excuseNote).toBeUndefined();
    });

    it('strips excuseNote when status is NOT_MARKED', () => {
      const result = mapTimelineRecord({
        date: '2024-01-15',
        time: '08:30',
        status: 'NOT_MARKED',
        excuseNote: 'Should be stripped',
      });
      expect(result.excuseNote).toBeUndefined();
    });

    it('normalizes unknown status to NOT_MARKED', () => {
      const result = mapTimelineRecord({
        date: '2024-01-15',
        time: '08:30',
        status: 'INVALID',
      });
      expect(result.status).toBe('NOT_MARKED');
    });

    it('normalizes null status to NOT_MARKED', () => {
      const result = mapTimelineRecord({
        date: '2024-01-15',
        time: '08:30',
        status: null,
      });
      expect(result.status).toBe('NOT_MARKED');
    });
  });

  describe('unwrapData', () => {
    it('returns raw T when payload is not an ApiSuccess envelope', () => {
      const raw = [{ id: '1', name: 'Test' }];
      expect(unwrapData(raw)).toBe(raw);
    });

    it('extracts .data from ApiSuccess envelope', () => {
      const data = [{ id: '1', name: 'Test' }];
      const envelope: ApiSuccess<typeof data> = { success: true, message: 'ok', data };
      expect(unwrapData(envelope)).toBe(data);
    });

    it('handles plain objects as raw T', () => {
      const raw = { id: '1', name: 'Test' };
      expect(unwrapData(raw)).toBe(raw);
    });
  });
});
