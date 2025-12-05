import {
  getCEFRLevel,
  getNextLevelInfo,
  getCurrentLevelEnd,
  calculateLevelDetail,
  LEVEL_THRESHOLDS,
  MAX_SCORE,
  ORDERED_LEVELS,
} from '../levelUtils';

describe('levelUtils', () => {
  describe('getCEFRLevel', () => {
    it('returns A1 for scores below 25', () => {
      expect(getCEFRLevel(0)).toBe('A1');
      expect(getCEFRLevel(10)).toBe('A1');
      expect(getCEFRLevel(24)).toBe('A1');
    });

    it('returns A2 for scores 25-49', () => {
      expect(getCEFRLevel(25)).toBe('A2');
      expect(getCEFRLevel(30)).toBe('A2');
      expect(getCEFRLevel(49)).toBe('A2');
    });

    it('returns B1 for scores 50-99', () => {
      expect(getCEFRLevel(50)).toBe('B1');
      expect(getCEFRLevel(75)).toBe('B1');
      expect(getCEFRLevel(99)).toBe('B1');
    });

    it('returns B2 for scores 100-149', () => {
      expect(getCEFRLevel(100)).toBe('B2');
      expect(getCEFRLevel(125)).toBe('B2');
      expect(getCEFRLevel(149)).toBe('B2');
    });

    it('returns C1 for scores 150-199', () => {
      expect(getCEFRLevel(150)).toBe('C1');
      expect(getCEFRLevel(175)).toBe('C1');
      expect(getCEFRLevel(199)).toBe('C1');
    });

    it('returns C2 for scores 200+', () => {
      expect(getCEFRLevel(200)).toBe('C2');
      expect(getCEFRLevel(250)).toBe('C2');
      expect(getCEFRLevel(300)).toBe('C2');
    });
  });

  describe('getNextLevelInfo', () => {
    it('returns next level for A1', () => {
      const result = getNextLevelInfo('A1');
      expect(result).toEqual({
        nextLevel: 'A2',
        nextThreshold: 25,
      });
    });

    it('returns next level for A2', () => {
      const result = getNextLevelInfo('A2');
      expect(result).toEqual({
        nextLevel: 'B1',
        nextThreshold: 50,
      });
    });

    it('returns next level for B1', () => {
      const result = getNextLevelInfo('B1');
      expect(result).toEqual({
        nextLevel: 'B2',
        nextThreshold: 100,
      });
    });

    it('returns next level for B2', () => {
      const result = getNextLevelInfo('B2');
      expect(result).toEqual({
        nextLevel: 'C1',
        nextThreshold: 150,
      });
    });

    it('returns next level for C1', () => {
      const result = getNextLevelInfo('C1');
      expect(result).toEqual({
        nextLevel: 'C2',
        nextThreshold: 200,
      });
    });

    it('returns null for C2 (max level)', () => {
      expect(getNextLevelInfo('C2')).toBeNull();
    });

    it('returns null for invalid level', () => {
      expect(getNextLevelInfo('INVALID')).toBeNull();
    });
  });

  describe('getCurrentLevelEnd', () => {
    it('returns correct end score for A1', () => {
      expect(getCurrentLevelEnd('A1')).toBe(25);
    });

    it('returns correct end score for A2', () => {
      expect(getCurrentLevelEnd('A2')).toBe(50);
    });

    it('returns correct end score for B1', () => {
      expect(getCurrentLevelEnd('B1')).toBe(100);
    });

    it('returns correct end score for B2', () => {
      expect(getCurrentLevelEnd('B2')).toBe(150);
    });

    it('returns correct end score for C1', () => {
      expect(getCurrentLevelEnd('C1')).toBe(200);
    });

    it('returns MAX_SCORE for C2', () => {
      expect(getCurrentLevelEnd('C2')).toBe(MAX_SCORE);
    });
  });

  describe('calculateLevelDetail', () => {
    it('calculates correct details for A1 level (score 10)', () => {
      const result = calculateLevelDetail(10, 5);
      expect(result).toEqual({
        current_level: 10,
        delta: 5,
        cefr_level: 'A1',
        next_level: 'A2',
        remaining_to_next: 15,
        progress_in_current: 40,
      });
    });

    it('calculates correct details for A2 level (score 30)', () => {
      const result = calculateLevelDetail(30);
      expect(result).toEqual({
        current_level: 30,
        delta: 0,
        cefr_level: 'A2',
        next_level: 'B1',
        remaining_to_next: 20,
        progress_in_current: 20,
      });
    });

    it('calculates correct details for B1 level (score 75)', () => {
      const result = calculateLevelDetail(75);
      expect(result).toEqual({
        current_level: 75,
        delta: 0,
        cefr_level: 'B1',
        next_level: 'B2',
        remaining_to_next: 25,
        progress_in_current: 50,
      });
    });

    it('calculates correct details for B2 level (score 125)', () => {
      const result = calculateLevelDetail(125);
      expect(result).toEqual({
        current_level: 125,
        delta: 0,
        cefr_level: 'B2',
        next_level: 'C1',
        remaining_to_next: 25,
        progress_in_current: 50,
      });
    });

    it('calculates correct details for C1 level (score 175)', () => {
      const result = calculateLevelDetail(175);
      expect(result).toEqual({
        current_level: 175,
        delta: 0,
        cefr_level: 'C1',
        next_level: 'C2',
        remaining_to_next: 25,
        progress_in_current: 50,
      });
    });

    it('calculates correct details for C2 level (max level)', () => {
      const result = calculateLevelDetail(250);
      expect(result).toEqual({
        current_level: 250,
        delta: 0,
        cefr_level: 'C2',
        next_level: null,
        remaining_to_next: 0,
        progress_in_current: 50,
      });
    });

    it('handles score at exact threshold (A2 = 25)', () => {
      const result = calculateLevelDetail(25);
      expect(result.cefr_level).toBe('A2');
      expect(result.next_level).toBe('B1');
      expect(result.remaining_to_next).toBe(25);
      expect(result.progress_in_current).toBe(0);
    });

    it('handles score at exact threshold (B1 = 50)', () => {
      const result = calculateLevelDetail(50);
      expect(result.cefr_level).toBe('B1');
      expect(result.next_level).toBe('B2');
      expect(result.remaining_to_next).toBe(50);
      expect(result.progress_in_current).toBe(0);
    });

    it('clamps progress to minimum 0%', () => {
      const result = calculateLevelDetail(0);
      expect(result.progress_in_current).toBeGreaterThanOrEqual(0);
    });

    it('clamps progress to maximum 100%', () => {
      const result = calculateLevelDetail(300);
      expect(result.progress_in_current).toBeLessThanOrEqual(100);
    });
  });

  describe('constants', () => {
    it('has correct LEVEL_THRESHOLDS', () => {
      expect(LEVEL_THRESHOLDS).toEqual({
        A1: 0,
        A2: 25,
        B1: 50,
        B2: 100,
        C1: 150,
        C2: 200,
      });
    });

    it('has correct ORDERED_LEVELS', () => {
      expect(ORDERED_LEVELS).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
    });

    it('has correct MAX_SCORE', () => {
      expect(MAX_SCORE).toBe(300);
    });
  });
});
