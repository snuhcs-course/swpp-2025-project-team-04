import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, { 
  FadeInDown, 
  ZoomIn, 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence, 
  withTiming, 
  withSpring,
  withDelay,
  runOnJS,
  withRepeat,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export interface MotivationBadgeProps {
  score: number;
  delta: number;
  onPress?: () => void;
}

export function MotivationBadge({ score, delta, onPress }: MotivationBadgeProps) {
  const scale = useSharedValue(1);
  const breathingScale = useSharedValue(1);

  // Determine message based on score and delta
  let message = "";
  let icon: keyof typeof Ionicons.glyphMap = "rocket-outline";
  let gradientColors = ['#60a5fa', '#3b82f6'];

  if (delta > 5) {
    message = "놀라운 성장이에요! 🚀";
    icon = "trending-up-outline";
    gradientColors = ['#f472b6', '#db2777']; // Pink
  } else if (delta > 0) {
    message = "실력이 늘고 있어요! 📈";
    icon = "stats-chart-outline";
    gradientColors = ['#34d399', '#059669']; // Green
  } else if (delta === 0) {
    message = "꾸준함이 비결이에요! 🌱";
    icon = "leaf-outline";
    gradientColors = ['#a78bfa', '#7c3aed']; // Purple
  } else {
    message = "포기하지 마세요! 💪";
    icon = "fitness-outline";
    gradientColors = ['#fbbf24', '#d97706']; // Orange/Gold
  }

  React.useEffect(() => {
    breathingScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 10 })
    );
    
    if (onPress) {
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathingScale.value }]
  }));

  return (
    <View className="items-center justify-center my-4 z-50">
      <Pressable onPress={handlePress}>
        <Animated.View style={[breathingStyle]}>
          <Animated.View 
            entering={ZoomIn.delay(600).springify()}
            style={[animatedStyle]}
          >
            <LinearGradient
              colors={gradientColors as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badge}
            >
              <Ionicons name={icon} size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-bold text-base tracking-wide">
                {message}
              </Text>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  particle: {
    position: 'absolute',
  }
});
