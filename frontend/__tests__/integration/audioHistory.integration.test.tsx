import React from 'react';
import {
  renderWithIntegrationProviders,
  waitFor,
  fireEvent,
} from './testUtils';
import { setupApiMocks } from './apiMocks';
import HistoryScreen from '@/app/(main)/history';

jest.mock('@/api/client');

describe('Audio History Integration Test', () => {
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
    const { getByText } = renderWithIntegrationProviders(<HistoryScreen />);

    expect(getByText('히스토리를 불러오는 중…')).toBeTruthy();
  });

  it('displays audio history list when loaded successfully', async () => {
    apiMocks.mockGetAudioHistorySuccess();

    const { getByText } = renderWithIntegrationProviders(<HistoryScreen />);

    await waitFor(() => {
      expect(getByText('Technology Trends')).toBeTruthy();
      expect(getByText('Daily Conversation')).toBeTruthy();
    });
  });

  it('displays empty state when no history exists', async () => {
    apiMocks.mockGetAudioHistoryEmpty();

    const { getByText } = renderWithIntegrationProviders(<HistoryScreen />);

    await waitFor(() => {
      expect(getByText('아직 생성된 오디오가 없어요')).toBeTruthy();
    });
  });

});
