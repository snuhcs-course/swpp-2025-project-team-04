import { customFetch } from './client';

export type Interest = {
  key: string;
  category: string;
  label: string;
};

export type User = {
  id: number;
  username: string;
  nickname: string;
  level: string;
  level_updated_at: string;
  initial_level_completed: boolean;
  level_score: number;
  interests: Interest[];
};

export type UpdateInterestsPayload = {
  interests: string[];
};

export type UpdateInterestsResponse = {
  interests: Interest[];
};

export const getMe = async (): Promise<User> => {
  return customFetch<User>('/user/me', {
    method: 'GET',
  });
};

export const updateInterests = async (
  interests: UpdateInterestsPayload,
): Promise<UpdateInterestsResponse> => {
  return customFetch<UpdateInterestsResponse>('/user/me/interests', {
    method: 'PUT',
    body: JSON.stringify(interests),
  });
};
