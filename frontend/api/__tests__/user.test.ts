import { getMe, updateInterests } from '../user';
import { customFetch } from '../client';

jest.mock('../client');

const mockCustomFetch = customFetch as jest.MockedFunction<typeof customFetch>;

describe('user API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('현재 사용자 정보 조회 성공', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        nickname: 'Test User',
        email: 'test@example.com',
      };

      mockCustomFetch.mockResolvedValue(mockUser);

      const result = await getMe();

      expect(mockCustomFetch).toHaveBeenCalledWith('/user/me', {
        method: 'GET',
      });
      expect(result).toEqual(mockUser);
    });

    it('인증되지 않은 경우 실패', async () => {
      const error = new Error('Unauthorized');
      mockCustomFetch.mockRejectedValue(error);

      await expect(getMe()).rejects.toThrow('Unauthorized');
    });

    it('네트워크 에러 처리', async () => {
      const error = new Error('Network error');
      mockCustomFetch.mockRejectedValue(error);

      await expect(getMe()).rejects.toThrow('Network error');
    });
  });

  describe('updateInterests', () => {
    it('관심사 업데이트 성공', async () => {
      const mockResponse = {
        interests: ['music', 'sports', 'technology'],
      };

      mockCustomFetch.mockResolvedValue(mockResponse);

      const result = await updateInterests(['music', 'sports', 'technology']);

      expect(mockCustomFetch).toHaveBeenCalledWith('/user/me/interests', {
        method: 'PUT',
        body: JSON.stringify({ interests: ['music', 'sports', 'technology'] }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('빈 관심사 배열로 업데이트', async () => {
      const mockResponse = {
        interests: [],
      };

      mockCustomFetch.mockResolvedValue(mockResponse);

      const result = await updateInterests([]);

      expect(mockCustomFetch).toHaveBeenCalledWith('/user/me/interests', {
        method: 'PUT',
        body: JSON.stringify({ interests: [] }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('관심사 업데이트 실패', async () => {
      const error = new Error('Failed to update interests');
      mockCustomFetch.mockRejectedValue(error);

      await expect(updateInterests(['music'])).rejects.toThrow(
        'Failed to update interests',
      );
    });
  });
});
