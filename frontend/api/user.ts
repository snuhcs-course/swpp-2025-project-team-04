import { User } from '@/types/type';
import { customFetch } from './client';

export const getMe = async (): Promise<User> => {
  return customFetch<User>('/users/me', {
    method: 'GET',
  });
};

export const getUserById = async (userId: number): Promise<User> => {
  return customFetch<User>(`/users/${userId}`, {
    method: 'GET',
  });
};
