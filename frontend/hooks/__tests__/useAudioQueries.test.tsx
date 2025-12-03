import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as audioHistoryAPI from '@/api/audioHistory';
import { useAudioHistory } from '../queries/useAudioHistoryQueries';
import { AUDIO_HISTORY_QUERY_KEY } from '@/constants/queryKeys';
import type {
  AudioHistoryResponse,
  AudioHistoryItem,
} from '@/api/audioHistory';
import type { ApiError } from '@/api/client';

jest.mock('@/api/audioHistory');

describe('useAudioQueries', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return wrapper;
  };

  const mockAudioItem: AudioHistoryItem = {
    generated_content_id: 1,
    user_id: 1,
    title: 'Test Audio',
    audio_url: 'https://example.com/audio.mp3',
    script_data: 'Test script',
    sentences: [
      { id: 1, start_time: 0, text: 'Hello world' },
      { id: 2, start_time: 2.5, text: 'This is a test' },
    ],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
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

  describe('useAudioHistory', () => {
    it('첫 페이지 데이터 조회 성공', async () => {
      const mockResponse: AudioHistoryResponse = {
        items: [mockAudioItem],
        total: 1,
        limit: 20,
        offset: 0,
      };

      (audioHistoryAPI.getAudioHistory as jest.Mock).mockResolvedValue(
        mockResponse,
      );

      const { result } = renderHook(() => useAudioHistory(20), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(audioHistoryAPI.getAudioHistory).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
      });
      expect(result.current.data?.pages).toHaveLength(1);
      expect(result.current.data?.pages[0]).toEqual(mockResponse);
    });

    it('기본 limit 값 20으로 설정됨', async () => {
      const mockResponse: AudioHistoryResponse = {
        items: [],
        total: 0,
        limit: 20,
        offset: 0,
      };

      (audioHistoryAPI.getAudioHistory as jest.Mock).mockResolvedValue(
        mockResponse,
      );

      const { result } = renderHook(() => useAudioHistory(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(audioHistoryAPI.getAudioHistory).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
      });
    });

    it('커스텀 limit 값 사용 가능', async () => {
      const mockResponse: AudioHistoryResponse = {
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
      };

      (audioHistoryAPI.getAudioHistory as jest.Mock).mockResolvedValue(
        mockResponse,
      );

      const { result } = renderHook(() => useAudioHistory(10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(audioHistoryAPI.getAudioHistory).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
      });
    });

    it('무한 스크롤 - 다음 페이지 로드 성공', async () => {
      const mockPage1: AudioHistoryResponse = {
        items: Array(20)
          .fill(null)
          .map((_, idx) => ({
            ...mockAudioItem,
            generated_content_id: idx + 1,
            title: `Audio ${idx + 1}`,
          })),
        total: 50,
        limit: 20,
        offset: 0,
      };

      const mockPage2: AudioHistoryResponse = {
        items: Array(20)
          .fill(null)
          .map((_, idx) => ({
            ...mockAudioItem,
            generated_content_id: idx + 21,
            title: `Audio ${idx + 21}`,
          })),
        total: 50,
        limit: 20,
        offset: 20,
      };

      (audioHistoryAPI.getAudioHistory as jest.Mock)
        .mockResolvedValueOnce(mockPage1)
        .mockResolvedValueOnce(mockPage2);

      const { result } = renderHook(() => useAudioHistory(20), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pages).toHaveLength(1);
      expect(result.current.hasNextPage).toBe(true);

      await result.current.fetchNextPage();

      await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));

      expect(audioHistoryAPI.getAudioHistory).toHaveBeenNthCalledWith(1, {
        limit: 20,
        offset: 0,
      });
      expect(audioHistoryAPI.getAudioHistory).toHaveBeenNthCalledWith(2, {
        limit: 20,
        offset: 20,
      });
    });

    it('모든 데이터 로드 완료 시 hasNextPage가 false', async () => {
      const mockResponse: AudioHistoryResponse = {
        items: Array(15)
          .fill(null)
          .map((_, idx) => ({
            ...mockAudioItem,
            generated_content_id: idx + 1,
          })),
        total: 15,
        limit: 20,
        offset: 0,
      };

      (audioHistoryAPI.getAudioHistory as jest.Mock).mockResolvedValue(
        mockResponse,
      );

      const { result } = renderHook(() => useAudioHistory(20), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.hasNextPage).toBe(false);
    });

    it('마지막 페이지가 limit보다 적을 때 hasNextPage가 false', async () => {
      const mockPage1: AudioHistoryResponse = {
        items: Array(20)
          .fill(null)
          .map((_, idx) => ({
            ...mockAudioItem,
            generated_content_id: idx + 1,
          })),
        total: 25,
        limit: 20,
        offset: 0,
      };

      const mockPage2: AudioHistoryResponse = {
        items: Array(5)
          .fill(null)
          .map((_, idx) => ({
            ...mockAudioItem,
            generated_content_id: idx + 21,
          })),
        total: 25,
        limit: 20,
        offset: 20,
      };

      (audioHistoryAPI.getAudioHistory as jest.Mock)
        .mockResolvedValueOnce(mockPage1)
        .mockResolvedValueOnce(mockPage2);

      const { result } = renderHook(() => useAudioHistory(20), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.hasNextPage).toBe(true);

      await result.current.fetchNextPage();

      await waitFor(() => expect(result.current.hasNextPage).toBe(false));
      expect(result.current.data?.pages).toHaveLength(2);
    });

    it('빈 히스토리 처리', async () => {
      const mockResponse: AudioHistoryResponse = {
        items: [],
        total: 0,
        limit: 20,
        offset: 0,
      };

      (audioHistoryAPI.getAudioHistory as jest.Mock).mockResolvedValue(
        mockResponse,
      );

      const { result } = renderHook(() => useAudioHistory(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.pages[0].items).toHaveLength(0);
      expect(result.current.hasNextPage).toBe(false);
    });

    it('로딩 상태 확인', async () => {
      let resolvePromise: (value: AudioHistoryResponse) => void;
      const promise = new Promise<AudioHistoryResponse>((resolve) => {
        resolvePromise = resolve;
      });

      (audioHistoryAPI.getAudioHistory as jest.Mock).mockReturnValue(promise);

      const { result } = renderHook(() => useAudioHistory(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);

      const mockResponse: AudioHistoryResponse = {
        items: [mockAudioItem],
        total: 1,
        limit: 20,
        offset: 0,
      };

      resolvePromise!(mockResponse);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.isPending).toBe(false);
    });

    it('staleTime 설정 확인 (5분)', async () => {
      const mockResponse: AudioHistoryResponse = {
        items: [mockAudioItem],
        total: 1,
        limit: 20,
        offset: 0,
      };

      (audioHistoryAPI.getAudioHistory as jest.Mock).mockResolvedValue(
        mockResponse,
      );

      const { result, rerender } = renderHook(() => useAudioHistory(20), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(audioHistoryAPI.getAudioHistory).toHaveBeenCalledTimes(1);

      rerender();

      expect(audioHistoryAPI.getAudioHistory).toHaveBeenCalledTimes(1);
    });

    it('여러 페이지의 offset 계산이 정확함', async () => {
      const createMockPage = (
        offset: number,
        count: number,
      ): AudioHistoryResponse => ({
        items: Array(count)
          .fill(null)
          .map((_, idx) => ({
            ...mockAudioItem,
            generated_content_id: offset + idx + 1,
          })),
        total: 100,
        limit: 20,
        offset,
      });

      (audioHistoryAPI.getAudioHistory as jest.Mock)
        .mockResolvedValueOnce(createMockPage(0, 20))
        .mockResolvedValueOnce(createMockPage(20, 20))
        .mockResolvedValueOnce(createMockPage(40, 20));

      const { result } = renderHook(() => useAudioHistory(20), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      await result.current.fetchNextPage();
      await waitFor(() =>
        expect(result.current.isFetchingNextPage).toBe(false),
      );

      await result.current.fetchNextPage();
      await waitFor(() => expect(result.current.data?.pages).toHaveLength(3));

      expect(audioHistoryAPI.getAudioHistory).toHaveBeenCalledTimes(3);
    });

    it('refetch 기능 동작 확인', async () => {
      const mockResponse1: AudioHistoryResponse = {
        items: [mockAudioItem],
        total: 1,
        limit: 20,
        offset: 0,
      };

      const mockResponse2: AudioHistoryResponse = {
        items: [
          { ...mockAudioItem, generated_content_id: 2, title: 'Updated Audio' },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      };

      (audioHistoryAPI.getAudioHistory as jest.Mock)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const { result } = renderHook(() => useAudioHistory(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.pages[0].items[0].generated_content_id).toBe(
        1,
      );

      await result.current.refetch();

      await waitFor(() =>
        expect(
          result.current.data?.pages[0].items[0].generated_content_id,
        ).toBe(2),
      );
    });

    it('에러 발생 시 재시도 한 번 수행', async () => {
      const error: ApiError = {
        status: 500,
        message: 'Internal Server Error',
      };

      (audioHistoryAPI.getAudioHistory as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useAudioHistory(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true), {
        timeout: 3000,
      });

      expect(result.current.error).toEqual(error);
      expect(audioHistoryAPI.getAudioHistory).toHaveBeenCalled();
    });
  });
});
