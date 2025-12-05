import type { ApiError } from '@/api/client';
import {
  getMyVocab,
  getVocab,
  deleteMyVocab,
  type VocabResponse,
  type MyVocab,
} from '@/api/vocab';
import { MY_VOCAB_QUERY_KEY, VOCAB_QUERY_KEY } from '@/constants/queryKeys';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useVocab = (generatedContentId: number) => {
  return useQuery<VocabResponse, ApiError>({
    queryKey: [VOCAB_QUERY_KEY, generatedContentId],
    queryFn: () => getVocab(generatedContentId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useMyVocab = () => {
  return useQuery<MyVocab[], ApiError>({
    queryKey: [MY_VOCAB_QUERY_KEY],
    queryFn: getMyVocab,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useDeleteMyVocab = () => {
  const qc = useQueryClient();

  return useMutation<void, ApiError, number>({
    mutationFn: (wordId: number) => deleteMyVocab(wordId),
    onSuccess: async (_, wordId) => {
      await qc.invalidateQueries({ queryKey: [MY_VOCAB_QUERY_KEY] });
    },
    onError: (err, wordId) => {
      console.error('📕 단어 삭제 실패:', wordId, err);
    },
  });
};
