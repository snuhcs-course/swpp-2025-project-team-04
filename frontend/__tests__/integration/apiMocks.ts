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
  audioHistory: {
    items: [
      {
        generated_content_id: 1,
        user_id: 1,
        title: 'Technology Trends',
        audio_url: 'https://example.com/audio/tech.mp3',
        script_data: 'Sample script',
        sentences: [
          { id: 1, start_time: 0, text: 'Hello world' },
          { id: 2, start_time: 2, text: 'This is a test' },
        ],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      {
        generated_content_id: 2,
        user_id: 1,
        title: 'Daily Conversation',
        audio_url: 'https://example.com/audio/daily.mp3',
        script_data: 'Sample script 2',
        sentences: [
          { id: 3, start_time: 0, text: 'Good morning' },
          { id: 4, start_time: 2, text: 'How are you' },
        ],
        created_at: '2024-01-14T10:00:00Z',
        updated_at: '2024-01-14T10:00:00Z',
      },
    ],
    total: 2,
    limit: 20,
    offset: 0,
  },
  stats: {
    streak: {
      consecutive_days: 5,
      weekly_total_minutes: 120,
      daily_minutes: [
        { date: '2024-01-15', minutes: 30 },
        { date: '2024-01-16', minutes: 25 },
        { date: '2024-01-17', minutes: 20 },
        { date: '2024-01-18', minutes: 15 },
        { date: '2024-01-19', minutes: 30 },
        { date: '2024-01-20', minutes: 0 },
        { date: '2024-01-21', minutes: 0 },
      ],
    },
    current_level: {
      lexical: { cefr_level: 'A2', score: 35 },
      syntactic: { cefr_level: 'A2', score: 40 },
      auditory: { cefr_level: 'A1', score: 20 },
      overall_cefr_level: { cefr_level: 'A2', score: 32 },
      updated_at: '2024-01-15T10:00:00Z',
    },
    total_time_spent_minutes: 500,
    achievements: [
      {
        code: 'first_step',
        name: '첫 걸음',
        description: '첫 번째 레슨 완료',
        category: 'beginner',
        achieved: true,
        achieved_at: '2024-01-10T10:00:00Z',
      },
      {
        code: 'week_warrior',
        name: '일주일 전사',
        description: '7일 연속 학습',
        category: 'streak',
        achieved: false,
        achieved_at: null,
      },
    ],
  },
  audioGeneration: {
    generated_content_id: 123,
    title: 'Technology and Innovation',
    audio_url: 'https://example.com/audio/generated.mp3',
    sentences: [
      { id: '1', start_time: '0', text: 'Technology is rapidly evolving.' },
      { id: '2', start_time: '3', text: 'Innovation drives progress.' },
    ],
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
    mockGetStatsFailure: (message = 'Failed to fetch stats') => {
      mockCustomFetch.mockRejectedValueOnce(new Error(message));
    },
    mockGetAudioHistorySuccess: () => {
      mockCustomFetch.mockResolvedValueOnce(mockApiResponses.audioHistory);
    },
    mockGetAudioHistoryEmpty: () => {
      mockCustomFetch.mockResolvedValueOnce({
        items: [],
        total: 0,
        limit: 20,
        offset: 0,
      });
    },
    mockGetAudioHistoryFailure: (message = 'Failed to fetch history') => {
      mockCustomFetch.mockRejectedValueOnce(new Error(message));
    },
    mockGenerateAudioSuccess: () => {
      mockCustomFetch.mockResolvedValueOnce(mockApiResponses.audioGeneration);
    },
    mockGenerateAudioFailure: (message = 'Failed to generate audio') => {
      mockCustomFetch.mockRejectedValueOnce(new Error(message));
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
