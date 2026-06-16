/**
 * Unit tests for token.service `validateToken`.
 *
 * Asserts the client parses the REAL backend wire shape of
 * `POST /auth/validate-token`: an `ApiSuccess` envelope wrapping a flat
 * `{ userId, email, role, ... }` payload (tutoring-backend auth.controller.ts
 * validateToken). The client normalizes it to `{ id, email, role, ... }`.
 */

import { authClient } from '@/lib/api/client';
import { validateToken } from '@/modules/auth/services/token.service';

jest.mock('@/lib/api/client', () => ({
  authClient: { post: jest.fn() },
}));

const mockPost = authClient.post as jest.Mock;

describe('validateToken', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('parses the enveloped flat backend shape into the AuthUser shape', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'ok',
        data: {
          userId: 'user-123',
          email: 'teacher@example.com',
          role: 'TEACHER',
          fullName: 'Aya Hassan',
          phoneE164: '+201000000000',
          status: 'ACTIVE',
        },
      },
    });

    const result = await validateToken();

    expect(mockPost).toHaveBeenCalledWith('/auth/validate-token');
    expect(result).toEqual({
      id: 'user-123',
      email: 'teacher@example.com',
      role: 'TEACHER',
      fullName: 'Aya Hassan',
      phoneE164: '+201000000000',
    });
  });

  it('handles optional fields being absent (defensive parse)', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'ok',
        data: { userId: 'u-1', email: 'p@example.com', role: 'PARENT' },
      },
    });

    const result = await validateToken();

    expect(result).toEqual({
      id: 'u-1',
      email: 'p@example.com',
      role: 'PARENT',
      fullName: undefined,
      phoneE164: undefined,
    });
  });

  it('preserves an explicit null phoneE164', async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'ok',
        data: { userId: 'u-2', email: 'p2@example.com', role: 'PARENT', phoneE164: null },
      },
    });

    const result = await validateToken();

    expect(result.phoneE164).toBeNull();
  });

  it('throws on a malformed payload missing required fields', async () => {
    mockPost.mockResolvedValueOnce({
      data: { success: true, message: 'ok', data: { email: 'no-id@example.com' } },
    });

    await expect(validateToken()).rejects.toThrow('Invalid validate-token response shape');
  });
});
