import type { ApiError } from '@/api/client';
import { getMe, User } from '@/api/user';
import { USER_QUERY_KEY } from '@/constants/queryKeys';
import { useQuery } from '@tanstack/react-query';

export const useUser = () => {
  return useQuery<User | null, ApiError>({
    queryKey: [USER_QUERY_KEY],
    queryFn: async () => {
      try {
        return await getMe();
      } catch (error) {
        if (isUnauthorizedError(error)) {
          return null;
        }
        throw error;
      }
    },
    initialData: null,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

const isUnauthorizedError = (error: unknown): error is ApiError => {
  return (
    Boolean(error) &&
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as ApiError).status === 401
  );
};
