import { customFetch } from './client';

// --- Types ---

export type AudioGenerationPayload = {
  style: string;
  theme: string;
};

export type Sentence = {
  id: number;
  start_time: number;
  text: string;
};

export type AudioGenerationResponse = {
  generated_content_id: number;
  title: string;
  audio_url: string;
  sentences: Sentence[];
};

// --- API functions ---

export const generateAudio = async (
  payload: AudioGenerationPayload,
): Promise<AudioGenerationResponse> => {
  return customFetch<AudioGenerationResponse>('/audio/generate-mock', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
