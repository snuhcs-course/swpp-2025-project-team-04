import { View, Text, TouchableOpacity } from 'react-native';

type NavButtonsProps = {
  onNext: () => void;
  onBack?: () => void;
  nextLabel: string;
  backLabel?: string;
  canProceed?: boolean;
  showBackButton?: boolean;
};

export default function NavButtons({
  onNext,
  onBack,
  nextLabel,
  backLabel = '이전',
  canProceed = true,
  showBackButton = false,
}: NavButtonsProps) {
  return (
    <View className="flex-row gap-3 p-6 pb-10 bg-white">
      {showBackButton && onBack && (
        <TouchableOpacity
          className="flex-1 p-4 rounded-lg border-2 border-gray-300 items-center"
          onPress={onBack}
        >
          <Text className="text-base text-gray-800 font-semibold">
            {backLabel}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        className={`p-4 rounded-lg bg-[#6FA4D7] items-center ${!showBackButton ? 'flex-[2]' : 'flex-1'} ${!canProceed ? 'opacity-50' : ''}`}
        onPress={onNext}
        disabled={!canProceed}
      >
        <Text className="text-base text-white font-semibold">{nextLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}
