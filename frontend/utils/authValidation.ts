// 3. username는 6~16자, 숫자와 영문 대/소문자만 허용

export const validateUsername = (username: string): string | null => {
  if (!username) return 'ID를 입력해주세요.';
  if (username.length < 6) return 'ID는 6자 이상이어야 합니다.';
  if (username.length > 16) return 'ID는 16자 이하여야 합니다.';
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return 'ID는 영문 대/소문자, 숫자, 언더스코어만 사용할 수 있습니다.';
  return null;
};

// 비밀번호는 8~32자, 숫자와 알파벳을 최소 1개 이상 포함
export const validatePassword = (password: string): string | null => {
  if (!password) return '비밀번호를 입력해주세요.';
  if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
  if (password.length > 32) return '비밀번호는 32자 이하여야 합니다.';
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
    return '비밀번호는 숫자와 영문자를 최소 1개 이상 포함해야 합니다.';
  return null;
};
