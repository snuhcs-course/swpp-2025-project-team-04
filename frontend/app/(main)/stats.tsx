import { ToastAndroid, Text, View, Pressable } from 'react-native';

export default function StatsScreen() {
  const showToast = () => {
    ToastAndroid.show(
      'Stats feature is under development.',
      ToastAndroid.SHORT,
    );
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Stats dashboard coming soon.</Text>
      <Pressable onPress={showToast}>
        <Text>Show Toast</Text>
      </Pressable>
    </View>
  );
}
