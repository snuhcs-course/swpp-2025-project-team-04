import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Chip } from './Chip';

type ChipSelectorGroupProps = {
  title: string;
  chips: string[];
  isMultiSelect?: boolean;
  onSelectionChange?: (selected: string[]) => void;
};

export function ChipSelectorGroup({
  title,
  chips,
  isMultiSelect = false,
  onSelectionChange,
}: ChipSelectorGroupProps) {
  const [selectedChips, setSelectedChips] = useState<string[]>([]);

  useEffect(() => {
    onSelectionChange?.(selectedChips);
  }, [onSelectionChange, selectedChips]);

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) => {
      const isAlreadySelected = prev.includes(chip);

      // 다중 선택 모드
      if (isMultiSelect) {
        if (isAlreadySelected) {
          return prev.filter((item) => item !== chip);
        }
        return [...prev, chip];
      }

      // 단일 선택 모드
      if (isAlreadySelected) {
        return [];
      }
      return [chip];
    });
  };

  // 스크롤바 표시 여부
  const isScrollable = chips.length > 3;

  // 컨테이너 스타일 메모이제이션
  const containerStyles = useMemo(
    () => ({
      paddingVertical: 8,
      paddingHorizontal: isScrollable ? 4 : 0,
      alignItems: 'center' as const,
    }),
    [isScrollable],
  );

  return (
    <View className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 ">
      <Text className="mb-3 text-lg font-bold text-slate-900">{title}</Text>
      {isScrollable ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            ...containerStyles,
            paddingRight: 12,
          }}
          className="ml-1"
        >
          {chips.map((chip) => (
            <Chip
              key={chip}
              label={chip}
              selected={selectedChips.includes(chip)}
              onPress={() => toggleChip(chip)}
            />
          ))}
        </ScrollView>
      ) : (
        <View className="flex-row" style={containerStyles}>
          {chips.map((chip) => (
            <Chip
              key={chip}
              label={chip}
              selected={selectedChips.includes(chip)}
              onPress={() => toggleChip(chip)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
