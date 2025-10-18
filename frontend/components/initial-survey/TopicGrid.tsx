import { View, Text, TouchableOpacity } from 'react-native';

export type TopicCategory = {
  category: string;
  topics: Array<{ id: string; label: string }>;
};

type TopicGridProps = {
  categories: TopicCategory[];
  selectedTopics: string[];
  onToggle: (topicId: string) => void;
  maxSelections: number;
};

export default function TopicGrid({
  categories,
  selectedTopics,
  onToggle,
  maxSelections,
}: TopicGridProps) {
  return (
    <View className="mb-5">
      <Text className="text-[22px] font-bold text-gray-800 mb-2 text-center leading-[30px]">
        가장 관심 있는 주제를 선택해주세요
      </Text>
      <Text className="text-base font-semibold text-gray-600 mb-[19px] text-center">
        (최대 {maxSelections}개)
      </Text>

      {categories.map((categoryData, index) => (
        <View key={index} className="mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-3">
            {categoryData.category}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {categoryData.topics.map((topic) => {
              const isSelected = selectedTopics.includes(topic.id);
              return (
                <TouchableOpacity
                  key={topic.id}
                  className={`py-2.5 px-4 rounded-[20px] border-2 ${
                    isSelected
                      ? 'border-[#6FA4D7] bg-[#6FA4D7]'
                      : 'border-gray-300 bg-white'
                  }`}
                  onPress={() => onToggle(topic.id)}
                >
                  <Text
                    className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-600'}`}
                  >
                    {topic.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      <Text className="text-base font-semibold text-[#6FA4D7] text-center mt-4">
        {selectedTopics.length}/{maxSelections} 선택됨
      </Text>
    </View>
  );
}
