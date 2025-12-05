import { validateUsername, validatePassword } from '../authValidation';

describe('authValidation', () => {
  describe('validateUsername', () => {
    it('빈 문자열이나 공백만 있을 때 에러 반환', () => {
      expect(validateUsername('')).toBe('아이디를 입력해주세요.');
      expect(validateUsername('   ')).toBe('아이디를 입력해주세요.');
    });

    it('내용이 있는 입력은 모두 허용', () => {
      expect(validateUsername('abc')).toBeNull();
      expect(validateUsername('user name')).toBeNull();
      expect(validateUsername('user@name')).toBeNull();
      expect(validateUsername('user-name')).toBeNull();
      expect(validateUsername('123')).toBeNull();
      expect(validateUsername('한글아이디')).toBeNull();
    });
  });

  describe('validatePassword', () => {
    it('빈 문자열 입력 시 에러 반환', () => {
      expect(validatePassword('')).toBe('비밀번호를 입력해주세요.');
    });

    it('3자 미만 입력 시 에러 반환', () => {
      expect(validatePassword('ab')).toBe('비밀번호는 3~30자여야 합니다.');
    });

    it('30자 초과 입력 시 에러 반환', () => {
      const longPassword = 'a'.repeat(31);
      expect(validatePassword(longPassword)).toBe(
        '비밀번호는 3~30자여야 합니다.',
      );
    });

    it('3~30자 길이는 모두 허용', () => {
      expect(validatePassword('abc')).toBeNull();
      expect(validatePassword('123')).toBeNull();
      expect(validatePassword('패스워드1')).toBeNull();
      expect(validatePassword('a'.repeat(30))).toBeNull();
    });
  });
});
