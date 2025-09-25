import { login, logout, signup } from '@/api/auth';
import { USER_QUERY_KEY } from '@/constants/queryKeys';
import type { User } from '@/types/type';
import {
  deleteRefreshToken,
  saveRefreshToken,
  setAccessToken,
} from '@/utils/tokenManager';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

export const useSignup = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      // data: { user, accessToken, refreshToken }
      queryClient.setQueryData<User | null>(USER_QUERY_KEY, data.user);
      setAccessToken(data.accessToken);
      saveRefreshToken(data.refreshToken);
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
      setAccessToken(data.accessToken);
      saveRefreshToken(data.refreshToken);
      console.log('로그인 성공 및 모든 토큰/정보 저장 완료');
      router.replace('/');
    },
    onError: (error) => console.error('로그인 실패:', error),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<void, Error, void>({
    mutationFn: logout,
    onSuccess: () => {
      console.log('로그아웃 성공. 모든 로컬 인증 정보를 삭제합니다.');
      setAccessToken(null);
      deleteRefreshToken();
      queryClient.removeQueries({ queryKey: USER_QUERY_KEY });
      router.replace('/(auth)/login');
    },
  });
};
