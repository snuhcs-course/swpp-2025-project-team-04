import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as authAPI from '@/api/auth';
import * as userAPI from '@/api/user';
import * as tokenManager from '@/utils/tokenManager';
import {
  useSignup,
  useLogin,
  useLogout,
  useChangePassword,
  useDeleteAccount,
} from '../mutations/useAuthMutations';
import { USER_QUERY_KEY } from '@/constants/queryKeys';
import type { User } from '@/types/type';

jest.mock('@/api/auth');
jest.mock('@/api/user');
jest.mock('@/utils/tokenManager');
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    replace: mockReplace,
  })),
}));

describe('useAuthMutations', () => {
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

  describe('useSignup', () => {
    it('회원가입 성공 시 토큰 저장 및 라우팅', async () => {
      const mockUser = {
        id: 1,
        username: 'newuser',
        nickname: 'New User',
      } as User;
      const mockResponse = {
        user: mockUser,
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-456',
      };

      (authAPI.signup as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSignup(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        username: 'newuser',
        password: 'password123',
        nickname: 'New User',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(tokenManager.setAccessToken).toHaveBeenCalledWith(
        'access-token-123',
      );
      expect(tokenManager.saveRefreshToken).toHaveBeenCalledWith(
        'refresh-token-456',
      );
      expect(queryClient.getQueryData([USER_QUERY_KEY])).toEqual(mockUser);
      expect(mockReplace).toHaveBeenCalledWith('/initial-survey');
    });

    it('회원가입 실패 시 에러 처리', async () => {
      const error = new Error('Username already exists');
      (authAPI.signup as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useSignup(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        username: 'testuser',
        password: 'password123',
        nickname: 'Test User',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });
  });

  describe('useLogin', () => {
    it('로그인 성공 시 토큰 저장 및 라우팅', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        nickname: 'Test',
        initial_level_completed: true,
      } as User;
      const mockResponse = {
        user: mockUser,
        access_token: 'access-123',
        refresh_token: 'refresh-456',
      };

      (authAPI.login as jest.Mock).mockResolvedValue(mockResponse);
      (userAPI.getMe as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        username: 'testuser',
        password: 'password123',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(tokenManager.setAccessToken).toHaveBeenCalledWith('access-123');
      expect(tokenManager.saveRefreshToken).toHaveBeenCalledWith('refresh-456');
      expect(queryClient.getQueryData([USER_QUERY_KEY])).toEqual(mockUser);
      expect(mockReplace).toHaveBeenCalledWith('/');
    });

    it('로그인 실패 시 에러 처리', async () => {
      const error = new Error('Invalid credentials');
      (authAPI.login as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        username: 'testuser',
        password: 'wrongpassword',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });
  });

  describe('useLogout', () => {
    it('로그아웃 시 토큰 삭제 및 캐시 클리어', async () => {
      const mockUser = { id: 1, username: 'testuser' } as User;
      queryClient.setQueryData([USER_QUERY_KEY], mockUser);

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(),
      });

      await result.current();

      expect(tokenManager.setAccessToken).toHaveBeenCalledWith(null);
      expect(tokenManager.deleteRefreshToken).toHaveBeenCalled();
      expect(queryClient.getQueryData([USER_QUERY_KEY])).toBeUndefined();
    });
  });

  describe('useChangePassword', () => {
    it('비밀번호 변경 성공 시 사용자 캐시 유지', async () => {
      const mockUser = { id: 1, username: 'testuser' } as User;
      queryClient.setQueryData([USER_QUERY_KEY], mockUser);

      const mockResponse = { message: 'Password changed successfully' };
      (authAPI.changePassword as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useChangePassword(), {
        wrapper: createWrapper(),
      });

      const passwordData = {
        currentPassword: 'oldpass123',
        newPassword: 'newpass456',
      };

      result.current.mutate(passwordData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(authAPI.changePassword).toHaveBeenCalled();
      expect((authAPI.changePassword as jest.Mock).mock.calls[0][0]).toEqual(
        passwordData,
      );
      expect(queryClient.getQueryData([USER_QUERY_KEY])).toEqual(mockUser);
    });

    it('비밀번호 변경 실패 시 사용자 캐시 복원', async () => {
      const mockUser = { id: 1, username: 'testuser' } as User;
      queryClient.setQueryData([USER_QUERY_KEY], mockUser);

      const error = new Error('Current password is incorrect');
      (authAPI.changePassword as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useChangePassword(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        currentPassword: 'wrongpass',
        newPassword: 'newpass456',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(queryClient.getQueryData([USER_QUERY_KEY])).toEqual(mockUser);
    });

    it('context가 undefined일 때 onError 안전하게 처리', async () => {
      const error = new Error('Some error');
      (authAPI.changePassword as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useChangePassword(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        currentPassword: 'oldpass123',
        newPassword: 'newpass456',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });

    it('context가 undefined일 때 onSuccess 안전하게 처리', async () => {
      const mockResponse = { message: 'Password changed successfully' };
      (authAPI.changePassword as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useChangePassword(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        currentPassword: 'oldpass123',
        newPassword: 'newpass456',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useDeleteAccount', () => {
    it('계정 삭제 성공 시 사용자 캐시 제거', async () => {
      const mockUser = { id: 1, username: 'testuser' } as User;
      queryClient.setQueryData([USER_QUERY_KEY], mockUser);

      const mockResponse = { message: 'Account deleted successfully' };
      (authAPI.deleteAccount as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteAccount(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(authAPI.deleteAccount).toHaveBeenCalled();
      expect(queryClient.getQueryData([USER_QUERY_KEY])).toBeNull();
    });

    it('계정 삭제 실패 시 에러 처리', async () => {
      const error = new Error('Failed to delete account');
      (authAPI.deleteAccount as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteAccount(), {
        wrapper: createWrapper(),
      });

      result.current.mutate();

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(error);
    });
  });
});
