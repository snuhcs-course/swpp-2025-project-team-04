import React from 'react';
import {
  renderWithIntegrationProviders,
  waitFor,
  fireEvent,
} from './testUtils';
import { setupApiMocks } from './apiMocks';
import FeedbackScreen from '@/app/feedback';
import { useLocalSearchParams } from 'expo-router';
import { customFetch } from '@/api/client';

jest.mock('@/api/client');
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

describe('Feedback Integration Test', () => {
  let apiMocks: ReturnType<typeof setupApiMocks>;

  const mockFeedbackParams = {
    generated_content_id: '123',
    pause_cnt: '5',
    rewind_cnt: '3',
    vocab_lookup_cnt: '10',
    vocab_save_cnt: '7',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    apiMocks = setupApiMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue(mockFeedbackParams);
    (customFetch as jest.Mock).mockResolvedValue({
      lexical_level: 35,
      syntactic_level: 40,
      speed_level: 20,
      lexical_level_delta: 5,
      syntactic_level_delta: 3,
      speed_level_delta: 2,
    });
  });

  afterEach(async () => {
    apiMocks.reset();
    jest.clearAllTimers();
  });

  it('displays feedback screen title', () => {
    const { getByText } = renderWithIntegrationProviders(<FeedbackScreen />);

    expect(getByText('학습 세션 완료!')).toBeTruthy();
  });

  it('displays understanding section', () => {
    const { getByText } = renderWithIntegrationProviders(<FeedbackScreen />);

    expect(getByText('이해도')).toBeTruthy();
  });

  it('shows understanding difficulty options', () => {
    const { getByText } = renderWithIntegrationProviders(<FeedbackScreen />);

    expect(getByText('매우 낮음')).toBeTruthy();
    expect(getByText('낮음')).toBeTruthy();
    expect(getByText('보통')).toBeTruthy();
    expect(getByText('높음')).toBeTruthy();
    expect(getByText('매우 높음')).toBeTruthy();
  });

  it('displays submit button', () => {
    const { getByText } = renderWithIntegrationProviders(<FeedbackScreen />);

    expect(getByText('제출하기')).toBeTruthy();
  });

  it('shows speed options after selecting understanding', async () => {
    const { getByText } = renderWithIntegrationProviders(<FeedbackScreen />);

    const understandingLevel = getByText('보통');
    fireEvent.press(understandingLevel);

    await waitFor(() => {
      expect(getByText('발화속도')).toBeTruthy();
      expect(getByText('매우 느림')).toBeTruthy();
    });
  });
});
