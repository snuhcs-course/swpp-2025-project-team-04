import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
        <View className="flex-1 pb-4 pt-20">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                showsVerticalScrollIndicator={false}
            >
                <View className="mb-4">
                    <Text className="text-[32px] font-black text-slate-900 mb-2 text-center leading-[40px] tracking-tight">
                        레벨 테스트 결과
                    </Text>
                    <Text className="text-[15px] text-slate-600 text-center leading-[22px]">
                        분석된 현재 영어 실력입니다
                    </Text>
                </View>

                {/* 전체 평균 */}
                <View className="rounded-[32px] mb-6 shadow-md mx-4 overflow-hidden">
                    <LinearGradient
                        colors={['#0EA5E9', '#38BDF8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="p-6 items-center"
                    >
                        <Text className="text-white text-lg font-bold mb-2 opacity-90">
                            종합 레벨
                        </Text>
                        <Text className="text-white text-[56px] font-black mb-1 leading-[64px]">
                            {results.overall.cefr_level}
                        </Text>
                        <View className="bg-white/20 px-4 py-1 rounded-full">
                            <Text className="text-white font-semibold text-xs">
                                Score: {averageLevel.toFixed(1)}
                            </Text>
                        </View>
                    </LinearGradient>
                </View>

                {/* 개별 레벨 카드들 */}
                <View className="gap-3 mb-4">
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
            </ScrollView>

            <Pressable
                onPress={onNext}
                className="overflow-hidden rounded-2xl shadow-sm active:opacity-90 mt-auto"
            >
                <LinearGradient
                    colors={['#0EA5E9', '#38BDF8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="py-4 items-center"
                >
                    <Text className="text-white font-bold text-[17px]">
                        관심사 선택하러 가기
                    </Text>
                </LinearGradient>
            </Pressable>
        </View>
    );
}
