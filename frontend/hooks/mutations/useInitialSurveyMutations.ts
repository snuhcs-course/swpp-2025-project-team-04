import {
  submitLevelTest,
  submitManualLevel,
  type LevelTestResponse,
  type ManualLevelResponse,
} from '@/api/initialSurvey';
import {
  updateInterests,
  UpdateInterestsPayload,
  type UpdateInterestsResponse,
} from '@/api/user';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type SubmitLevelTestParams = {
  levelId: string;
  percentages: number[];
};

type SubmitManualLevelParams = {
  levelId: string;
};

export const useSubmitLevelTest = () => {
  return useMutation({
    mutationFn: ({ levelId, percentages }: SubmitLevelTestParams) =>
      submitLevelTest(levelId, percentages),
    onSuccess: (data: LevelTestResponse) => {},
    onError: (error) => console.error('레벨 테스트 제출 실패:', error),
  });
};

export const useSubmitManualLevel = () => {
  return useMutation({
    mutationFn: ({ levelId }: SubmitManualLevelParams) =>
      submitManualLevel(levelId),
    onSuccess: (data: ManualLevelResponse) => {},
    onError: (error) => console.error('수동 레벨 설정 실패:', error),
  });
};

export const useUpdateInterests = () => {
  const qc = useQueryClient();

  return useMutation<UpdateInterestsResponse, Error, UpdateInterestsPayload>({
    mutationFn: (payload) => updateInterests(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('관심사 업데이트 실패:', error);
    },
  });
};
