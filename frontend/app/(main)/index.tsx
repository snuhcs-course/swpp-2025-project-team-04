import Button from '@/components/home/Button';
import { ChipSelectorGroup } from '@/components/home/ChipSelectorGroup';
import { MOOD_OPTIONS } from '@/constants/homeOptions';
import { TOPIC_CATEGORIES } from '@/constants/initialSurveyData';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useGenerateAudio, useGenerateAudioWithWebSocket } from '@/hooks/mutations/useAudioMutations';
import AudioGenerationProgress from '@/components/audio/AudioGenerationProgress';
import { useQueryClient } from '@tanstack/react-query';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { getBaseUrl } from '@/api/client';
import { useUser } from '@/hooks/queries/useUserQueries';
import { useStats } from '@/hooks/queries/useStatsQueries';
import TrackPlayer from 'react-native-track-player';

export default function HomeScreen() {
  const qc = useQueryClient();
  const baseURL = getBaseUrl();
  const router = useRouter();

  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: stats } = useStats();

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<MOOD_OPTIONS | null>(null);
  const [displayedThemes, setDisplayedThemes] = useState<string[]>([]);

  const allAvailableTopics = useMemo(() => {
    return TOPIC_CATEGORIES.flatMap((category) =>
      category.topics.map((topic) => topic.id),
    );
  }, []);

  const generateDisplayedThemes = useCallback(() => {
    const userInterests = user?.interests || [];
    const totalThemesToShow = 5;
    const randomNeeded = totalThemesToShow - userInterests.length;

    if (randomNeeded <= 0) {
      return userInterests.slice(0, totalThemesToShow);
    }

    const remainingTopics = allAvailableTopics.filter(
      (topic) => !userInterests.includes(topic),
    );

    const shuffled = [...remainingTopics].sort(() => Math.random() - 0.5);
    const randomTopics = shuffled.slice(0, randomNeeded);

    return [...userInterests, ...randomTopics];
  }, [user, allAvailableTopics]);

  useFocusEffect(
    useCallback(() => {
      setDisplayedThemes(generateDisplayedThemes());
    }, [generateDisplayedThemes]),
  );

  // WebSocket 오디오 생성 훅
  const audioWebSocket = useGenerateAudioWithWebSocket();
  
  // Legacy HTTP 훅 (fallback용으로 유지)
  const { mutate: audioMutate, isPending: isAudioLoading } = useGenerateAudio();

  // 상단 안내 문구
  const focusMessage = useMemo(() => {
    if (!selectedTheme) {
      return (
        <Text className="text-base leading-6 text-neutral-600">
          테마와 분위기를 선택하면 맞춤 학습 계획이 제공됩니다.
        </Text>
      );
    }

    if (!selectedMood) {
      return (
        <Text className="text-base leading-6 text-neutral-600">
          <Text className="font-bold">{selectedTheme}</Text> 주제로 맞춤
          콘텐츠를 준비해드립니다.
        </Text>
      );
    }

    return (
      <Text className="text-base leading-6 text-neutral-600">
        <Text className="font-bold">{selectedTheme}</Text> 주제로{' '}
        <Text className="font-bold">{selectedMood}</Text> 분위기의 콘텐츠를
        준비해드립니다.
      </Text>
    );
  }, [selectedTheme, selectedMood]);

  const handleGenerateAudio = () => {
    if (!selectedTheme || !selectedMood) {
      console.warn('테마와 분위기를 모두 선택하세요.');
      return;
    }

    // WebSocket을 통한 오디오 생성
    audioWebSocket.generateAudio(
      { mood: selectedMood, theme: selectedTheme },
      async (data) => {
        try {
          // RNTP 트랙 세팅
          await TrackPlayer.reset();
          await TrackPlayer.add({
            url: data.audio_url,
            title: data.title,
            artist: 'LingoFit',
          });

          // 세션 ID 생성 후 캐시에 원본 응답 저장
          const id = uuidv4();
          
          // AudioGenerationResult를 AudioGenerationResponse 형식으로 변환
          const responseData = {
            title: data.title,
            audio_url: data.audio_url,
            sentences: data.sentences.map(sentence => ({
              id: Math.random().toString(), // 임시 ID 생성
              start_time: sentence.start_time.toString(),
              text: sentence.text,
            })),
          };
          
          qc.setQueryData(['audio', id], responseData);

          // 프로그레스 모달 닫기를 위한 딜레이
          setTimeout(() => {
            router.push(`/audioPlayer/${id}`);
          }, 1000);
        } catch (e) {
          console.error('TrackPlayer 처리 중 오류:', e);
        }
      }
    );
  };
  
  const handleRetryGeneration = () => {
    if (!selectedTheme || !selectedMood) return;
    
    audioWebSocket.retryGeneration(
      { mood: selectedMood, theme: selectedTheme },
      async (data) => {
        try {
          await TrackPlayer.reset();
          await TrackPlayer.add({
            url: data.audio_url,
            title: data.title,
            artist: 'LingoFit',
          });

          const id = uuidv4();
          const responseData = {
            title: data.title,
            audio_url: data.audio_url,
            sentences: data.sentences.map(sentence => ({
              id: Math.random().toString(),
              start_time: sentence.start_time.toString(),
              text: sentence.text,
            })),
          };
          
          qc.setQueryData(['audio', id], responseData);
          
          setTimeout(() => {
            router.push(`/audioPlayer/${id}`);
          }, 1000);
        } catch (e) {
          console.error('TrackPlayer 처리 중 오류:', e);
        }
      }
    );
  };

  if (isUserLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#EBF4FB]">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#EBF4FB]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-gradient-to-br from-primary to-sky-600 px-6 pb-4 pt-24">
          <View className="mb-6 rounded-2xl bg-white px-5 py-4">
            <View className="mb-3 flex-row items-center">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500">
                <Text className="text-2xl">🔥</Text>
              </View>

              <View>
                <Text className="text-sm font-black text-neutral-600">
                  연속 학습
                </Text>
                <Text className="text-xl font-black text-neutral-900">
                  {stats?.streak.consecutive_days ?? 0}일
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between">
              {['월', '화', '수', '목', '금', '토', '일'].map((day, index) => {
                const dayData = stats?.streak.daily_minutes[index];
                const hasActivity = dayData ? dayData.minutes > 1 : false;

                return (
                  <View key={day} className="items-center">
                    <Text className="mb-2 text-xs font-semibold text-neutral-400">
                      {day}
                    </Text>
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-neutral-200">
                      <View
                        className={`h-2 w-2 rounded-full ${hasActivity ? 'bg-orange-500' : 'bg-transparent'}`}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <Text className="mb-2 text-2xl font-black text-neutral-900">
            맞춤 학습 시작하기
          </Text>
          <Text className="text-base font-black leading-6 text-neutral-700">
            오늘의 학습을 위해 테마와 분위기를 선택하세요.
          </Text>
        </View>

        <View className="px-5 pt-3">
          <ChipSelectorGroup
            title="테마"
            chips={displayedThemes}
            onSelectionChange={(value) => setSelectedTheme(value || null)}
          />

          <ChipSelectorGroup
            title="분위기"
            chips={Object.values(MOOD_OPTIONS)}
            onSelectionChange={(value) =>
              setSelectedMood(value ? (value as MOOD_OPTIONS) : null)
            }
          />

          <View className="mt-2 rounded-2xl bg-white p-6 shadow-sm">
            <View className="mb-3 flex-row items-center">
              <Text className="flex-1 text-lg font-bold text-neutral-900">
                오늘의 학습
              </Text>
            </View>
            {focusMessage}
          </View>

          <View className="mt-6">
            <Button
              title={audioWebSocket.isGenerating ? '생성 중...' : '오디오 생성하기'}
              onPress={handleGenerateAudio}
              disabled={audioWebSocket.isGenerating || !selectedTheme || !selectedMood}
              style={{ width: '100%' }}
            />
          </View>
        </View>
      </ScrollView>

      {/* WebSocket 오디오 생성 프로그레스 모달 */}
      <AudioGenerationProgress
        visible={audioWebSocket.isGenerating || !!audioWebSocket.error}
        step={audioWebSocket.currentStep}
        message={audioWebSocket.currentMessage}
        percentage={audioWebSocket.currentPercentage}
        isConnected={audioWebSocket.isConnected}
        error={audioWebSocket.error}
        onCancel={() => {
          audioWebSocket.cancelGeneration();
          audioWebSocket.clearError();
        }}
        onRetry={audioWebSocket.error ? handleRetryGeneration : undefined}
      />
    </View>
  );
}
