import { GradientButton } from '@/components/home/GradientButton';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View, Alert, SafeAreaView } from 'react-native';
import Animated, {
  FadeInUp,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import { submitFeedback } from '@/api/feedback';

const UNDERSTANDING_DIFFICULTY_LEVELS = [
  { value: 1, label: '매우 낮음', emoji: '😰', backendValue: 0 },
  { value: 2, label: '낮음', emoji: '😟', backendValue: 1 },
  { value: 3, label: '보통', emoji: '😐', backendValue: 2 },
  { value: 4, label: '높음', emoji: '🙂', backendValue: 3 },
  { value: 5, label: '매우 높음', emoji: '😊', backendValue: 4 },
];

const SPEED_DIFFICULTY_LEVELS = [
  { value: 1, label: '매우 느림', emoji: '😪', backendValue: 4 },
  { value: 2, label: '느림', emoji: '🥱', backendValue: 3 },
  { value: 3, label: '적당함', emoji: '🙂', backendValue: 2 },
  { value: 4, label: '빠름', emoji: '😦', backendValue: 1 },
  { value: 5, label: '매우 빠름', emoji: '😰', backendValue: 0 },
];

export default function FeedbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 오디오 플레이어에서 전달받은 행동 로그 데이터
  const generatedContentId = parseInt(
    Array.isArray(params.generated_content_id)
      ? params.generated_content_id[0]
      : (params.generated_content_id ?? '0'),
  );
  const pauseCount = parseInt(
    Array.isArray(params.pause_cnt)
      ? params.pause_cnt[0]
      : (params.pause_cnt ?? '0'),
  );
  const rewindCount = parseInt(
    Array.isArray(params.rewind_cnt)
      ? params.rewind_cnt[0]
      : (params.rewind_cnt ?? '0'),
  );
  const vocabLookupCount = parseInt(
    Array.isArray(params.vocab_lookup_cnt)
      ? params.vocab_lookup_cnt[0]
      : (params.vocab_lookup_cnt ?? '0'),
  );
  const vocabSaveCount = parseInt(
    Array.isArray(params.vocab_save_cnt)
      ? params.vocab_save_cnt[0]
      : (params.vocab_save_cnt ?? '0'),
  );

  const [selectedUnderstandingDifficulty, setSelectedUnderstandingDifficulty] =
    useState<number | null>(null);
  const [selectedSpeedDifficulty, setSelectedSpeedDifficulty] = useState<
    number | null
  >(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (
      !selectedUnderstandingDifficulty ||
      !selectedSpeedDifficulty ||
      submitting
    )
      return;

    setSubmitting(true);
    try {
      // UI 값을 백엔드 값으로 변환
      const understandingBackendValue =
        UNDERSTANDING_DIFFICULTY_LEVELS.find(
          (l) => l.value === selectedUnderstandingDifficulty,
        )?.backendValue ?? 0;

      const speedBackendValue =
        SPEED_DIFFICULTY_LEVELS.find((l) => l.value === selectedSpeedDifficulty)
          ?.backendValue ?? 0;

      // 완전한 피드백 데이터 페이로드 (7가지 필드)
      const payload = {
        generated_content_id: generatedContentId,
        pause_cnt: pauseCount,
        rewind_cnt: rewindCount,
        vocab_lookup_cnt: vocabLookupCount,
        vocab_save_cnt: vocabSaveCount,
        understanding_difficulty: understandingBackendValue,
        speed_difficulty: speedBackendValue,
      };

      const response = await submitFeedback(payload);

      // 레벨 결과 페이지로 이동
      router.replace({
        pathname: '/level-result',
        params: {
          lexical_level: response.lexical_level.toString(),
          syntactic_level: response.syntactic_level.toString(),
          speed_level: response.speed_level.toString(),
          lexical_delta: response.lexical_level_delta.toString(),
          syntactic_delta: response.syntactic_level_delta.toString(),
          speed_delta: response.speed_level_delta.toString(),
        },
      });
    } catch (error) {
      console.error('[피드백 제출 실패]', error);
      Alert.alert(
        '피드백 제출 실패',
        '피드백을 제출하는 중 문제가 발생했습니다. 다시 시도해주세요.',
        [{ text: '확인' }],
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    selectedUnderstandingDifficulty !== null &&
    selectedSpeedDifficulty !== null;

  return (
    <View className="flex-1 bg-[#F5F9FF]">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-5">
          {/* 헤드라인 */}
          <Animated.View
            entering={FadeInUp.delay(200).springify()}
            className="pt-8"
          >
            <Text className="mb-2 text-3xl font-black text-neutral-900">
              학습 세션 완료!
            </Text>
            <Text className="text-base leading-6 text-neutral-600">
              이번 학습은 어떠셨나요?
            </Text>
          </Animated.View>

          {/* 평가 섹션 */}
          <View className="flex-1 pt-8">
            {/* 이해도 평가 */}
            <Animated.View
              entering={FadeInUp.delay(400).springify()}
              className="mb-8"
            >
              <View className="mb-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-lg font-bold text-neutral-900">
                    이해도
                  </Text>
                  <Text className="mt-1 text-sm text-neutral-500">
                    내용중 얼마를 이해하셨나요?
                  </Text>
                </View>
                {selectedUnderstandingDifficulty !== null && (
                  <Animated.Text
                    entering={FadeInUp.springify()}
                    className="text-4xl"
                  >
                    {
                      UNDERSTANDING_DIFFICULTY_LEVELS.find(
                        (l) => l.value === selectedUnderstandingDifficulty,
                      )?.emoji
                    }
                  </Animated.Text>
                )}
              </View>
              <View className="flex-row gap-2">
                {UNDERSTANDING_DIFFICULTY_LEVELS.map((level) => {
                  const isSelected =
                    selectedUnderstandingDifficulty === level.value;
                  return (
                    <View key={level.value} style={{ flex: 1 }}>
                      <Pressable
                        onPress={() =>
                          setSelectedUnderstandingDifficulty(level.value)
                        }
                        style={({ pressed }) => ({
                          transform: [{ scale: pressed ? 0.95 : 1 }],
                        })}
                        className={`items-center justify-center rounded-2xl border-2 py-6 transition-all duration-150 ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <Text
                          className={`text-center text-sm font-semibold ${
                            isSelected ? 'text-sky-700' : 'text-gray-500'
                          }`}
                          numberOfLines={2}
                        >
                          {level.label}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </Animated.View>

            {/* 발화속도 평가 */}
            {selectedUnderstandingDifficulty !== null && (
              <Animated.View
                entering={FadeInUp.springify()}
                layout={Layout.springify()}
                className="mb-8"
              >
                <View className="mb-4 flex-row items-center justify-between">
                  <View>
                    <Text className="text-lg font-bold text-neutral-900">
                      발화속도
                    </Text>
                    <Text className="mt-1 text-sm text-neutral-500">
                      말하기 속도는 어땠나요?
                    </Text>
                  </View>
                  {selectedSpeedDifficulty !== null && (
                    <Animated.Text
                      entering={FadeInUp.springify()}
                      className="text-4xl"
                    >
                      {
                        SPEED_DIFFICULTY_LEVELS.find(
                          (l) => l.value === selectedSpeedDifficulty,
                        )?.emoji
                      }
                    </Animated.Text>
                  )}
                </View>
                <View className="flex-row gap-2">
                  {SPEED_DIFFICULTY_LEVELS.map((level) => {
                    const isSelected = selectedSpeedDifficulty === level.value;
                    return (
                      <View key={level.value} style={{ flex: 1 }}>
                        <Pressable
                          onPress={() =>
                            setSelectedSpeedDifficulty(level.value)
                          }
                          style={({ pressed }) => ({
                            transform: [{ scale: pressed ? 0.95 : 1 }],
                          })}
                          className={`items-center justify-center rounded-2xl border-2 py-6 transition-all duration-150 ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <Text
                            className={`text-center text-sm font-semibold ${
                              isSelected ? 'text-sky-700' : 'text-gray-500'
                            }`}
                            numberOfLines={2}
                          >
                            {level.label}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            )}
          </View>

          {/* 제출 버튼 */}
          <Animated.View
            entering={FadeInDown.delay(600).springify()}
            className="pb-8"
          >
            <GradientButton
              title="제출하기"
              loadingMessage="제출 중..."
              icon="send"
              loading={submitting}
              disabled={!canSubmit}
              onPress={handleSubmit}
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}
