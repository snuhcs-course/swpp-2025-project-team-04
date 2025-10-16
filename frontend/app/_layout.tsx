import '@/global.css';
import { useUser } from '@/hooks/queries/useUserQueries';
import { QueryProvider } from '@/lib/QueryProvider';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

export { ErrorBoundary } from 'expo-router';

// 스플래시 자동 종료 방지
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <QueryProvider>
      <RootNavigation />
    </QueryProvider>
  );
}

function RootNavigation() {
  const { data: user, isLoading: isAuthLoading } = useUser();

  useEffect(() => {
    let didHide = false;

    // 인증 정보 로딩이 끝나면 스플래시를 숨깁니다.
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
      didHide = true; // 컴포넌트 언마운트 시 정리
    };
  }, [isAuthLoading]);

  // 인증 정보 로딩 중이면 아무것도 렌더링하지 않고 네이티브 스플래시를 계속 보여줍니다.
  if (isAuthLoading) {
    return null;
  }

  return (
    <Stack>
      {/* 사용자가 있으면 (main) 그룹으로, 없으면 (auth) 그룹으로 보냅니다. */}
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(main)" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
