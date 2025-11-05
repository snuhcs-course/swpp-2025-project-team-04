import { customFetch } from './client';
import { 
  audioWebSocketService, 
  type AudioGenerationRequest as WSAudioGenerationRequest,
  type AudioGenerationResult as WSAudioGenerationResult 
} from '@/services/audioWebSocket';

// --- Types ---

export type AudioGenerationPayload = {
  mood: string;
  theme: string;
};

export type Sentence = {
  id: string;
  start_time: string;
  text: string;
};

export type AudioGenerationResponse = {
  title: string;
  audio_url: string;
  sentences: Sentence[];
};

// WebSocket types (re-exported for compatibility)
export type AudioGenerationRequest = WSAudioGenerationRequest;
export type AudioGenerationResult = WSAudioGenerationResult;

// --- API functions ---

// Legacy HTTP endpoint (kept for backward compatibility)
export const generateAudio = async (
  payload: AudioGenerationPayload,
): Promise<AudioGenerationResponse> => {
  return customFetch<AudioGenerationResponse>('/audio/test-generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// WebSocket-based audio generation (new primary method)
export const generateAudioWithWebSocket = async (
  request: AudioGenerationRequest,
  callbacks: {
    onProgress: (step: string, message: string, percentage: number) => void;
    onSuccess: (result: AudioGenerationResult) => void;
    onError: (error: string) => void;
    onConnectionChange: (connected: boolean) => void;
  }
): Promise<void> => {
  return audioWebSocketService.generateAudio(request, {
    onProgress: (update) => {
      callbacks.onProgress(update.step, update.message, update.percentage);
    },
    onSuccess: callbacks.onSuccess,
    onError: callbacks.onError,
    onConnectionChange: callbacks.onConnectionChange,
  });
};
