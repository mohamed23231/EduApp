/**
 * Parent API Contract Shape Tests
 * Validates: Requirements 18.2
 *
 * These tests verify that service functions call the correct endpoints with expected
 * request shapes and that response unwrapping matches the expected types.
 */

import { fetchStudents, fetchStudentDetails, linkStudent } from '../services/students.service';
import { fetchAttendance } from '../services/attendance.service';
import type { Student, StudentDetails, AttendanceRecord, LinkStudentRequest } from '../types/student.types';
import type { ApiSuccess } from '@/shared/types/api';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('@/lib/api/client', () => ({
    client: {
        get: jest.fn(),
        post: jest.fn(),
    },
}));

import { client } from '@/lib/api/client';

// ─── Test Data ───────────────────────────────────────────────────────────────

const mockStudent: Student = {
    id: 'student-1',
    fullName: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
    grade: 'Grade 5',
    schoolName: 'Example School',
};

const mockStudentDetails: StudentDetails = {
    ...mockStudent,
    email: 'john@example.com',
    phone: '+1234567890',
    enrollmentDate: '2023-09-01',
};

const mockAttendanceRecord: AttendanceRecord = {
    sessionDate: '2024-01-15',
    sessionName: 'Math Class',
    status: 'PRESENT',
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Parent API Contract Shape Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('fetchStudents', () => {
        it('should call GET /api/v1/parents/students endpoint', async () => {
            const mockResponse: ApiSuccess<Student[]> = {
                success: true,
                message: 'Students fetched successfully',
                data: [mockStudent],
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

            await fetchStudents();

            expect(client.get).toHaveBeenCalledWith('/api/v1/parents/students');
            expect(client.get).toHaveBeenCalledTimes(1);
        });

        it('should unwrap ApiSuccess envelope and return data array', async () => {
            const mockResponse: ApiSuccess<Student[]> = {
                success: true,
                message: 'Students fetched successfully',
                data: [mockStudent],
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

            const result = await fetchStudents();

            expect(result).toEqual([mockStudent]);
            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('id');
            expect(result[0]).toHaveProperty('fullName');
        });

        it('should return empty array when no students linked', async () => {
            const mockResponse: ApiSuccess<Student[]> = {
                success: true,
                message: 'No students linked',
                data: [],
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

            const result = await fetchStudents();

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should return multiple students with correct shape', async () => {
            const student2: Student = {
                id: 'student-2',
                fullName: 'Jane Smith',
                avatarUrl: 'https://example.com/avatar2.jpg',
                grade: 'Grade 6',
                schoolName: 'Example School',
            };

            const mockResponse: ApiSuccess<Student[]> = {
                success: true,
                message: 'Students fetched successfully',
                data: [mockStudent, student2],
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

            const result = await fetchStudents();

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual(mockStudent);
            expect(result[1]).toEqual(student2);
        });

        it('should handle optional fields in Student response', async () => {
            const studentWithoutOptionals: Student = {
                id: 'student-3',
                fullName: 'Bob Johnson',
            };

            const mockResponse: ApiSuccess<Student[]> = {
                success: true,
                message: 'Students fetched successfully',
                data: [studentWithoutOptionals],
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

            const result = await fetchStudents();

            expect(result[0]).toEqual(studentWithoutOptionals);
            expect(result[0]).toHaveProperty('id');
            expect(result[0]).toHaveProperty('fullName');
            expect(result[0].avatarUrl).toBeUndefined();
        });
    });

    describe('fetchStudentDetails', () => {
        it('should call GET /api/v1/parents/students/:studentId endpoint with correct ID', async () => {
            const studentId = 'student-1';
            const mockResponse: ApiSuccess<StudentDetails> = {
                success: true,
                message: 'Student details fetched successfully',
                data: mockStudentDetails,
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

            await fetchStudentDetails(studentId);

            expect(client.get).toHaveBeenCalledWith(`/api/v1/parents/students/${studentId}`);
            expect(client.get).toHaveBeenCalledTimes(1);
        });

        it('should unwrap ApiSuccess envelope and return StudentDetails', async () => {
            const mockResponse: ApiSuccess<StudentDetails> = {
                success: true,
                message: 'Student details fetched successfully',
                data: mockStudentDetails,
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

            const result = await fetchStudentDetails('student-1');

            expect(result).toEqual(mockStudentDetails);
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('fullName');
            expect(result).toHaveProperty('email');
            expect(result).toHaveProperty('phone');
            expect(result).toHaveProperty('enrollmentDate');
        });

        it('should handle StudentDetails with optional fields', async () => {
            const detailsWithoutOptionals: StudentDetails = {
                id: 'student-1',
                fullName: 'John Doe',
            };

            const mockResponse: ApiSuccess<StudentDetails> = {
                success: true,
                message: 'Student details fetched successfully',
                data: detailsWithoutOptionals,
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

            const result = await fetchStudentDetails('student-1');

            expect(result).toEqual(detailsWithoutOptionals);
            expect(result.email).toBeUndefined();
            expect(result.phone).toBeUndefined();
            expect(result.enrollmentDate).toBeUndefined();
        });

        it('should pass studentId as path parameter', async () => {
            const studentId = 'abc-123-def';
            const mockResponse: ApiSuccess<StudentDetails> = {
                success: true,
                message: 'Student details fetched successfully',
                data: mockStudentDetails,
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

            await fetchStudentDetails(studentId);

            expect(client.get).toHaveBeenCalledWith(`/api/v1/parents/students/${studentId}`);
        });
    });

    describe('linkStudent', () => {
        it('should call POST /api/v1/parents/link-student endpoint', async () => {
            const accessCode = 'EDU-123-456';
            const mockResponse: ApiSuccess<Student> = {
                success: true,
                message: 'Student linked successfully',
                data: mockStudent,
            };

            (client.post as jest.Mock).mockResolvedValue({ data: mockResponse });

            await linkStudent(accessCode);

            expect(client.post).toHaveBeenCalledWith(
                '/api/v1/parents/link-student',
                expect.objectContaining({ accessCode }),
            );
            expect(client.post).toHaveBeenCalledTimes(1);
        });

        it('should send LinkStudentRequest with correct shape', async () => {
            const accessCode = 'EDU-123-456';
            const mockResponse: ApiSuccess<Student> = {
                success: true,
                message: 'Student linked successfully',
                data: mockStudent,
            };

            (client.post as jest.Mock).mockResolvedValue({ data: mockResponse });

            await linkStudent(accessCode);

            const callArgs = (client.post as jest.Mock).mock.calls[0];
            const payload = callArgs[1] as LinkStudentRequest;

            expect(payload).toHaveProperty('accessCode');
            expect(payload.accessCode).toBe(accessCode);
        });

        it('should unwrap ApiSuccess envelope and return linked Student', async () => {
            const mockResponse: ApiSuccess<Student> = {
                success: true,
                message: 'Student linked successfully',
                data: mockStudent,
            };

            (client.post as jest.Mock).mockResolvedValue({ data: mockResponse });

            const result = await linkStudent('EDU-123-456');

            expect(result).toEqual(mockStudent);
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('fullName');
        });

        it('should handle various access code formats', async () => {
            const accessCodes = ['EDU-123-456', 'ABC123', 'code-with-dashes', '12345'];
            const mockResponse: ApiSuccess<Student> = {
                success: true,
                message: 'Student linked successfully',
                data: mockStudent,
            };

            (client.post as jest.Mock).mockResolvedValue({ data: mockResponse });

            for (const code of accessCodes) {
                await linkStudent(code);

                const callArgs = (client.post as jest.Mock).mock.calls[
                    (client.post as jest.Mock).mock.calls.length - 1
                ];
                const payload = callArgs[1] as LinkStudentRequest;

                expect(payload.accessCode).toBe(code);
            }
        });
    });

    describe('fetchAttendance', () => {
        it('should call GET /api/v1/parents/students/:studentId/attendance endpoint', async () => {
            const studentId = 'student-1';
            const mockResponse: ApiSuccess<AttendanceRecord[]> = {
                success: true,
                message: 'Attendance records fetched successfully',
                data: [mockAttendanceRecord],
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

            await fetchAttendance(studentId);

            expect(client.get).toHaveBeenCalledWith(
                `/api/v1/parents/students/${studentId}/attendance`,
            );
            expect(client.get).toHaveBeenCalledTimes(1);
        });

        it('should unwrap ApiSuccess envelope and return AttendanceRecord array', async () => {
            const mockResponse: ApiSuccess<AttendanceRecord[]> = {
                success: true,
                message: 'Attendance records fetched successfully',
                data: [mockAttendanceRecord],
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

            const result = await fetchAttendance('student-1');

            expect(result).toEqual([mockAttendanceRecord]);
            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('sessionDate');
            expect(result[0]).toHaveProperty('sessionName');
            expect(result[0]).toHaveProperty('status');
        });

        it('should return empty array when no attendance records available', async () => {
            const mockResponse: ApiSuccess<AttendanceRecord[]> = {
                success: true,
                message: 'No attendance records',
                data: [],
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

            const result = await fetchAttendance('student-1');

            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });

        it('should return multiple attendance records with correct shape', async () => {
            const record2: AttendanceRecord = {
                sessionDate: '2024-01-16',
                sessionName: 'English Class',
                status: 'ABSENT',
            };

            const record3: AttendanceRecord = {
                sessionDate: '2024-01-17',
                sessionName: 'Science Class',
                status: 'EXCUSED',
            };

            const mockResponse: ApiSuccess<AttendanceRecord[]> = {
                success: true,
                message: 'Attendance records fetched successfully',
                data: [mockAttendanceRecord, record2, record3],
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

            const result = await fetchAttendance('student-1');

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual(mockAttendanceRecord);
            expect(result[1]).toEqual(record2);
            expect(result[2]).toEqual(record3);
        });

        it('should handle all valid attendance statuses', async () => {
            const statuses: Array<'PRESENT' | 'ABSENT' | 'EXCUSED' | 'NOT_MARKED'> = [
                'PRESENT',
                'ABSENT',
                'EXCUSED',
                'NOT_MARKED',
            ];

            const records: AttendanceRecord[] = statuses.map((status, index) => ({
                sessionDate: `2024-01-${15 + index}`,
                sessionName: `Class ${index}`,
                status,
            }));

            const mockResponse: ApiSuccess<AttendanceRecord[]> = {
                success: true,
                message: 'Attendance records fetched successfully',
                data: records,
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

            const result = await fetchAttendance('student-1');

            expect(result).toHaveLength(4);
            result.forEach((record, index) => {
                expect(record.status).toBe(statuses[index]);
            });
        });

        it('should pass studentId as path parameter', async () => {
            const studentId = 'xyz-789-abc';
            const mockResponse: ApiSuccess<AttendanceRecord[]> = {
                success: true,
                message: 'Attendance records fetched successfully',
                data: [],
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

            await fetchAttendance(studentId);

            expect(client.get).toHaveBeenCalledWith(
                `/api/v1/parents/students/${studentId}/attendance`,
            );
        });
    });

    describe('Response Envelope Unwrapping', () => {
        it('should extract data from ApiSuccess envelope for all services', async () => {
            const studentResponse: ApiSuccess<Student[]> = {
                success: true,
                message: 'Success',
                data: [mockStudent],
            };

            const detailsResponse: ApiSuccess<StudentDetails> = {
                success: true,
                message: 'Success',
                data: mockStudentDetails,
            };

            const attendanceResponse: ApiSuccess<AttendanceRecord[]> = {
                success: true,
                message: 'Success',
                data: [mockAttendanceRecord],
            };

            (client.get as jest.Mock)
                .mockResolvedValueOnce({ data: studentResponse })
                .mockResolvedValueOnce({ data: detailsResponse })
                .mockResolvedValueOnce({ data: attendanceResponse });

            const linkedResponse: ApiSuccess<Student> = {
                success: true,
                message: 'Success',
                data: mockStudent,
            };

            (client.post as jest.Mock).mockResolvedValue({ data: linkedResponse });

            const students = await fetchStudents();
            const details = await fetchStudentDetails('student-1');
            const attendance = await fetchAttendance('student-1');
            const linked = await linkStudent('EDU-123-456');

            expect(students).toEqual([mockStudent]);
            expect(details).toEqual(mockStudentDetails);
            expect(attendance).toEqual([mockAttendanceRecord]);
            expect(linked).toEqual(mockStudent);
        });

        it('should not expose envelope structure in returned data', async () => {
            const mockResponse: ApiSuccess<Student[]> = {
                success: true,
                message: 'Students fetched successfully',
                data: [mockStudent],
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

            const result = await fetchStudents();

            expect(result).not.toHaveProperty('success');
            expect(result).not.toHaveProperty('message');
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('Endpoint Path Correctness', () => {
        it('should use correct base path for all parent endpoints', async () => {
            const mockResponse: ApiSuccess<Student[]> = {
                success: true,
                message: 'Success',
                data: [],
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });
            (client.post as jest.Mock).mockResolvedValue({ data: mockResponse });

            await fetchStudents();
            await fetchStudentDetails('id-1');
            await linkStudent('code');
            await fetchAttendance('id-1');

            const calls = [
                ...(client.get as jest.Mock).mock.calls,
                ...(client.post as jest.Mock).mock.calls,
            ];

            calls.forEach((call) => {
                const endpoint = call[0];
                expect(endpoint).toMatch(/^\/api\/v1\/parents\//);
            });
        });

        it('should construct dynamic paths correctly with studentId', async () => {
            const studentIds = ['student-1', 'student-2', 'abc-123-def'];
            const mockResponse: ApiSuccess<StudentDetails> = {
                success: true,
                message: 'Success',
                data: mockStudentDetails,
            };

            (client.get as jest.Mock).mockResolvedValue({ data: mockResponse });

            for (const id of studentIds) {
                await fetchStudentDetails(id);
            }

            const calls = (client.get as jest.Mock).mock.calls;
            studentIds.forEach((id, index) => {
                expect(calls[index][0]).toBe(`/api/v1/parents/students/${id}`);
            });
        });
    });
});
