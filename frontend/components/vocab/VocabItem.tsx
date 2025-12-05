import React, { useState, type Dispatch, type SetStateAction } from 'react';
import {
  View,
  Text,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import ExampleAudioButton from './ExampleAudioButton';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const [expanded, setExpanded] = useState(false);
  const [showMoreButton, setShowMoreButton] = useState(false);
  const [measured, setMeasured] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const onTextLayout = (e: any) => {
    if (measured) return;
    if (e.nativeEvent.lines.length > 2) {
      setShowMoreButton(true);
    }
    setMeasured(true);
  };

  // 텍스트 강조 렌더링 함수
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight) return text;

    // 특수문자 이스케이프 (Regex 오류 방지)
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // 해당 단어 기준으로 문장을 쪼갬 (괄호를 써서 구분자도 배열에 포함)
    const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));

    return parts.map((part, index) => {
      // 대소문자 무시하고 비교
      const isMatch = part.toLowerCase() === highlight.toLowerCase();

      return isMatch ? (
        // 강조 스타일: font-black, 색상 변경 등 원하는 대로 커스텀
        <Text key={index} className="font-black text-slate-900">
          {part}
        </Text>
      ) : (
        <Text key={index}>{part}</Text>
      );
    });
  };

  return (
    <View className="mb-5 rounded-3xl bg-white px-5 py-3 shadow-sm">
      <View className="mb-1 flex-row items-center justify-between">
        <View className="flex-row flex-wrap items-center">
          <Text className="text-2xl font-black text-neutral-900">
            {item.word}
          </Text>
          <View className="ml-3 rounded-full bg-primary/10 px-2 py-1">
            <Text className="text-xs font-semibold text-primary">
              {item.pos}
            </Text>
          </View>
        </View>

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

      <Text className="mb-2 text-md font-bold text-blue-600">
        {item.meaning}
      </Text>

      {/* 예문 */}
      <Pressable
        onPress={toggleExpand}
        disabled={!showMoreButton}
        className={`rounded-2xl bg-slate-50 px-4 py-3 ${
          showMoreButton ? 'active:bg-slate-100' : ''
        }`}
      >
        <Text
          onTextLayout={onTextLayout}
          numberOfLines={!measured || expanded ? undefined : 2}
          className="text-base leading-6 text-slate-700"
        >
          {/* 하이라이트 함수 호출 */}
          {renderHighlightedText(item.example_sentence, item.word)}
        </Text>

        {showMoreButton && (
          <View className="mt-2 h-6 justify-center">
            <Text className="text-xs font-bold text-slate-400">
              {expanded ? '접기' : '더보기'}
            </Text>
          </View>
        )}
      </Pressable>

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
