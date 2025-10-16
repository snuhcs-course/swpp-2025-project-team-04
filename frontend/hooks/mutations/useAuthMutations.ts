import { login, signup } from '@/api/auth';
import { USER_QUERY_KEY } from '@/constants/queryKeys';
import type { User } from '@/types/type';
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
      queryClient.setQueryData<User | null>(USER_QUERY_KEY, data.user);
      setAccessToken(data.access_token);
      saveRefreshToken(data.refresh_token);
      console.log('회원가입 성공 및 모든 토큰/정보 저장 완료');
      router.replace('/');
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
      queryClient.setQueryData(USER_QUERY_KEY, data.user);
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
    queryClient.setQueryData<User | null>(USER_QUERY_KEY, null);
  }, [queryClient]);
};
