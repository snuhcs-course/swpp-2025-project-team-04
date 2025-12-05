import { normalizeWord, makeVocabKey, clamp } from '../vocabHelpers';

describe('vocabHelpers', () => {
  describe('normalizeWord', () => {
    it('converts to lowercase', () => {
      expect(normalizeWord('Hello')).toBe('hello');
      expect(normalizeWord('WORLD')).toBe('world');
      expect(normalizeWord('TeSt')).toBe('test');
    });

    it('trims whitespace', () => {
      expect(normalizeWord('  hello  ')).toBe('hello');
      expect(normalizeWord('\thello\n')).toBe('hello');
      expect(normalizeWord(' test ')).toBe('test');
    });

    it('removes punctuation but keeps letters and numbers', () => {
      expect(normalizeWord('hello!')).toBe('hello');
      expect(normalizeWord('world?')).toBe('world');
      expect(normalizeWord('test,')).toBe('test');
      expect(normalizeWord('hello.')).toBe('hello');
    });

    it('preserves hyphens and apostrophes', () => {
      expect(normalizeWord("don't")).toBe("don't");
      expect(normalizeWord('self-esteem')).toBe('self-esteem');
      expect(normalizeWord("it's")).toBe("it's");
      expect(normalizeWord('twenty-one')).toBe('twenty-one');
    });

    it('handles numbers', () => {
      expect(normalizeWord('test123')).toBe('test123');
      expect(normalizeWord('hello2world')).toBe('hello2world');
    });

    it('handles empty or null input', () => {
      expect(normalizeWord('')).toBe('');
      expect(normalizeWord('   ')).toBe('');
    });

    it('handles mixed punctuation', () => {
      expect(normalizeWord('Hello, World!')).toBe('helloworld');
      expect(normalizeWord('(test)')).toBe('test');
      expect(normalizeWord('[example]')).toBe('example');
    });

    it('handles Unicode characters', () => {
      expect(normalizeWord('café')).toBe('café');
      expect(normalizeWord('日本語')).toBe('日本語');
      expect(normalizeWord('한글')).toBe('한글');
    });

    it('removes multiple punctuation marks', () => {
      expect(normalizeWord('hello!!!')).toBe('hello');
      expect(normalizeWord('what???')).toBe('what');
    });

    it('handles words with internal punctuation', () => {
      expect(normalizeWord('hello...world')).toBe('helloworld');
      expect(normalizeWord('test--case')).toBe('test--case');
    });
  });

  describe('makeVocabKey', () => {
    it('creates key with sentence index and normalized word', () => {
      expect(makeVocabKey(0, 'hello')).toBe('0:hello');
      expect(makeVocabKey(5, 'world')).toBe('5:world');
    });

    it('normalizes word in key', () => {
      expect(makeVocabKey(1, 'Hello')).toBe('1:hello');
      expect(makeVocabKey(2, 'WORLD!')).toBe('2:world');
      expect(makeVocabKey(3, '  test  ')).toBe('3:test');
    });

    it('handles different sentence indices', () => {
      expect(makeVocabKey(0, 'word')).toBe('0:word');
      expect(makeVocabKey(10, 'word')).toBe('10:word');
      expect(makeVocabKey(999, 'word')).toBe('999:word');
    });

    it('creates unique keys for same word in different sentences', () => {
      const key1 = makeVocabKey(0, 'apple');
      const key2 = makeVocabKey(1, 'apple');
      expect(key1).not.toBe(key2);
      expect(key1).toBe('0:apple');
      expect(key2).toBe('1:apple');
    });

    it('handles words with punctuation', () => {
      expect(makeVocabKey(0, "don't")).toBe("0:don't");
      expect(makeVocabKey(1, 'hello!')).toBe('1:hello');
    });

    it('handles empty words', () => {
      expect(makeVocabKey(0, '')).toBe('0:');
      expect(makeVocabKey(5, '   ')).toBe('5:');
    });
  });

  describe('clamp', () => {
    it('returns value when within bounds', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(7.5, 5, 10)).toBe(7.5);
      expect(clamp(0, -10, 10)).toBe(0);
    });

    it('returns min when value is below minimum', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(-100, -50, 50)).toBe(-50);
      expect(clamp(0, 1, 10)).toBe(1);
    });

    it('returns max when value is above maximum', () => {
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(100, -50, 50)).toBe(50);
      expect(clamp(20, 0, 10)).toBe(10);
    });

    it('handles negative ranges', () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(-15, -10, -1)).toBe(-10);
      expect(clamp(0, -10, -1)).toBe(-1);
    });

    it('handles equal min and max', () => {
      expect(clamp(5, 10, 10)).toBe(10);
      expect(clamp(15, 10, 10)).toBe(10);
      expect(clamp(10, 10, 10)).toBe(10);
    });

    it('handles decimal values', () => {
      expect(clamp(5.5, 0, 10)).toBe(5.5);
      expect(clamp(0.5, 0, 1)).toBe(0.5);
      expect(clamp(1.5, 0, 1)).toBe(1);
    });

    it('handles zero', () => {
      expect(clamp(0, -10, 10)).toBe(0);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(0, -10, 0)).toBe(0);
    });

    it('handles large numbers', () => {
      expect(clamp(1000, 0, 500)).toBe(500);
      expect(clamp(-1000, -500, 0)).toBe(-500);
    });
  });
});
