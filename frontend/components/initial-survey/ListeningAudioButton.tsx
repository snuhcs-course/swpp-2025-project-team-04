import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, Alert } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { getAudioUrl } from '@/api/initialSurvey';
import { getAccessToken } from '@/utils/tokenManager';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type ListeningAudioButtonProps = {
  level: string;
  questionNumber: number;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function ListeningAudioButton({
  level,
  questionNumber,
}: ListeningAudioButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [downloadedUri, setDownloadedUri] = useState<string | null>(null);

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const audioUrl = useMemo(() => {
    if (!level) return '';
    return getAudioUrl(level, questionNumber);
  }, [level, questionNumber]);

  useEffect(() => {
    setDownloadedUri(null);
    setIsLoading(false);

    if (player) {
      player.pause();
      player.seekTo(0);
    }
  }, [level, questionNumber, player]);

  const handlePlay = useCallback(async () => {
    if (!player) return;

    try {
      if (downloadedUri) {
        player.seekTo(0);
        player.play();
        return;
      }

      setIsLoading(true);

      if (!audioUrl) {
        throw new Error('No audio URL');
      }

      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const fileName = `audio_${level}_${questionNumber}.wav`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      const downloadResult = await FileSystem.downloadAsync(
        audioUrl,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (downloadResult.status !== 200) {
        throw new Error(`Failed to download audio`);
      }

      setDownloadedUri(downloadResult.uri);
      player.replace({ uri: downloadResult.uri });
      player.play();
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load audio:', error);
      setIsLoading(false);
      Alert.alert('오디오 재생 오류', '오디오 파일을 불러올 수 없습니다.');
    }
  }, [player, audioUrl, downloadedUri, level, questionNumber]);

  const handlePause = useCallback(() => {
    if (!player) return;
    player.pause();
  }, [player]);

  const handleReplay = useCallback(() => {
    if (!player || !downloadedUri) return;
    player.seekTo(0);
    player.play();
  }, [player, downloadedUri]);

  const duration = status?.duration || 0;
  const currentTime = status?.currentTime || 0;
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
  const isPlaying = status?.playing || false;
  const hasFinished = downloadedUri !== null && !isPlaying && currentTime > 0;

  return (
    <View className="items-center w-full mb-6">
      <View className="items-center mb-8">
        <Text className="text-[32px] font-black text-slate-900 text-center leading-[40px] tracking-tight mb-2">
          듣기 평가
        </Text>
        <Text className="text-[20px] font-bold text-slate-700 text-center mb-1">
          {questionNumber}/5
        </Text>
        <Text className="text-[15px] text-slate-600 text-center">
          오디오를 듣고 이해도를 평가하세요
        </Text>
      </View>

      <View className="w-full bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden px-6 py-6">
        {isLoading ? (
          <Pressable
            className="overflow-hidden rounded-2xl mb-6"
            disabled={true}
            style={{ opacity: 0.6 }}
          >
            <LinearGradient
              colors={['#0EA5E9', '#38BDF8'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="py-4 flex-row items-center justify-center rounded-2xl"
            >
              <Ionicons name="hourglass" size={24} color="#fff" />
              <Text className="text-white text-base font-bold ml-2">
                로딩 중...
              </Text>
            </LinearGradient>
          </Pressable>
        ) : isPlaying ? (
          <Pressable
            onPress={handlePause}
            className="overflow-hidden rounded-2xl mb-6"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <LinearGradient
              colors={['#0EA5E9', '#38BDF8'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="py-4 flex-row items-center justify-center rounded-2xl"
            >
              <Ionicons name="pause-circle" size={24} color="#fff" />
              <Text className="text-white text-base font-bold ml-2">
                일시정지
              </Text>
            </LinearGradient>
          </Pressable>
        ) : hasFinished ? (
          <Pressable
            onPress={handleReplay}
            className="overflow-hidden rounded-2xl mb-6"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <LinearGradient
              colors={['#0EA5E9', '#38BDF8'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="py-4 flex-row items-center justify-center rounded-2xl"
            >
              <Ionicons name="refresh-circle" size={24} color="#fff" />
              <Text className="text-white text-base font-bold ml-2">
                다시 듣기
              </Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <Pressable
            onPress={handlePlay}
            className="overflow-hidden rounded-2xl mb-6"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <LinearGradient
              colors={['#0EA5E9', '#38BDF8'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="py-4 flex-row items-center justify-center rounded-2xl"
            >
              <Ionicons name="play-circle" size={24} color="#fff" />
              <Text className="text-white text-base font-bold ml-2">
                재생하기
              </Text>
            </LinearGradient>
          </Pressable>
        )}

        <View className="mb-3">
          <View className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${progress * 100}%`,
                backgroundColor: '#0EA5E9',
              }}
            />
          </View>
        </View>

        <View className="flex-row justify-between">
          <Text className="text-sm font-semibold text-slate-500">
            {formatTime(currentTime)}
          </Text>
          <Text className="text-sm font-semibold text-slate-500">
            {formatTime(duration)}
          </Text>
        </View>
      </View>
    </View>
  );
}
