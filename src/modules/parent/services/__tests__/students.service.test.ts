import { client } from '@/lib/api/client';
import { fetchStudents } from '../students.service';

jest.mock('@/lib/api/client', () => ({
  client: { get: jest.fn() },
}));

const mockGet = client.get as jest.Mock;

describe('students.service · fetchStudents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests the students list with includeUnlinked=true', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await fetchStudents();

    expect(mockGet).toHaveBeenCalledWith(
      '/parents/students',
      { params: { includeUnlinked: true } },
    );
  });

  it('maps linkStatus through from the backend response', async () => {
    mockGet.mockResolvedValue({
      data: [
        { id: '1', name: 'Linked Kid', linkStatus: 'linked' },
        { id: '2', name: 'Revoked Kid', linkStatus: 'unlinked' },
      ],
    });

    const students = await fetchStudents();

    expect(students[0].linkStatus).toBe('linked');
    expect(students[1].linkStatus).toBe('unlinked');
  });

  it('leaves linkStatus undefined when the backend omits it (legacy response)', async () => {
    mockGet.mockResolvedValue({
      data: [{ id: '1', name: 'Legacy Kid' }],
    });

    const students = await fetchStudents();

    expect(students[0].linkStatus).toBeUndefined();
  });
});
