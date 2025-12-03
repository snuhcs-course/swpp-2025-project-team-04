import type { ApiError } from '@/api/client';
import { getAudioHistory, type AudioHistoryResponse } from '@/api/audioHistory';
import { AUDIO_HISTORY_QUERY_KEY } from '@/constants/queryKeys';
import { useInfiniteQuery } from '@tanstack/react-query';

export const useAudioHistory = (limit: number = 20) => {
  return useInfiniteQuery<AudioHistoryResponse, ApiError>({
    queryKey: [AUDIO_HISTORY_QUERY_KEY, limit],
    queryFn: ({ pageParam = 0 }) => {
      return getAudioHistory({ limit, offset: pageParam as number });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce(
        (sum, page) => sum + page.items.length,
        0,
      );
      if (lastPage.items.length < limit || totalLoaded >= lastPage.total) {
        return undefined;
      }
      return totalLoaded;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};
