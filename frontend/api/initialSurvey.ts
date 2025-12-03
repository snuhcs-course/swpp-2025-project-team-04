import { customFetch } from './client';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type LevelTestItem = {
  script_id: string;
  generated_content_id: number;
  understanding: number; // 0-100
};

export type LevelTestPayload = {
  level: CEFRLevel;
  tests: LevelTestItem[];
};

export type LevelTestResponse = {
  success: boolean;
  lexical: { cefr_level: string; score: number };
  syntactic: { cefr_level: string; score: number };
  auditory: { cefr_level: string; score: number };
  overall: { cefr_level: string; score: number };
};

export type ManualLevelPayload = {
  level: CEFRLevel;
};

export type ManualLevelResponse = {
  level: CEFRLevel;
  level_description: string;
  updated_at: string;
};

export const mapLevelIdToCEFR = (levelId: string): CEFRLevel => {
  const levelMap: Record<string, CEFRLevel> = {
    '1': 'A1',
    '2': 'A2',
    '3': 'B1',
    '4': 'B2',
    '5': 'C1',
    '6': 'C2',
  };

  return levelMap[levelId];
};

export const generateScriptId = (
  level: CEFRLevel,
  questionNumber: number,
): string => {
  const levelBaseMap: Record<CEFRLevel, number> = {
    A1: 0, // script_ids 1-5
    A2: 5, // 6-10
    B1: 10, // 11-15
    B2: 15, // 16-20
    C1: 20, // 21-25
    C2: 25, // 26-30
  };

  const baseId = levelBaseMap[level];
  const scriptId = baseId + questionNumber;

  return scriptId.toString();
};

export const getAudioUrl = (
  levelId: string,
  questionNumber: number,
): string => {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  const cefrLevel = mapLevelIdToCEFR(levelId);
  return `${baseUrl}/api/v1/initial-survey/${cefrLevel}/${questionNumber}`;
};

export const submitLevelTest = async (
  levelId: string,
  percentages: number[],
): Promise<LevelTestResponse> => {
  const cefrLevel = mapLevelIdToCEFR(levelId);

  const tests: LevelTestItem[] = percentages.map((understanding, index) => ({
    script_id: generateScriptId(cefrLevel, index + 1),
    generated_content_id: 0,
    understanding,
  }));

  const payload: LevelTestPayload = {
    level: cefrLevel,
    tests,
  };

  return customFetch<LevelTestResponse>('/level-system/level-test', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const submitManualLevel = async (
  levelId: string,
): Promise<ManualLevelResponse> => {
  const cefrLevel = mapLevelIdToCEFR(levelId);

  const payload: ManualLevelPayload = { level: cefrLevel };

  return customFetch<ManualLevelResponse>('/level-system/manual-level', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
