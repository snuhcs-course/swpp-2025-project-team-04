import React from 'react';
import {
  renderWithIntegrationProviders,
  waitFor,
  fireEvent,
} from './testUtils';
import { setupApiMocks } from './apiMocks';
import InitialSurveyScreen from '@/app/initial-survey';
import { router } from 'expo-router';

jest.mock('@/api/client');
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  router: {
    replace: jest.fn(),
  },
}));

describe('Initial Survey Integration Test', () => {
  let apiMocks: ReturnType<typeof setupApiMocks>;

  beforeEach(() => {
    jest.clearAllMocks();
    apiMocks = setupApiMocks();
  });

  afterEach(async () => {
    apiMocks.reset();
    jest.clearAllTimers();
  });

  it('starts survey and selects level', async () => {
    const { getByText } = renderWithIntegrationProviders(
      <InitialSurveyScreen />,
    );

    fireEvent.press(getByText('시작하기'));

    await waitFor(() => {
      expect(getByText('(A1) 초보자')).toBeTruthy();
    });

    const beginnerButton = getByText('(A1) 초보자');
    fireEvent.press(beginnerButton);

    const nextButton = getByText('다음');
    expect(nextButton).toBeTruthy();
  });

  it('navigates back through survey steps', async () => {
    const { getByText, queryByText } = renderWithIntegrationProviders(
      <InitialSurveyScreen />,
    );

    fireEvent.press(getByText('시작하기'));

    await waitFor(() => {
      expect(getByText('(A1) 초보자')).toBeTruthy();
    });

    const beginnerButton = getByText('(A1) 초보자');
    fireEvent.press(beginnerButton);

    fireEvent.press(getByText('다음'));

    await waitFor(() => {
      expect(getByText('테스트 진행하기')).toBeTruthy();
    });

    const backButtons = queryByText('이전');
    if (backButtons) {
      fireEvent.press(backButtons);
      await waitFor(() => {
        expect(getByText('(A1) 초보자')).toBeTruthy();
      });
    }
  });

  it('prevents navigation without selecting level', () => {
    const { getByText, queryByText } = renderWithIntegrationProviders(
      <InitialSurveyScreen />,
    );

    fireEvent.press(getByText('시작하기'));

    fireEvent.press(getByText('다음'));

    expect(queryByText('레벨 테스트를 진행하시겠어요?')).toBeNull();
  });
});
