import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface ParticleProps {
  index: number;
  trigger: number;
  onComplete: () => void;
}

const COLORS = ['#f472b6', '#60a5fa', '#fbbf24', '#34d399', '#a78bfa', '#ef4444', '#3b82f6'];

const Particle = ({ index, trigger, onComplete }: ParticleProps) => {
  const x = useSharedValue(width / 2);
  const y = useSharedValue(height / 2);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (trigger <= 0) return;

    // Reset immediately each time trigger changes
    x.value = width / 2;
    y.value = height / 2 + 100;
    opacity.value = 1;
    scale.value = 0;
    rotation.value = 0;

    // Randomize destination
    const angle = Math.random() * Math.PI * 2;
    const destX = width / 2 + Math.cos(angle) * (width * 0.8);
    const destY = height / 2 + Math.sin(angle) * (height * 0.8) - 100;

    // Start animations immediately
    scale.value = withSpring(1 + Math.random(), { damping: 10, stiffness: 100 });
    rotation.value = withTiming(Math.random() * 720 - 360, { duration: 1500 });
    
    x.value = withTiming(destX, { duration: 1500, easing: Easing.out(Easing.quad) });
    y.value = withTiming(destY, { duration: 1500, easing: Easing.out(Easing.quad) });
    
    opacity.value = withSequence(
      withTiming(1, { duration: 50 }), // Faster fade in
      withDelay(800, withTiming(0, { duration: 700 }))
    );
  }, [trigger]); // Re-run animation whenever trigger increments

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value - width / 2 },
      { translateY: y.value - height / 2 },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
    opacity: opacity.value,
    position: 'absolute',
    left: 0,
    top: 0,
  }));

  // Random shape
  const isCircle = index % 3 === 0;
  const isSquare = index % 3 === 1;
  const size = 8 + Math.random() * 8;

  return (
    <Animated.View
      style={[
        style,
        {
          width: size,
          height: isSquare ? size : size * 1.5,
          borderRadius: isCircle ? size / 2 : 2,
          backgroundColor: COLORS[index % COLORS.length],
        },
      ]}
    />
  );
};

export function ConfettiOverlay({ trigger }: { trigger: number }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {trigger > 0 &&
        Array.from({ length: 50 }).map((_, i) => (
          <Particle
            key={`${trigger}-${i}`}
            index={i}
            trigger={trigger}
            onComplete={() => {}}
          />
        ))}
    </View>
  );
}
