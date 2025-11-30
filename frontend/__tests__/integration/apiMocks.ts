import { customFetch } from '@/api/client';

export const mockApiResponses = {
  login: {
    user: {
      id: 1,
      username: 'testuser',
      nickname: 'Test User',
      email: 'test@example.com',
    },
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
  },
  signup: {
    user: {
      id: 2,
      username: 'newuser',
      nickname: 'New User',
      email: 'new@example.com',
    },
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
  },
  user: {
    id: 1,
    username: 'testuser',
    nickname: 'Test User',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
  },
  vocabList: [
    {
      id: 1,
      word: 'apple',
      meaning: '사과',
      example_sentence: 'I like apples.',
      example_sentence_url: 'https://example.com/audio/apple.mp3',
      pos: 'noun',
    },
    {
      id: 2,
      word: 'book',
      meaning: '책',
      example_sentence: 'This is a good book.',
      example_sentence_url: 'https://example.com/audio/book.mp3',
      pos: 'noun',
    },
  ],
  stats: {
    total_words_learned: 10,
    total_listening_time: 3600,
    streak_days: 5,
    level_progress: {
      beginner: 50,
      intermediate: 20,
      advanced: 5,
    },
  },
  initialSurvey: {
    success: true,
    message: 'Survey completed successfully',
  },
  feedback: {
    success: true,
    message: 'Feedback submitted successfully',
  },
};

export function setupApiMocks() {
  const mockCustomFetch = customFetch as jest.MockedFunction<
    typeof customFetch
  >;

  return {
    mockLoginSuccess: () => {
      mockCustomFetch.mockResolvedValueOnce(mockApiResponses.login);
    },
    mockLoginFailure: (message = 'Invalid credentials') => {
      mockCustomFetch.mockRejectedValueOnce(new Error(message));
    },
    mockSignupSuccess: () => {
      mockCustomFetch.mockResolvedValueOnce(mockApiResponses.signup);
    },
    mockSignupFailure: (message = 'Username already exists') => {
      mockCustomFetch.mockRejectedValueOnce(new Error(message));
    },
    mockGetUserSuccess: () => {
      mockCustomFetch.mockResolvedValueOnce(mockApiResponses.user);
    },
    mockGetUserFailure: () => {
      mockCustomFetch.mockRejectedValueOnce(new Error('Unauthorized'));
    },
    mockGetVocabSuccess: () => {
      mockCustomFetch.mockResolvedValueOnce(mockApiResponses.vocabList);
    },
    mockGetVocabEmpty: () => {
      mockCustomFetch.mockResolvedValueOnce([]);
    },
    mockGetVocabFailure: (message = 'Failed to fetch vocabulary') => {
      mockCustomFetch.mockRejectedValueOnce(new Error(message));
    },
    mockDeleteVocabSuccess: () => {
      mockCustomFetch.mockResolvedValueOnce({ success: true });
    },
    mockGetStatsSuccess: () => {
      mockCustomFetch.mockResolvedValueOnce(mockApiResponses.stats);
    },
    mockSubmitSurveySuccess: () => {
      mockCustomFetch.mockResolvedValueOnce(mockApiResponses.initialSurvey);
    },
    mockSubmitFeedbackSuccess: () => {
      mockCustomFetch.mockResolvedValueOnce(mockApiResponses.feedback);
    },
    reset: () => {
      mockCustomFetch.mockReset();
    },
  };
}
