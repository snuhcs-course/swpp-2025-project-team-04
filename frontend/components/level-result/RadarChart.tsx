import React from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, G, Circle, Path } from 'react-native-svg';

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
  const normalize = (detail: RadarStatDetail | undefined) => {
    if (!detail) return 0;
    const ratio = detail.progress_in_current / 100;
    if (isNaN(ratio)) return 0;
    return Math.min(Math.max(ratio, 0), 1);
  };

  const v1 = normalize(details.lexical);
  const v2 = normalize(details.syntactic);
  const v3 = normalize(details.auditory);

  const p1x = CENTER + RADIUS * v1 * Math.cos(-Math.PI / 2);
  const p1y = CENTER + RADIUS * v1 * Math.sin(-Math.PI / 2);

  const p2x = CENTER + RADIUS * v2 * Math.cos(Math.PI / 6);
  const p2y = CENTER + RADIUS * v2 * Math.sin(Math.PI / 6);

  const p3x = CENTER + RADIUS * v3 * Math.cos((5 * Math.PI) / 6);
  const p3y = CENTER + RADIUS * v3 * Math.sin((5 * Math.PI) / 6);

  const pathD = `M ${p1x} ${p1y} L ${p2x} ${p2y} L ${p3x} ${p3y} Z`;

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
        <Path
          d={pathD}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth="3"
        />

        {/* Vertex Dots */}
        <Circle r="4" fill="#3b82f6" stroke="white" strokeWidth="2" cx={p1x} cy={p1y} />
        <Circle r="4" fill="#3b82f6" stroke="white" strokeWidth="2" cx={p2x} cy={p2y} />
        <Circle r="4" fill="#3b82f6" stroke="white" strokeWidth="2" cx={p3x} cy={p3y} />

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
