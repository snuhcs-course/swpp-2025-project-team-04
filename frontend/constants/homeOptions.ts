export const STYLE_OPTIONS = {
  CASUAL_CONVERSATION: { label: '일상 대화', emoji: '🗨️' },
  NEWS: { label: '뉴스', emoji: '📰' },
  PODCAST: { label: '팟캐스트', emoji: '🎙️' },
  SHORT_STORY: { label: '단편 소설', emoji: '📖' },
  SPEECH: { label: '연설', emoji: '🎤' },
} as const;

// ------------------------------------------------------------------------------

export const THEME_OPTIONS = {
  POLITICS: {
    category: '시사·뉴스',
    label: '정치',
    emoji: '🏛️',
  },
  ECONOMY: {
    category: '시사·뉴스',
    label: '경제',
    emoji: '💰',
  },
  SOCIETY: {
    category: '시사·뉴스',
    label: '사회',
    emoji: '👥',
  },
  WORLD: {
    category: '시사·뉴스',
    label: '국제',
    emoji: '🌍',
  },
  TECHNOLOGY: {
    category: '시사·뉴스',
    label: '테크',
    emoji: '🚀',
  },

  TRAVEL: {
    category: '라이프스타일',
    label: '여행',
    emoji: '✈️',
  },
  FOOD: {
    category: '라이프스타일',
    label: '음식',
    emoji: '🍴',
  },
  HEALTH: {
    category: '라이프스타일',
    label: '건강',
    emoji: '💪',
  },
  SELF_IMPROVEMENT: {
    category: '라이프스타일',
    label: '자기계발',
    emoji: '📈',
  },
  FINANCE: {
    category: '라이프스타일',
    label: '재테크',
    emoji: '💵',
  },

  MOVIES_TV: {
    category: '문화·엔터테인먼트',
    label: '영화/드라마',
    emoji: '🎬',
  },
  MUSIC: {
    category: '문화·엔터테인먼트',
    label: '음악',
    emoji: '🎵',
  },
  SPORTS: {
    category: '문화·엔터테인먼트',
    label: '스포츠',
    emoji: '⚽',
  },
  GAMES: {
    category: '문화·엔터테인먼트',
    label: '게임',
    emoji: '🎮',
  },
  ART: {
    category: '문화·엔터테인먼트',
    label: '예술',
    emoji: '🎨',
  },

  SCIENCE: {
    category: '지식·교육',
    label: '과학',
    emoji: '🔬',
  },
  HISTORY: {
    category: '지식·교육',
    label: '역사',
    emoji: '📜',
  },
  PHILOSOPHY: {
    category: '지식·교육',
    label: '철학',
    emoji: '💭',
  },
  PSYCHOLOGY: {
    category: '지식·교육',
    label: '심리학',
    emoji: '🧠',
  },
  IT_AI: {
    category: '지식·교육',
    label: 'IT/AI',
    emoji: '🤖',
  },
} as const;
