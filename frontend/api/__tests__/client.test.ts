import { getBaseUrl, customFetch } from '../client';
import * as tokenManager from '@/utils/tokenManager';
import { queryClient } from '@/lib/QueryProvider';

jest.mock('@/utils/tokenManager');
jest.mock('@/lib/QueryProvider', () => ({
  queryClient: {
    setQueryData: jest.fn(),
  },
}));

global.fetch = jest.fn();

describe('client', () => {
  const originalEnv = process.env;

  beforeAll(() => {
    process.env = {
      ...originalEnv,
      EXPO_PUBLIC_API_URL: 'https://api.test.com',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (tokenManager.getAccessToken as jest.Mock).mockReturnValue('access-token');
    (tokenManager.getRefreshToken as jest.Mock).mockResolvedValue(
      'refresh-token',
    );
  });

  describe('getBaseUrl', () => {
    it('하드코딩된 베이스 URL 반환', () => {
      const baseUrl = getBaseUrl();
      expect(baseUrl).toBe('http://52.78.135.45:3000');
    });

    it('환경 변수가 없어도 하드코딩된 URL 사용', () => {
      const baseUrl = getBaseUrl();
      expect(baseUrl).toBeTruthy();
      expect(typeof baseUrl).toBe('string');
    });
  });

  describe('customFetch - basic requests', () => {
    it('makes successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
      });

      const result = await customFetch('/test');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://52.78.135.45:3000/api/v1/test',
        expect.objectContaining({
          headers: expect.any(Headers),
        }),
      );
    });

    it('adds Authorization header when access token exists', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue('{}'),
      });

      await customFetch('/test');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const headers = callArgs[1].headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer access-token');
    });

    it('handles 204 No Content response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Headers(),
        text: jest.fn().mockResolvedValue(''),
      });

      const result = await customFetch('/test');

      expect(result).toBeNull();
    });

    it('handles empty response body', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue(''),
      });

      const result = await customFetch('/test');

      expect(result).toBeNull();
    });

    it('handles non-JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: jest.fn().mockResolvedValue('Plain text response'),
      });

      const result = await customFetch('/test');

      expect(result).toBe('Plain text response');
    });

    it('sets Content-Type header for JSON body', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: jest.fn().mockResolvedValue('{}'),
      });

      await customFetch('/test', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' }),
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const headers = callArgs[1].headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('customFetch - error handling', () => {
    it('extracts error message from JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        text: jest
          .fn()
          .mockResolvedValue(JSON.stringify({ message: 'Invalid input' })),
      });

      await expect(customFetch('/test')).rejects.toThrow('Invalid input');
    });

    it('extracts nested error messages', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            error: { detail: 'Nested error message' },
          }),
        ),
      });

      await expect(customFetch('/test')).rejects.toThrow(
        'Nested error message',
      );
    });

    it('handles array error messages', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        text: jest
          .fn()
          .mockResolvedValue(JSON.stringify({ errors: ['Error 1', 'Error 2'] })),
      });

      await expect(customFetch('/test')).rejects.toThrow('Error 1');
    });

    it('detects username duplicate error in English', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        text: jest
          .fn()
          .mockResolvedValue(
            JSON.stringify({ message: 'Username already exists' }),
          ),
      });

      await expect(customFetch('/test')).rejects.toThrow(
        '이미 사용 중인 아이디입니다.',
      );
    });

    it('detects username duplicate error in Korean', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        text: jest
          .fn()
          .mockResolvedValue(JSON.stringify({ message: '이미 등록된 사용자' })),
      });

      await expect(customFetch('/test')).rejects.toThrow(
        '이미 사용 중인 아이디입니다.',
      );
    });

    it('detects username duplicate in field error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            username: ['This username is already taken'],
          }),
        ),
      });

      await expect(customFetch('/test')).rejects.toThrow(
        '이미 사용 중인 아이디입니다.',
      );
    });

    it('uses default error message for unparseable response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
        text: jest.fn().mockResolvedValue(''),
      });

      await expect(customFetch('/test')).rejects.toThrow(
        'API 요청에 실패했습니다.',
      );
    });

    it('uses plain text as error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        text: jest.fn().mockResolvedValue('Plain text error'),
      });

      await expect(customFetch('/test')).rejects.toThrow('Plain text error');
    });
  });

  describe('customFetch - token refresh', () => {
    it('refreshes token on 401 and retries request', async () => {
      const mockData = { success: true };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          headers: new Headers(),
          text: jest.fn().mockResolvedValue('Unauthorized'),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              access_token: 'new-access-token',
              refresh_token: 'new-refresh-token',
            }),
          ),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: jest.fn().mockResolvedValue(JSON.stringify(mockData)),
        });

      const result = await customFetch('/protected');

      expect(result).toEqual(mockData);
      expect(tokenManager.setAccessToken).toHaveBeenCalledWith(
        'new-access-token',
      );
      expect(tokenManager.saveRefreshToken).toHaveBeenCalledWith(
        'new-refresh-token',
      );
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('saves new refresh token from rotation', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          headers: new Headers(),
          text: jest.fn().mockResolvedValue('Unauthorized'),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              access_token: 'new-access',
              refresh_token: 'rotated-refresh',
            }),
          ),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: jest.fn().mockResolvedValue('{}'),
        });

      await customFetch('/test');

      expect(tokenManager.saveRefreshToken).toHaveBeenCalledWith(
        'rotated-refresh',
      );
    });

    it('queues concurrent 401 requests during token refresh', async () => {
      let refreshCallCount = 0;

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/auth/refresh')) {
          refreshCallCount++;
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Headers({ 'content-type': 'application/json' }),
            text: jest.fn().mockResolvedValue(
              JSON.stringify({
                access_token: 'new-token',
                refresh_token: 'new-refresh',
              }),
            ),
          });
        }

        return Promise.resolve({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          headers: new Headers(),
          text: jest.fn().mockResolvedValue('Unauthorized'),
        });
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          headers: new Headers(),
          text: jest.fn().mockResolvedValue('Unauthorized'),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: jest.fn().mockResolvedValue(
            JSON.stringify({
              access_token: 'new-token',
              refresh_token: 'new-refresh',
            }),
          ),
        })
        .mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: jest.fn().mockResolvedValue('{}'),
        });

      await Promise.all([customFetch('/test1'), customFetch('/test2')]);

      expect(tokenManager.setAccessToken).toHaveBeenCalled();
    });

    it('clears tokens and user data on refresh failure', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          headers: new Headers(),
          text: jest.fn().mockResolvedValue('Unauthorized'),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          headers: new Headers(),
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ message: 'Invalid token' })),
        });

      await expect(customFetch('/test')).rejects.toThrow(
        '로그인에 실패했습니다.',
      );

      expect(tokenManager.setAccessToken).toHaveBeenCalledWith(null);
      expect(tokenManager.deleteRefreshToken).toHaveBeenCalled();
      expect(queryClient.setQueryData).toHaveBeenCalledWith(
        expect.arrayContaining(['user']),
        null,
      );
    });

    it('throws error when no refresh token available', async () => {
      (tokenManager.getRefreshToken as jest.Mock).mockResolvedValue(null);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
        text: jest.fn().mockResolvedValue('Unauthorized'),
      });

      await expect(customFetch('/test')).rejects.toThrow(
        '로그인에 실패했습니다.',
      );
    });
  });
});
