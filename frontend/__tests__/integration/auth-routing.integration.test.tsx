import React from 'react';
import { render, waitFor } from './testUtils';
import { setupApiMocks } from './apiMocks';
import { useUser } from '@/hooks/queries/useUserQueries';
import { useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as tokenManager from '@/utils/tokenManager';

jest.mock('@/api/client');
jest.mock('@/utils/tokenManager');
jest.mock('@/hooks/queries/useUserQueries');

const mockReplace = jest.fn();
const mockRouter = {
  replace: mockReplace,
  push: jest.fn(),
  back: jest.fn(),
};

(useRouter as jest.Mock).mockReturnValue(mockRouter);

function TestAuthRoutingComponent() {
  const { data: user, isLoading } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && user && !user.initial_level_completed) {
      router.replace('/initial-survey');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return null;
  }

  return <div data-testid="content">Content</div>;
}

describe('Authentication Routing Integration Test', () => {
  let apiMocks: ReturnType<typeof setupApiMocks>;
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    apiMocks = setupApiMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    mockReplace.mockClear();
  });

  afterEach(() => {
    apiMocks.reset();
    jest.clearAllTimers();
  });

  it('redirects to initial-survey when user has not completed initial level test', async () => {
    const userWithIncompleteTest = {
      id: 1,
      username: 'testuser',
      nickname: 'Test User',
      level: 'A1',
      level_updated_at: '2024-01-01T00:00:00Z',
      initial_level_completed: false,
      level_score: 0,
      interests: [],
    };

    (useUser as jest.Mock).mockReturnValue({
      data: userWithIncompleteTest,
      isLoading: false,
      isError: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TestAuthRoutingComponent />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/initial-survey');
    });
  });

  it('does not redirect when user has completed initial level test', async () => {
    const userWithCompletedTest = {
      id: 1,
      username: 'testuser',
      nickname: 'Test User',
      level: 'A2',
      level_updated_at: '2024-01-01T00:00:00Z',
      initial_level_completed: true,
      level_score: 35,
      interests: [
        { key: 'technology', category: 'Knowledge', label: 'Technology' },
      ],
    };

    (useUser as jest.Mock).mockReturnValue({
      data: userWithCompletedTest,
      isLoading: false,
      isError: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TestAuthRoutingComponent />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalledWith('/initial-survey');
    });
  });

  it('does not redirect when user is not authenticated', async () => {
    (useUser as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TestAuthRoutingComponent />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it('does not redirect while loading user data', async () => {
    (useUser as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TestAuthRoutingComponent />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it('redirects after user data loads with incomplete test', async () => {
    (useUser as jest.Mock).mockReturnValueOnce({
      data: null,
      isLoading: true,
      isError: false,
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <TestAuthRoutingComponent />
      </QueryClientProvider>,
    );

    expect(mockReplace).not.toHaveBeenCalled();

    const userWithIncompleteTest = {
      id: 2,
      username: 'newuser',
      nickname: 'New User',
      level: 'A1',
      level_updated_at: '2024-01-01T00:00:00Z',
      initial_level_completed: false,
      level_score: 0,
      interests: [],
    };

    (useUser as jest.Mock).mockReturnValue({
      data: userWithIncompleteTest,
      isLoading: false,
      isError: false,
    });

    rerender(
      <QueryClientProvider client={queryClient}>
        <TestAuthRoutingComponent />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/initial-survey');
    });
  });
});
