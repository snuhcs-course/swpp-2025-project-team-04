import type { Level } from '@/components/initial-survey/LevelSelector';

export const LISTENING_LEVELS: Level[] = [
  { id: '1', title: '(A1) 초보자' },
  { id: '2', title: '(A2) 기본 이해' },
  { id: '3', title: '(B1) 일상 대화 가능' },
  { id: '4', title: '(B2) 자연스러운 대화 가능' },
  { id: '5', title: '(C1) 전문적인 이해' },
  { id: '6', title: '(C2) 원어민 수준' },
];

export const WELCOME_CONTENT = {
  title: 'LingoFit에 오신 것을 환영합니다! 🎧',
  subtitle: '여러분에게 꼭 맞는 영어 듣기 레벨을 찾아봅시다.',
  sections: [
    {
      heading: '왜 설문이 필요한가요?',
      content:
        '가장 효율적인 학습을 위해 현재 레벨을 파악합니다. 너무 쉽거나 어렵지 않은 맞춤형 콘텐츠를 추천해 드립니다.',
    },
    {
      content:
        "이 설문은 점수가 아닌, 여러분의 '시작점'을 찾는 과정입니다. 솔직한 답변은 학습 효과를 극대화합니다.",
    },
  ],
};

export const MAX_TOPIC_SELECTIONS = 3;
export const TOTAL_SURVEY_PAGES = 9;
