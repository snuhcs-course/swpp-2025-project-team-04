import { useColorScheme } from '@/hooks/useColorScheme';
import '@/global.css';
import { useUser } from '@/hooks/queries/useUserQueries';
import { QueryProvider } from '@/lib/QueryProvider';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

export { ErrorBoundary } from 'expo-router';

// 스플래시 자동 종료 방지
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigation />
      </ThemeProvider>
    </QueryProvider>
  );
}

function RootNavigation() {
  const { data: user, isLoading: isAuthLoading } = useUser();

  useEffect(() => {
    let didHide = false;

    if (!isAuthLoading) {
      const start = Date.now();

      const hide = async () => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, 1000 - elapsed); // 최소 1초 보장
        setTimeout(async () => {
          if (!didHide) {
            await SplashScreen.hideAsync();
            didHide = true;
          }
        }, remaining);
      };

      hide();
    }

    return () => {
      didHide = true; // cleanup
    };
  }, [isAuthLoading]);

  // 아직 로딩 중이면 네이티브 스플래시 유지
  if (isAuthLoading) {
    return null;
  }

  return (
    <Stack>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(main)" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
