import { User } from '@/types/type';
import { customFetch } from './client';

export const getUserById = async (userId: number): Promise<User> => {
  return customFetch<User>(`/users/${userId}`, {
    method: 'GET',
  });
};
