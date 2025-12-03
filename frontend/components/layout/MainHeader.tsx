import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStats } from '@/hooks/queries/useStatsQueries';

type MainHeaderProps = {
  title: string;
};

export default function MainHeader({ title }: MainHeaderProps) {
  const insets = useSafeAreaInsets(); // 안전 영역 패딩 얻기
  const router = useRouter();
  const { data: stats } = useStats();
  const [showStreakTooltip, setShowStreakTooltip] = useState(false);

  useEffect(() => {
    if (showStreakTooltip) {
      const timer = setTimeout(() => setShowStreakTooltip(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showStreakTooltip]);

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: '#ffffff' }}>
      <View className="flex-row items-center justify-between border-b border-slate-200 px-6 pb-3">
        <Text className="text-xl font-extrabold text-slate-900">{title}</Text>
        <View className="flex-row items-center gap-3">
          {stats && stats.streak.consecutive_days > 0 && (
            <View className="relative">
              <Pressable
                onPress={() => setShowStreakTooltip(!showStreakTooltip)}
                className="flex-row items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 active:bg-orange-100"
              >
                <Text className="text-lg">🔥</Text>
                <Text className="text-base font-bold text-orange-600">
                  {stats.streak.consecutive_days}
                </Text>
              </Pressable>

              {showStreakTooltip && (
                <View
                  className="absolute right-0 top-10 z-50"
                  style={{ minWidth: 140 }}
                >
                  <View className="absolute -top-1.5 right-4 h-3 w-3 rotate-45 bg-slate-800" />
                  <View className="rounded-lg bg-slate-800 px-3 py-2 shadow-lg">
                    <Text className="text-sm font-medium text-white">
                      연속 학습 {stats.streak.consecutive_days}일차
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
