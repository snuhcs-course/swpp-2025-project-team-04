import { View, Text } from 'react-native';

type ContentSection = {
  heading?: string;
  content: string;
  highlight?: string;
};

type WelcomeStepProps = {
  title: string;
  subtitle: string;
  sections: ContentSection[];
};

export default function WelcomeStep({
  title,
  subtitle,
  sections,
}: WelcomeStepProps) {
  return (
    <View className="py-5">
      <Text className="text-[32px] font-bold text-gray-800 mb-3 text-center">
        {title}
      </Text>
      <Text className="text-lg text-gray-600 mb-10 text-center leading-[26px]">
        {subtitle}
      </Text>

      <View className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        {sections.map((section, index) => (
          <View key={index}>
            {section.heading && (
              <Text className="text-xl font-semibold text-gray-800 mb-4">
                {section.heading}
              </Text>
            )}
            <Text className="text-base text-gray-700 leading-6 mb-4">
              {section.content}
            </Text>
            {section.highlight && (
              <Text className="text-[17px] font-semibold text-[#6FA4D7] leading-6 mb-4 text-center py-3 bg-gray-100 rounded-lg">
                {section.highlight}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
