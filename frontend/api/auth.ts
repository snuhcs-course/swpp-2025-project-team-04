import { customFetch } from './client';
import { User } from './user';

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

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  message: string;
};

export type DeleteAccountResponse = {
  message: string;
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

export const changePassword = async (
  payload: ChangePasswordPayload,
): Promise<ChangePasswordResponse> => {
  return customFetch<ChangePasswordResponse>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: payload.currentPassword,
      new_password: payload.newPassword,
    }),
  });
};

export const deleteAccount = async (): Promise<DeleteAccountResponse> => {
  return customFetch<DeleteAccountResponse>('/auth/delete-account', {
    method: 'DELETE',
  });
};
