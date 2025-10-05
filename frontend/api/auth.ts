import type { User } from '@/types/type';
import { customFetch } from './client';

// --- Types ---

export type SignupPayload = {
  username: string;
  password: string;
  nickname: string;
};

export type SignupResponse = {
  user?: User;
  access_token: string;
  refresh_token: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  user?: User;
  access_token: string;
  refresh_token: string;
};

// --- API functions ---

export const signup = async (
  payload: SignupPayload,
): Promise<SignupResponse> => {
  return customFetch<SignupResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  return customFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// export const logout = async (): Promise<void> => {
//   return customFetch<void>('/auth/logout', { method: 'POST' });
// };
