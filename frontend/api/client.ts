import { USER_QUERY_KEY } from '@/constants/queryKeys';
import { queryClient } from '@/lib/QueryProvider';
import {
  deleteRefreshToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from '@/utils/tokenManager';

export type RefreshResponse = {
  accessToken: string;
};

export type ApiError = Error & {
  status?: number;
  data?: unknown;
};

type PendingRequest = {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
};

let isRefreshing = false;
let failedQueue: PendingRequest[] = [];

const getBaseUrl = (): string => {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('API base URL is not configured. Set EXPO_PUBLIC_API_URL.');
  }
  return baseUrl;
};

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

const buildApiError = (
  status: number,
  message: string,
  data?: unknown,
): ApiError => {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.data = data;
  return error;
};

const parseErrorResponse = async (response: Response): Promise<ApiError> => {
  const rawBody = await response.text().catch(() => '');
  let parsed: unknown;
  let message = 'API 요청에 실패했습니다.';

  if (rawBody) {
    try {
      parsed = JSON.parse(rawBody);
      if (parsed && typeof parsed === 'object' && 'message' in parsed) {
        const parsedMessage = (parsed as Record<string, unknown>).message;
        if (typeof parsedMessage === 'string' && parsedMessage.trim()) {
          message = parsedMessage;
        }
      } else if (rawBody.trim()) {
        message = rawBody;
      }
    } catch {
      if (rawBody.trim()) {
        message = rawBody;
      }
    }
  }

  return buildApiError(response.status, message, parsed);
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  if (!text.trim()) {
    return null as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('json')) {
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as T;
    }
  }

  return text as T;
};

const refreshAccessToken = async (): Promise<RefreshResponse> => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw buildApiError(401, 'No refresh token available.');
  }

  const response = await fetch(`${getBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return parseResponse<RefreshResponse>(response);
};

export const customFetch = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const baseUrl = getBaseUrl();
  const headers = new Headers(options.headers as HeadersInit);
  const hasJsonBody =
    options.body != null && !(options.body instanceof FormData);

  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const requestInit: RequestInit = {
    ...options,
    headers,
  };

  let response = await fetch(`${baseUrl}/api/v1${endpoint}`, requestInit);

  if (response.status === 401) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(customFetch(endpoint, options)),
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const { accessToken: newAccessToken } = await refreshAccessToken();
      setAccessToken(newAccessToken);
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      processQueue(null, newAccessToken);
      response = await fetch(`${baseUrl}${endpoint}`, {
        ...requestInit,
        headers,
      });
    } catch (refreshError) {
      const status =
        refreshError &&
        typeof refreshError === 'object' &&
        'status' in refreshError
          ? ((refreshError as ApiError).status ?? 401)
          : 401;
      const data =
        refreshError &&
        typeof refreshError === 'object' &&
        'data' in refreshError
          ? (refreshError as ApiError).data
          : undefined;
      const failureError = buildApiError(
        status,
        '세션이 만료되었습니다. 다시 로그인해주세요.',
        data,
      );
      processQueue(failureError, null);
      setAccessToken(null);
      deleteRefreshToken();
      queryClient.setQueryData(USER_QUERY_KEY, null);
      throw failureError;
    } finally {
      isRefreshing = false;
    }
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return parseResponse<T>(response);
};
