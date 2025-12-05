import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { 
  FadeInDown, 
  Layout, 
  useSharedValue, 
  useAnimatedStyle, 
  withDelay, 
  withTiming, 
  withSpring,
  withRepeat,
  withSequence,
  Easing
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface LevelDetail {
  current_level: number;
  delta: number;
  cefr_level: string;
  current_start: number;
  current_end: number;
  progress_in_current: number;
}

interface StatCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  detail: LevelDetail;
  color: string;
  index: number;
  onPress?: () => void;
}

export function StatCard({ title, icon, detail, color, index, onPress }: StatCardProps) {
  const isPositive = detail.delta >= 0;
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // 0 → 목표 값으로 한 번만 채워서 게이지가 유지되도록 수정
    progressWidth.value = 0;
    progressWidth.value = withDelay(
      250 + index * 120,
      withTiming(detail.progress_in_current, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [detail.progress_in_current, index]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
    backgroundColor: color,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 150 + 300).springify()}
      layout={Layout.springify()}
      className="mb-4"
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <View className="flex-row items-center mb-3">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: `${color}15` }}
          >
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-800">{title}</Text>
            <Text className="text-xs text-gray-500 font-medium">Level {detail.cefr_level}</Text>
          </View>
          <View className="items-end">
            <Text className="text-xl font-black text-gray-800">
              {detail.current_level.toFixed(0)}
            </Text>
            <View className="flex-row items-center">
              <Ionicons 
                name={isPositive ? "arrow-up" : "arrow-down"} 
                size={12} 
                color={isPositive ? "#10b981" : "#ef4444"} 
              />
              <Text 
                className={`text-xs font-bold ml-0.5 ${isPositive ? 'text-green-500' : 'text-red-500'}`}
              >
                {Math.abs(detail.delta).toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="mt-2">
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-[10px] text-gray-400 font-medium">{detail.current_start}</Text>
            <Text className="text-[10px] text-gray-400 font-medium">{detail.current_end}</Text>
          </View>
          <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <Animated.View
              className="h-full rounded-full"
              style={progressStyle}
            />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
});
