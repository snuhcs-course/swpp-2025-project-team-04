import { useState, useCallback, useRef } from 'react';
import { 
  audioWebSocketService, 
  type AudioGenerationRequest, 
  type AudioGenerationResult,
  type ProgressUpdate,
  type ProgressStep 
} from '@/services/audioWebSocket';

interface AudioWebSocketState {
  isGenerating: boolean;
  isConnected: boolean;
  progress: ProgressUpdate | null;
  error: string | null;
  result: AudioGenerationResult | null;
}

export const useAudioWebSocket = () => {
  const [state, setState] = useState<AudioWebSocketState>({
    isGenerating: false,
    isConnected: false,
    progress: null,
    error: null,
    result: null,
  });

  const successCallbackRef = useRef<((result: AudioGenerationResult) => void) | null>(null);

  const updateState = useCallback((updates: Partial<AudioWebSocketState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const generateAudio = useCallback(async (
    request: AudioGenerationRequest,
    onSuccess?: (result: AudioGenerationResult) => void
  ) => {
    if (state.isGenerating) {
      throw new Error('Audio generation is already in progress');
    }

    // Store success callback
    successCallbackRef.current = onSuccess || null;

    // Reset state
    updateState({
      isGenerating: true,
      error: null,
      result: null,
      progress: null,
    });

    try {
      await audioWebSocketService.generateAudio(request, {
        onProgress: (update: ProgressUpdate) => {
          updateState({ progress: update });
        },
        
        onSuccess: (result: AudioGenerationResult) => {
          updateState({ 
            isGenerating: false,
            result,
            progress: {
              step: 'complete',
              message: '오디오 생성이 완료되었습니다!',
              percentage: 100,
            }
          });
          
          // Call the success callback if provided
          successCallbackRef.current?.(result);
          successCallbackRef.current = null;
        },
        
        onError: (error: string) => {
          updateState({ 
            isGenerating: false, 
            error,
            progress: null 
          });
          successCallbackRef.current = null;
        },
        
        onConnectionChange: (connected: boolean) => {
          updateState({ isConnected: connected });
        },
      });
    } catch (error) {
      updateState({ 
        isGenerating: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
      successCallbackRef.current = null;
    }
  }, [state.isGenerating, updateState]);

  const cancelGeneration = useCallback(() => {
    audioWebSocketService.cancel();
    updateState({ 
      isGenerating: false, 
      progress: null,
      error: null 
    });
    successCallbackRef.current = null;
  }, [updateState]);

  const retryGeneration = useCallback(async (
    request: AudioGenerationRequest,
    onSuccess?: (result: AudioGenerationResult) => void
  ) => {
    // Clear error state first
    updateState({ error: null });
    
    // Small delay to show state change
    setTimeout(() => {
      generateAudio(request, onSuccess);
    }, 100);
  }, [generateAudio, updateState]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const clearResult = useCallback(() => {
    updateState({ result: null, progress: null });
  }, [updateState]);

  return {
    // State
    isGenerating: state.isGenerating,
    isConnected: state.isConnected,
    progress: state.progress,
    error: state.error,
    result: state.result,
    
    // Actions
    generateAudio,
    cancelGeneration,
    retryGeneration,
    clearError,
    clearResult,
    
    // Computed values
    currentStep: state.progress?.step || 'connecting',
    currentMessage: state.progress?.message || '',
    currentPercentage: state.progress?.percentage || 0,
  };
};