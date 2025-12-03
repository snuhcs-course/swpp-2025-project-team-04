import { changePassword, deleteAccount, login, signup } from '@/api/auth';
import { User } from '@/api/user';
import { USER_QUERY_KEY } from '@/constants/queryKeys';
import {
  deleteRefreshToken,
  saveRefreshToken,
  setAccessToken,
} from '@/utils/tokenManager';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';

export const useSignup = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      // data: { user, accessToken, refreshToken }
      queryClient.setQueryData<User | null>([USER_QUERY_KEY], data.user);
      setAccessToken(data.access_token);
      saveRefreshToken(data.refresh_token);
      console.log('회원가입 성공 및 모든 토큰/정보 저장 완료');
      router.replace('/initial-survey');
    },
    onError: (error) => console.error('회원가입 실패:', error),
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // data: { user, accessToken, refreshToken }
      queryClient.setQueryData([USER_QUERY_KEY], data.user);
      setAccessToken(data.access_token);
      saveRefreshToken(data.refresh_token);
      console.log('로그인 성공 및 모든 토큰/정보 저장 완료');
      router.replace('/');
    },
    onError: (error) => console.error('로그인 실패:', error),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    setAccessToken(null);
    await deleteRefreshToken();
    queryClient.setQueryData<User | null>([USER_QUERY_KEY], null);
    await queryClient.cancelQueries();
    queryClient.clear();
  }, [queryClient]);
};

export const useChangePassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changePassword,
    // Prevent transient loss of cached user while password-change may
    // trigger a short-lived 401/getMe failure (server may revoke tokens).
    // Capture current user and restore it after the mutation so the
    // global auth guard doesn't immediately redirect to the auth stack.
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [USER_QUERY_KEY] });
      const previousUser = queryClient.getQueryData([USER_QUERY_KEY]);
      return { previousUser };
    },
    onError: (_err, _vars, context) => {
      if (context && (context as any).previousUser !== undefined) {
        queryClient.setQueryData(
          [USER_QUERY_KEY],
          (context as any).previousUser,
        );
      }
    },
    onSuccess: (_data, _vars, context) => {
      // Restore previous user cache if it was overwritten by a concurrent
      // getMe returning 401 during password change.
      if (context && (context as any).previousUser !== undefined) {
        queryClient.setQueryData(
          [USER_QUERY_KEY],
          (context as any).previousUser,
        );
      }
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.setQueryData<User | null>([USER_QUERY_KEY], null);
    },
  });
};
