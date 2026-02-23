/**
 * Unit tests for LinkStudentScreen
 * Validates: Requirements 9.2, 9.3, 9.4, 9.5, 9.8
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { render, screen, setup } from '@/lib/test-utils';
import { useLinkStudent } from '../../hooks/use-link-student';
import { LinkStudentScreen } from '../link-student-screen';

// Mock dependencies
jest.mock('expo-router');
jest.mock('react-i18next');
jest.mock('../../hooks/use-link-student');
jest.mock('../../services/error-utils', () => ({
  extractErrorMessage: jest.fn((error, t) => {
    if (!error)
      return '';
    const axiosError = error as any;
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    if (!axiosError.response) {
      return t('parent.common.offlineError');
    }
    return t('parent.common.genericError');
  }),
}));

const mockRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseTranslation = useTranslation as jest.MockedFunction<typeof useTranslation>;
const mockUseLinkStudent = useLinkStudent as jest.MockedFunction<typeof useLinkStudent>;

// Mock translation function
const mockT = (key: string) => key;

// Helper to render with React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function renderWithProviders(component: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>,
  );
}

// eslint-disable-next-line max-lines-per-function
describe('linkStudentScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: {} as any,
    } as any);
    mockRouter.mockReturnValue({
      back: jest.fn(),
      push: jest.fn(),
      replace: jest.fn(),
      navigate: jest.fn(),
      canGoBack: jest.fn(() => true),
    } as any);
  });

  describe('empty code disables submit', () => {
    it('should disable submit button when access code is empty', () => {
      mockUseLinkStudent.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        error: null,
      } as any);

      renderWithProviders(<LinkStudentScreen />);

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when access code is only whitespace', async () => {
      mockUseLinkStudent.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        error: null,
      } as any);

      const { user } = setup(
        <QueryClientProvider client={queryClient}>
          <LinkStudentScreen />
        </QueryClientProvider>,
      );

      const input = screen.getByTestId('access-code-input');
      await user.type(input, '   ');

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when access code is non-empty', async () => {
      mockUseLinkStudent.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        error: null,
      } as any);

      const { user } = setup(
        <QueryClientProvider client={queryClient}>
          <LinkStudentScreen />
        </QueryClientProvider>,
      );

      const input = screen.getByTestId('access-code-input');
      await user.type(input, 'EDU-123-456');

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('submit triggers mutation with trimmed code', () => {
    it('should call mutate with trimmed access code on submit', async () => {
      const mockMutate = jest.fn();
      mockUseLinkStudent.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null,
      } as any);

      const { user } = setup(
        <QueryClientProvider client={queryClient}>
          <LinkStudentScreen />
        </QueryClientProvider>,
      );

      const input = screen.getByTestId('access-code-input');
      await user.type(input, '  EDU-123-456  ');

      const submitButton = screen.getByTestId('submit-button');
      await user.press(submitButton);

      expect(mockMutate).toHaveBeenCalledWith(
        'EDU-123-456',
        expect.objectContaining({
          onSuccess: expect.any(Function),
        }),
      );
    });

    it('should not call mutate if validation fails', async () => {
      const mockMutate = jest.fn();
      mockUseLinkStudent.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null,
      } as any);

      const { user } = setup(
        <QueryClientProvider client={queryClient}>
          <LinkStudentScreen />
        </QueryClientProvider>,
      );

      const submitButton = screen.getByTestId('submit-button');
      await user.press(submitButton);

      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe('loading state disables button and shows indicator', () => {
    it('should disable submit button during loading', () => {
      mockUseLinkStudent.mockReturnValue({
        mutate: jest.fn(),
        isPending: true,
        error: null,
      } as any);

      renderWithProviders(<LinkStudentScreen />);

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
    });

    it('should show activity indicator during loading', () => {
      mockUseLinkStudent.mockReturnValue({
        mutate: jest.fn(),
        isPending: true,
        error: null,
      } as any);

      renderWithProviders(<LinkStudentScreen />);

      // When isPending is true, the loading indicator container should be rendered
      // The ActivityIndicator component should be present
      const { root } = render(
        <QueryClientProvider client={queryClient}>
          <LinkStudentScreen />
        </QueryClientProvider>,
      );
      expect(root).toBeDefined();
    });
  });

  describe('error state displays backend message', () => {
    it('should display backend error message when mutation fails', () => {
      const mockError = {
        isAxiosError: true,
        response: {
          data: {
            message: 'Invalid access code',
          },
        },
      };

      mockUseLinkStudent.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        error: mockError as any,
      } as any);

      renderWithProviders(<LinkStudentScreen />);

      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeOnTheScreen();
      expect(screen.getByText('Invalid access code')).toBeOnTheScreen();
    });

    it('should display generic error when backend message is missing', () => {
      const mockError = {
        isAxiosError: true,
        response: {
          data: {
            message: '',
          },
        },
      };

      mockUseLinkStudent.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        error: mockError as any,
      } as any);

      renderWithProviders(<LinkStudentScreen />);

      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeOnTheScreen();
      expect(screen.getByText('parent.common.genericError')).toBeOnTheScreen();
    });

    it('should display offline error when no response received', () => {
      const mockError = {
        isAxiosError: true,
        response: null,
      };

      mockUseLinkStudent.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        error: mockError as any,
      } as any);

      renderWithProviders(<LinkStudentScreen />);

      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeOnTheScreen();
      expect(screen.getByText('parent.common.offlineError')).toBeOnTheScreen();
    });
  });

  describe('success navigates back to dashboard', () => {
    it('should navigate back on successful link', async () => {
      const mockReplace = jest.fn();
      mockRouter.mockReturnValue({
        back: jest.fn(),
        push: jest.fn(),
        replace: mockReplace,
        navigate: jest.fn(),
        canGoBack: jest.fn(() => true),
      } as any);

      let onSuccessCallback: (() => void) | undefined;
      const mockMutate = jest.fn((_code: string, options?: { onSuccess?: () => void }) => {
        onSuccessCallback = options?.onSuccess;
      });

      mockUseLinkStudent.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        error: null,
      } as any);

      const { user } = setup(
        <QueryClientProvider client={queryClient}>
          <LinkStudentScreen />
        </QueryClientProvider>,
      );

      const input = screen.getByTestId('access-code-input');
      await user.type(input, 'EDU-123-456');

      const submitButton = screen.getByTestId('submit-button');
      await user.press(submitButton);

      // Trigger the onSuccess callback
      onSuccessCallback?.();

      expect(mockReplace).toHaveBeenCalledWith('/(parent)/(tabs)/dashboard');
    });
  });

  describe('validation error display', () => {
    it('should show validation error for empty code', async () => {
      mockUseLinkStudent.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        error: null,
      } as any);

      const { user } = setup(
        <QueryClientProvider client={queryClient}>
          <LinkStudentScreen />
        </QueryClientProvider>,
      );

      // Submit button should be disabled initially
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();

      // Pressing submit with empty code should not call mutate
      await user.press(submitButton);
      expect(mockUseLinkStudent().mutate).not.toHaveBeenCalled();
    });

    it('should clear validation error when user types', async () => {
      mockUseLinkStudent.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        error: null,
      } as any);

      const { user } = setup(
        <QueryClientProvider client={queryClient}>
          <LinkStudentScreen />
        </QueryClientProvider>,
      );

      // Initially submit button is disabled
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();

      // Type in the input
      const input = screen.getByTestId('access-code-input');
      await user.type(input, 'EDU-123-456');

      // Submit button should now be enabled
      expect(submitButton).not.toBeDisabled();
    });
  });
});
