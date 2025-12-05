import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as initialSurveyAPI from '@/api/initialSurvey';
import * as userAPI from '@/api/user';
import {
  useSubmitLevelTest,
  useSubmitManualLevel,
  useUpdateInterests,
} from '../mutations/useInitialSurveyMutations';
import type {
  LevelTestResponse,
  ManualLevelResponse,
} from '@/api/initialSurvey';
import type { UpdateInterestsResponse } from '@/api/user';

jest.mock('@/api/initialSurvey');
jest.mock('@/api/user');

describe('useInitialSurveyMutations', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return wrapper;
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

  describe('useSubmitLevelTest', () => {
    it('레벨 테스트 제출 성공', async () => {
      const mockResponse: LevelTestResponse = {
        level: 'intermediate',
        score: 75,
        message: 'Level test completed',
      };

      (initialSurveyAPI.submitLevelTest as jest.Mock).mockResolvedValue(
        mockResponse,
      );

      const { result } = renderHook(() => useSubmitLevelTest(), {
        wrapper: createWrapper(),
      });

      const testData = {
        levelId: 'level-1',
        percentages: [80, 70, 75, 65],
      };

      result.current.mutate(testData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(initialSurveyAPI.submitLevelTest).toHaveBeenCalledWith(
        'level-1',
        [80, 70, 75, 65],
      );
      expect(result.current.data).toEqual(mockResponse);
    });

    it('레벨 테스트 제출 실패 시 에러 처리', async () => {
      const error = new Error('Failed to submit level test');
      (initialSurveyAPI.submitLevelTest as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useSubmitLevelTest(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        levelId: 'level-1',
        percentages: [80, 70, 75, 65],
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });

    it('다양한 퍼센티지 배열로 제출', async () => {
      const mockResponse: LevelTestResponse = {
        level: 'beginner',
        score: 45,
        message: 'Level test completed',
      };

      (initialSurveyAPI.submitLevelTest as jest.Mock).mockResolvedValue(
        mockResponse,
      );

      const { result } = renderHook(() => useSubmitLevelTest(), {
        wrapper: createWrapper(),
      });

      const testData = {
        levelId: 'level-2',
        percentages: [40, 50, 45, 50],
      };

      result.current.mutate(testData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(initialSurveyAPI.submitLevelTest).toHaveBeenCalledWith(
        'level-2',
        [40, 50, 45, 50],
      );
      expect(result.current.data?.level).toBe('beginner');
    });

    it('빈 퍼센티지 배열로 제출', async () => {
      const mockResponse: LevelTestResponse = {
        level: 'beginner',
        score: 0,
        message: 'Level test completed',
      };

      (initialSurveyAPI.submitLevelTest as jest.Mock).mockResolvedValue(
        mockResponse,
      );

      const { result } = renderHook(() => useSubmitLevelTest(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        levelId: 'level-3',
        percentages: [],
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(initialSurveyAPI.submitLevelTest).toHaveBeenCalledWith(
        'level-3',
        [],
      );
    });
  });

  describe('useSubmitManualLevel', () => {
    it('수동 레벨 설정 성공', async () => {
      const mockResponse: ManualLevelResponse = {
        level: 'advanced',
        message: 'Level set successfully',
      };

      (initialSurveyAPI.submitManualLevel as jest.Mock).mockResolvedValue(
        mockResponse,
      );

      const { result } = renderHook(() => useSubmitManualLevel(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ levelId: 'advanced-level' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(initialSurveyAPI.submitManualLevel).toHaveBeenCalledWith(
        'advanced-level',
      );
      expect(result.current.data).toEqual(mockResponse);
    });

    it('수동 레벨 설정 실패 시 에러 처리', async () => {
      const error = new Error('Invalid level ID');
      (initialSurveyAPI.submitManualLevel as jest.Mock).mockRejectedValue(
        error,
      );

      const { result } = renderHook(() => useSubmitManualLevel(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ levelId: 'invalid-level' });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });

    it('다양한 레벨 ID로 설정', async () => {
      const levels = [
        { id: 'beginner', response: 'beginner' },
        { id: 'intermediate', response: 'intermediate' },
        { id: 'advanced', response: 'advanced' },
      ];

      for (const level of levels) {
        const mockResponse: ManualLevelResponse = {
          level: level.response,
          message: `Level set to ${level.response}`,
        };

        (initialSurveyAPI.submitManualLevel as jest.Mock).mockResolvedValue(
          mockResponse,
        );

        const { result } = renderHook(() => useSubmitManualLevel(), {
          wrapper: createWrapper(),
        });

        result.current.mutate({ levelId: level.id });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(initialSurveyAPI.submitManualLevel).toHaveBeenCalledWith(
          level.id,
        );
        expect(result.current.data?.level).toBe(level.response);

        jest.clearAllMocks();
      }
    });

    it('로딩 상태 확인', async () => {
      let resolvePromise: (value: ManualLevelResponse) => void;
      const promise = new Promise<ManualLevelResponse>((resolve) => {
        resolvePromise = resolve;
      });

      (initialSurveyAPI.submitManualLevel as jest.Mock).mockReturnValue(
        promise,
      );

      const { result } = renderHook(() => useSubmitManualLevel(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ levelId: 'test-level' });

      await waitFor(() => expect(result.current.isPending).toBe(true));

      const mockResponse: ManualLevelResponse = {
        level: 'intermediate',
        message: 'Level set successfully',
      };

      resolvePromise!(mockResponse);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('useUpdateInterests', () => {
    it('관심사 업데이트 성공', async () => {
      const mockResponse: UpdateInterestsResponse = {
        message: 'Interests updated successfully',
        interests: ['music', 'sports', 'technology'],
      };

      (userAPI.updateInterests as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateInterests(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ interests: ['music', 'sports', 'technology'] });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(userAPI.updateInterests).toHaveBeenCalledWith({
        interests: ['music', 'sports', 'technology'],
      });
      expect(result.current.data).toEqual(mockResponse);
    });

    it('관심사 업데이트 실패 시 에러 처리', async () => {
      const error = new Error('Failed to update interests');
      (userAPI.updateInterests as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateInterests(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ interests: ['invalid'] });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });
  });
});
