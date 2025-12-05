import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

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
  const MAX_SCORE = 300;
  const safeScore = isNaN(score) ? 0 : score;
  const targetProgress = Math.min(safeScore / MAX_SCORE, 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - targetProgress);

  return (
    <View className="items-center justify-center py-8">
      <View style={styles.container}>
        {/* Background Decorative Ring */}
        <View style={styles.absoluteFill}>
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
        </View>

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
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke="#3b82f6"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
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
      </View>
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
