import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Text,
  View,
  Modal,
  Pressable,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import TrackPlayer, { useProgress } from 'react-native-track-player';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { AudioGenerationResponse } from '@/api/audio';
import PlayerControls from '@/components/audio/PlayerControls';
import AudioSlider from '@/components/audio/AudioSlider';
import Script from '@/components/audio/script';
import { useBehaviorLogs } from '@/hooks/useBehaviorLogs';
import { PendingVocab, useAddVocab } from '@/hooks/mutations/useVocabMutations';

export default function AudioPlayer() {
  const { id: idParam, fromHistory } = useLocalSearchParams();
  const isFromHistory = fromHistory === 'true';
  const router = useRouter();

  const qc = useQueryClient();
  const id = Array.isArray(idParam) ? idParam[0] : (idParam ?? null);
  const data = id
    ? (qc.getQueryData(['audio', id]) as AudioGenerationResponse | undefined)
    : undefined;

  const [isPlaying, setIsPlaying] = useState(false);

  // 모달 상태: [강제 종료 경고, 학습 완료 선택, ✅ 데이터 저장 로딩]
  const [isExitModalVisible, setIsExitModalVisible] = useState(false);
  const [isCompletionModalVisible, setIsCompletionModalVisible] =
    useState(false);
  const [isExiting, setIsExiting] = useState(false); // ✅ 저장/종료 진행 상태

  const { behaviorLogs, incrementLog } = useBehaviorLogs();
  const behaviorLogsRef = useRef(behaviorLogs);
  useEffect(() => {
    behaviorLogsRef.current = behaviorLogs;
  }, [behaviorLogs]);

  const togglePlayback = async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
      setIsPlaying(false);
      incrementLog('pauseCount');
    } else {
      await TrackPlayer.play();
      setIsPlaying(true);
    }
  };

  // 단어장 관련 로직
  const addVocabMutation = useAddVocab();
  const [selectedVocabs, setSelectedVocabs] = useState<PendingVocab[]>([]);
  const selectedVocabsRef = useRef<PendingVocab[]>([]);
  useEffect(() => {
    selectedVocabsRef.current = selectedVocabs;
  }, [selectedVocabs]);

  const generatedIdRef = useRef<number | null>(null);
  useEffect(() => {
    generatedIdRef.current = data?.generated_content_id ?? null;
  }, [data?.generated_content_id]);

  const toggleVocab = (sentenceIndex: number, word: string) => {
    setSelectedVocabs((prev) => {
      const exists = prev.some(
        (v) => v.sentenceIndex === sentenceIndex && v.word === word,
      );
      return exists
        ? prev.filter(
            (v) => !(v.sentenceIndex === sentenceIndex && v.word === word),
          )
        : [...prev, { sentenceIndex, word }];
    });
  };

  const saveAllSelectedVocabs = useCallback(async () => {
    const generatedId = generatedIdRef.current;
    const vocabsToSave = selectedVocabsRef.current;
    if (!generatedId || !vocabsToSave.length) return;
    await Promise.all(
      vocabsToSave.map((vocab) =>
        addVocabMutation.mutateAsync({
          generatedContentId: generatedId,
          pendingVocab: vocab,
        }),
      ),
    );
    incrementLog('vocabSaveCount', vocabsToSave.length);
  }, [addVocabMutation, incrementLog]);

  const stopAndCleanup = useCallback(async () => {
    try {
      await TrackPlayer.stop();
      await TrackPlayer.reset();
    } catch {}
  }, []);

  // 1. [난이도 피드백] -> 저장 후 이동
  const exitWithFeedback = useCallback(async () => {
    setIsExiting(true); // ✅ 로딩 시작

    try {
      await stopAndCleanup();
      await saveAllSelectedVocabs(); // 서버 요청 대기

      const logs = behaviorLogsRef.current;
      const generatedId = generatedIdRef.current;

      const params = {
        generated_content_id: generatedId?.toString() ?? '0',
        pause_cnt: logs.pauseCount.toString(),
        rewind_cnt: logs.rewindCount.toString(),
        vocab_lookup_cnt: logs.vocabLookupCount.toString(),
        vocab_save_cnt: logs.vocabSaveCount.toString(),
      };

      router.replace({ pathname: '/feedback', params });
    } catch (e) {
      // 에러 발생 시 로딩 풀고(혹은 에러처리) 로그 찍기
      console.error(e);
      setIsExiting(false);
    }
  }, [router, stopAndCleanup, saveAllSelectedVocabs]);

  // 2. [학습 종료] -> 저장 후 이동
  const exitWithoutFeedback = useCallback(async () => {
    setIsExiting(true); // ✅ 로딩 시작

    try {
      await stopAndCleanup();
      await saveAllSelectedVocabs(); // 서버 요청 대기
      isFromHistory ? router.replace('/(main)/history') : router.replace('/');
    } catch (e) {
      console.error(e);
      setIsExiting(false);
    }
  }, [isFromHistory, router, saveAllSelectedVocabs, stopAndCleanup]);

  // 3. [다시 듣기]
  const handleReplay = async () => {
    setIsCompletionModalVisible(false);
    didFinishRef.current = false;
    await TrackPlayer.seekTo(0);
    await TrackPlayer.play();
    setIsPlaying(true);
  };

  // 마운트 시 자동 재생
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await TrackPlayer.play();
        if (mounted) setIsPlaying(true);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const { position, duration } = useProgress(100);
  const didFinishRef = useRef(false);

  // ✅ 오디오 종료 감지
  useEffect(() => {
    if (didFinishRef.current) return;
    if (!duration || duration <= 0) return;

    const EPSILON = 0.3;
    if (position >= duration - EPSILON) {
      didFinishRef.current = true;
      (async () => {
        await TrackPlayer.pause();
        setIsPlaying(false);

        if (!isFromHistory) {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
          setIsCompletionModalVisible(true);
        }
      })();
    }
  }, [position, duration, isFromHistory]);

  // 뒤로가기 핸들러
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isExiting) return true; // ✅ 저장 중엔 뒤로가기 막음
      if (!data) return false;

      if (isFromHistory) {
        exitWithoutFeedback();
        return true;
      }
      if (isExitModalVisible) {
        setIsExitModalVisible(false);
        return true;
      }
      if (isCompletionModalVisible) {
        exitWithFeedback();
        return true;
      }
      setIsExitModalVisible(true);
      return true;
    });
    return () => sub.remove();
  }, [
    data,
    isExitModalVisible,
    isCompletionModalVisible,
    isFromHistory,
    isExiting,
    exitWithoutFeedback,
    exitWithFeedback,
  ]);

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-[#EBF4FB]">
        <Ionicons name="alert-circle" size={64} color="#0EA5E9" />
        <Text className="mt-3 text-slate-600 text-base font-semibold">
          오디오 데이터를 불러오지 못했어요.
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#0C4A6E', '#0369A1', '#7DB7E8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <Script
        generatedContentId={data.generated_content_id}
        scripts={data.sentences}
        onVocabLookup={() => incrementLog('vocabLookupCount')}
        onRewind={() => incrementLog('rewindCount')}
        selectedVocabs={selectedVocabs}
        onToggleVocab={toggleVocab}
      />

      <AudioSlider />

      <PlayerControls
        isPlaying={isPlaying}
        onTogglePlay={togglePlayback}
        onFinish={
          isFromHistory
            ? exitWithoutFeedback
            : () => setIsExitModalVisible(true)
        }
        finishButtonText={isFromHistory ? '복습 종료' : '학습 종료'}
      />

      {/* 1. 중도 포기 경고 모달 */}
      {isExitModalVisible && !isFromHistory && (
        <Modal
          transparent
          animationType="fade"
          onRequestClose={() => setIsExitModalVisible(false)}
        >
          <View className="flex-1 items-center justify-center bg-black/50 px-4">
            <Pressable
              onPress={() => setIsExitModalVisible(false)}
              className="absolute inset-0"
            />
            <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
              <View className="flex-row items-center mb-4">
                <View className="mr-3 rounded-full bg-orange-100 p-2.5">
                  <Ionicons name="warning" size={24} color="#F97316" />
                </View>
                <Text className="text-xl font-bold text-slate-900">
                  학습을 종료할까요?
                </Text>
              </View>
              <Text className="text-[15px] leading-6 text-slate-600">
                지금 나가면 레벨이 증가하지 않습니다.{'\n'}그래도
                종료하시겠어요?
              </Text>
              <View className="mt-8 flex-row justify-end gap-3">
                <Pressable
                  onPress={() => setIsExitModalVisible(false)}
                  className="rounded-xl bg-slate-100 px-5 py-3 active:bg-slate-200"
                >
                  <Text className="font-semibold text-slate-700">계속하기</Text>
                </Pressable>
                <Pressable
                  onPress={exitWithoutFeedback}
                  className="rounded-xl bg-slate-800 px-5 py-3 active:bg-slate-900"
                >
                  <Text className="font-semibold text-white">종료하기</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 2. 학습 완료 축하 모달 */}
      {isCompletionModalVisible && !isFromHistory && (
        <Modal
          transparent
          animationType="fade"
          onRequestClose={() => {
            exitWithFeedback();
          }}
        >
          <View className="flex-1 items-center justify-center bg-black/60 px-6">
            <View className="w-full max-w-sm items-center rounded-3xl bg-white p-6 shadow-2xl">
              <View className="mb-4 -mt-12 rounded-full border-[6px] border-white bg-yellow-400 p-5 shadow-sm">
                <Ionicons name="trophy" size={40} color="#FFFFFF" />
              </View>
              <Text className="text-2xl font-extrabold text-slate-900">
                Excellent!
              </Text>
              <Text className="mt-2 text-center text-[15px] text-slate-500">
                오늘의 학습을 완료했어요.{'\n'}이제 무엇을 할까요?
              </Text>
              <View className="mt-8 w-full gap-3">
                <Pressable
                  onPress={exitWithFeedback}
                  className="w-full flex-row items-center justify-center rounded-2xl bg-sky-500 py-4 active:bg-sky-600 shadow-sky-200 shadow-md"
                >
                  <Ionicons
                    name="star"
                    size={18}
                    color="white"
                    style={{ marginRight: 6 }}
                  />
                  <Text className="text-[16px] font-bold text-white">
                    난이도 평가하기
                  </Text>
                </Pressable>
                <Pressable
                  onPress={exitWithoutFeedback}
                  className="w-full flex-row items-center justify-center rounded-2xl bg-slate-200 py-4 active:bg-slate-300"
                >
                  <Text className="text-[16px] font-bold text-slate-700">
                    그냥 종료하기
                  </Text>
                  <Ionicons
                    name="exit-outline"
                    size={18}
                    color="#334155"
                    style={{ marginLeft: 6 }}
                  />
                </Pressable>
                <Pressable
                  onPress={handleReplay}
                  className="w-full flex-row items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 py-4 active:bg-slate-100"
                >
                  <Ionicons
                    name="refresh"
                    size={18}
                    color="#94a3b8"
                    style={{ marginRight: 6 }}
                  />
                  <Text className="text-[15px] font-semibold text-slate-400">
                    처음부터 다시 듣기
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ✅ 3. 저장 중 로딩 오버레이 */}
      {isExiting && (
        <Modal transparent animationType="fade" visible={isExiting}>
          <View className="flex-1 items-center justify-center bg-black/60">
            <View className="items-center rounded-2xl bg-slate-900/80 p-6">
              <ActivityIndicator size="large" color="#ffffff" />
              <Text className="mt-4 text-[15px] font-semibold text-white">
                학습 기록을 저장하고 있어요...
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </LinearGradient>
  );
}
