import { USER_QUERY_KEY } from '@/constants/queryKeys';
import { queryClient } from '@/lib/QueryProvider';
import {
  deleteRefreshToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  saveRefreshToken, // [추가] 새 리프레시 토큰 저장을 위해 import
} from '@/utils/tokenManager';

export type RefreshResponse = {
  accessToken: string;
};

// [추가] 서버 응답 타입을 정의 (스네이크 케이스)
type ServerAuthResponse = {
  access_token: string;
  refresh_token: string;
};

export type ApiError = Error & {
  status?: number;
  data?: unknown;
};

type PendingRequest = {
  resolve: () => void;
  reject: (error: Error) => void;
};

let isRefreshing = false;
let failedQueue: PendingRequest[] = [];

export const getBaseUrl = (): string => {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('API base URL is not configured. Set EXPO_PUBLIC_API_URL.');
  }
  return 'http://52.78.135.45:3000';
};

const DEFAULT_ERROR_MESSAGE = 'API 요청에 실패했습니다.';

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
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

const extractFirstString = (input: unknown): string | null => {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    return trimmed || null;
  }

  if (Array.isArray(input)) {
    for (const item of input) {
      const nested = extractFirstString(item);
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  if (input && typeof input === 'object') {
    const record = input as Record<string, unknown>;
    const prioritizedKeys = ['message', 'detail', 'error'];

    for (const key of prioritizedKeys) {
      if (key in record) {
        const nested = extractFirstString(record[key]);
        if (nested) {
          return nested;
        }
      }
    }

    for (const value of Object.values(record)) {
      const nested = extractFirstString(value);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
};

const isUsernameDuplicateError = (
  parsedBody: unknown,
  message?: string | null,
): boolean => {
  const normalizedMessage = message?.toLowerCase() ?? '';
  if (
    normalizedMessage.includes('username already') ||
    normalizedMessage.includes('username exists') ||
    normalizedMessage.includes('duplicate username') ||
    normalizedMessage.includes('이미 등록') ||
    normalizedMessage.includes('이미 존재') ||
    normalizedMessage.includes('중복')
  ) {
    return true;
  }

  if (!parsedBody || typeof parsedBody !== 'object') {
    return false;
  }

  if ('username' in parsedBody) {
    const usernameError = extractFirstString(
      (parsedBody as Record<string, unknown>).username,
    );
    if (!usernameError) {
      return false;
    }

    const normalized = usernameError.toLowerCase();
    return (
      normalized.includes('already') ||
      normalized.includes('exist') ||
      normalized.includes('taken') ||
      normalized.includes('duplicate') ||
      normalized.includes('이미') ||
      normalized.includes('중복')
    );
  }

  return false;
};

const localizeErrorMessage = (
  parsedBody: unknown,
  message: string | null,
): string | null => {
  if (isUsernameDuplicateError(parsedBody, message)) {
    return '이미 사용 중인 아이디입니다.';
  }

  return null;
};

const parseErrorResponse = async (response: Response): Promise<ApiError> => {
  const rawBody = await response.text().catch(() => '');
  let parsed: unknown;
  let message: string | null = null;

  if (rawBody) {
    try {
      parsed = JSON.parse(rawBody);
      message = extractFirstString(parsed);
    } catch {
      const trimmed = rawBody.trim();
      message = trimmed || null;
    }
  }

  if (!message && rawBody.trim()) {
    message = rawBody.trim();
  }

  const localizedMessage = localizeErrorMessage(parsed, message);
  const finalMessage = localizedMessage ?? message ?? DEFAULT_ERROR_MESSAGE;

  return buildApiError(response.status, finalMessage, parsed ?? rawBody);
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

// --- [수정된 부분] ---
const refreshAccessToken = async (): Promise<RefreshResponse> => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw buildApiError(401, 'No refresh token available.');
  }

  const response = await fetch(`${getBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // 1. 서버 스펙에 맞춰 키 이름을 refresh_token으로 변경
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  // 2. 서버 응답 파싱 (스네이크 케이스)
  const data = await parseResponse<ServerAuthResponse>(response);

  // 3. [중요] Refresh Token Rotation 처리
  // 서버가 새 리프레시 토큰을 주면 반드시 저장해야 함.
  // 이걸 안 하면 다음 갱신 때 구버전 토큰을 보내서 401 뜸.
  if (data.refresh_token) {
    await saveRefreshToken(data.refresh_token);
  }

  // 4. 앱 내부에서 사용하는 카멜 케이스로 반환
  return {
    accessToken: data.access_token,
  };
};
// --------------------

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

  const fullUrl = `${baseUrl}/api/v1${endpoint}`;
  console.log(`[API Request] ${options.method || 'GET'} ${fullUrl}`);
  if (options.body) {
    console.log('[API Request Body]', options.body);
  }

  let response = await fetch(fullUrl, requestInit);

  console.log(`[API Response] ${response.status} ${response.statusText}`);

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

      // 재요청
      response = await fetch(fullUrl, {
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
        '로그인에 실패했습니다.',
        data,
      );
      processQueue(failureError, null);
      setAccessToken(null);
      deleteRefreshToken();
      queryClient.setQueryData([USER_QUERY_KEY], null);
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
