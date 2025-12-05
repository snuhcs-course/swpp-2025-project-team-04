// app/_layout.tsx
import '@/global.css';
import CustomSplashScreen from './splashScreen';
import { useUser } from '@/hooks/queries/useUserQueries';
import { QueryProvider } from '@/lib/QueryProvider';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
export { ErrorBoundary } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import TrackPlayer, {
  AppKilledPlaybackBehavior,
} from 'react-native-track-player';
import * as Linking from 'expo-linking';
import { LogBox } from 'react-native';

// Reanimated warnings 무시
LogBox.ignoreLogs(['[Reanimated]']);

// Disable Reanimated strict mode
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('[Reanimated]')) {
      return;
    }
    originalWarn(...args);
  };
}

SplashScreen.preventAutoHideAsync();

async function setupPlayerOnce() {
  const isInitialized = await TrackPlayer.isServiceRunning();
  try {
    if (!isInitialized) {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        capabilities: [],
        compactCapabilities: [],
        android: {
          appKilledPlaybackBehavior:
            AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        },
        notificationCapabilities: [],
      });
    }
  } catch (err) {
    console.error('TP: setup 실패', err);
  }
}

export default function RootLayout() {
  useEffect(() => {
    // 1. 앱 시작 시 1회만 TrackPlayer 초기화
    setupPlayerOnce();

    // 2. [수정] Android 네비게이션 바 즉시 숨기기
    // RootNavigation -> RootLayout으로 이동
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
  }, []); // [] : 앱이 처음 마운트될 때 한 번만 실행

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <RootNavigation />
      </QueryProvider>
    </SafeAreaProvider>
  );
}

function RootNavigation() {
  const { data: user, isLoading: isAuthLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;

      // 탭하면 오디오페이지로 navigate
      if (url.includes('notification.click')) {
        try {
          const activeTrack = await TrackPlayer.getActiveTrack();
          if (activeTrack?.id) {
            router.replace(`/audioPlayer/${activeTrack.id}`);
          }
        } catch (error) {
          console.error('Error getting active track:', error);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  const [isSplashAnimationFinished, setIsSplashAnimationFinished] =
    useState(false);

  const showSplash = isAuthLoading || !isSplashAnimationFinished;

  if (showSplash) {
    return (
      <CustomSplashScreen
        isReady={!isAuthLoading}
        onAnimationComplete={() => setIsSplashAnimationFinished(true)}
      />
    );
  }

  return (
    <Stack>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen
          name="audioPlayer/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="feedback" options={{ headerShown: false }} />
        <Stack.Screen name="level-result" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="initial-survey" options={{ headerShown: false }} />
      <Stack.Screen name="walkthrough" options={{ headerShown: false }} />
    </Stack>
  );
}
