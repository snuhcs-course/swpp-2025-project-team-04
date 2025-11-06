import { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

export default function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const heartbeatAnim = useRef(new Animated.Value(1)).current;
  const backgroundColorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Heartbeat animation that loops
    const heartbeat = Animated.loop(
      Animated.sequence([
        Animated.timing(heartbeatAnim, {
          toValue: 1.1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );

    const animationSequence = Animated.sequence([
      Animated.parallel([
        Animated.timing(backgroundColorAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(700), // Fixed 0.7 second display time
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);

    // Start heartbeat animation
    heartbeat.start();

    // Start main animation sequence
    animationSequence.start(() => {
      heartbeat.stop();
      onAnimationComplete?.();
    });

    return () => {
      heartbeat.stop();
    };
  }, [fadeAnim, scaleAnim, heartbeatAnim, backgroundColorAnim, onAnimationComplete]);

  const backgroundColor = backgroundColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#000000', '#6FA4D7'], // black to blue
  });

  return (
    <Animated.View className="flex-1 items-center justify-center" style={{ backgroundColor }}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: 'center',
        }}
      >
        <Animated.View
          style={{
            transform: [{ scale: heartbeatAnim }],
            marginBottom: 32,
          }}
        >
          <View className="h-24 w-24 items-center justify-center rounded-2xl bg-white shadow-lg overflow-hidden">
            <Image 
              source={require('@/assets/icon.png')}
              style={{ width: 64, height: 64 }}
              resizeMode="contain"
            />
          </View>
        </Animated.View>
        
        <Animated.Text
          className="text-4xl font-black text-white mb-2"
          style={{ opacity: fadeAnim }}
        >
          LingoFit
        </Animated.Text>
        
        <Animated.Text
          className="text-lg font-medium text-white/90"
          style={{ opacity: fadeAnim }}
        >
          PROFESSIONAL LEARNING MADE SIMPLE
        </Animated.Text>
        
        <Animated.View
          className="mt-8 flex-row space-x-1"
          style={{ opacity: fadeAnim }}
        >
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              className="h-2 w-2 rounded-full bg-white/70"
              style={{
                opacity: heartbeatAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: index === 0 ? [0.3, 1] : 
                            index === 1 ? [0.5, 0.8] : 
                            [0.7, 0.6],
                }),
              }}
            />
          ))}
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}