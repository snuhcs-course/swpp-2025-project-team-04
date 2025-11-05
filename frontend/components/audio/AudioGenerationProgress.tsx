import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { ProgressStep } from '@/services/audioWebSocket';

interface AudioGenerationProgressProps {
  visible: boolean;
  step: ProgressStep;
  message: string;
  percentage: number;
  isConnected: boolean;
  onCancel: () => void;
  onRetry?: () => void;
  error?: string;
}

const stepConfig = {
  connecting: {
    icon: '⏳',
    title: '연결 중',
    color: 'bg-blue-500',
  },
  script_generation: {
    icon: '📝',
    title: '스크립트 생성',
    color: 'bg-purple-500',
  },
  audio_generation: {
    icon: '🎵',
    title: '오디오 생성',
    color: 'bg-green-500',
  },
  saving: {
    icon: '💾',
    title: '저장 중',
    color: 'bg-orange-500',
  },
  complete: {
    icon: '✅',
    title: '완료',
    color: 'bg-emerald-500',
  },
};

export default function AudioGenerationProgress({
  visible,
  step,
  message,
  percentage,
  isConnected,
  onCancel,
  onRetry,
  error,
}: AudioGenerationProgressProps) {
  const currentStep = stepConfig[step];

  const getStepStatus = (stepKey: ProgressStep) => {
    const steps: ProgressStep[] = ['connecting', 'script_generation', 'audio_generation', 'saving', 'complete'];
    const currentIndex = steps.indexOf(step);
    const stepIndex = steps.indexOf(stepKey);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const renderStepIndicator = (stepKey: ProgressStep, index: number) => {
    const stepInfo = stepConfig[stepKey];
    const status = getStepStatus(stepKey);
    
    return (
      <View key={stepKey} className="flex-1 items-center">
        <View className="relative">
          <View
            className={`h-12 w-12 items-center justify-center rounded-full border-2 ${
              status === 'completed'
                ? 'border-emerald-500 bg-emerald-500'
                : status === 'current'
                ? `border-blue-500 ${stepInfo.color}`
                : 'border-gray-300 bg-gray-100'
            }`}
          >
            <Text className="text-lg">
              {status === 'completed' ? '✓' : stepInfo.icon}
            </Text>
          </View>
          
          {index < 4 && (
            <View
              className={`absolute left-12 top-6 h-0.5 w-8 ${
                status === 'completed' ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            />
          )}
        </View>
        
        <Text className={`mt-2 text-xs font-medium text-center ${
          status === 'current' ? 'text-blue-600' : 'text-gray-600'
        }`}>
          {stepInfo.title}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl">
          {/* Connection Status */}
          <View className="mb-4 flex-row items-center justify-center">
            <View className={`h-3 w-3 rounded-full mr-2 ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <Text className="text-sm text-gray-600">
              {isConnected ? '연결됨' : '연결 끊김'}
            </Text>
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-center text-gray-900 mb-6">
            오디오 생성 중
          </Text>

          {/* Step Indicators */}
          <View className="flex-row justify-between mb-6 px-2">
            {(['connecting', 'script_generation', 'audio_generation', 'saving', 'complete'] as ProgressStep[]).map((stepKey, index) => 
              renderStepIndicator(stepKey, index)
            )}
          </View>

          {/* Progress Bar */}
          <View className="mb-4">
            <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <View
                className={`h-full ${currentStep.color} rounded-full transition-all duration-500`}
                style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
              />
            </View>
            <Text className="text-center text-sm text-gray-600 mt-2">
              {Math.round(percentage)}%
            </Text>
          </View>

          {/* Current Step Info */}
          <View className="mb-6 p-4 bg-gray-50 rounded-xl">
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-3">{currentStep.icon}</Text>
              <Text className="text-lg font-semibold text-gray-900">
                {currentStep.title}
              </Text>
            </View>
            <Text className="text-sm text-gray-600 leading-5">
              {message}
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="mb-4 p-4 bg-red-50 rounded-xl border border-red-200">
              <Text className="text-red-800 font-medium mb-1">오류 발생</Text>
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row space-x-3">
            {error && onRetry && (
              <TouchableOpacity
                onPress={onRetry}
                className="flex-1 bg-blue-500 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold text-center">
                  다시 시도
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={onCancel}
              className={`${error && onRetry ? 'flex-1' : 'w-full'} ${
                error ? 'bg-gray-500' : 'bg-red-500'
              } py-3 rounded-xl`}
            >
              <Text className="text-white font-semibold text-center">
                {error ? '닫기' : '취소'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Estimated Time */}
          {!error && step !== 'complete' && (
            <Text className="text-center text-xs text-gray-500 mt-4">
              예상 시간: 10-30초
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}