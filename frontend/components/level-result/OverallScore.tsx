import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSpring,
  withDelay,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface OverallScoreProps {
  score: number;
  cefrLevel: string;
  delta: number;
}

const CIRCLE_SIZE = 220;
const STROKE_WIDTH = 15;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function OverallScore({ score, cefrLevel, delta }: OverallScoreProps) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(0);
  const pulse = useSharedValue(1);
  const rotation = useSharedValue(0);
  
  const MAX_SCORE = 300;
  const safeScore = isNaN(score) ? 0 : score;
  const targetProgress = Math.min(safeScore / MAX_SCORE, 1);

  useEffect(() => {
    // Entrance animation
    scale.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
    
    // Continuous filling animation loop
    // Start from 0, animate to target, wait, then animate back to 0 and repeat
    progress.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }), // Start at 0
        withDelay(500, withTiming(targetProgress, { duration: 2000, easing: Easing.out(Easing.exp) })), // Fill up slower (2s)
        withDelay(3000, withTiming(0, { duration: 500 })) // Wait longer (3s) then animate back to 0
      ),
      -1,
      false
    );

    // Continuous pulse animation - subtle
    pulse.value = withDelay(2000, withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    ));

    // Subtle rotation for background ring
    rotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, [score]);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value * pulse.value },
      ],
    };
  });

  const bgRingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View className="items-center justify-center py-8">
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Background Decorative Ring (Rotating) */}
        <Animated.View style={[styles.absoluteFill, bgRingStyle]}>
           <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS + 15}
              stroke="#f0f9ff"
              strokeWidth={4}
              strokeDasharray="10, 10"
              fill="none"
            />
           </Svg>
        </Animated.View>

        {/* Main Rings */}
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.svg}>
          {/* Track */}
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke="#e2e8f0"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            opacity={0.3}
          />
          {/* Progress */}
          <AnimatedCircle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke="#3b82f6"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeLinecap="round"
            animatedProps={animatedProps}
            rotation="-90"
            origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
          />
        </Svg>

        {/* Inner Content */}
        <View style={styles.innerContent}>
          <Text className="text-gray-400 text-xs font-bold tracking-widest mb-1">OVERALL</Text>
          <Text className="text-6xl font-black text-slate-800 tracking-tighter">
            {score.toFixed(0)}
          </Text>
          <View className="flex-row items-center mt-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            <Text className="text-blue-600 font-bold text-lg mr-1">{cefrLevel}</Text>
            {delta !== 0 && (
              <Text className={`text-xs font-bold ${delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  absoluteFill: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
