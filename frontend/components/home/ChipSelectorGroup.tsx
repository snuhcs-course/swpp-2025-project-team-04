import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Chip } from './Chip';

type ChipSelectorGroupProps = {
  title: string;
  chips: readonly string[];
  value?: string | null;
  onSelectionChange?: (selected: string | null) => void;
  dense?: boolean;
  disabled?: boolean;
};

export function ChipSelectorGroup({
  title,
  chips,
  value,
  onSelectionChange,
  dense = false,
  disabled = false,
}: ChipSelectorGroupProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState<string | null>(
    value ?? null,
  );
  const isControlled = value !== undefined;
  const selectedChip = isControlled ? (value ?? null) : uncontrolledValue;

  const selectChip = (chip: string) => {
    const nextValue = selectedChip === chip ? null : chip;
    if (!isControlled) setUncontrolledValue(nextValue);
    onSelectionChange?.(nextValue);
  };

  const isScrollable = chips.length > 3;

  const containerStyles = useMemo(
    () => ({
      paddingVertical: dense ? 4 : 6,
      paddingHorizontal: isScrollable ? 6 : 0,
      alignItems: 'center' as const,
    }),
    [isScrollable, dense],
  );

  return (
    <View>
      {/* 타이틀 */}
      <View className="flex-row items-center">
        <LinearGradient
          colors={['#0EA5E9', '#38BDF8'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="mr-2 h-5 w-1.5 rounded-full"
        />
        <Text className="text-lg font-extrabold text-slate-900 tracking-tight">
          {title}
        </Text>
      </View>

      {/* 칩 영역 */}
      {isScrollable ? (
        <View className={`${dense ? 'py-2' : 'py-3'} relative overflow-hidden`}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              ...containerStyles,
              paddingRight: 14,
            }}
            className="ml-1"
          >
            {chips.map((chip) => (
              <Chip
                key={chip}
                label={chip}
                selected={selectedChip === chip}
                onPress={() => selectChip(chip)}
                disabled={disabled}
              />
            ))}
          </ScrollView>

          {/* 스크롤 페이드 */}
          {/* 왼쪽 페이드 */}
          <LinearGradient
            pointerEvents="none"
            colors={['#FFFFFF', 'rgba(255,255,255,0)'] as const}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0, // ← h-full 대신 bottom:0
              width: 20,
            }}
          />

          {/* 오른쪽 페이드 */}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0)', '#FFFFFF'] as const}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0, // ← h-full 대신 bottom:0
              width: 20,
            }}
          />
        </View>
      ) : (
        <View
          className={`${dense ? 'px-2 py-2' : 'px-1 py-3'}`}
          style={containerStyles}
        >
          <View className="flex-row flex-wrap">
            {chips.map((chip) => (
              <View key={chip} className="mb-3 mr-3">
                <Chip
                  label={chip}
                  selected={selectedChip === chip}
                  onPress={() => selectChip(chip)}
                />
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
