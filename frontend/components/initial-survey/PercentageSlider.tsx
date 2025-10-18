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
    <View className="mb-5">
      <Text className="text-2xl font-semibold text-gray-800 text-center mt-[100px]">
        listening file {fileNumber}
      </Text>

      <View className="mt-10 px-2">
        <Text className="text-xl font-semibold text-gray-800 text-center mb-10 leading-7">
          들은 내용 중 몇 %를 이해했는지 솔직하게 평가해 주세요.
        </Text>

        <View className="items-center mb-4">
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={100}
            step={10}
            value={value}
            onValueChange={onChange}
            minimumTrackTintColor="#6FA4D7"
            maximumTrackTintColor="#e0e0e0"
            thumbTintColor="#6FA4D7"
          />

          <Text className="text-[32px] font-bold text-[#6FA4D7] mt-5">
            {value}%
          </Text>
        </View>
      </View>
    </View>
  );
}
