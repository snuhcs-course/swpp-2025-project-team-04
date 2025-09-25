import { useQuery } from '@tanstack/react-query';
import { Text, View } from 'react-native';

function useGreeting() {
  return useQuery({
    queryKey: ['greeting'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return 'You are signed in. Build something awesome!';
    },
  });
}

export default function HomeScreen() {
  const { data, isLoading } = useGreeting();

  return (
    <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-neutral-950">
      <View className="w-full max-w-xl items-center">
        <Text className="mb-3 text-3xl font-semibold text-neutral-900 dark:text-white">
          Home
        </Text>
      </View>
    </View>
  );
}
