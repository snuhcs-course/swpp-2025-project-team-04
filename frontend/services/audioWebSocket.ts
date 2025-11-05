import { getAccessToken } from '@/utils/tokenManager';
import { getBaseUrl } from '@/api/client';

export type ProgressStep = 'connecting' | 'script_generation' | 'audio_generation' | 'saving' | 'complete';

export interface ProgressUpdate {
  step: ProgressStep;
  message: string;
  percentage: number;
}

export interface AudioGenerationResult {
  generated_content_id: number;
  title: string;
  audio_url: string;
  sentences: Array<{
    text: string;
    start_time: number;
    end_time: number;
  }>;
}

export interface AudioGenerationRequest {
  mood: string;
  theme: string;
}

export type AudioGenerationCallback = {
  onProgress: (update: ProgressUpdate) => void;
  onSuccess: (result: AudioGenerationResult) => void;
  onError: (error: string) => void;
  onConnectionChange: (connected: boolean) => void;
};

export class AudioWebSocketService {
  private ws: WebSocket | null = null;
  private isConnecting: boolean = false;
  private callbacks: AudioGenerationCallback | null = null;

  private readonly progressMap: Record<string, number> = {
    script_generation: 25,
    audio_generation: 60,
    saving: 90,
    generation_complete: 100,
  };

  async generateAudio(
    request: AudioGenerationRequest,
    callbacks: AudioGenerationCallback
  ): Promise<void> {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      throw new Error('Audio generation is already in progress');
    }

    this.callbacks = callbacks;
    this.isConnecting = true;

    try {
      await this.connect();
      await this.authenticate();
      await this.sendGenerationRequest(request);
    } catch (error) {
      this.cleanup();
      this.callbacks?.onError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.callbacks?.onProgress({
          step: 'connecting',
          message: '서버에 연결 중입니다...',
          percentage: 5,
        });

        // Convert HTTP base URL to WebSocket URL
        const httpBaseUrl = getBaseUrl();
        const wsBaseUrl = httpBaseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
        const wsUrl = `${wsBaseUrl}/api/v1/audio/ws/generate`;
        
        console.log('🔌 Connecting to WebSocket:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.callbacks?.onConnectionChange(true);
          resolve();
        };

        this.ws.onclose = (event) => {
          this.callbacks?.onConnectionChange(false);
          if (this.isConnecting) {
            const reason = event.reason || 'Connection closed unexpectedly';
            reject(new Error(`Connection failed: ${reason}`));
          }
        };

        this.ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          this.callbacks?.onConnectionChange(false);
          reject(new Error('WebSocket connection error - 서버가 실행 중인지 확인해주세요'));
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        // Timeout after 10 seconds
        setTimeout(() => {
          if (this.isConnecting) {
            this.ws?.close();
            reject(new Error('연결 시간 초과 - 서버 연결을 확인해주세요'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  private async authenticate(): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = getAccessToken();
      if (!token) {
        reject(new Error('No access token available'));
        return;
      }

      this.callbacks?.onProgress({
        step: 'connecting',
        message: '인증 중입니다...',
        percentage: 10,
      });

      const authMessage = {
        type: 'auth',
        payload: {
          token: token,
        },
      };

      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(authMessage));

        // Set up auth response handler
        const originalOnMessage = this.ws.onmessage;
        this.ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.type === 'auth_success') {
            this.ws!.onmessage = originalOnMessage;
            resolve();
          } else if (message.type === 'error') {
            reject(new Error(message.payload.message || 'Authentication failed'));
          }
        };

        // Timeout for auth
        setTimeout(() => {
          reject(new Error('Authentication timeout'));
        }, 5000);
      } else {
        reject(new Error('WebSocket not connected'));
      }
    });
  }

  private async sendGenerationRequest(request: AudioGenerationRequest): Promise<void> {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.callbacks?.onProgress({
      step: 'script_generation',
      message: 'AI 스크립트 생성을 시작합니다...',
      percentage: 15,
    });

    const generationMessage = {
      type: 'generate_audio',
      payload: request,
    };

    this.ws.send(JSON.stringify(generationMessage));
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      console.log('WebSocket message received:', message);

      switch (message.type) {
        case 'status_update':
          this.handleStatusUpdate(message.payload);
          break;
        case 'generation_complete':
          this.handleGenerationComplete(message.payload);
          break;
        case 'error':
          this.handleError(message.payload);
          break;
        case 'auth_success':
          // Auth success is handled in authenticate method
          break;
        default:
          console.warn('Unknown message type:', message.type, message);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error, event.data);
      this.callbacks?.onError('서버 응답을 처리할 수 없습니다');
    }
  }

  private handleStatusUpdate(payload: { step_code: string; message: string }): void {
    const percentage = this.progressMap[payload.step_code] || 0;
    const step = this.mapStepCode(payload.step_code);

    this.callbacks?.onProgress({
      step,
      message: payload.message,
      percentage,
    });
  }

  private handleGenerationComplete(payload: AudioGenerationResult): void {
    this.callbacks?.onProgress({
      step: 'complete',
      message: '오디오 생성이 완료되었습니다!',
      percentage: 100,
    });

    this.callbacks?.onSuccess(payload);
    this.cleanup();
  }

  private handleError(payload: { step_code?: string; message: string }): void {
    const errorMessage = payload.message || '알 수 없는 오류가 발생했습니다';
    console.error('WebSocket error received:', payload);
    this.callbacks?.onError(errorMessage);
    this.cleanup();
  }

  private mapStepCode(stepCode: string): ProgressStep {
    switch (stepCode) {
      case 'script_generation':
        return 'script_generation';
      case 'audio_generation':
        return 'audio_generation';
      case 'saving':
        return 'saving';
      case 'generation_complete':
        return 'complete';
      default:
        return 'script_generation';
    }
  }

  cancel(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
    this.callbacks?.onConnectionChange(false);
    this.callbacks = null;
  }
}

export const audioWebSocketService = new AudioWebSocketService();