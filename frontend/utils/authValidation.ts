export const validateUsername = (username: string): string | null => {
  if (!username.trim()) return '아이디를 입력해주세요.';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return '비밀번호를 입력해주세요.';
  if (password.length < 3 || password.length > 30)
    return '비밀번호는 3~30자여야 합니다.';
  return null;
};
