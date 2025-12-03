import { Ionicons } from '@expo/vector-icons';

// ============ 타입 정의 ============

// CEFR 레벨 타입
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// 개별 레벨 정보
export type LevelDetail = {
    current_level: number; // 현재 레벨 스코어
    delta?: number; // 변화량 (optional for initial survey)
    cefr_level: string; // 현재 CEFR 레벨
    next_level: CEFRLevel | null; // 다음 CEFR 레벨 (C2면 null)
    remaining_to_next: number; // 다음 레벨까지 남은 점수
    progress_in_current: number; // 현재 레벨 내 진행도 (0-100%)
};

// ============ 상수 정의 ============

// CEFR 레벨별 시작 점수
export const LEVEL_THRESHOLDS: Record<CEFRLevel, number> = {
    A1: 0,
    A2: 25,
    B1: 50,
    B2: 100,
    C1: 150,
    C2: 200,
};

export const MAX_SCORE = 300;
export const ORDERED_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// 레벨별 색상
export const LEVEL_COLORS = {
    lexical: '#3b82f6',
    syntactic: '#7c3aed',
    auditory: '#10b981',
};

// ============ 유틸리티 함수 ============

// 스코어로부터 CEFR 레벨 계산
export function getCEFRLevel(score: number): CEFRLevel {
    if (score >= LEVEL_THRESHOLDS.C2) return 'C2';
    if (score >= LEVEL_THRESHOLDS.C1) return 'C1';
    if (score >= LEVEL_THRESHOLDS.B2) return 'B2';
    if (score >= LEVEL_THRESHOLDS.B1) return 'B1';
    if (score >= LEVEL_THRESHOLDS.A2) return 'A2';
    return 'A1';
}

// 다음 레벨 정보 계산
export function getNextLevelInfo(
    currentLevel: string,
): { nextLevel: CEFRLevel; nextThreshold: number } | null {
    // Ensure currentLevel is a valid CEFRLevel for indexing
    const level = currentLevel as CEFRLevel;
    const currentIndex = ORDERED_LEVELS.indexOf(level);

    if (currentIndex === -1 || currentIndex === ORDERED_LEVELS.length - 1) return null; // C2 or invalid has no next level

    const nextLevel = ORDERED_LEVELS[currentIndex + 1];
    return {
        nextLevel,
        nextThreshold: LEVEL_THRESHOLDS[nextLevel],
    };
}

// 현재 레벨 범위의 끝 점수 계산
export function getCurrentLevelEnd(currentLevel: string): number {
    const nextInfo = getNextLevelInfo(currentLevel);
    return nextInfo ? nextInfo.nextThreshold : MAX_SCORE;
}

// 레벨 상세 정보 계산
export function calculateLevelDetail(score: number, delta: number = 0): LevelDetail {
    const cefrLevel = getCEFRLevel(score);
    const currentStart = LEVEL_THRESHOLDS[cefrLevel];
    const currentEnd = getCurrentLevelEnd(cefrLevel);
    const nextInfo = getNextLevelInfo(cefrLevel);

    const remainingToNext = nextInfo ? nextInfo.nextThreshold - score : 0;
    const progressInCurrent =
        ((score - currentStart) / (currentEnd - currentStart)) * 100;

    return {
        current_level: score,
        delta,
        cefr_level: cefrLevel,
        next_level: nextInfo?.nextLevel || null,
        remaining_to_next: Math.max(0, remainingToNext),
        progress_in_current: Math.max(0, Math.min(100, progressInCurrent)),
    };
}
