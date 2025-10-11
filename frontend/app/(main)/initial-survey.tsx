import {useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet} from 'react-native';
import {router} from 'expo-router';

export default function InitialSurveyScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userInput, setUserInput] = useState({
    proficiencyLevel: '',
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
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.tempText}>listening file 1</Text>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.tempText}>listening file 2</Text>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.tempText}>listening file 3</Text>
          </View>
        );
      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.tempText}>listening file 4</Text>
          </View>
        );
      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.tempText}>listening file 5</Text>
          </View>
        );
      case 7:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.tempText}>Final Page</Text>
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
});
