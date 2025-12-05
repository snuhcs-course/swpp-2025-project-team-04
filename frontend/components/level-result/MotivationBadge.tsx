import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export interface MotivationBadgeProps {
  score: number;
  delta: number;
  onPress?: () => void;
}

export function MotivationBadge({ score: _score, delta, onPress }: MotivationBadgeProps) {
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

  return (
    <View className="items-center justify-center my-4 z-50">
      <Pressable onPress={onPress} disabled={!onPress}>
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
});
