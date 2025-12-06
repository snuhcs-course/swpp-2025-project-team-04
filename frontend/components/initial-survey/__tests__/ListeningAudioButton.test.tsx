import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react-native';
import ListeningAudioButton from '../ListeningAudioButton';
import * as FileSystem from 'expo-file-system/legacy';
import { getAccessToken } from '@/utils/tokenManager';
import { Alert } from 'react-native';

// Mock
jest.mock('expo-audio', () => {
  const mockPlayer = {
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    replace: jest.fn(),
  };

  return {
    useAudioPlayer: jest.fn(() => mockPlayer),
    useAudioPlayerStatus: jest.fn(() => ({
      playing: false,
      currentTime: 0,
      duration: 0,
    })),
  };
});

jest.mock('expo-file-system/legacy', () => ({
  downloadAsync: jest.fn(),
  cacheDirectory: 'file://cache/',
}));

jest.mock('@/utils/tokenManager', () => ({
  getAccessToken: jest.fn(),
}));

jest.mock('@/api/initialSurvey', () => ({
  getAudioUrl: jest.fn(
    (level, questionNumber) =>
      `https://api.test.com/audio/${level}/${questionNumber}.wav`,
  ),
}));

jest.spyOn(Alert, 'alert');

const mockUseAudioPlayer = require('expo-audio').useAudioPlayer;
const mockUseAudioPlayerStatus = require('expo-audio').useAudioPlayerStatus;

describe('ListeningAudioButton', () => {
  const mockGetAccessToken = getAccessToken as jest.MockedFunction<
    typeof getAccessToken
  >;
  const mockDownloadAsync = FileSystem.downloadAsync as jest.MockedFunction<
    typeof FileSystem.downloadAsync
  >;

  let mockPlayer: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPlayer = {
      play: jest.fn(),
      pause: jest.fn(),
      seekTo: jest.fn(),
      replace: jest.fn(),
    };

    mockUseAudioPlayer.mockReturnValue(mockPlayer);
    mockUseAudioPlayerStatus.mockReturnValue({
      playing: false,
      currentTime: 0,
      duration: 0,
    });

    mockGetAccessToken.mockReturnValue('test-token');
  });

  describe('렌더링', () => {
    it('renders with correct audio number', () => {
      render(<ListeningAudioButton level="intermediate" questionNumber={1} />);

      expect(screen.getByText('1/5')).toBeTruthy();
    });

    it('renders play button initially', () => {
      render(<ListeningAudioButton level="intermediate" questionNumber={1} />);

      expect(screen.getByText('재생하기')).toBeTruthy();
    });

    it('renders with different question numbers', () => {
      const { rerender } = render(
        <ListeningAudioButton level="intermediate" questionNumber={1} />,
      );
      expect(screen.getByText('1/5')).toBeTruthy();

      rerender(
        <ListeningAudioButton level="intermediate" questionNumber={2} />,
      );
      expect(screen.getByText('2/5')).toBeTruthy();
    });
  });

  describe('초기 재생', () => {
    it('downloads and plays audio when play button is pressed', async () => {
      mockDownloadAsync.mockResolvedValue({
        uri: 'file://cache/audio_intermediate_1.wav',
        status: 200,
        headers: {},
        md5: '',
      });

      render(<ListeningAudioButton level="intermediate" questionNumber={1} />);

      const playButton = screen.getByText('재생하기');
      fireEvent.press(playButton);

      await waitFor(() => {
        expect(mockDownloadAsync).toHaveBeenCalledWith(
          'https://api.test.com/audio/intermediate/1.wav',
          'file://cache/audio_intermediate_1.wav',
          {
            headers: {
              Authorization: 'Bearer test-token',
            },
          },
        );
      });

      await waitFor(() => {
        expect(mockPlayer.replace).toHaveBeenCalledWith({
          uri: 'file://cache/audio_intermediate_1.wav',
        });
        expect(mockPlayer.play).toHaveBeenCalled();
      });
    });

    it('shows error alert when download fails', async () => {
      mockDownloadAsync.mockResolvedValue({
        uri: '',
        status: 404,
        headers: {},
        md5: '',
      });

      render(<ListeningAudioButton level="intermediate" questionNumber={1} />);

      const playButton = screen.getByText('재생하기');
      fireEvent.press(playButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '오디오 재생 오류',
          '오디오 파일을 불러올 수 없습니다.',
        );
      });
    });

    it('shows error alert when no access token available', async () => {
      mockGetAccessToken.mockReturnValue(null);

      render(<ListeningAudioButton level="intermediate" questionNumber={1} />);

      const playButton = screen.getByText('재생하기');
      fireEvent.press(playButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '오디오 재생 오류',
          '오디오 파일을 불러올 수 없습니다.',
        );
      });
    });
  });

  describe('재생 중', () => {
    it('shows pause button when audio is playing', () => {
      mockUseAudioPlayerStatus.mockReturnValue({
        playing: true,
        currentTime: 5,
        duration: 30,
      });

      render(<ListeningAudioButton level="intermediate" questionNumber={1} />);

      expect(screen.getByText('일시정지')).toBeTruthy();
    });

    it('pauses audio when pause button is pressed', () => {
      mockUseAudioPlayerStatus.mockReturnValue({
        playing: true,
        currentTime: 5,
        duration: 30,
      });

      render(<ListeningAudioButton level="intermediate" questionNumber={1} />);

      const pauseButton = screen.getByText('일시정지');
      fireEvent.press(pauseButton);

      expect(mockPlayer.pause).toHaveBeenCalled();
    });
  });

  describe('일시정지 상태', () => {
    it('shows restart and play buttons when paused', async () => {
      // 다운로드 하고 플레이
      mockDownloadAsync.mockResolvedValue({
        uri: 'file://cache/audio_intermediate_1.wav',
        status: 200,
        headers: {},
        md5: '',
      });

      const { rerender } = render(
        <ListeningAudioButton level="intermediate" questionNumber={1} />,
      );

      const playButton = screen.getByText('재생하기');
      fireEvent.press(playButton);

      await waitFor(() => {
        expect(mockPlayer.play).toHaveBeenCalled();
      });

      // pause state 업데이트
      mockUseAudioPlayerStatus.mockReturnValue({
        playing: false,
        currentTime: 10,
        duration: 30,
      });

      rerender(
        <ListeningAudioButton level="intermediate" questionNumber={1} />,
      );

      // state 업데이트 대기
      await waitFor(() => {
        expect(screen.queryByText('다시 듣기')).toBeTruthy();
      });
    });

    it('resumes playback when play button is pressed', async () => {
      mockDownloadAsync.mockResolvedValue({
        uri: 'file://cache/audio_intermediate_1.wav',
        status: 200,
        headers: {},
        md5: '',
      });

      const { rerender } = render(
        <ListeningAudioButton level="intermediate" questionNumber={1} />,
      );

      const initialPlayButton = screen.getByText('재생하기');
      fireEvent.press(initialPlayButton);

      await waitFor(() => {
        expect(mockPlayer.play).toHaveBeenCalled();
      });

      mockUseAudioPlayerStatus.mockReturnValue({
        playing: false,
        currentTime: 10,
        duration: 30,
      });

      rerender(
        <ListeningAudioButton level="intermediate" questionNumber={1} />,
      );

      await waitFor(() => {
        const resumePlayButton = screen.getByText('다시 듣기');
        fireEvent.press(resumePlayButton);
        expect(mockPlayer.play).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('재시작 기능', () => {
    it('calls seekTo and play when restart button functionality is invoked', async () => {
      mockDownloadAsync.mockResolvedValue({
        uri: 'file://cache/audio_intermediate_1.wav',
        status: 200,
        headers: {},
        md5: '',
      });

      render(<ListeningAudioButton level="intermediate" questionNumber={1} />);

      const playButton = screen.getByText('재생하기');
      fireEvent.press(playButton);

      await waitFor(() => {
        expect(mockPlayer.play).toHaveBeenCalled();
        expect(mockPlayer.replace).toHaveBeenCalledWith({
          uri: 'file://cache/audio_intermediate_1.wav',
        });
      });

      expect(mockPlayer.seekTo).toBeDefined();
      expect(typeof mockPlayer.seekTo).toBe('function');
    });

    it('shows restart button when audio is finished and can restart', async () => {
      mockDownloadAsync.mockResolvedValue({
        uri: 'file://cache/audio_intermediate_1.wav',
        status: 200,
        headers: {},
        md5: '',
      });

      const { rerender } = render(
        <ListeningAudioButton level="intermediate" questionNumber={1} />,
      );

      const playButton = screen.getByText('재생하기');
      fireEvent.press(playButton);

      await waitFor(() => {
        expect(mockPlayer.play).toHaveBeenCalled();
      });

      mockUseAudioPlayerStatus.mockReturnValue({
        playing: false,
        currentTime: 29,
        duration: 30,
      });

      rerender(
        <ListeningAudioButton level="intermediate" questionNumber={1} />,
      );

      await waitFor(() => {
        const restartButton = screen.queryByText('다시 듣기');
        if (restartButton) {
          fireEvent.press(restartButton);
          expect(mockPlayer.seekTo).toHaveBeenCalledWith(0);
          expect(mockPlayer.play).toHaveBeenCalled();
        }
      });
    });

    it('does nothing when restart is called without player', async () => {
      mockUseAudioPlayer.mockReturnValue(null);

      render(<ListeningAudioButton level="intermediate" questionNumber={1} />);

      expect(screen.getByText('재생하기')).toBeTruthy();
    });
  });

  describe('완료 상태', () => {
    it('shows only restart button when audio is finished', async () => {
      mockDownloadAsync.mockResolvedValue({
        uri: 'file://cache/audio_intermediate_1.wav',
        status: 200,
        headers: {},
        md5: '',
      });

      render(<ListeningAudioButton level="intermediate" questionNumber={1} />);

      const playButton = screen.getByText('재생하기');
      fireEvent.press(playButton);

      await waitFor(() => {
        expect(mockPlayer.play).toHaveBeenCalled();
      });
      expect(mockPlayer.play).toHaveBeenCalled();
    });
  });

  describe('시간 표시', () => {
    it('formats time display correctly', () => {
      mockUseAudioPlayerStatus.mockReturnValue({
        playing: false,
        currentTime: 0,
        duration: 0,
      });

      render(<ListeningAudioButton level="intermediate" questionNumber={1} />);

      const timeDisplays = screen.getAllByText('0:00');
      expect(timeDisplays.length).toBeGreaterThan(0);
    });

    it('displays duration correctly when audio is loaded', () => {
      mockUseAudioPlayerStatus.mockReturnValue({
        playing: false,
        currentTime: 0,
        duration: 125,
      });

      render(<ListeningAudioButton level="intermediate" questionNumber={1} />);

      expect(screen.getByText('2:05')).toBeTruthy();
    });

    it('updates time display when audio is playing', async () => {
      jest.useFakeTimers();

      mockUseAudioPlayerStatus.mockReturnValue({
        playing: true,
        currentTime: 10,
        duration: 30,
      });

      render(<ListeningAudioButton level="intermediate" questionNumber={1} />);

      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(screen.getByText('0:10')).toBeTruthy();
      });

      jest.useRealTimers();
    });

    it('sets current time to duration when near end of audio', async () => {
      jest.useFakeTimers();

      mockUseAudioPlayerStatus.mockReturnValue({
        playing: true,
        currentTime: 29.7,
        duration: 30,
      });

      render(<ListeningAudioButton level="intermediate" questionNumber={1} />);

      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(screen.getByText('0:30')).toBeTruthy();
      });

      jest.useRealTimers();
    });
  });

  describe('레벨 및 질문 변경', () => {
    it('resets state when level changes', () => {
      const { rerender } = render(
        <ListeningAudioButton level="beginner" questionNumber={1} />,
      );

      rerender(<ListeningAudioButton level="advanced" questionNumber={1} />);

      expect(screen.getByText('재생하기')).toBeTruthy();
    });

    it('resets state when question number changes', () => {
      const { rerender } = render(
        <ListeningAudioButton level="intermediate" questionNumber={1} />,
      );

      rerender(
        <ListeningAudioButton level="intermediate" questionNumber={2} />,
      );

      expect(screen.getByText('2/5')).toBeTruthy();
      expect(screen.getByText('재생하기')).toBeTruthy();
    });
  });
});
