import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TrackPlayer, { useProgress } from 'react-native-track-player';
import { Ionicons } from '@expo/vector-icons';
import { Sentence } from '@/api/audio';
import Word, { WordLayout } from './Word';
import { useVocab } from '@/hooks/queries/useVocabQueries';
import { PendingVocab } from '@/hooks/mutations/useVocabMutations';

// =================== Props & Local Types ===================
export type ScriptProps = {
  generatedContentId: number;
  scripts: Sentence[];
  onVocabLookup?: () => void;
  onRewind?: () => void;
  selectedVocabs?: PendingVocab[];
  onToggleVocab?: (sentenceIndex: number, word: string) => void;
};

type WordPopupState = {
  word: string;
  sentenceIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
} | null;

// =================== Helper functions ==========
const norm = (w: string) =>
  (w || '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}'-]/gu, '');

const makeVocabKey = (sentenceIndex: number, word: string) =>
  `${sentenceIndex}:${norm(word)}`;

// =================== Constants ===================
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SAFE_PAD = 12;
const ARROW = 12;
const CARD_MAX_W = Math.min(220, SCREEN_W - SAFE_PAD * 2);
const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(v, max));

// ========== Component ==========
export default function Script({
  scripts,
  generatedContentId,
  onVocabLookup,
  onRewind,
  selectedVocabs = [],
  onToggleVocab,
}: ScriptProps) {
  const { data: vocabData } = useVocab(generatedContentId);
  const [wordPopup, setWordPopup] = useState<WordPopupState>(null);

  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. 단어장 데이터 캐싱 (뜻 조회용)
  const vocabMap = useMemo(() => {
    const map = new Map<
      string,
      { pos: string; word: string; meaning: string }
    >();
    if (vocabData?.sentences?.length) {
      for (const s of vocabData.sentences) {
        for (const wd of s.words) {
          const k = makeVocabKey(s.index, wd.word);
          map.set(k, wd);
        }
      }
    }
    return map;
  }, [vocabData]);

  // 1-1. 북마크된 단어 키 캐싱 (하이라이팅용)
  const bookmarkedKeys = useMemo(() => {
    const set = new Set<string>();
    selectedVocabs.forEach((v) => {
      set.add(makeVocabKey(v.sentenceIndex, v.word));
    });
    return set;
  }, [selectedVocabs]);

  // 2. 현재 재생 위치 탐색
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const currentLineIndexRef = useRef(-1);
  const isSeekingRef = useRef(false);
  const seekingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { position } = useProgress(100);
  const startTimes = useMemo(
    () => scripts.map((s) => s.start_time || 0),
    [scripts],
  );

  useEffect(() => {
    if (!startTimes.length) return;
    if (isSeekingRef.current) return;

    let idx = currentLineIndexRef.current;
    if (idx === -1 || position < startTimes[idx]) {
      idx = 0;
    }
    while (idx + 1 < startTimes.length && position >= startTimes[idx + 1]) {
      idx += 1;
    }
    currentLineIndexRef.current = idx;
    setCurrentLineIndex(idx);
  }, [position, startTimes]);

  const flatListRef = useRef<FlatList<Sentence>>(null);

  useEffect(() => {
    if (!flatListRef.current) return;
    if (currentLineIndex < 0) return;
    if (wordPopup) return;
    if (isUserScrolling) return;
    if (isSeekingRef.current) return;

    flatListRef.current.scrollToIndex({
      index: currentLineIndex,
      animated: true,
      viewPosition: 0.5,
    });
  }, [currentLineIndex, isUserScrolling, wordPopup]);

  const onLinePress = (time: number, lineIndex: number) => {
    TrackPlayer.seekTo(time);
    isSeekingRef.current = true;

    if (seekingTimeoutRef.current) {
      clearTimeout(seekingTimeoutRef.current);
      seekingTimeoutRef.current = null;
    }

    setCurrentLineIndex(lineIndex);
    currentLineIndexRef.current = lineIndex;

    flatListRef.current?.scrollToIndex({
      index: lineIndex,
      animated: true,
      viewPosition: 0.5,
    });

    seekingTimeoutRef.current = setTimeout(() => {
      isSeekingRef.current = false;
      seekingTimeoutRef.current = null;
    }, 500);
  };

  const prevPositionRef = useRef(0);
  useEffect(() => {
    const REWIND_THRESHOLD = 2.0;
    if (prevPositionRef.current - position > REWIND_THRESHOLD) {
      onRewind?.();
    }
    prevPositionRef.current = position;
  }, [position, onRewind]);

  // 3. 팝업 관리
  const [cardW, setCardW] = useState<number>(Math.min(160, CARD_MAX_W));
  const [popupReady, setPopupReady] = useState<boolean>(false);
  const widthCacheRef = useRef<Map<string, number>>(new Map());

  const handleWordLongPress = (
    word: string,
    layout: WordLayout,
    sentenceIndex: number,
  ) => {
    setPopupReady(false);
    const key = norm(word);
    const cachedW = widthCacheRef.current.get(key);
    setCardW(cachedW ?? CARD_MAX_W);

    setWordPopup({
      word,
      sentenceIndex,
      x: Number.isFinite(layout.x) ? layout.x : 0,
      y: Number.isFinite(layout.y) ? layout.y : 0,
      width: Number.isFinite(layout.width) ? layout.width : 0,
      height: Number.isFinite(layout.height) ? layout.height : 0,
    });
    onVocabLookup?.();
  };

  // 4. 스크롤 핸들러
  const handleScrollStart = () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    setIsUserScrolling(true);
  };

  const handleScrollEnd = () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 5. 렌더
  const renderLine = ({
    item,
    index: lineIndex,
  }: ListRenderItemInfo<Sentence>) => {
    const isHighlighted = lineIndex === currentLineIndex;
    const startTime = item.start_time || 0;
    const trimmedText = item.text?.trim();
    const words =
      trimmedText && trimmedText.length > 0
        ? trimmedText.split(/\s+/)
        : ['...'];

    return (
      <Pressable
        onPress={() => onLinePress(startTime, lineIndex)}
        className={`px-6 ${isHighlighted ? 'py-3' : 'py-1.5'}`}
      >
        <View
          className={`flex-row flex-wrap justify-start gap-y-1 ${
            isHighlighted ? 'opacity-100' : 'opacity-50'
          }`}
        >
          {words.map((w, i) => (
            <Word
              key={`${item.id}-${i}`}
              text={w}
              appendSpace={i < words.length - 1}
              isHighlighted={isHighlighted}
              isBookmarked={bookmarkedKeys.has(makeVocabKey(lineIndex, w))}
              onPress={() => onLinePress(startTime, lineIndex)}
              onLongPress={(layout: WordLayout) =>
                handleWordLongPress(w, layout, lineIndex)
              }
            />
          ))}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-transparent relative">
      <View className="flex-1">
        <FlatList
          ref={flatListRef}
          onScrollBeginDrag={handleScrollStart}
          onMomentumScrollBegin={handleScrollStart}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={(e) => {
            if (e.nativeEvent.velocity?.y === 0) {
              handleScrollEnd();
            }
          }}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0.5,
              });
            }, 100);
          }}
          data={scripts}
          renderItem={renderLine}
          keyExtractor={(it) => it.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 28 }}
          ItemSeparatorComponent={() => <View className="h-1" />}
        />

        {/* 단어 팝업 */}
        {wordPopup && (
          <View className="absolute inset-0" pointerEvents="box-none">
            <Pressable
              className="absolute inset-0 bg-black/20"
              onPress={() => setWordPopup(null)}
            />

            {(() => {
              const centerX = wordPopup.x + wordPopup.width / 2;
              const desiredTopAbove = wordPopup.y - 68;
              const canPlaceAbove = desiredTopAbove >= SAFE_PAD + 4;

              const top = canPlaceAbove
                ? clamp(desiredTopAbove, SAFE_PAD, SCREEN_H - SAFE_PAD - 80)
                : clamp(
                    wordPopup.y + wordPopup.height + 8,
                    SAFE_PAD,
                    SCREEN_H - SAFE_PAD - 80,
                  );

              const left = clamp(
                centerX - cardW / 2,
                SAFE_PAD,
                SCREEN_W - (cardW + SAFE_PAD),
              );
              const arrowLeft = clamp(centerX - left - ARROW / 2, 8, cardW - 8);

              const key = makeVocabKey(wordPopup.sentenceIndex, wordPopup.word);
              const entry = vocabMap.get(key);

              // 팝업 내부에서도 북마크 상태 확인
              const normalizedWord = norm(entry?.word ?? wordPopup.word);
              const isBookmarked = selectedVocabs.some(
                (v) =>
                  v.sentenceIndex === wordPopup.sentenceIndex &&
                  norm(v.word) === normalizedWord,
              );

              return (
                <View className="absolute" style={{ top, left }}>
                  <View
                    className="rounded-2xl bg-white p-3"
                    style={{
                      maxWidth: CARD_MAX_W,
                      opacity: popupReady ? 1 : 0,
                    }}
                    onLayout={(e) => {
                      if (popupReady) return;
                      const w = e.nativeEvent.layout.width;
                      if (Number.isFinite(w)) {
                        widthCacheRef.current.set(key, w);
                        setCardW(w);
                        setPopupReady(true);
                      }
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center justify-start flex-shrink">
                        <Text className="text-[14px] font-extrabold text-slate-900">
                          {entry?.word ?? wordPopup.word}
                        </Text>
                        {entry?.pos ? (
                          <View className="ml-2 rounded-full bg-sky-100 px-2.5 py-0.5">
                            <Text className="text-[11px] font-extrabold tracking-tight text-sky-700">
                              {entry.pos}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {/* entry가 있을 때(로딩 완료)만 북마크 버튼 표시 */}
                      {entry ? (
                        <Pressable
                          onPress={() =>
                            onToggleVocab?.(wordPopup.sentenceIndex, entry.word)
                          }
                          className="pl-2 active:opacity-70"
                          hitSlop={8}
                        >
                          {isBookmarked ? (
                            <Ionicons
                              name="bookmark"
                              size={16}
                              color="#0EA5E9"
                            />
                          ) : (
                            <Ionicons
                              name="bookmark-outline"
                              size={16}
                              color="#0EA5E9"
                            />
                          )}
                        </Pressable>
                      ) : null}
                    </View>

                    <Text className="mt-1 text-[13px] font-semibold text-slate-800">
                      {entry?.meaning ?? '단어 뜻 불러오는 중...'}
                    </Text>

                    {canPlaceAbove ? (
                      <View
                        className="absolute -bottom-[5px] h-3 w-3 rotate-45 bg-white"
                        style={{ left: arrowLeft }}
                      />
                    ) : (
                      <View
                        className="absolute -top-[5px] h-3 w-3 rotate-45 bg-white"
                        style={{ left: arrowLeft }}
                      />
                    )}
                  </View>
                </View>
              );
            })()}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
