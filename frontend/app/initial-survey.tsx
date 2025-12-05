// screens/InitialSurveyScreen.tsx
import { useMemo, useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';

import LevelSelector from '@/components/initial-survey/LevelSelector';
import ListeningAudioButton from '@/components/initial-survey/ListeningAudioButton';
import NavButtons from '@/components/initial-survey/NavButtons';
import PercentageSlider from '@/components/initial-survey/PercentageSlider';
import ProgressBar from '@/components/initial-survey/ProgressBar';
import ResultStep from '@/components/initial-survey/ResultStep';
import TestOptionStep from '@/components/initial-survey/TestOptionStep';
import TopicGrid from '@/components/initial-survey/TopicGrid';
import WelcomeStep from '@/components/initial-survey/WelcomeStep';

import { LevelTestResponse } from '@/api/initialSurvey';

import {
  LISTENING_LEVELS,
  WELCOME_CONTENT,
  MAX_TOPIC_SELECTIONS,
  TOTAL_SURVEY_PAGES,
} from '@/constants/initialSurveyData';
import { THEME_OPTIONS } from '@/constants/homeOptions';
import { LEVEL_THRESHOLDS } from '@/utils/levelUtils';
import { mapLevelIdToCEFR } from '@/api/initialSurvey';

import {
  useSubmitLevelTest,
  useSubmitManualLevel,
  useUpdateInterests,
} from '@/hooks/mutations/useInitialSurveyMutations';

export default function InitialSurveyScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [skipTest, setSkipTest] = useState<boolean | null>(null);
  const [userInput, setUserInput] = useState({
    proficiencyLevel: '',
    percent1: 50,
    percent2: 50,
    percent3: 50,
    percent4: 50,
    percent5: 50,
    selectedTopics: [] as string[],
  });
  const [testResult, setTestResult] = useState<LevelTestResponse | null>(null);

  const { mutate: submitLevelTest, isPending: isLevelTestPending } =
    useSubmitLevelTest();
  const { mutate: submitManualLevel, isPending: isManualLevelPending } =
    useSubmitManualLevel();
  const { mutate: updateInterests, isPending: isUpdateInterestsPending } =
    useUpdateInterests();

  const isSubmitting =
    isLevelTestPending || isManualLevelPending || isUpdateInterestsPending;

  const handleNext = () => {
    if (currentStep === TOTAL_SURVEY_PAGES) {
      handleSubmit();
      return;
    }
    // 레벨 선택 없이 Step 2로 넘어가기 방지
    if (currentStep === 1 && !userInput.proficiencyLevel) {
      return;
    }
    // Step 1에서 레벨 선택 후 다음으로 넘어갈 때 API 호출
    if (currentStep === 1) {
      if (isSubmitting) return;
      submitManualLevel(
        { levelId: userInput.proficiencyLevel },
        {
          onSuccess: (data) => {
            setCurrentStep(currentStep + 1);
          },
          onError: () => {
            Alert.alert(
              '제출 실패',
              '레벨 설정에 실패했습니다. 다시 시도해주세요.',
              [{ text: '확인' }],
            );
          },
        },
      );
      return;
    }
    // Step 2에서 선택 없이 넘어가기 방지
    if (currentStep === 2 && skipTest === null) return;

    // Step 7 (Last Question) -> Submit Level Test
    if (currentStep === 7) {
      if (isSubmitting) return;
      submitLevelTest(
        {
          levelId: userInput.proficiencyLevel,
          percentages: [
            userInput.percent1,
            userInput.percent2,
            userInput.percent3,
            userInput.percent4,
            userInput.percent5,
          ],
        },
        {
          onSuccess: (data) => {
            setTestResult(data);
            setCurrentStep(8);
          },
          onError: () =>
            Alert.alert(
              '제출 실패',
              '레벨 테스트 제출에 실패했습니다. 다시 시도해주세요.',
              [{ text: '확인' }],
            ),
        },
      );
      return;
    }

    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      if ((currentStep === 8 || currentStep === 9) && skipTest === true) {
        setCurrentStep(2);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const goToWalkthrough = () => {
    router.replace('/walkthrough');
  };

  const handleSubmit = () => {
    if (isSubmitting) return;

    const submitInterestsAndNavigate = () => {
      if (userInput.selectedTopics.length > 0) {
        updateInterests(
          { interests: userInput.selectedTopics },
          {
            onSuccess: (data) => {
              goToWalkthrough();
            },
            onError: () => {
              Alert.alert(
                '제출 실패',
                '관심사 저장에 실패했습니다. 다시 시도해주세요.',
                [{ text: '확인' }],
              );
            },
          },
        );
      } else {
        goToWalkthrough();
      }
    };

    if (skipTest === true) {
      // 레벨은 이미 Step 2에서 제출했으므로, 관심사만 저장 후 워크스루 이동
      submitInterestsAndNavigate();
    } else {
      // 레벨 테스트도 이미 Step 7에서 제출했으므로, 관심사만 저장
      submitInterestsAndNavigate();
    }
  };

  const handleTopicToggle = (topicId: string) => {
    const currentTopics = userInput.selectedTopics;
    if (currentTopics.includes(topicId)) {
      setUserInput({
        ...userInput,
        selectedTopics: currentTopics.filter((t) => t !== topicId),
      });
    } else if (currentTopics.length < MAX_TOPIC_SELECTIONS) {
      setUserInput({
        ...userInput,
        selectedTopics: [...currentTopics, topicId],
      });
    }
  };

  const getNextButtonLabel = () => {
    if (currentStep === TOTAL_SURVEY_PAGES) return '완료';
    if (currentStep === 0) return '시작하기';
    if (currentStep === 2) {
      if (skipTest === true) return '건너뛰기';
      if (skipTest === false) return '테스트 시작';
      return '선택해주세요';
    }
    if (currentStep === 8) return ''; // Result Page has its own button
    return '다음';
  };

  const canProceed = () => {
    if (isSubmitting) return false;
    if (currentStep === 1 && !userInput.proficiencyLevel) return false;
    if (currentStep === 2 && skipTest === null) return false;
    return true;
  };

  // THEME_OPTIONS -> TopicGrid용 구조로 변환
  // TopicGrid expects: { category: string, topics: { id, label, emoji }[] }[]
  const themeCategories = useMemo(() => {
    const map = new Map<
      string,
      {
        category: string;
        topics: { id: string; label: string; emoji: string }[];
      }
    >();

    Object.entries(THEME_OPTIONS).forEach(([id, v]) => {
      const cat = v.category;
      if (!map.has(cat)) map.set(cat, { category: cat, topics: [] });
      map.get(cat)!.topics.push({ id, label: v.label, emoji: v.emoji });
    });

    const arr = Array.from(map.values());
    // 카테고리/토픽 정렬(선택)
    arr.sort((a, b) => a.category.localeCompare(b.category, 'ko'));
    arr.forEach((g) =>
      g.topics.sort((a, b) => a.label.localeCompare(b.label, 'ko')),
    );
    return arr;
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <WelcomeStep
            title={WELCOME_CONTENT.title}
            subtitle={WELCOME_CONTENT.subtitle}
            sections={WELCOME_CONTENT.sections}
          />
        );
      case 1:
        return (
          <LevelSelector
            levels={LISTENING_LEVELS}
            selectedLevel={userInput.proficiencyLevel}
            onSelect={(levelId) =>
              setUserInput({ ...userInput, proficiencyLevel: levelId })
            }
          />
        );
      case 2:
        return (
          <TestOptionStep
            onSelect={(skip) => {
              setSkipTest(skip);
              if (skip) {
                // Skip selected: Submit manual level immediately
                if (isSubmitting) return;

                submitManualLevel(
                  { levelId: userInput.proficiencyLevel },
                  {
                    onSuccess: (data: any) => {
                      // Construct mock result for manual level
                      const cefr = mapLevelIdToCEFR(userInput.proficiencyLevel);
                      const score = LEVEL_THRESHOLDS[cefr] || 0;

                      const mockResult: LevelTestResponse = {
                        success: true,
                        lexical: { cefr_level: cefr, score: score },
                        syntactic: { cefr_level: cefr, score: score },
                        auditory: { cefr_level: cefr, score: score },
                        overall: { cefr_level: cefr, score: score },
                      };

                      setTestResult(mockResult);
                      setCurrentStep(9);
                    },
                    onError: () => {
                      Alert.alert('오류', '제출에 실패했습니다.');
                    },
                  },
                );
              } else {
                setCurrentStep(currentStep + 1);
              }
            }}
          />
        );
      case 3:
        return (
          <>
            <ListeningAudioButton
              key="audio-1"
              level={userInput.proficiencyLevel}
              questionNumber={1}
            />
            <PercentageSlider
              value={userInput.percent1}
              onChange={(value) =>
                setUserInput({ ...userInput, percent1: value })
              }
              fileNumber={1}
            />
          </>
        );
      case 4:
        return (
          <>
            <ListeningAudioButton
              key="audio-2"
              level={userInput.proficiencyLevel}
              questionNumber={2}
            />
            <PercentageSlider
              value={userInput.percent2}
              onChange={(value) =>
                setUserInput({ ...userInput, percent2: value })
              }
              fileNumber={2}
            />
          </>
        );
      case 5:
        return (
          <>
            <ListeningAudioButton
              key="audio-3"
              level={userInput.proficiencyLevel}
              questionNumber={3}
            />
            <PercentageSlider
              value={userInput.percent3}
              onChange={(value) =>
                setUserInput({ ...userInput, percent3: value })
              }
              fileNumber={3}
            />
          </>
        );
      case 6:
        return (
          <>
            <ListeningAudioButton
              key="audio-4"
              level={userInput.proficiencyLevel}
              questionNumber={4}
            />
            <PercentageSlider
              value={userInput.percent4}
              onChange={(value) =>
                setUserInput({ ...userInput, percent4: value })
              }
              fileNumber={4}
            />
          </>
        );
      case 7:
        return (
          <>
            <ListeningAudioButton
              key="audio-5"
              level={userInput.proficiencyLevel}
              questionNumber={5}
            />
            <PercentageSlider
              value={userInput.percent5}
              onChange={(value) =>
                setUserInput({ ...userInput, percent5: value })
              }
              fileNumber={5}
            />
          </>
        );
      case 8:
        return testResult ? (
          <ResultStep results={testResult} onNext={() => setCurrentStep(9)} />
        ) : null;
      case 9:
        return (
          <TopicGrid
            categories={themeCategories}
            selectedTopics={userInput.selectedTopics}
            onToggle={handleTopicToggle}
            maxSelections={MAX_TOPIC_SELECTIONS}
          />
        );
      default:
        return null;
    }
  };

  // Topic Selection(9)만 스크롤 가능
  const isScrollableStep = currentStep === 9;

  return (
    <View className="flex-1" style={{ backgroundColor: '#EBF4FB' }}>
      {isScrollableStep ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pb-4 pt-12"
        >
          {currentStep > 0 && (
            <ProgressBar
              currentStep={currentStep}
              totalPages={TOTAL_SURVEY_PAGES}
            />
          )}
          {renderStep()}
        </ScrollView>
      ) : (
        <>
          <View className="flex-1 px-6 justify-center">{renderStep()}</View>
          {currentStep > 0 && (
            <View
              className="absolute top-0 left-0 right-0 px-6 pt-12"
              style={{ pointerEvents: 'box-none' }}
            >
              <ProgressBar
                currentStep={currentStep}
                totalPages={TOTAL_SURVEY_PAGES}
              />
            </View>
          )}
        </>
      )}

      <NavButtons
        onNext={handleNext}
        onBack={handleBack}
        nextLabel={getNextButtonLabel()}
        showBackButton={currentStep > 0 && currentStep !== 8}
        canProceed={canProceed()}
        hideNextButton={currentStep === 2 || currentStep === 8}
      />
    </View>
  );
}
