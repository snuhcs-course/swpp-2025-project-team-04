import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LevelTestResponse } from '@/api/initialSurvey';
import LevelCard from '@/components/shared/LevelCard';
import { calculateLevelDetail, LEVEL_COLORS } from '@/utils/levelUtils';

type ResultStepProps = {
    results: LevelTestResponse;
    onNext: () => void;
};

export default function ResultStep({ results, onNext }: ResultStepProps) {
    const lexicalDetail = calculateLevelDetail(
        results.lexical.score,
        0, // Initial survey has no delta
    );
    const syntacticDetail = calculateLevelDetail(
        results.syntactic.score,
        0,
    );
    const auditoryDetail = calculateLevelDetail(
        results.auditory.score,
        0,
    );

    const averageLevel = results.overall.score;

    return (
        <View className="flex-1">
            <View className="mb-6">
                <Text className="text-2xl font-bold text-gray-900 mb-2">
                    레벨 테스트 결과 📊
                </Text>
                <Text className="text-gray-600">
                    분석된 현재 영어 실력입니다.
                </Text>
            </View>

            {/* 전체 평균 */}
            <View className="bg-[#6FA4D7] rounded-3xl p-8 mb-4 shadow-md items-center">
                <Text className="text-white text-xl font-semibold mb-3">
                    종합 레벨
                </Text>
                <Text className="text-white text-6xl font-bold mb-1">
                    {results.overall.cefr_level}
                </Text>
                <Text className="text-white/80 text-sm">
                    Score: {averageLevel.toFixed(1)}
                </Text>
            </View>

            {/* 개별 레벨 카드들 */}
            <View className="gap-3 mb-6">
                <LevelCard
                    title="어휘력"
                    icon="book-outline"
                    detail={lexicalDetail}
                    color={LEVEL_COLORS.lexical}
                />

                <LevelCard
                    title="문법"
                    icon="git-network-outline"
                    detail={syntacticDetail}
                    color={LEVEL_COLORS.syntactic}
                />

                <LevelCard
                    title="청취력"
                    icon="headset-outline"
                    detail={auditoryDetail}
                    color={LEVEL_COLORS.auditory}
                />
            </View>

            <Pressable
                className="bg-[#6FA4D7] rounded-xl py-4 items-center active:opacity-80"
                onPress={onNext}
            >
                <Text className="text-white font-bold text-lg">
                    관심사 선택하러 가기
                </Text>
            </Pressable>
        </View>
    );
}
