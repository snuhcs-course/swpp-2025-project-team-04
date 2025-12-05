import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const DEVICE_WIDTH = Math.min(width - 120, 280);

type FlowStep = {
  key: 'generate' | 'session' | 'vocab';
  title: string;
  caption: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const FLOW_STEPS: FlowStep[] = [
  {
    key: 'generate',
    title: '홈',
    caption: '관심 주제와 분위기를 고르고 Generate로 세션을 만들어요.',
    hint: '맞춤 추천 흐름',
    icon: 'flash',
  },
  {
    key: 'session',
    title: '세션',
    caption: '스크립트와 오디오를 동시에 보며 하이라이트를 따라가요.',
    hint: '집중 청취',
    icon: 'headset',
  },
  {
    key: 'vocab',
    title: '단어장',
    caption: '모르는 단어를 길게 눌러 단어장에 저장하고 확인해요.',
    hint: '즉시 저장',
    icon: 'bookmarks',
  },
];

const AnimatedGradientBackground = () => {
  const gradientAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(gradientAnim, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [gradientAnim]);

  const translate = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 40],
  });
  const fade = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.65],
  });

  return (
    <>
      <View className="absolute inset-0 bg-[#020b1a]" />
      <Animated.View
        style={{
          position: 'absolute',
          width: width * 1.6,
          height: width * 1.6,
          top: -width * 0.6,
          left: -width * 0.5,
          opacity: fade,
          transform: [{ translateX: translate }, { translateY: translate }],
        }}
      >
        <LinearGradient
          colors={['#051937', '#0C4A6E', '#0284C7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          width: width * 1.1,
          height: width * 1.1,
          bottom: -width * 0.3,
          right: -width * 0.5,
          opacity: 0.45,
          transform: [{ translateX: Animated.multiply(translate, -1) }],
        }}
      >
        <LinearGradient
          colors={['#082F49', '#0C4A6E', '#0369A1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </>
  );
};

const HomePreview = ({ action }: { action: Animated.Value }) => {
  const pointerX = action.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-10, 80, -10],
  });
  const pointerY = action.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [20, 120, 20],
  });
  const buttonScale = action.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.95, 1.05, 0.95],
  });

  const themeChips = [
    { label: '철학', emoji: '💭' },
    { label: '국제', emoji: '🌎' },
    { label: '스포츠', emoji: '⚽️' },
    { label: '테크', emoji: '💡' },
  ];
  const styleChips = [
    { label: '집중적인', emoji: '🎧' },
    { label: '따뜻한', emoji: '🔥' },
    { label: '활기찬', emoji: '⚡️' },
    { label: '차분한', emoji: '🌊' },
  ];

  return (
    <View className="relative h-full rounded-[32px] bg-[#E2F1FF] px-5 py-6 shadow-lg shadow-black/20">
      <View>
        <Text className="text-xs font-semibold uppercase tracking-[3px] text-slate-500">
          홈
        </Text>
        <Text className="mt-1 text-[13px] text-slate-500">
          LingoFit님, 바로 학습을 시작해볼까요?
        </Text>
        <Text className="text-2xl font-extrabold text-slate-900">
          주제와 스타일을 골라주세요
        </Text>
      </View>
      <View className="mt-5 rounded-[26px] bg-white p-4 shadow">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-slate-600">주제</Text>
          <View className="ml-3 h-0.5 flex-1 rounded-full bg-slate-100" />
        </View>
        <View className="mt-3 flex-row flex-wrap gap-3">
          {themeChips.map((chip) => (
            <View
              key={chip.label}
              className="rounded-2xl bg-[#F7FBFF] px-4 py-2 shadow-sm"
            >
              <Text className="text-[13px] font-semibold text-slate-700">
                {chip.emoji} {chip.label}
              </Text>
            </View>
          ))}
        </View>
        <View className="mt-5 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-slate-600">스타일</Text>
          <View className="ml-3 h-0.5 flex-1 rounded-full bg-slate-100" />
        </View>
        <View className="mt-3 flex-row flex-wrap gap-3">
          {styleChips.map((chip) => (
            <View
              key={chip.label}
              className="rounded-2xl bg-[#F7FBFF] px-4 py-2 shadow-sm"
            >
              <Text className="text-[13px] font-semibold text-slate-700">
                {chip.emoji} {chip.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <Animated.View
        style={{ transform: [{ scale: buttonScale }] }}
        className="mt-4 rounded-[30px] shadow-lg shadow-sky-200"
      >
        <LinearGradient
          colors={['#59C3FF', '#3A8DFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-[30px] overflow-hidden"
          style={{ borderRadius: 30 }}
        >
          <View className="flex-row items-center justify-center gap-2 px-6 py-4">
            <Ionicons name="musical-notes" size={18} color="#fff" />
            <Text className="text-base font-semibold text-white">
              나만의 오디오 만들기
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.View
        style={{
          transform: [{ translateX: pointerX }, { translateY: pointerY }],
        }}
        className="pointer-events-none absolute left-5 top-32 rounded-full border-2 border-sky-300 bg-white/80 p-2"
      >
        <Ionicons name="hand-left-outline" size={18} color="#0EA5E9" />
      </Animated.View>
    </View>
  );
};

const SessionPreview = ({ action }: { action: Animated.Value }) => {
  const highlightY = action.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 84],
  });

  const scriptLines = [
    'Hello there, my friend. I want to tell you about money.',
    'Money helps us buy food, clothes, and toys.',
    'It is important to use money wisely.',
    'When the jar is full, you have saved a nice amount.',
    'Next, think before you buy something.',
    'Ask yourself, “Do I really need this?”',
  ];

  return (
    <LinearGradient
      colors={['#0A4D94', '#0A72C6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="h-full rounded-[32px] px-5 py-6 shadow-xl shadow-black/40 overflow-hidden"
      style={{ borderRadius: 32 }}
    >
      <Text className="text-xs font-semibold uppercase tracking-[3px] text-white/70">
        오디오 세션
      </Text>
      <Text className="mt-1 text-2xl font-bold text-white">
        스크립트와 함께 몰입하기
      </Text>

      <View className="mt-5 flex-1 rounded-3xl bg-white/10 p-4">
        <View className="relative overflow-hidden rounded-2xl bg-white/10 p-2">
          <Animated.View
            style={{ transform: [{ translateY: highlightY }] }}
            className="absolute left-2 right-2 h-12 rounded-2xl bg-white/20"
          />
          {scriptLines.map((line) => (
            <View key={line} className="px-2 py-2">
              <Text className="text-[12px] leading-5 text-white">{line}</Text>
            </View>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
};

const VocabPreview = ({ action }: { action: Animated.Value }) => {
  const highlightScale = action.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.9, 1.05, 0.9],
  });
  const cardTranslate = action.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [30, 0, 30],
  });
  const pointerTranslate = action.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 35, 0],
  });

  return (
    <View className="h-full rounded-[32px] bg-[#F5F7FB] px-5 py-6 shadow-lg shadow-black/20">
      <Text className="text-sm font-semibold text-slate-500">단어 저장</Text>
      <Text className="mt-1 text-2xl font-bold text-slate-900">
        길게 눌러 단어장에 추가
      </Text>
      <View className="mt-5 flex-1 rounded-3xl bg-white p-4">
        <LinearGradient
          colors={['#0A4D94', '#0A72C6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-3xl border border-slate-100 p-4 overflow-hidden"
          style={{ borderRadius: 24 }}
        >
          <Text className="text-xs uppercase tracking-[3px] text-white/70">
            세션 스크립트
          </Text>
          <Text className="mt-3 text-[13px] leading-6 text-white/90">
            When the{' '}
            <Animated.Text
              style={{ transform: [{ scale: highlightScale }] }}
              className="rounded-lg bg-white/30 px-1 text-[13px] font-semibold text-white"
            >
              jar
            </Animated.Text>{' '}
            is full, you have saved a nice amount.
          </Text>
          <Text className="mt-2 text-[12px] text-white/70">
            단어를 길게 눌러 단어장에 저장하세요.
          </Text>
          <Animated.View
            style={{ transform: [{ translateY: pointerTranslate }] }}
            className="pointer-events-none mt-4 self-start rounded-full border-2 border-white/50 bg-white/80 p-2"
          >
            <Ionicons name="hand-left-outline" size={18} color="#0EA5E9" />
          </Animated.View>
          <Animated.View
            style={{
              opacity: action.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1, 0],
              }),
              transform: [
                {
                  translateY: action.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, -10, 0],
                  }),
                },
              ],
            }}
            className="pointer-events-none absolute left-10 top-16 rounded-2xl bg-white px-3 py-2 shadow"
          >
            <Text className="text-xs font-semibold text-slate-900">jar</Text>
            <Text className="text-[11px] text-slate-500">단지</Text>
          </Animated.View>
        </LinearGradient>
        <Animated.View
          style={{
            transform: [
              {
                translateY: action.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 10, 0],
                }),
              },
            ],
          }}
          className="mt-4 items-center"
        >
          <Ionicons name="arrow-down-circle" size={28} color="#0EA5E9" />
          <Text className="mt-1 text-xs text-slate-500">단어장으로 저장</Text>
        </Animated.View>
        <Animated.View
          style={{
            transform: [{ translateY: cardTranslate }],
          }}
          className="mt-5 rounded-[24px] border border-slate-100 bg-white p-4 shadow-xl shadow-black/10"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-[3px] text-slate-400">
              단어장
            </Text>
            <Ionicons name="trash" size={16} color="#F87171" />
          </View>
          <Text className="mt-2 text-2xl font-extrabold text-slate-900">
            jar
          </Text>
          <Text className="text-sm text-slate-500">단지</Text>
          <View className="mt-3 rounded-2xl bg-slate-50 p-3">
            <Text className="text-xs text-slate-500">예문</Text>
            <Text className="mt-1 text-sm text-slate-700">
              When the jar is full, you have saved a nice amount.
            </Text>
          </View>
          <View className="mt-3 flex-row items-center gap-2">
            <Ionicons name="volume-high" size={18} color="#0EA5E9" />
            <Text className="text-sm font-semibold text-[#0EA5E9]">
              예문 듣기
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const DevicePreview = ({
  activeKey,
  actionAnim,
  screenScale,
}: {
  activeKey: FlowStep['key'];
  actionAnim: Animated.Value;
  screenScale: Animated.Value;
}) => {
  const renderScreen = () => {
    switch (activeKey) {
      case 'generate':
        return <HomePreview action={actionAnim} />;
      case 'session':
        return <SessionPreview action={actionAnim} />;
      case 'vocab':
        return <VocabPreview action={actionAnim} />;
      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={{ transform: [{ scale: screenScale }] }}
      className="mt-6 items-center justify-center"
    >
      <View
        style={{ width: DEVICE_WIDTH, height: DEVICE_WIDTH * 1.8 }}
        className="overflow-hidden rounded-[42px] border border-white/5 bg-white/10 p-3 shadow-2xl shadow-black/40 backdrop-blur-md"
      >
        {renderScreen()}
      </View>
    </Animated.View>
  );
};

const StepSelector = ({
  activeIndex,
  onSelect,
}: {
  activeIndex: number;
  onSelect: (index: number) => void;
}) => (
  <View className="mt-4 flex-row flex-wrap justify-center gap-3">
    {FLOW_STEPS.map((step, index) => {
      const isActive = index === activeIndex;
      if (isActive) {
        return (
          <LinearGradient
            key={step.key}
            colors={['#0EA5E9', '#38BDF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl overflow-hidden"
            style={{ borderRadius: 16 }}
          >
            <Pressable
              onPress={() => onSelect(index)}
              className="flex-row items-center gap-2 rounded-2xl px-4 py-2"
            >
              <Ionicons name={step.icon} size={16} color="#fff" />
              <Text className="text-sm font-semibold text-white">
                {step.title}
              </Text>
            </Pressable>
          </LinearGradient>
        );
      }
      return (
        <Pressable
          key={step.key}
          onPress={() => onSelect(index)}
          className="flex-row items-center gap-2 rounded-2xl border border-white/20 px-4 py-2"
        >
          <Ionicons name={step.icon} size={16} color="#94A3B8" />
          <Text className="text-sm text-white/70">{step.title}</Text>
        </Pressable>
      );
    })}
  </View>
);

export default function WalkthroughScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const [activeStep, setActiveStep] = useState(0);
  const actionAnim = useRef(new Animated.Value(0)).current;
  const screenScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(actionAnim, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(actionAnim, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [actionAnim]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % FLOW_STEPS.length);
    }, 5200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    screenScale.setValue(0.95);
    Animated.spring(screenScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 70,
    }).start();
  }, [activeStep, screenScale]);

  const handleStart = () => {
    router.replace('/(main)');
  };

  return (
    <View className="flex-1 bg-black">
      <AnimatedGradientBackground />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: top + 12,
          paddingBottom: bottom + 24,
          paddingHorizontal: 24,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1">
          <Text className="text-3xl font-bold text-white">
            한눈에 보는 LingoFit 루틴
          </Text>

          <View className="mt-6 flex-1">
            <DevicePreview
              activeKey={FLOW_STEPS[activeStep].key}
              actionAnim={actionAnim}
              screenScale={screenScale}
            />

            <View className="mt-6 flex-1 justify-between">
              <View>
                <StepSelector
                  activeIndex={activeStep}
                  onSelect={setActiveStep}
                />

                <View className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-lg">
                  <Text className="text-sm font-semibold text-white/80">
                    {FLOW_STEPS[activeStep].title}
                  </Text>
                  <Text className="mt-2 text-base text-white/90">
                    {FLOW_STEPS[activeStep].caption}
                  </Text>
                  <Text className="mt-2 text-sm text-white/60">
                    {FLOW_STEPS[activeStep].hint}
                  </Text>
                </View>
              </View>

              <LinearGradient
                colors={['#0EA5E9', '#38BDF8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="mt-5 rounded-3xl overflow-hidden"
                style={{ borderRadius: 24 }}
              >
                <Pressable
                  onPress={handleStart}
                  className="w-full items-center rounded-3xl px-4 py-4"
                >
                  <View className="flex-row items-center justify-center gap-2">
                    <Text className="text-base font-semibold text-white">
                      지금 바로 LingoFit 시작
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </View>
                </Pressable>
              </LinearGradient>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
