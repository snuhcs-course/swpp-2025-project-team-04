import { ChipSelectorGroup } from '@/components/home/ChipSelectorGroup';
import { STYLE_OPTIONS, THEME_OPTIONS } from '@/constants/homeOptions';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useGenerateAudio } from '@/hooks/mutations/useAudioMutations';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/queries/useUserQueries';
import TrackPlayer from 'react-native-track-player';
import { GradientButton } from '@/components/home/GradientButton';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { STATS_QUERY_KEY, VOCAB_QUERY_KEY } from '@/constants/queryKeys';
import { getVocab } from '@/api/vocab';

export default function HomeScreen() {
  const qc = useQueryClient();
  const router = useRouter();

  const { data: user, isLoading: isUserLoading } = useUser();

  // --- 타입 & 유틸
  type ThemeKey = keyof typeof THEME_OPTIONS;
  type StyleKey = keyof typeof STYLE_OPTIONS;

  const THEME_KEYS = useMemo(
    () => Object.keys(THEME_OPTIONS) as ThemeKey[],
    [],
  );
  const STYLE_KEYS = useMemo(
    () => Object.keys(STYLE_OPTIONS) as StyleKey[],
    [],
  );

  const toThemeDisplay = (k: ThemeKey) =>
    `${THEME_OPTIONS[k].emoji} ${THEME_OPTIONS[k].label}`;
  const toStyleDisplay = (k: StyleKey) =>
    `${STYLE_OPTIONS[k].emoji} ${STYLE_OPTIONS[k].label}`;

  // display → key 역매핑 레코드
  const themeDisplayToKey = useMemo(
    () =>
      Object.fromEntries(
        THEME_KEYS.map((k) => [toThemeDisplay(k), k]),
      ) as Record<string, ThemeKey>,
    [THEME_KEYS],
  );
  const StyleDisplayToKey = useMemo(
    () =>
      Object.fromEntries(
        STYLE_KEYS.map((k) => [toStyleDisplay(k), k]),
      ) as Record<string, StyleKey>,
    [STYLE_KEYS],
  );

  // --- 주제(Theme) 관리: 키 기반
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey | null>(null);
  const [displayedThemes, setDisplayedThemes] = useState<ThemeKey[]>([]);

  // 유저 관심사가 있다면 우선 채우고, 모자라면 랜덤 보충
  console.log('THEME_KEYS:', THEME_KEYS);
  console.log('user:', user);
  console.log(
    'userInterests:',
    (user?.interests ?? []).map((i) => i.key),
  );

  const generateDisplayedThemes = useCallback((): ThemeKey[] => {
    const FIXED = 3; // 유저 관심사 고정 개수
    const TOTAL = 7;

    const userInterests = (user?.interests ?? [])
      .map((i) => i.key)
      .filter((k): k is ThemeKey => THEME_KEYS.includes(k as ThemeKey));

    // 유저 관심사가 3개 미만이어도 MAX 3개까지만 반영
    const fixed = userInterests.slice(0, FIXED);

    const remaining = THEME_KEYS.filter((k) => !fixed.includes(k));

    // 랜덤하게 섞기
    const shuffled = [...remaining].sort(() => Math.random() - 0.5);

    const need = TOTAL - fixed.length; // 필요 수: 4 또는 유저 관심사가 3 미만일 경우 더 많아짐

    return [...fixed, ...shuffled.slice(0, Math.min(need, shuffled.length))];
  }, [user]);

  const [selectedStyle, setSelectedStyle] = useState<StyleKey | null>(null);
  const [displayedStyles, setDisplayedStyles] = useState<StyleKey[]>(() => {
    const shuffled = [...STYLE_KEYS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(5, STYLE_KEYS.length));
  });

  const generateDisplayedStyles = useCallback((): StyleKey[] => {
    const shuffled = [...STYLE_KEYS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(5, STYLE_KEYS.length));
  }, []);

  // --- 화면 복귀 시 한 번에 갱신
  useFocusEffect(
    useCallback(() => {
      setDisplayedThemes(generateDisplayedThemes());
      setDisplayedStyles(generateDisplayedStyles());
    }, [generateDisplayedThemes, generateDisplayedStyles]),
  );

  // 오디오 API 훅
  const { mutate: audioMutate, isPending: isAudioLoading } = useGenerateAudio();

  // 하단 안내 문구
  const focusMessage = useMemo(() => {
    const StyleLabel = selectedStyle
      ? STYLE_OPTIONS[selectedStyle].label
      : null;
    const themeLabel = selectedTheme
      ? THEME_OPTIONS[selectedTheme].label
      : null;

    if (!selectedTheme && !selectedStyle) {
      return (
        <Text className="text-base leading-7 text-slate-600">
          주제와 스타일를 선택해주세요.
        </Text>
      );
    }

    if (!selectedStyle) {
      return (
        <Text className="text-base leading-7 text-slate-600">
          <Text className="font-bold text-slate-900">{themeLabel}</Text> 주제로
          듣고싶어요.
        </Text>
      );
    }

    if (!selectedTheme) {
      return (
        <Text className="text-base leading-7 text-slate-600">
          <Text className="font-bold text-slate-900">{StyleLabel}</Text>{' '}
          스타일로 듣고싶어요.
        </Text>
      );
    }

    return (
      <Text className="text-base leading-7 text-slate-600">
        <Text className="font-bold text-slate-900">{themeLabel}</Text> 주제와{' '}
        <Text className="font-bold text-slate-900">{StyleLabel}</Text> 스타일로
        듣고싶어요.
      </Text>
    );
  }, [selectedTheme, selectedStyle]);

  // Theme 및 Style 선택 비우기
  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectedTheme(null);
        setSelectedStyle(null);
      };
    }, []),
  );

  // 오디오 생성 핸들러
  const handleGenerateAudio = () => {
    if (!selectedTheme || !selectedStyle) {
      console.warn('테마와 스타일을 모두 선택하세요.');
      return;
    }

    audioMutate(
      { style: selectedStyle, theme: selectedTheme },
      {
        onSuccess: async (data) => {
          try {
            // RNTP 트랙 세팅
            await TrackPlayer.reset();
            await TrackPlayer.add({
              id: data.generated_content_id,
              url: data.audio_url,
              // url: require('@/assets/audio/1_audio.mp3'),
              title: data.title,
              artist: 'LingoFit',
            });

            // 세션 ID 생성 후 캐시에 원본 응답 저장
            qc.setQueryData(['audio', String(data.generated_content_id)], data);

            // navigation과 동시에 백그라운드에서 실행 (await 불필요)
            qc.prefetchQuery({
              queryKey: [VOCAB_QUERY_KEY, data.generated_content_id],
              queryFn: () => getVocab(data.generated_content_id),
              staleTime: 5 * 60 * 1000, // useVocab의 staleTime과 일치
              retry: 30, // 최대 30회 재시도
              retryDelay: 1000, // 1초 간격
            });
            qc.invalidateQueries({ queryKey: [STATS_QUERY_KEY] });

            // 플레이어 화면으로 라우팅 (id만 전달)
            router.replace(`/audioPlayer/${data.generated_content_id}`);
          } catch (e) {
            4;
            console.error('TrackPlayer 처리 중 오류:', e);
          }
        },
        onError: (error) => {
          console.error('오디오 생성 실패:', error);
        },
      },
    );
  };

  // 사용자 이름 표시 로직
  const displayName = (user?.nickname || user?.username)?.trim();

  // 로딩 상태 처리
  if (isUserLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#EBF4FB]">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 px-5 bg-[#EBF4FB]"
      showsVerticalScrollIndicator={false}
    >
      {/* 인사말 */}

      <View className="px-5 pt-6 pb-2">
        <Text className="text-3xl font-black leading-tight text-slate-900">
          {/* 한 줄 안에 배치 */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              flexWrap: 'wrap',
            }}
          >
            <MaskedView
              maskElement={
                <Text className="text-3xl font-black leading-tight">
                  {displayName}
                </Text>
              }
            >
              <LinearGradient
                colors={['#38BDF8', '#0EA5E9', '#0284C7'] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text className="text-3xl font-black leading-tight opacity-0">
                  {displayName}
                </Text>
              </LinearGradient>
            </MaskedView>
            <Text className="text-3xl font-black leading-tight text-slate-900">
              님,
            </Text>
          </View>
          {'\n'}
          바로 학습을 시작해볼까요?
        </Text>

        <Text className="my-3 text-[15px] leading-6 text-slate-600">
          아래에서 듣고 싶은{' '}
          <Text className="font-semibold text-slate-800">주제</Text>와{' '}
          <Text className="font-semibold text-slate-800">스타일</Text>를 고르면
          맞춤 오디오를 만들어드릴게요.
        </Text>
      </View>

      {/* 주제 & 스타일 선택 칩 카드 */}
      <View className="mb-5 rounded-3xl border border-slate-100 bg-white shadow-sm">
        {/* 주제 */}
        <View className="p-4 pb-2">
          <ChipSelectorGroup
            title="주제"
            chips={displayedThemes.map(toThemeDisplay)}
            value={selectedTheme ? toThemeDisplay(selectedTheme) : null}
            onSelectionChange={(value) =>
              setSelectedTheme(
                value ? (themeDisplayToKey[value] ?? null) : null,
              )
            }
          />
        </View>

        {/* 구분선 */}
        <View className="h-[1px] bg-sky-100 mb-5" />

        {/* 스타일 */}
        <View className="p-4 pt-2">
          <ChipSelectorGroup
            title="스타일"
            chips={displayedStyles.map(toStyleDisplay)}
            value={selectedStyle ? toStyleDisplay(selectedStyle) : null}
            onSelectionChange={(value) =>
              setSelectedStyle(
                value ? (StyleDisplayToKey[value] ?? null) : null,
              )
            }
          />
        </View>
      </View>

      {/* 하단 안내 문구 */}
      {/* 하단 안내 + 버튼 카드 */}
      <View className="rounded-3xl bg-white border border-sky-100 shadow-md shadow-sky-200/40 px-6 py-5">
        {/* 섹션 타이틀 */}
        <Text className="text-sm font-semibold text-sky-600 mb-2">
          오늘의 선택
        </Text>

        {/* 안내 문구 */}
        <View className="mb-6">{focusMessage}</View>

        {/* 구분선 */}
        <View className="h-[1px] bg-sky-100 mb-5" />

        {/* 오디오 생성 버튼 */}
        <GradientButton
          title="나만의 오디오 만들기"
          icon="musical-notes"
          loading={isAudioLoading}
          disabled={!selectedTheme || !selectedStyle}
          onPress={handleGenerateAudio}
        />
      </View>
    </ScrollView>
  );
}
