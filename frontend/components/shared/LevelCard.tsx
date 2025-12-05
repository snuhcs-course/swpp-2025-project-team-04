import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LevelDetail, MAX_SCORE } from '@/utils/levelUtils';

// 개별 레벨 카드 Props
type LevelCardProps = {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    detail: LevelDetail;
    color: string;
};

export default function LevelCard({ title, icon, detail, color }: LevelCardProps) {
    const isPositive = (detail.delta ?? 0) > 0;
    const isNegative = (detail.delta ?? 0) < 0;

    return (
        <View className="bg-white rounded-2xl p-4 shadow-sm w-full">
            {/* 헤더 */}
            <View className="flex-row items-center mb-3">
                <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-2.5"
                    style={{ backgroundColor: `${color}20` }}
                >
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <View className="flex-1">
                    <Text className="text-sm font-semibold text-slate-700">{title}</Text>
                    <Text className="text-xs text-slate-500">{detail.cefr_level}</Text>
                </View>
            </View>

            {/* 변화량 (Optional) */}
            {detail.delta !== undefined && detail.delta !== 0 && (
                <View className="items-center mb-3">
                    <View className="flex-row items-center">
                        {isPositive && <Ionicons name="arrow-up" size={28} color="#10b981" />}
                        {isNegative && (
                            <Ionicons name="arrow-down" size={28} color="#ef4444" />
                        )}
                        <Text
                            className={`ml-1 text-4xl font-bold ${isPositive
                                ? 'text-green-600'
                                : isNegative
                                    ? 'text-red-600'
                                    : 'text-slate-600'
                                }`}
                        >
                            {Math.abs(detail.delta).toFixed(1)}
                        </Text>
                    </View>
                </View>
            )}

            {/* 현재 스코어 */}
            <View className="mb-3">
                <Text className="text-2xl font-bold" style={{ color }}>
                    {detail.current_level.toFixed(1)}
                    <Text className="text-sm text-slate-400"> / {MAX_SCORE}</Text>
                </Text>
            </View>

            {/* 다음 레벨까지 프로그레스 바 */}
            {detail.next_level && (
                <View>
                    <Text className="text-xs text-slate-500 mb-1.5">
                        다음 레벨: {detail.next_level} (남은 점수:{' '}
                        {detail.remaining_to_next.toFixed(0)})
                    </Text>
                    <View className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <View
                            className="h-full rounded-full"
                            style={{
                                width: `${detail.progress_in_current}%`,
                                backgroundColor: color,
                            }}
                        />
                    </View>
                </View>
            )}
            {!detail.next_level && (
                <View>
                    <Text className="text-xs font-semibold text-purple-600">
                        🎉 최고 레벨!
                    </Text>
                </View>
            )}
        </View>
    );
}
