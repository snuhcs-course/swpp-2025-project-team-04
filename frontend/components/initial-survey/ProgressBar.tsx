import { View } from 'react-native';

type ProgressBarProps = {
  currentStep: number;
  totalPages: number;
};

export default function ProgressBar({
  currentStep,
  totalPages,
}: ProgressBarProps) {
  return (
    <View className="mb-8">
      <View className="h-2 bg-gray-200 rounded overflow-hidden">
        <View
          className="h-full bg-[#6FA4D7] rounded"
          style={{ width: `${(currentStep / totalPages) * 100}%` }}
        />
      </View>
    </View>
  );
}
