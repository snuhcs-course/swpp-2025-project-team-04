import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';

type PercentageSliderProps = {
  value: number;
  onChange: (value: number) => void;
  fileNumber: number;
};

export default function PercentageSlider({
  value,
  onChange,
  fileNumber,
}: PercentageSliderProps) {
  return (
    <View className="w-full">
      <View className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden px-6 py-8">
        <View className="items-center mb-8">
          <Text
            className="text-[60px] font-black text-center leading-[68px]"
            style={{ color: '#0EA5E9' }}
          >
            {value}%
          </Text>
        </View>

        <View className="mb-4">
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={100}
            step={10}
            value={value}
            onValueChange={onChange}
            minimumTrackTintColor="#0EA5E9"
            maximumTrackTintColor="#E2E8F0"
            thumbTintColor="#0EA5E9"
          />
        </View>

        <View className="flex-row justify-between px-2">
          <Text className="text-sm font-semibold text-slate-500">0%</Text>
          <Text className="text-sm font-semibold text-slate-500">50%</Text>
          <Text className="text-sm font-semibold text-slate-500">100%</Text>
        </View>
      </View>
    </View>
  );
}
