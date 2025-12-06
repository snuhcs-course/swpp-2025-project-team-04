export const normalizeWord = (word: string): string => {
  return (word || '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}'-]/gu, '');
};

export const makeVocabKey = (sentenceIndex: number, word: string): string => {
  return `${sentenceIndex}:${normalizeWord(word)}`;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};
