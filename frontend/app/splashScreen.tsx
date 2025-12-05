import { useEffect, useRef, useState } from 'react';
import { View, Image, Animated, Dimensions } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  isReady: boolean;
  onAnimationComplete?: () => void;
}

export default function SplashScreen({
  isReady,
  onAnimationComplete,
}: SplashScreenProps) {
  // Start visible (opacity 1) to match native splash immediately
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Refs and State
  const heartbeatRef = useRef<Animated.CompositeAnimation | null>(null);
  const [isMinTimeElapsed, setIsMinTimeElapsed] = useState(false);
  const isFadeOutStarted = useRef(false);

  useEffect(() => {
    const hideSplash = async () => {
      try {
        // Wait a frame to ensure the Custom Splash is painted
        await new Promise((resolve) => setTimeout(resolve, 50));

        await ExpoSplashScreen.hideAsync();
      } catch (e) {
        console.warn('CustomSplash: Failed to hide native splash', e);
      }
    };
    hideSplash();

    // Heartbeat animation loop
    const heartbeat = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05, // Subtle heartbeat
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    heartbeat.start();
    heartbeatRef.current = heartbeat; // Store heartbeat animation in ref

    return () => {
      heartbeatRef.current?.stop(); // Stop heartbeat on unmount
    };
  }, []); // Run once on mount

  // 1. Minimum Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMinTimeElapsed(true);
    }, 2000); // Minimum 2 seconds
    return () => clearTimeout(timer);
  }, []);

  // 2. Check for Fade Out Condition
  useEffect(() => {
    if (isReady && isMinTimeElapsed && !isFadeOutStarted.current) {
      isFadeOutStarted.current = true;
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        heartbeatRef.current?.stop(); // Stop heartbeat when fade out completes
        onAnimationComplete?.();
      });
    }
  }, [isReady, isMinTimeElapsed, containerOpacity, onAnimationComplete]); // Added containerOpacity and onAnimationComplete as dependencies

  return (
    <Animated.View
      className="flex-1 bg-[#001F3B] items-center justify-center"
      style={{ opacity: containerOpacity }}
    >
      {/*
        Image matches Native Splash:
        - Background: #001F3B (set in container)
        - Image: splash.png
        - Size: Reduced to ~64% to match native rendering of 1024px icon on high-density screens
      */}
      <Animated.Image
        source={require('@/assets/splash.png')}
        className="w-[205px] h-[205px]"
        style={[
          {
            transform: [{ scale: scaleAnim }],
            opacity: containerOpacity, // Bind opacity directly to image too
          },
        ]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}
