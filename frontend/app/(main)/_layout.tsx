import { Ionicons } from '@expo/vector-icons';
import MainHeader from '@/components/layout/MainHeader';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

export default function MainLayout() {
  return (
    <View className="flex-1 bg-white">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#6FA4D7',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
            height: 70,
            paddingBottom: 20,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '홈',
            tabBarLabel: '홈',
            headerShown: true,
            header: () => <MainHeader title="홈" />,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="vocab"
          options={{
            title: '단어장',
            tabBarLabel: '단어장',
            headerShown: true,
            header: () => <MainHeader title="단어장" />,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: '히스토리',
            tabBarLabel: '히스토리',
            headerShown: true,
            header: () => <MainHeader title="히스토리" />,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: '통계',
            tabBarLabel: '통계',
            headerShown: true,
            header: () => <MainHeader title="통계" />,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '프로필',
            headerShown: true,
            header: () => <MainHeader title="프로필" />,
            tabBarButton: () => null,
            tabBarItemStyle: { display: 'none' },
          }}
        />
      </Tabs>
    </View>
  );
}
