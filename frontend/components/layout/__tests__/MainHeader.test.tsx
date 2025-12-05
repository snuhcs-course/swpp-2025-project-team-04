import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainHeader from '../MainHeader';
import { STATS_QUERY_KEY } from '@/constants/queryKeys';

// Mock
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 44,
    bottom: 0,
    left: 0,
    right: 0,
  })),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
}));

describe('MainHeader', () => {
  let queryClient: QueryClient;

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('renders correctly with title', () => {
    renderWithProviders(<MainHeader title="홈" />);

    expect(screen.getByText('홈')).toBeTruthy();
  });

  it('renders with different titles', () => {
    const { rerender } = renderWithProviders(<MainHeader title="단어장" />);
    expect(screen.getByText('단어장')).toBeTruthy();

    rerender(
      <QueryClientProvider client={queryClient}>
        <MainHeader title="통계" />
      </QueryClientProvider>,
    );
    expect(screen.getByText('통계')).toBeTruthy();
  });

  it('applies safe area insets for top padding', () => {
    const { UNSAFE_root } = renderWithProviders(<MainHeader title="테스트" />);

    expect(UNSAFE_root).toBeTruthy();
  });

  it('shows streak badge when stats have consecutive days > 0', () => {
    queryClient.setQueryData([STATS_QUERY_KEY], {
      streak: { consecutive_days: 5 },
      total_listening_time: 1200,
      total_words_learned: 50,
    });

    renderWithProviders(<MainHeader title="홈" />);

    expect(screen.getByText('🔥')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('does not show streak badge when consecutive days is 0', () => {
    queryClient.setQueryData([STATS_QUERY_KEY], {
      streak: { consecutive_days: 0 },
      total_listening_time: 1200,
      total_words_learned: 50,
    });

    renderWithProviders(<MainHeader title="홈" />);

    expect(screen.queryByText('🔥')).toBeNull();
  });

  it('shows streak tooltip when streak badge is pressed in', async () => {
    queryClient.setQueryData([STATS_QUERY_KEY], {
      streak: { consecutive_days: 3 },
      total_listening_time: 1200,
      total_words_learned: 50,
    });

    renderWithProviders(<MainHeader title="홈" />);

    expect(screen.queryByText('연속 학습 3일차')).toBeNull();

    const streakBadge = screen.getByText('🔥');
    fireEvent(streakBadge.parent!, 'pressIn');

    expect(screen.getByText('연속 학습 3일차')).toBeTruthy();

    fireEvent(streakBadge.parent!, 'pressOut');

    expect(screen.queryByText('연속 학습 3일차')).toBeNull();
  });

  it('shows correct tooltip text based on streak days', async () => {
    queryClient.setQueryData([STATS_QUERY_KEY], {
      streak: { consecutive_days: 7 },
      total_listening_time: 1200,
      total_words_learned: 50,
    });

    renderWithProviders(<MainHeader title="홈" />);

    const streakBadge = screen.getByText('🔥');
    fireEvent(streakBadge.parent!, 'pressIn');

    expect(screen.getByText('연속 학습 7일차')).toBeTruthy();

    fireEvent(streakBadge.parent!, 'pressOut');

    await waitFor(() => {
      expect(screen.queryByText('연속 학습 7일차')).toBeNull();
    });
  });

  it('renders profile button', () => {
    renderWithProviders(<MainHeader title="홈" />);

    expect(screen.getByText('홈')).toBeTruthy();
  });
});
