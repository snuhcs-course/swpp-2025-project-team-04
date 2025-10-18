import { View, Text, TouchableOpacity } from 'react-native';

export type Level = {
  id: string;
  title: string;
};

type LevelSelectorProps = {
  levels: Level[];
  selectedLevel: string;
  onSelect: (levelId: string) => void;
};

export default function LevelSelector({
  levels,
  selectedLevel,
  onSelect,
}: LevelSelectorProps) {
  return (
    <View className="mb-5">
      <Text className="text-2xl font-bold text-gray-800 mb-3 text-center">
        영어 듣기 실력은 어느 정도인가요?
      </Text>
      <Text className="text-base text-gray-600 mb-6 text-center leading-[22px]">
        가장 정확하다고 생각하는 레벨을 하나 선택해 주세요.
      </Text>
      <View className="gap-3">
        {levels.map((level) => {
          const isSelected = selectedLevel === level.id;
          return (
            <TouchableOpacity
              key={level.id}
              className={`p-4 rounded-xl border-2 items-center ${
                isSelected
                  ? 'border-[#6FA4D7] bg-gray-100'
                  : 'border-gray-300 bg-white'
              }`}
              onPress={() => onSelect(level.id)}
            >
              <Text
                className={`text-lg font-bold ${isSelected ? 'text-[#6FA4D7]' : 'text-gray-800'}`}
              >
                {level.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
