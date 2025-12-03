import { View, Text, Pressable, ScrollView, SafeAreaView, Dimensions, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';

import { OverallScore } from '@/components/level-result/OverallScore';
import { StatCard } from '@/components/level-result/StatCard';
import { RadarChart } from '@/components/level-result/RadarChart';
import { MotivationBadge } from '@/components/level-result/MotivationBadge';
import { ConfettiOverlay } from '@/components/level-result/ConfettiOverlay';

// ============ 타입 정의 ============

type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

type LevelDetail = {
  current_level: number;
  delta: number;
  cefr_level: CEFRLevel;
  next_level: CEFRLevel | null;
  remaining_to_next: number;
  progress_in_current: number;
  current_start: number;
  current_end: number;
};

// ============ 상수 정의 ============

const LEVEL_THRESHOLDS: Record<CEFRLevel, number> = {
  A1: 0,
  A2: 26,
  B1: 51,
  B2: 101,
  C1: 151,
  C2: 201,
};

const MAX_SCORE = 300;
const ORDERED_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const LEVEL_COLORS = {
  lexical: '#3b82f6', // Blue
  syntactic: '#8b5cf6', // Violet
  auditory: '#10b981', // Emerald
};

// ============ 유틸리티 함수 ============

function getCEFRLevel(score: number): CEFRLevel {
  if (score >= LEVEL_THRESHOLDS.C2) return 'C2';
  if (score >= LEVEL_THRESHOLDS.C1) return 'C1';
  if (score >= LEVEL_THRESHOLDS.B2) return 'B2';
  if (score >= LEVEL_THRESHOLDS.B1) return 'B1';
  if (score >= LEVEL_THRESHOLDS.A2) return 'A2';
  return 'A1';
}

function getNextLevelInfo(
  currentLevel: CEFRLevel,
): { nextLevel: CEFRLevel; nextThreshold: number } | null {
  const currentIndex = ORDERED_LEVELS.indexOf(currentLevel);
  if (currentIndex === ORDERED_LEVELS.length - 1) return null;

  const nextLevel = ORDERED_LEVELS[currentIndex + 1];
  return {
    nextLevel,
    nextThreshold: LEVEL_THRESHOLDS[nextLevel],
  };
}

function getCurrentLevelEnd(currentLevel: CEFRLevel): number {
  const nextInfo = getNextLevelInfo(currentLevel);
  return nextInfo ? nextInfo.nextThreshold - 1 : MAX_SCORE;
}

function calculateLevelDetail(score: number, delta: number): LevelDetail {
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
    current_start: currentStart,
    current_end: currentEnd,
  };
}

// Background Blob Component
function BackgroundBlob({ style }: { style: any }) {
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: 200,
          opacity: 0.4,
          backgroundColor: '#bfdbfe', // blue-200
          // Removed filter: 'blur(60px)' as it causes issues on native
        },
        style,
      ]}
    />
  );
}

export default function LevelResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  // ============ URL 파라미터 파싱 ============
  const lexicalLevel = parseFloat(
    Array.isArray(params.lexical_level)
      ? params.lexical_level[0]
      : (params.lexical_level ?? '100'),
  );
  const syntacticLevel = parseFloat(
    Array.isArray(params.syntactic_level)
      ? params.syntactic_level[0]
      : (params.syntactic_level ?? '100'),
  );
  const speedLevel = parseFloat(
    Array.isArray(params.speed_level)
      ? params.speed_level[0]
      : (params.speed_level ?? '100'),
  );
  const lexicalDelta = parseFloat(
    Array.isArray(params.lexical_delta)
      ? params.lexical_delta[0]
      : (params.lexical_delta ?? '5'),
  );
  const syntacticDelta = parseFloat(
    Array.isArray(params.syntactic_delta)
      ? params.syntactic_delta[0]
      : (params.syntactic_delta ?? '3'),
  );
  const speedDelta = parseFloat(
    Array.isArray(params.speed_delta)
      ? params.speed_delta[0]
      : (params.speed_delta ?? '-2'),
  );

  // ============ 레벨 상세 정보 계산 ============
  const lexicalDetail = calculateLevelDetail(lexicalLevel, lexicalDelta);
  const syntacticDetail = calculateLevelDetail(syntacticLevel, syntacticDelta);
  const auditoryDetail = calculateLevelDetail(speedLevel, speedDelta);

  // ============ 평균 계산 ============
  const averageLevel = (lexicalLevel + syntacticLevel + speedLevel) / 3;
  const averageDelta = (lexicalDelta + syntacticDelta + speedDelta) / 3;
  const averageCefr = getCEFRLevel(averageLevel);

  // Background Animations
  const blob1Y = useSharedValue(0);
  const blob1X = useSharedValue(0);
  const blob2Y = useSharedValue(0);
  const blob2X = useSharedValue(0);

  useEffect(() => {
    blob1Y.value = withRepeat(
      withTiming(-100, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    blob1X.value = withRepeat(
      withTiming(50, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    blob2Y.value = withRepeat(
      withTiming(100, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    blob2X.value = withRepeat(
      withTiming(-50, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    setConfettiTrigger(1);
    const secondBurst = setTimeout(
      () => setConfettiTrigger(prev => prev + 1),
      1800
    );
    const hideOverlay = setTimeout(() => setConfettiTrigger(0), 4500);

    return () => {
      clearTimeout(secondBurst);
      clearTimeout(hideOverlay);
    };
  }, []);

  const blob1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: blob1Y.value }, { translateX: blob1X.value }],
    top: -100,
    left: -100,
    backgroundColor: '#dbeafe', // blue-100
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: blob2Y.value }, { translateX: blob2X.value }],
    bottom: -50,
    right: -100,
    backgroundColor: '#e0e7ff', // indigo-100
  }));

  return (
    <View className="flex-1 bg-[#F5F9FF]">
      {/* Dynamic Background */}
      <View style={StyleSheet.absoluteFill} className="overflow-hidden">
        <BackgroundBlob style={blob1Style} />
        <BackgroundBlob style={blob2Style} />
      </View>

      <SafeAreaView className="flex-1">
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View 
            entering={FadeInUp.delay(200).springify()}
            className="items-center pt-6 pb-2"
          >
            <Text className="text-neutral-500 font-bold tracking-widest text-[10px] uppercase mb-1 bg-white/50 px-2 py-1 rounded-full overflow-hidden">
              Session Report
            </Text>
            <Text className="text-2xl font-black text-neutral-900">
              학습 분석 결과
            </Text>
          </Animated.View>

          {/* Overall Score with Circular Progress */}
          <OverallScore 
            score={averageLevel} 
            cefrLevel={averageCefr} 
            delta={averageDelta} 
          />

          {/* Motivation Badge */}
          <MotivationBadge 
            score={averageLevel} 
            delta={averageDelta} 
          />

          {/* Radar Chart */}
          <Animated.View 
            entering={FadeInUp.delay(400).springify()}
            className="items-center -mt-2 mb-4"
          >
            <RadarChart 
              details={{
                lexical: lexicalDetail,
                syntactic: syntacticDetail,
                auditory: auditoryDetail
              }}
            />
          </Animated.View>

          {/* Stats Grid */}
          <View className="px-5">
            <Text className="text-lg font-bold text-neutral-900 mb-4 ml-1">
              상세 분석
            </Text>
            
            <StatCard
              title="어휘력 (Lexical)"
              icon="book-outline"
              detail={lexicalDetail}
              color={LEVEL_COLORS.lexical}
              index={0}
            />
            
            <StatCard
              title="문법 (Syntactic)"
              icon="git-network-outline"
              detail={syntacticDetail}
              color={LEVEL_COLORS.syntactic}
              index={1}
            />
            
            <StatCard
              title="청취력 (Auditory)"
              icon="headset-outline"
              detail={auditoryDetail}
              color={LEVEL_COLORS.auditory}
              index={2}
            />
          </View>

          {/* Action Button */}
          <Animated.View 
            entering={FadeInDown.delay(800).springify()}
            className="px-5 mt-6"
          >
            <Pressable
              className="bg-blue-500 rounded-xl py-4"
              onPress={() => router.replace('/(main)')}
            >
              <Text className="text-white text-center text-lg font-bold">
                확인
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
      
      {/* Full Screen Confetti Overlay */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents="none">
        <ConfettiOverlay trigger={confettiTrigger} />
      </View>
    </View>
  );
}
