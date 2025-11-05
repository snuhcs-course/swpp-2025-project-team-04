// app/_layout.tsx
import '@/global.css';
import { useUser } from '@/hooks/queries/useUserQueries';
import { QueryProvider } from '@/lib/QueryProvider';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
export { ErrorBoundary } from 'expo-router';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import TrackPlayer, { Capability } from 'react-native-track-player';
import { PlaybackService } from './PlaybackService';
import SplashScreenComponent from '@/components/SplashScreen';

SplashScreen.preventAutoHideAsync();

// 전역 가드 (Fast Refresh 대비)
declare global {
  // eslint-disable-next-line no-var
  var __PLAYER_INITIALIZED__: boolean | undefined;
  // eslint-disable-next-line no-var
  var __SERVICE_REGISTERED__: boolean | undefined;
}

async function setupPlayerOnce() {
  if (global.__PLAYER_INITIALIZED__) return;
  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      capabilities: [Capability.Play, Capability.Pause, Capability.SeekTo],
      // 필요하면 compactCapabilities, android 옵션 등 추가
    });
    global.__PLAYER_INITIALIZED__ = true;
  } catch (e) {
    // 이미 초기화된 경우 등: 조용히 무시
    global.__PLAYER_INITIALIZED__ = true;
  }
}

// 서비스 등록은 모듈 최상단에서 1회
if (!global.__SERVICE_REGISTERED__) {
  TrackPlayer.registerPlaybackService(() => PlaybackService);
  global.__SERVICE_REGISTERED__ = true;
}

export default function RootLayout() {
  useEffect(() => {
    // 앱 시작 시 1회만 초기화 시도
    setupPlayerOnce();
  }, []);

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
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    // Hide native splash immediately when app loads
    SplashScreen.hideAsync();
  }, []);

  const handleSplashAnimationComplete = () => {
    setShowCustomSplash(false);
  };

  // Show custom splash for fixed duration regardless of loading state
  if (showCustomSplash) {
    return <SplashScreenComponent onAnimationComplete={handleSplashAnimationComplete} />;
  }

  // Show loading indicator if still loading after splash
  if (isAuthLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#EBF4FB]">
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Screen name="initial-survey" options={{ headerShown: false }} />
    </Stack>
  );
}
