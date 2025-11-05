import {
  generateAudio,
  type AudioGenerationPayload,
  type AudioGenerationResponse,
} from '@/api/audio';
import { useMutation } from '@tanstack/react-query';
import { useAudioWebSocket } from '@/hooks/useAudioWebSocket';

// Legacy HTTP-based hook (kept for backward compatibility)
export const useGenerateAudio = () => {
  return useMutation({
    mutationFn: generateAudio,
    onSuccess: (data: AudioGenerationResponse) => {
      console.log('오디오 생성 API 호출 성공:', data);
    },
    onError: (error) => console.error('오디오 생성 실패:', error),
  });
};

// New WebSocket-based hook with live progress tracking
export const useGenerateAudioWithWebSocket = () => {
  const audioWebSocket = useAudioWebSocket();

  return {
    // WebSocket state
    isGenerating: audioWebSocket.isGenerating,
    isConnected: audioWebSocket.isConnected,
    progress: audioWebSocket.progress,
    error: audioWebSocket.error,
    result: audioWebSocket.result,
    
    // Progress details
    currentStep: audioWebSocket.currentStep,
    currentMessage: audioWebSocket.currentMessage,
    currentPercentage: audioWebSocket.currentPercentage,
    
    // Actions
    generateAudio: audioWebSocket.generateAudio,
    cancelGeneration: audioWebSocket.cancelGeneration,
    retryGeneration: audioWebSocket.retryGeneration,
    clearError: audioWebSocket.clearError,
    clearResult: audioWebSocket.clearResult,
    
    // Mutation-like interface for compatibility
    mutate: audioWebSocket.generateAudio,
    isPending: audioWebSocket.isGenerating,
    isError: !!audioWebSocket.error,
    isSuccess: !!audioWebSocket.result,
    data: audioWebSocket.result,
  };
};
