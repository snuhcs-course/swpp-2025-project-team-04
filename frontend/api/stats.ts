import { customFetch } from './client';

export type DailyMinutes = {
  date: string;
  minutes: number;
};

export type Streak = {
  consecutive_days: number;
  weekly_total_minutes: number;
  daily_minutes: DailyMinutes[];
};

export type SkillLevel = {
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  score: number;
};

export type CurrentLevel = {
  lexical: SkillLevel;
  syntactic: SkillLevel;
  auditory: SkillLevel;
  overall_cefr_level: SkillLevel;
  updated_at: string;
};

export type Achievement = {
  code: string;
  name: string;
  description: string;
  category: string;
  achieved: boolean;
  achieved_at: string | null; // datetime, null if not achieved
};

export type StatsResponse = {
  streak: Streak;
  current_level: CurrentLevel;
  total_time_spent_minutes: number;
  total_days: number;
  achievements: Achievement[];
};

export const getStats = async (): Promise<StatsResponse> => {
  return customFetch<StatsResponse>('/stats', {
    method: 'GET',
  });
};
