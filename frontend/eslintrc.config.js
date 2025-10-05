module.exports = {
  root: true,
  extends: [
    'expo', // Expo 기본 설정
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // TypeScript 추천 규칙
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier', // Prettier와 충돌하는 ESLint 규칙 비활성화
  ],
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'prettier',
    'simple-import-sort',
  ],
  parser: '@typescript-eslint/parser',
  rules: {
    'prettier/prettier': 'error', // Prettier 규칙을 어기면 ESLint 오류로 표시
    'react/react-in-jsx-scope': 'off', // React 17+ 에서는 불필요
    'react/prop-types': 'off', // TypeScript를 사용하므로 prop-types는 불필요
    'simple-import-sort/imports': 'error', // import 정렬 규칙을 켜고, 어길 시 에러 발생
    'simple-import-sort/exports': 'error', // export 정렬 규칙
  },
  settings: {
    react: {
      version: 'detect', // 설치된 React 버전을 자동으로 감지
    },
  },
  env: {
    node: true, // Node.js 환경(e.g. require)을 인식
  },
};
