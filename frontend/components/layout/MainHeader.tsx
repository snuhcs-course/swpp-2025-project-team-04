import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStats } from '@/hooks/queries/useStatsQueries';

type MainHeaderProps = {
  title: string;
};

export default function MainHeader({ title }: MainHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: stats } = useStats();
  const [showStreakTooltip, setShowStreakTooltip] = useState(false);

  // 스트릭 값과 활성화 여부 계산
  const streakDays = stats?.streak?.consecutive_days || 0;
  const hasStreak = streakDays > 0;

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: '#ffffff' }}>
      <View className="flex-row items-center justify-between border-b border-slate-200 px-6 pb-3">
        <Text className="text-xl font-extrabold text-slate-900">{title}</Text>
        <View className="flex-row items-center gap-5">
          {stats && (
            <View className="relative">
              <Pressable
                onPressIn={() => setShowStreakTooltip(true)}
                onPressOut={() => setShowStreakTooltip(false)}
                // 조건부 스타일 적용
                className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
                  hasStreak
                    ? 'bg-orange-50 active:bg-orange-100' // 스트릭 있을 때 (오렌지)
                    : 'bg-slate-100 active:bg-slate-200' // 0일일 때 (회색)
                }`}
              >
                {/* 0일이면 불꽃 대신 다른 이모지(🧊)를 쓰거나 그대로 둬도 됨. 일단 불꽃 유지 */}
                <Text className={`text-lg ${!hasStreak && 'opacity-50'}`}>
                  {hasStreak ? '🔥' : '🧊'}
                </Text>
                <Text
                  className={`text-base font-bold ${
                    hasStreak ? 'text-orange-600' : 'text-slate-400'
                  }`}
                >
                  {streakDays}
                </Text>
              </Pressable>

              {showStreakTooltip && (
                <View className="absolute right-0 top-10 z-50">
                  <View className="absolute -top-1.5 right-4 h-3 w-3 rotate-45 bg-slate-800" />
                  <View className="min-w-[100px] items-center justify-center rounded-lg bg-slate-800 px-1 py-2 shadow-lg">
                    <Text className="text-center text-sm font-medium text-white">
                      {hasStreak
                        ? `연속 학습 ${streakDays}일차`
                        : '아직 연속 학습이 없어요'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
          <Pressable
            onPress={() => router.push('/profile')}
            className="h-9 w-9 items-center justify-center rounded-full bg-primary active:bg-primary/80"
          >
            <Ionicons name="person" size={20} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
