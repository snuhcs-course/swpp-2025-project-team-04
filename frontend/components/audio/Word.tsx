import React, { useRef, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

export type WordLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WordProps = {
  text: string;
  isHighlighted?: boolean;
  isBookmarked?: boolean;
  onPress: () => void;
  onLongPress: (layout: WordLayout) => void;
  appendSpace?: boolean;
};

export default function Word({
  text,
  isHighlighted = false,
  isBookmarked = false,
  onPress,
  onLongPress,
  appendSpace = false,
}: WordProps) {
  const touchableRef = useRef<View>(null);

  // 정규식으로 특수문자와 단어 분리
  // Group 1: 앞쪽 특수문자 (예: " )
  // Group 2: 단어 (문자, 숫자, 하이픈, 작은따옴표 포함)
  // Group 3: 뒤쪽 특수문자 (예: ", . )
  const { prefix, core, suffix } = useMemo(() => {
    // \p{L}: 유니코드 문자(한글 포함), \p{N}: 숫자
    const match = text.match(
      /^([^\p{L}\p{N}]*)([\p{L}\p{N}\-']*)([^\p{L}\p{N}]*)$/u,
    );
    if (match) {
      return { prefix: match[1], core: match[2], suffix: match[3] };
    }
    // 매칭 안되면 전체를 단어로 취급
    return { prefix: '', core: text, suffix: '' };
  }, [text]);

  const handleLongPress = () => {
    Haptics.selectionAsync().catch(() => {});

    const node = touchableRef.current as unknown as {
      measureInWindow?: (
        cb: (x: number, y: number, w: number, h: number) => void,
      ) => void;
      measure?: (
        cb: (
          x: number,
          y: number,
          w: number,
          h: number,
          pageX: number,
          pageY: number,
        ) => void,
      ) => void;
    };

    if (node?.measureInWindow) {
      node.measureInWindow((x, y, width, height) => {
        onLongPress({ x, y, width, height });
      });
    } else if (node?.measure) {
      node.measure((_x, _y, width, height, pageX, pageY) => {
        onLongPress({ x: pageX, y: pageY, width, height });
      });
    } else {
      onLongPress({ x: 0, y: 0, width: 0, height: 0 });
    }
  };

  // 공통 폰트 스타일 (굵기 처리)
  const fontStyle = isHighlighted ? 'font-bold' : 'font-semibold';

  return (
    <Pressable
      ref={touchableRef}
      onPress={onPress}
      onLongPress={handleLongPress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text className="text-center text-xl text-white">
        {/* 1. 앞쪽 특수문자 (하이라이트 X) */}
        {prefix ? (
          <Text className={`text-white ${fontStyle}`}>{prefix}</Text>
        ) : null}

        {/* 2. 실제 단어 (여기에만 북마크 배경색 적용) */}
        <Text
          suppressHighlighting
          className={`${
            isBookmarked ? 'bg-yellow-500/30 text-yellow-50' : 'text-white'
          } ${fontStyle}`}
        >
          {core}
        </Text>

        {/* 3. 뒤쪽 특수문자 (하이라이트 X) */}
        {suffix ? (
          <Text className={`text-white ${fontStyle}`}>{suffix}</Text>
        ) : null}

        {/* 4. 띄어쓰기 */}
        {appendSpace ? ' ' : ''}
      </Text>
    </Pressable>
  );
}
