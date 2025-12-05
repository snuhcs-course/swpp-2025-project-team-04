import React from 'react';
import {
  renderWithIntegrationProviders,
  waitFor,
  fireEvent,
} from './testUtils';
import { setupApiMocks } from './apiMocks';
import VocabScreen from '@/app/(main)/vocab';

jest.mock('@/api/client');
jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
  })),
  useAudioPlayerStatus: jest.fn(() => ({
    playing: false,
    currentTime: 0,
    duration: 0,
  })),
}));

describe('Vocab Integration Test', () => {
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
    const { getByText } = renderWithIntegrationProviders(<VocabScreen />);

    expect(getByText('내 단어장을 불러오는 중…')).toBeTruthy();
  });

  it('displays vocab list when loaded successfully', async () => {
    apiMocks.mockGetVocabSuccess();

    const { getAllByText } = renderWithIntegrationProviders(<VocabScreen />);

    await waitFor(() => {
      expect(getAllByText('apple').length).toBeGreaterThan(0);
      expect(getAllByText('book').length).toBeGreaterThan(0);
    });
  });

  it('displays empty state when no vocab items exist', async () => {
    apiMocks.mockGetVocabEmpty();

    const { getByText } = renderWithIntegrationProviders(<VocabScreen />);

    await waitFor(() => {
      expect(getByText('아직 저장된 단어가 없어요')).toBeTruthy();
      expect(
        getByText(/스크립트에서 단어를 길게 눌러/, { exact: false }),
      ).toBeTruthy();
    });
  });

  it('displays error state when API call fails', async () => {
    apiMocks.mockGetVocabFailure('Failed to fetch vocabulary');

    const { getByText } = renderWithIntegrationProviders(<VocabScreen />);

    await waitFor(
      () => {
        expect(getByText('단어장을 불러오지 못했어요.')).toBeTruthy();
        expect(getByText('다시 시도하기')).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it('refetches vocab list when retry button is pressed', async () => {
    apiMocks.mockGetVocabFailure('Network error');

    const { getByText, getAllByText } = renderWithIntegrationProviders(<VocabScreen />);

    await waitFor(
      () => {
        expect(getByText('다시 시도하기')).toBeTruthy();
      },
      { timeout: 3000 },
    );

    apiMocks.mockGetVocabSuccess();

    const retryButton = getByText('다시 시도하기');
    fireEvent.press(retryButton);

    await waitFor(() => {
      expect(getAllByText('apple').length).toBeGreaterThan(0);
      expect(getAllByText('book').length).toBeGreaterThan(0);
    });
  });

  it('displays vocab details including word, meaning, and example', async () => {
    apiMocks.mockGetVocabSuccess();

    const { getAllByText } = renderWithIntegrationProviders(<VocabScreen />);

    await waitFor(() => {
      expect(getAllByText('apple').length).toBeGreaterThan(0);
      expect(getAllByText('사과').length).toBeGreaterThan(0);
      expect(getAllByText('I like apples.').length).toBeGreaterThan(0);

      expect(getAllByText('book').length).toBeGreaterThan(0);
      expect(getAllByText('책').length).toBeGreaterThan(0);
      expect(getAllByText('This is a good book.').length).toBeGreaterThan(0);
    });
  });
});
