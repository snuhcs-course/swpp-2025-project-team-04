import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Slider from '@react-native-community/slider';

export default function InitialSurveyScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userInput, setUserInput] = useState({
    proficiencyLevel: '',
    percent1: 50,
    percent2: 50,
    percent3: 50,
    percent4: 50,
    percent5: 50,
    selectedTopics: [] as string[],
  });

  const totalPages = 7;

  const listeningLevels = [
    { id: '1', title: '(A1) 초보자' },
    { id: '2', title: '(A2) 기본 이해' },
    { id: '3', title: '(B1) 일상 대화 가능' },
    { id: '4', title: '(B2) 자연스러운 대화 가능' },
    { id: '5', title: '(C1) 전문적인 이해' },
    { id: '6', title: '(C2) 원어민 수준' }
  ];

  const topicCategories = [
    {
      category: '시사·뉴스',
      topics: [
        { id: '정치', label: '🏛️ 정치' },
        { id: '경제', label: '💰 경제' },
        { id: '사회', label: '👥 사회' },
        { id: '국제', label: '🌍 국제' },
        { id: '기술 트렌드', label: '🚀 기술 트렌드' }
      ]
    },
    {
      category: '라이프스타일',
      topics: [
        { id: '여행', label: '✈️ 여행' },
        { id: '음식', label: '🍴 음식' },
        { id: '건강', label: '💪 건강' },
        { id: '자기계발', label: '📈 자기계발' },
        { id: '재테크', label: '💵 재테크' }
      ]
    },
    {
      category: '문화·엔터테인먼트',
      topics: [
        { id: '영화/드라마', label: '🎬 영화/드라마' },
        { id: '음악', label: '🎵 음악' },
        { id: '스포츠', label: '⚽ 스포츠' },
        { id: '게임', label: '🎮 게임' },
        { id: '예술', label: '🎨 예술' }
      ]
    },
    {
      category: '지식·교육',
      topics: [
        { id: '과학', label: '🔬 과학' },
        { id: '역사', label: '📜 역사' },
        { id: '철학', label: '💭 철학' },
        { id: '심리학', label: '🧠 심리학' },
        { id: 'IT/AI', label: '🤖 IT/AI' },
        { id: '언어 학습', label: '📚 언어 학습' }
      ]
    },
    {
      category: '개인 경험·스토리',
      topics: [
        { id: '에세이', label: '✍️ 에세이' },
        { id: '인터뷰', label: '🎤 인터뷰' },
        { id: '일상 이야기', label: '💬 일상 이야기' }
      ]
    }
  ];

  const handleNext = () => {
    if (currentStep === totalPages) {
      handleSubmit();
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    router.replace('/(main)');
  };

  const handleTopicToggle = (topic: string) => {
    const currentTopics = userInput.selectedTopics;
    if (currentTopics.includes(topic)) {// Remove if already selected
      setUserInput({
        ...userInput,
        selectedTopics: currentTopics.filter(t => t !== topic)
      });
    } else if (currentTopics.length < 3) {// Add if less than 3 selected
      setUserInput({
        ...userInput,
        selectedTopics: [...currentTopics, topic]
      });
    }
  };

  const useSlider = (
    percentKey: 'percent1' | 'percent2' | 'percent3' | 'percent4' | 'percent5',
    fileNumber: number
  ) => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.tempText}>listening file {fileNumber}</Text>

        <View style={styles.sliderContainer}>
          <Text style={styles.sliderQuestion}>
            들은 내용 중 몇 %를 이해했는지 솔직하게 평가해 주세요.
          </Text>

          <View style={styles.sliderWrapper}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={10}
              value={userInput[percentKey]}
              onValueChange={(value) => {
                setUserInput({ ...userInput, [percentKey]: value });
              }}
              minimumTrackTintColor="#6FA4D7"
              maximumTrackTintColor="#e0e0e0"
              thumbTintColor="#6FA4D7"
            />

            <Text style={styles.sliderValue}>{userInput[percentKey]}%</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.introContainer}>
            <Text style={styles.introTitle}>LingoFit에 오신 것을 환영합니다! 🎧</Text>
            <Text style={styles.introSubtitle}>여러분에게 꼭 맞는 영어 듣기 레벨을 찾아봅시다.</Text>

            <View style={styles.introSection}>
              <Text style={styles.introSectionTitle}>이 설문이 왜 필요할까요?</Text>
              <Text style={styles.introText}>
                최고의 학습 경험을 제공하기 위해, 저희는 먼저 여러분의 현재 영어 듣기 실력을 파악해야 합니다. 이 짧은 설문은 여러분의 강점을 분석하고, 앞으로 가장 빠르게 성장할 수 있는 영역을 찾는 데 도움을 줄 것입니다.
              </Text>
              <Text style={styles.introHighlight}>
                결과는 점수가 아닌, 여러분의 가장 효율적인 '시작점'입니다.
              </Text>
              <Text style={styles.introText}>
                솔직하게 답해 주시면, 저희 앱이 여러분만을 위한 맞춤 학습 계획을 세울 수 있습니다. 이를 통해 이미 아는 내용을 복습하며 시간을 낭비하거나, 너무 어려워서 흥미를 잃을 일이 없도록 도와드립니다.
              </Text>
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.levelQuestion}>영어 듣기 실력은 어느 정도인가요?</Text>
            <Text style={styles.levelSubtitle}>가장 정확하다고 생각하는 레벨을 하나 선택해 주세요.</Text>
            <View style={styles.levelsContainer}>
              {listeningLevels.map((level) => {
                const isSelected = userInput.proficiencyLevel === level.id;
                return (
                  <TouchableOpacity
                    key={level.id}
                    style={[
                      styles.levelButton,
                      isSelected && styles.levelButtonSelected,
                    ]}
                    onPress={() => {
                      setUserInput({ ...userInput, proficiencyLevel: level.id });
                    }}
                  >
                    <Text style={[styles.levelTitle, isSelected && styles.levelTitleSelected]}>
                      {level.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      case 2:
        return useSlider('percent1', 1);
      case 3:
        return useSlider('percent2', 2);
      case 4:
        return useSlider('percent3', 3);
      case 5:
        return useSlider('percent4', 4);
      case 6:
        return useSlider('percent5', 5);
      case 7:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.topicTitle}>가장 관심 있는 주제를 선택해주세요</Text>
            <Text style={styles.topicSubtitle}>(최대 3개)</Text>

            {topicCategories.map((categoryData, index) => (
              <View key={index} style={styles.categoryContainer}>
                <Text style={styles.categoryHeader}>{categoryData.category}</Text>
                <View style={styles.topicsGrid}>
                  {categoryData.topics.map((topic) => {
                    const isSelected = userInput.selectedTopics.includes(topic.id);
                    return (
                      <TouchableOpacity
                        key={topic.id}
                        style={[
                          styles.topicButton,
                          isSelected && styles.topicButtonSelected,
                        ]}
                        onPress={() => handleTopicToggle(topic.id)}
                      >
                        <Text style={[
                          styles.topicButtonText,
                          isSelected && styles.topicButtonTextSelected
                        ]}>
                          {topic.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            <Text style={styles.topicCounter}>
              {userInput.selectedTopics.length}/3 선택됨
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {currentStep > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(currentStep / totalPages) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}

        {renderStep()}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>이전</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, currentStep === 0 && styles.nextButtonFull]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === totalPages ? '완료' : currentStep === 0 ? '시작하기' : '다음'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6FA4D7',
    borderRadius: 4,
  },
  stepContainer: {
    marginBottom: 20,
  },
  tempText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingBottom: 40,
    backgroundColor: '#fff',
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#6FA4D7',
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 2,
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  introContainer: {
    paddingVertical: 20,
  },
  introTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 26,
  },
  introSection: {
    backgroundColor: '#f9f9f9',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  introSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  introText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 16,
  },
  introHighlight: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6FA4D7',
    lineHeight: 24,
    marginBottom: 16,
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  levelQuestion: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  levelSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  levelsContainer: {
    gap: 12,
  },
  levelButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  levelButtonSelected: {
    borderColor: '#6FA4D7',
    backgroundColor: '#f3f4f6',
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  levelTitleSelected: {
    color: '#6FA4D7',
  },
  sliderContainer: {
    marginTop: 40,
    paddingHorizontal: 8,
  },
  sliderQuestion: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 28,
  },
  sliderWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6FA4D7',
    marginTop: 20,
  },
  topicTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 30,
  },
  topicSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 19,
    textAlign: 'center',
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  topicButtonSelected: {
    borderColor: '#6FA4D7',
    backgroundColor: '#6FA4D7',
  },
  topicButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  topicButtonTextSelected: {
    color: '#fff',
  },
  topicCounter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6FA4D7',
    textAlign: 'center',
    marginTop: 16,
  },
});
