import { memo } from 'react';
import { Pressable, Text } from 'react-native';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: (label: string) => void;
};

// use memo to prevent unnecessary re-renders
export const Chip = memo(function Chip({
  label,
  selected = false,
  onPress,
}: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        onPress?.(label);
      }}
      className={`mr-3 flex-row items-center rounded-full border px-4 py-2 ${selected ? 'border-sky-500 bg-sky-100 ' : 'border-neutral-200 bg-white'}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      <Text
        className={`text-sm font-semibold ${selected ? 'text-sky-700' : 'text-slate-900'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
});
