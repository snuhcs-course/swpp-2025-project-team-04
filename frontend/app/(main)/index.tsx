import Button from '@/components/Button';
import { ChipSelectorGroup } from '@/components/home/ChipSelectorGroup';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

const THEME_OPTIONS = ['News', 'Sports', 'Travel', 'Science', 'Culture'];
const MOOD_OPTIONS = ['Calm', 'Energetic', 'Academic', 'Casual', 'Focused'];

export default function HomeScreen() {
  const router = useRouter();
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);

  const focusMessage = useMemo(() => {
    if (!selectedThemes.length) {
      return 'Choose a theme and mood to unlock a personalized study plan.';
    }

    const primaryTheme = selectedThemes[0];

    if (!selectedMoods.length) {
      return `We'll prepare ${primaryTheme} materials tailored just for you.`;
    }

    const moodTone = selectedMoods.map((mood) => mood.toLowerCase()).join(', ');
    return `We'll prepare ${primaryTheme} materials in a ${moodTone} tone to keep you motivated.`;
  }, [selectedThemes, selectedMoods]);

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1 px-5 pt-9"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-8 text-base text-slate-600">
          Tailor today&apos;s practice by choosing a theme and mood below.
        </Text>

        <ChipSelectorGroup
          title="Theme"
          chips={THEME_OPTIONS}
          onSelectionChange={setSelectedThemes}
        />

        <ChipSelectorGroup
          title="Mood"
          chips={MOOD_OPTIONS}
          isMultiSelect
          onSelectionChange={setSelectedMoods}
        />

        <View className="mt-8 rounded-2xl bg-sky-500 p-5">
          <Text className="mb-1 text-lg font-bold text-white">
            Today&apos;s focus
          </Text>
          <Text className="text-base leading-6 text-slate-50">
            {focusMessage}
          </Text>
        </View>
      </ScrollView>
      <View className="px-5 pb-8">
        <Button
          title="Generate Audio"
          onPress={() => {
            router.push('/lyric');
          }}
          style={{ width: '100%' }}
        />
      </View>
    </View>
  );
}
