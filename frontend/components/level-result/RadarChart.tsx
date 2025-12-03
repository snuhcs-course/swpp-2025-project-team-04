import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, G, Circle, Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type RadarStatDetail = {
  progress_in_current: number;
  current_start: number;
  current_end: number;
};

interface RadarChartProps {
  details: {
    lexical: RadarStatDetail;
    syntactic: RadarStatDetail;
    auditory: RadarStatDetail;
  };
}

const { width } = Dimensions.get('window');
const CHART_SIZE = width * 0.65;
const CENTER = CHART_SIZE / 2;
const RADIUS = CHART_SIZE / 2 - 30;

export function RadarChart({ details }: RadarChartProps) {
  const progress1 = useSharedValue(0);
  const progress2 = useSharedValue(0);
  const progress3 = useSharedValue(0);

  useEffect(() => {
    const normalize = (detail: RadarStatDetail | undefined) => {
      if (!detail) return 0;
      const ratio = detail.progress_in_current / 100;
      if (isNaN(ratio)) return 0;
      return Math.min(Math.max(ratio, 0), 1);
    };

    const v1 = normalize(details.lexical);
    const v2 = normalize(details.syntactic);
    const v3 = normalize(details.auditory);

    const createLoop = (target: number) => {
      return withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withDelay(500, withTiming(target, { duration: 2000, easing: Easing.out(Easing.ease) })),
          withDelay(3000, withTiming(0, { duration: 500 }))
        ),
        -1,
        false
      );
    };

    progress1.value = createLoop(v1);
    progress2.value = createLoop(v2);
    progress3.value = createLoop(v3);
  }, [
    details.lexical?.progress_in_current,
    details.syntactic?.progress_in_current,
    details.auditory?.progress_in_current,
  ]);

  const animatedPathProps = useAnimatedProps(() => {
    const p1x = CENTER + RADIUS * progress1.value * Math.cos(-Math.PI / 2);
    const p1y = CENTER + RADIUS * progress1.value * Math.sin(-Math.PI / 2);

    const p2x = CENTER + RADIUS * progress2.value * Math.cos(Math.PI / 6);
    const p2y = CENTER + RADIUS * progress2.value * Math.sin(Math.PI / 6);

    const p3x = CENTER + RADIUS * progress3.value * Math.cos((5 * Math.PI) / 6);
    const p3y = CENTER + RADIUS * progress3.value * Math.sin((5 * Math.PI) / 6);

    return {
      d: `M ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y} Z`,
    };
  });

  const getDotProps = (progress: SharedValue<number>, angle: number) => {
    return useAnimatedProps(() => {
      const cx = CENTER + RADIUS * progress.value * Math.cos(angle);
      const cy = CENTER + RADIUS * progress.value * Math.sin(angle);
      return { cx, cy };
    });
  };

  // Background grid points
  const getGridPoints = (scale: number) => {
    const r = RADIUS * scale;
    const p1 = `${CENTER + r * Math.cos(-Math.PI / 2)},${CENTER + r * Math.sin(-Math.PI / 2)}`;
    const p2 = `${CENTER + r * Math.cos(Math.PI / 6)},${CENTER + r * Math.sin(Math.PI / 6)}`;
    const p3 = `${CENTER + r * Math.cos((5 * Math.PI) / 6)},${CENTER + r * Math.sin((5 * Math.PI) / 6)}`;
    return `${p1} ${p2} ${p3}`;
  };

  return (
    <View className="items-center justify-center py-6">
      <Svg height={CHART_SIZE} width={CHART_SIZE}>
        {/* Background Grid */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
          <Polygon
            key={scale}
            points={getGridPoints(scale)}
            stroke="#e2e8f0"
            strokeWidth="1"
            fill={scale === 1 ? "#f8fafc" : "none"}
          />
        ))}

        {/* Axis Lines */}
        {[ -Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6 ].map((angle, i) => (
          <Line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={CENTER + RADIUS * Math.cos(angle)}
            y2={CENTER + RADIUS * Math.sin(angle)}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        ))}

        {/* Data Path */}
        <AnimatedPath
          animatedProps={animatedPathProps}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth="3"
        />

        {/* Vertex Dots */}
        <AnimatedCircle 
          r="4" 
          fill="#3b82f6" 
          stroke="white" 
          strokeWidth="2" 
          animatedProps={getDotProps(progress1, -Math.PI / 2)} 
        />
        <AnimatedCircle 
          r="4" 
          fill="#3b82f6" 
          stroke="white" 
          strokeWidth="2" 
          animatedProps={getDotProps(progress2, Math.PI / 6)} 
        />
        <AnimatedCircle 
          r="4" 
          fill="#3b82f6" 
          stroke="white" 
          strokeWidth="2" 
          animatedProps={getDotProps(progress3, (5 * Math.PI) / 6)} 
        />

        {/* Labels with range indicators */}
        <G x={CENTER} y={CENTER - RADIUS + 15}>
          <SvgText
            fill="#64748b"
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            어휘력
          </SvgText>
          <SvgText
            fill="#94a3b8"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
            y={14}
          >
            {`${details.lexical.current_start}-${details.lexical.current_end}`}
          </SvgText>
        </G>
        <G x={CENTER + RADIUS * Math.cos(Math.PI / 6) + 25} y={CENTER + RADIUS * Math.sin(Math.PI / 6) + 10}>
          <SvgText
            fill="#64748b"
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            문법
          </SvgText>
          <SvgText
            fill="#94a3b8"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
            y={14}
          >
            {`${details.syntactic.current_start}-${details.syntactic.current_end}`}
          </SvgText>
        </G>
        <G x={CENTER + RADIUS * Math.cos((5 * Math.PI) / 6) - 25} y={CENTER + RADIUS * Math.sin((5 * Math.PI) / 6) + 10}>
          <SvgText
            fill="#64748b"
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            청취력
          </SvgText>
          <SvgText
            fill="#94a3b8"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
            y={14}
          >
            {`${details.auditory.current_start}-${details.auditory.current_end}`}
          </SvgText>
        </G>
      </Svg>
    </View>
  );
}
