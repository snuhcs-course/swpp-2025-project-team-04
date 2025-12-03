import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioHistory } from '@/hooks/queries/useAudioHistoryQueries';
import { useRouter } from 'expo-router';
import type { AudioHistoryItem } from '@/api/audioHistory';
import type { AudioGenerationResponse } from '@/api/audio';
import { useQueryClient } from '@tanstack/react-query';
import TrackPlayer from 'react-native-track-player';
import { useFocusEffect } from '@react-navigation/native';

export default function HistoryScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAudioHistory();

  const items = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, []),
  );

  const handleItemPress = useCallback(
    async (item: AudioHistoryItem) => {
      try {
        if (!item.sentences || item.sentences.length === 0) {
          alert('오디오 데이터를 불러올 수 없습니다.');
          return;
        }

        await TrackPlayer.reset();
        await TrackPlayer.add({
          id: item.generated_content_id,
          url: item.audio_url,
          title: item.title,
          artist: 'LingoFit',
        });

        const audioData: AudioGenerationResponse = {
          generated_content_id: item.generated_content_id,
          title: item.title,
          audio_url: item.audio_url,
          sentences: item.sentences,
        };

        qc.setQueryData(
          ['audio', String(item.generated_content_id)],
          audioData,
        );

        router.replace(
          `/audioPlayer/${item.generated_content_id}?fromHistory=true`,
        );
      } catch (error) {
        alert('오디오를 재생할 수 없습니다.');
      }
    },
    [router, qc],
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: AudioHistoryItem }) => {
      return (
        <Pressable
          onPress={() => handleItemPress(item)}
          className="mb-3 overflow-hidden rounded-2xl bg-white shadow-sm active:bg-neutral-50"
        >
          <View className="flex-row items-center justify-between p-4">
            <View className="flex-1 pr-3">
              <Text className="mb-1 text-base font-bold text-neutral-900">
                {item.title}
              </Text>
              <Text className="text-xs text-neutral-500">
                {formatDate(item.created_at)}
              </Text>
            </View>
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Ionicons name="play" size={24} color="white" />
            </View>
          </View>
        </Pressable>
      );
    },
    [handleItemPress, formatDate],
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;

    return (
      <View className="py-4">
        <ActivityIndicator color="#0EA5E9" />
      </View>
    );
  }, [isFetchingNextPage]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#EBF4FB]">
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text className="mt-2 text-slate-600">히스토리를 불러오는 중…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-[#EBF4FB] px-6">
        <Text className="mb-3 text-center text-slate-700">
          히스토리를 불러오지 못했어요.
        </Text>
        <Text className="mb-4 text-center text-xs text-slate-500">
          {(error as any)?.message ?? '알 수 없는 오류'}
        </Text>
        <Text className="font-semibold text-sky-600" onPress={() => refetch()}>
          다시 시도하기
        </Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-[#EBF4FB] px-8">
        <View className="mb-4 rounded-full bg-sky-100 p-4">
          <Ionicons name="headset-outline" size={36} color="#0EA5E9" />
        </View>
        <Text className="text-lg font-semibold text-slate-700">
          아직 생성된 오디오가 없어요
        </Text>
        <Text className="mt-2 text-center text-sm leading-5 text-slate-500">
          홈에서 새로운 오디오를 생성해 보세요.
        </Text>
        <View className="mt-6 h-[1px] w-16 rounded-full bg-slate-200" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#EBF4FB]">
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.generated_content_id.toString()}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}
