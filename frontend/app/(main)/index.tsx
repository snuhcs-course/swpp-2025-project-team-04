import { USER_QUERY_KEY } from '@/constants/queryKeys';
import { User } from '@/types/type';
import { deleteRefreshToken, setAccessToken } from '@/utils/tokenManager';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

export default function HomeScreen() {
  const queryClient = useQueryClient();

  const user = queryClient.getQueryData<User | null>(USER_QUERY_KEY);

  // logout
  const handleLogout = () => {
    setAccessToken(null);
    deleteRefreshToken();
    queryClient.setQueryData(USER_QUERY_KEY, null);
  };

  return (
    <View>
      <Text>
        {user ? `Welcome back, ${user.nickname}!` : 'Welcome to LingoFit!'}
      </Text>
      {user && (
        <Text onPress={handleLogout} style={{ color: 'blue', marginTop: 20 }}>
          Logout
        </Text>
      )}
    </View>
  );
}
