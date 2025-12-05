import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Dispatch, SetStateAction } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

type Props = {
  id: number;
  url: string;
  player: ReturnType<typeof useAudioPlayer> | null;
  status: ReturnType<typeof useAudioPlayerStatus>;
  activeId: number | null;
  setActiveId: Dispatch<SetStateAction<number | null>>;
};

export default function ExampleAudioButton({
  id,
  url,
  player,
  status,
  activeId,
  setActiveId,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const isCurrent = activeId === id;
  const isPlaying = isCurrent && !!status?.playing; // 현재 아이템이면서 재생 중일 때만 true

  // ── Shimmer (재생 중에만 동작)
  const shimmerX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isPlaying) {
      shimmerX.stopAnimation?.();
      shimmerX.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.timing(shimmerX, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.linear),
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => {
      anim.stop();
    };
  }, [isPlaying, shimmerX]);

  const translateRange = useMemo(
    () =>
      shimmerX.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, 100],
      }),
    [shimmerX],
  );

  const resetPlayer = useCallback(async () => {
    if (!player) return;
    try {
      await player.pause();
      await player.seekTo(0);
    } catch (error) {
      console.warn('Failed to reset example audio player', error);
    }
  }, [player]);

  const handlePress = useCallback(async () => {
    if (!player || isLoading) return;

    if (isCurrent) {
      if (status?.playing) {
        await resetPlayer();
        setActiveId(null);
      } else {
        setIsLoading(true);
        setActiveId(id);
        try {
          await player.seekTo(0);
          await player.play();
        } catch (error) {
          console.warn('Failed to resume example audio', error);
          setActiveId(null);
        } finally {
          setIsLoading(false);
        }
      }
      return;
    }

    setIsLoading(true);
    setActiveId(id);
    try {
      if (status?.playing || activeId !== null) {
        await resetPlayer();
      }
      await player.replace({ uri: url });
      await player.play();
    } catch (error) {
      console.warn('Failed to play example audio', error);
      setActiveId(null);
      await resetPlayer();
    } finally {
      setIsLoading(false);
    }
  }, [
    player,
    status?.playing,
    activeId,
    resetPlayer,
    url,
    id,
    isCurrent,
    setActiveId,
    isLoading,
  ]);

  // 재생이 끝났으면 상태 초기화
  useEffect(() => {
    if (!player || !isCurrent || status?.playing) return;
    const duration = status?.duration ?? 0;
    const currentTime = status?.currentTime ?? 0;
    if (duration > 0 && currentTime >= duration - 0.1) {
      setActiveId(null);
      resetPlayer();
    }
  }, [
    isCurrent,
    status?.playing,
    status?.duration,
    status?.currentTime,
    setActiveId,
    resetPlayer,
    player,
  ]);

  // ── Colors
  const PLAYING_COLORS = ['#38BDF8', '#0284C7'] as const;

  // Pressable의 ripple이 모서리 밖으로 번지지 않도록 clip
  const RADIUS = 10;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isLoading || !player}
      android_ripple={{ color: 'rgba(14,165,233,0.12)', borderless: false }}
      style={({ pressed }) => ({
        borderRadius: RADIUS,
        overflow: 'hidden', // ← ripple clip
        opacity: pressed ? 0.96 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
      className="mt-4"
    >
      {({ pressed }) => {
        // 내부 공통 컨텐츠
        const Inner = (
          <View
            style={{ borderRadius: RADIUS }} // <-- 여기 수정함: rounded-xl 대신 RADIUS 사용
            className={`relative flex-row items-center justify-center border px-4 py-2 ${
              isPlaying
                ? 'border-transparent'
                : 'border-primary/40 bg-white shadow-sm'
            } ${isLoading ? 'opacity-80' : ''}`}
          >
            {isLoading ? (
              <ActivityIndicator color={isPlaying ? '#ffffff' : '#0284c7'} />
            ) : (
              <>
                <Ionicons
                  name={isPlaying ? 'stop' : 'play'}
                  size={18}
                  color={isPlaying ? '#ffffff' : '#0284c7'}
                />
                <Text
                  className={`ml-2 text-sm font-semibold ${
                    isPlaying ? 'text-white' : 'text-primary'
                  }`}
                >
                  {isPlaying ? '예문 종료' : '예문 듣기'}
                </Text>
              </>
            )}

            {/* 재생 중 셔머 하이라이트 */}
            {isPlaying && (
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: 100,
                  transform: [{ translateX: translateRange }],
                }}
              >
                <LinearGradient
                  colors={
                    [
                      'rgba(255,255,255,0.0)',
                      'rgba(255,255,255,0.22)',
                      'rgba(255,255,255,0.0)',
                    ] as const
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, transform: [{ skewX: '-15deg' } as any] }}
                />
              </Animated.View>
            )}
          </View>
        );

        // 재생 중일 때만 배경을 gradient로 감싸기
        return isPlaying ? (
          <LinearGradient
            colors={PLAYING_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: RADIUS }}
          >
            {Inner}
          </LinearGradient>
        ) : (
          Inner
        );
      }}
    </Pressable>
  );
}
