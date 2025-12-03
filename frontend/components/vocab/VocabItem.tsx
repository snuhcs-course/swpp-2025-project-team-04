import type { Dispatch, SetStateAction } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import ExampleAudioButton from './ExampleAudioButton';

export type Vocab = {
  id: number;
  word: string;
  example_sentence: string;
  example_sentence_url: string;
  pos: string;
  meaning: string;
};

type Props = {
  item: Vocab;
  player: ReturnType<typeof useAudioPlayer> | null;
  status: ReturnType<typeof useAudioPlayerStatus>;
  activeId: number | null;
  setActiveId: Dispatch<SetStateAction<number | null>>;
  onDelete?: (item: Vocab) => void;
};

export function VocabItem({
  item,
  player,
  status,
  activeId,
  setActiveId,
  onDelete,
}: Props) {
  return (
    <View className="mb-5 rounded-3xl bg-white p-5 shadow-sm">
      <View className="mb-4 flex-row items-center justify-between">
        {/* ── 왼쪽: 단어 + 품사 */}
        <View className="flex-row flex-wrap items-center">
          <Text className="text-3xl font-black text-neutral-900">
            {item.word}
          </Text>
          <View className="ml-3 rounded-full bg-primary/10 px-2 py-1">
            <Text className="text-xs font-semibold text-primary">
              {item.pos}
            </Text>
          </View>
        </View>

        {/* ── 오른쪽: 삭제 버튼 */}
        {onDelete && (
          <Pressable
            testID="delete-button"
            onPress={() => onDelete(item)}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </Pressable>
        )}
      </View>

      {/* 뜻 */}
      <Text className="mb-4 text-lg font-bold text-blue-600">
        {item.meaning}
      </Text>

      {/* 예문 */}
      <View className="rounded-2xl bg-slate-50 px-4 py-3">
        <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          예문
        </Text>
        <Text className="mt-2 text-base leading-6 text-slate-700">
          {item.example_sentence}
        </Text>
      </View>

      {/* 오디오 버튼 */}
      <ExampleAudioButton
        id={item.id}
        url={item.example_sentence_url}
        player={player}
        status={status}
        activeId={activeId}
        setActiveId={setActiveId}
      />
    </View>
  );
}
