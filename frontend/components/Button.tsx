import { Pressable, Text, ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}
export default function Button({
  title,
  onPress,
  style,
  disabled,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          backgroundColor: disabled ? '#A0A0A0' : '#1E90FF',
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 8,
          alignItems: 'center',
        },
        style,
      ]}
      disabled={disabled}
    >
      <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
        {title}
      </Text>
    </Pressable>
  );
}
