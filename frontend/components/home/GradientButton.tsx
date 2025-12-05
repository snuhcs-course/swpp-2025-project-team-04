import { LinearGradient } from 'expo-linear-gradient';
import {
  Animated,
  Easing,
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef } from 'react';

type GradientButtonProps = {
  title: string;
  loadingMessage?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function GradientButton({
  title,
  loadingMessage,
  icon = 'musical-notes',
  loading = false,
  disabled = false,
  onPress,
}: GradientButtonProps) {
  const shimmerX = useRef(new Animated.Value(0)).current;
  const isActive = !disabled && !loading;

  useEffect(() => {
    if (!isActive) {
      shimmerX.stopAnimation();
      shimmerX.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(shimmerX, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.linear),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, shimmerX]);

  const translateRange = useMemo(
    () =>
      shimmerX.interpolate({
        inputRange: [0, 1],
        outputRange: [-160, 160],
      }),
    [shimmerX],
  );

  // readonly 튜플로 타입 안전
  const ACTIVE_COLORS = ['#0EA5E9', '#38BDF8'] as const;
  const DISABLED_COLORS = ['#93C5FD', '#BAE6FD'] as const;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!isActive}
      onPress={async () => {
        if (!isActive) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress();
      }}
      android_ripple={{ color: 'rgba(14,165,233,0.16)', borderless: false }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.96 : 1, // 과한 흐림 방지
        transform: [{ scale: pressed ? 0.98 : 1 }], // 살짝 눌림
      })}
    >
      {({ pressed }) => (
        <LinearGradient
          colors={isActive ? ACTIVE_COLORS : DISABLED_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="relative overflow-hidden rounded-3xl"
        >
          <View className="flex-row items-center justify-center px-6 py-4">
            {loading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text className="ml-2 text-lg font-bold text-white">
                  {loadingMessage || '로딩 중...'}
                </Text>
              </>
            ) : (
              <>
                {icon && <Ionicons name={icon} size={20} color="#fff" />}
                <Text className="ml-2 text-lg font-bold text-white">
                  {title}
                </Text>
              </>
            )}
          </View>

          {/* iOS용 눌림 하이라이트 (Android는 ripple과 병행) */}
          {pressed && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: isActive
                  ? 'rgba(255,255,255,0.14)'
                  : 'rgba(255,255,255,0.10)',
              }}
            />
          )}

          {/* 셔머 스트라이프 */}
          {isActive && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 120,
                transform: [{ translateX: translateRange }],
              }}
            >
              <LinearGradient
                colors={
                  [
                    'rgba(255,255,255,0.0)',
                    'rgba(255,255,255,0.25)',
                    'rgba(255,255,255,0.0)',
                  ] as const
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, transform: [{ skewX: '-15deg' } as any] }}
              />
            </Animated.View>
          )}
        </LinearGradient>
      )}
    </Pressable>
  );
}
