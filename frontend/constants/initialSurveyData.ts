import type { Level } from '@/components/initial-survey/LevelSelector';
import type { TopicCategory } from '@/components/initial-survey/TopicGrid';

export const LISTENING_LEVELS: Level[] = [
  { id: '1', title: '(A1) 초보자' },
  { id: '2', title: '(A2) 기본 이해' },
  { id: '3', title: '(B1) 일상 대화 가능' },
  { id: '4', title: '(B2) 자연스러운 대화 가능' },
  { id: '5', title: '(C1) 전문적인 이해' },
  { id: '6', title: '(C2) 원어민 수준' },
];

export const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    category: '시사·뉴스',
    topics: [
      { id: '정치', label: '🏛️ 정치' },
      { id: '경제', label: '💰 경제' },
      { id: '사회', label: '👥 사회' },
      { id: '국제', label: '🌍 국제' },
      { id: '기술 트렌드', label: '🚀 기술 트렌드' },
    ],
  },
  {
    category: '라이프스타일',
    topics: [
      { id: '여행', label: '✈️ 여행' },
      { id: '음식', label: '🍴 음식' },
      { id: '건강', label: '💪 건강' },
      { id: '자기계발', label: '📈 자기계발' },
      { id: '재테크', label: '💵 재테크' },
    ],
  },
  {
    category: '문화·엔터테인먼트',
    topics: [
      { id: '영화/드라마', label: '🎬 영화/드라마' },
      { id: '음악', label: '🎵 음악' },
      { id: '스포츠', label: '⚽ 스포츠' },
      { id: '게임', label: '🎮 게임' },
      { id: '예술', label: '🎨 예술' },
    ],
  },
  {
    category: '지식·교육',
    topics: [
      { id: '과학', label: '🔬 과학' },
      { id: '역사', label: '📜 역사' },
      { id: '철학', label: '💭 철학' },
      { id: '심리학', label: '🧠 심리학' },
      { id: 'IT/AI', label: '🤖 IT/AI' },
      { id: '언어 학습', label: '📚 언어 학습' },
    ],
  },
  {
    category: '개인 경험·스토리',
    topics: [
      { id: '에세이', label: '✍️ 에세이' },
      { id: '인터뷰', label: '🎤 인터뷰' },
      { id: '일상 이야기', label: '💬 일상 이야기' },
    ],
  },
];

export const WELCOME_CONTENT = {
  title: 'LingoFit에 오신 것을 환영합니다! 🎧',
  subtitle: '여러분에게 꼭 맞는 영어 듣기 레벨을 찾아봅시다.',
  sections: [
    {
      heading: '이 설문이 왜 필요할까요?',
      content:
        '최고의 학습 경험을 제공하기 위해, 저희는 먼저 여러분의 현재 영어 듣기 실력을 파악해야 합니다. 이 짧은 설문은 여러분의 강점을 분석하고, 앞으로 가장 빠르게 성장할 수 있는 영역을 찾는 데 도움을 줄 것입니다.',
      highlight: "결과는 점수가 아닌, 여러분의 가장 효율적인 '시작점'입니다.",
    },
    {
      content:
        '솔직하게 답해 주시면, 저희 앱이 여러분만을 위한 맞춤 학습 계획을 세울 수 있습니다. 이를 통해 이미 아는 내용을 복습하며 시간을 낭비하거나, 너무 어려워서 흥미를 잃을 일이 없도록 도와드립니다.',
    },
  ],
};

export const MAX_TOPIC_SELECTIONS = 3;
export const TOTAL_SURVEY_PAGES = 7;
