import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { VocabItem } from '@/components/vocab/VocabItem';
import { useMyVocab, useDeleteMyVocab } from '@/hooks/queries/useVocabQueries';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useScrollToTop } from '@react-navigation/native';
import AlertModal from '@/components/common/modals/AlertModal';
import type { MyVocab } from '@/api/vocab';

export default function VocabScreen() {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MyVocab | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useMyVocab();
  const { mutate: deleteVocab } = useDeleteMyVocab();

  // 공통 정지 함수
  const stopAndReset = useCallback(async () => {
    if (!player) return;
    try {
      await player.pause();
      await player.seekTo(0);
    } catch {}
    setActiveId(null);
  }, [player]);

  // 1) 화면에서 벗어날 때(blur) 항상 오디오 중지
  useFocusEffect(
    useCallback(() => {
      // focused 시점에는 아무 것도 안 함
      return () => {
        // blur 시점
        stopAndReset();
      };
    }, [stopAndReset]),
  );

  // 2) 컴포넌트 언마운트 시에도 안전하게 정리
  useEffect(() => {
    return () => {
      stopAndReset();
    };
  }, [stopAndReset]);

  const handleDelete = useCallback(
    async (id: number) => {
      // 재생 중인 항목을 삭제하면 재생/상태 초기화
      if (activeId === id) {
        await stopAndReset();
      }
      deleteVocab(id); // 서버 삭제 (성공 시 캐시 무효화는 훅 내부 처리)
    },
    [activeId, deleteVocab, stopAndReset],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    await handleDelete(pendingDelete.id);
  }, [handleDelete, pendingDelete]);

  const openDeleteModal = useCallback((item: MyVocab) => {
    setPendingDelete(item);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setPendingDelete(null);
  }, []);

  const vocabs = data ?? [];

  return (
    <View className="flex-1 bg-[#EBF4FB]">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="mt-2 text-slate-600">내 단어장을 불러오는 중…</Text>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-3 text-center text-slate-700">
            단어장을 불러오지 못했어요.
          </Text>
          <Text className="mb-4 text-center text-slate-500 text-xs">
            {(error as any)?.message ?? '알 수 없는 오류'}
          </Text>
          <Text
            className="text-sky-600 font-semibold"
            onPress={() => refetch()}
          >
            다시 시도하기
          </Text>
        </View>
      ) : vocabs.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          {/* 빈 상태 아이콘 */}
          <View className="mb-4 rounded-full bg-sky-100 p-4">
            <Ionicons name="book-outline" size={36} color="#0EA5E9" />
          </View>

          {/* 메인 문구 */}
          <Text className="text-lg font-semibold text-slate-700">
            아직 저장된 단어가 없어요
          </Text>

          {/* 서브 문구 */}
          <Text className="mt-2 text-center text-sm text-slate-500 leading-5">
            스크립트에서 단어를 길게 눌러{' '}
            <Text className="text-sky-600 font-medium">단어장에 추가</Text>해
            보세요.
          </Text>

          {/* 장식선 */}
          <View className="mt-6 h-[1px] w-16 rounded-full bg-slate-200" />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 pt-6">
            {vocabs.map((item) => (
              <VocabItem
                key={item.id}
                item={item}
                player={player}
                status={status}
                activeId={activeId}
                setActiveId={setActiveId}
                onDelete={openDeleteModal} // 삭제 확인 모달용
              />
            ))}
            {isRefetching ? (
              <View className="mt-4 items-center">
                <ActivityIndicator />
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
      <AlertModal
        visible={pendingDelete !== null}
        title="단어 삭제"
        message={
          pendingDelete?.word
            ? `'${pendingDelete.word}' 단어를 삭제할까요?`
            : '이 단어를 삭제할까요?'
        }
        confirmText="삭제"
        cancelText="취소"
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
}
