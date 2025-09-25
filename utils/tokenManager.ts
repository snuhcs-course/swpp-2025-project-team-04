import * as SecureStore from 'expo-secure-store';

// --- Access Token 관리 (메모리) ---
let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => {
  return inMemoryAccessToken;
};

// --- Refresh Token 관리 (보안 스토리지) ---
export const saveRefreshToken = (token: string) => {
  return SecureStore.setItemAsync('refreshToken', token);
};

export const getRefreshToken = () => {
  return SecureStore.getItemAsync('refreshToken');
};

export const deleteRefreshToken = () => {
  return SecureStore.deleteItemAsync('refreshToken');
};
