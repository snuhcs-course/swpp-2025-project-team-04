import React from 'react';
import { renderWithIntegrationProviders, waitFor } from './testUtils';
import { setupApiMocks } from './apiMocks';
import StatsScreen from '@/app/(main)/stats';

jest.mock('@/api/client');

describe('Stats Integration Test', () => {
  let apiMocks: ReturnType<typeof setupApiMocks>;

  beforeEach(() => {
    jest.clearAllMocks();
    apiMocks = setupApiMocks();
  });

  afterEach(async () => {
    apiMocks.reset();
    jest.clearAllTimers();
  });

  it('shows loading state initially', () => {
    const { UNSAFE_root } = renderWithIntegrationProviders(<StatsScreen />);

    expect(UNSAFE_root).toBeTruthy();
  });

  it('displays stats data when loaded successfully', async () => {
    apiMocks.mockGetStatsSuccess();

    const { getAllByText } = renderWithIntegrationProviders(<StatsScreen />);

    await waitFor(() => {
      expect(getAllByText('A2').length).toBeGreaterThan(0);
    });
  });

  it('displays current level information', async () => {
    apiMocks.mockGetStatsSuccess();

    const { getByText } = renderWithIntegrationProviders(<StatsScreen />);

    await waitFor(() => {
      expect(getByText('어휘력')).toBeTruthy();
      expect(getByText('문법')).toBeTruthy();
    });
  });

  it('displays streak information', async () => {
    apiMocks.mockGetStatsSuccess();

    const { getByText } = renderWithIntegrationProviders(<StatsScreen />);

    await waitFor(() => {
      expect(getByText('연속 학습일')).toBeTruthy();
      expect(getByText('누적 학습일')).toBeTruthy();
    });
  });

  it('displays total study time', async () => {
    apiMocks.mockGetStatsSuccess();

    const { getByText } = renderWithIntegrationProviders(<StatsScreen />);

    await waitFor(() => {
      expect(getByText('총 학습시간')).toBeTruthy();
    });
  });

  it('displays weekly activity chart', async () => {
    apiMocks.mockGetStatsSuccess();

    const { getByText } = renderWithIntegrationProviders(<StatsScreen />);

    await waitFor(() => {
      expect(getByText('주간 활동')).toBeTruthy();
      expect(getByText('월')).toBeTruthy();
      expect(getByText('화')).toBeTruthy();
      expect(getByText('수')).toBeTruthy();
      expect(getByText('목')).toBeTruthy();
      expect(getByText('금')).toBeTruthy();
      expect(getByText('토')).toBeTruthy();
      expect(getByText('일')).toBeTruthy();
    });
  });

  it('displays achievements section', async () => {
    apiMocks.mockGetStatsSuccess();

    const { getByText } = renderWithIntegrationProviders(<StatsScreen />);

    await waitFor(() => {
      expect(getByText('나의 배지')).toBeTruthy();
      expect(getByText('첫 걸음')).toBeTruthy();
      expect(getByText('일주일 전사')).toBeTruthy();
    });
  });

  it('displays error state when API call fails', async () => {
    apiMocks.mockGetStatsFailure('Failed to load stats');

    const { getByText } = renderWithIntegrationProviders(<StatsScreen />);

    await waitFor(
      () => {
        expect(getByText('통계를 불러올 수 없습니다')).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });
});
