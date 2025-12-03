import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface TestOptionStepProps {
  onSelect: (skipTest: boolean) => void;
}

export default function TestOptionStep({ onSelect }: TestOptionStepProps) {
  const [selected, setSelected] = useState<boolean | null>(null);

  const handleSelect = (skipTest: boolean) => {
    setSelected(skipTest);
    onSelect(skipTest);
  };

  return (
    <View className="px-4">
      <View className="items-center mb-10">
        <View className="mb-6 items-center">
          <View className="bg-sky-50 rounded-full p-4 mb-4 border border-sky-100">
            <Ionicons name="headset" size={48} color="#0EA5E9" />
          </View>
          <Text className="text-[34px] font-black text-slate-900 text-center leading-[42px] tracking-tight">
            듣기 테스트를{'\n'}진행할까요?
          </Text>
        </View>

        <View className="flex-row items-center justify-center rounded-xl py-2 px-3">
          <Ionicons name="time-outline" size={16} color="#0EA5E9" />
          <Text className="text-sm text-sky-700 font-semibold ml-1.5">
            약 3분 소요 · 5 문항
          </Text>
        </View>
      </View>
      <View className="w-full gap-4 px-2">
        <TouchableOpacity
          onPress={() => handleSelect(false)}
          activeOpacity={0.8}
          className="overflow-hidden rounded-3xl shadow-lg"
        >
          {selected === false ? (
            <LinearGradient
              colors={['#0EA5E9', '#38BDF8'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="px-6 py-6"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-white/20 rounded-full p-2 mr-3">
                    <Ionicons name="play-circle" size={32} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-black text-white mb-0.5">
                      테스트 진행하기
                    </Text>
                    <Text className="text-sm text-sky-50 font-medium">
                      정확한 실력 측정
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </View>
            </LinearGradient>
          ) : (
            <View className="px-6 py-6 bg-white border-2 border-slate-200 rounded-3xl">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-slate-100 rounded-full p-2 mr-3">
                    <Ionicons
                      name="play-circle-outline"
                      size={32}
                      color="#64748b"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-black text-slate-800 mb-0.5">
                      테스트 진행하기
                    </Text>
                    <Text className="text-sm text-slate-500 font-medium">
                      정확한 실력 측정
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
              </View>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSelect(true)}
          activeOpacity={0.8}
          className="overflow-hidden rounded-3xl shadow-lg"
        >
          {selected === true ? (
            <LinearGradient
              colors={['#0EA5E9', '#38BDF8'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="px-6 py-6"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-white/20 rounded-full p-2 mr-3">
                    <Ionicons
                      name="arrow-forward-circle"
                      size={32}
                      color="#fff"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-black text-white mb-0.5">
                      건너뛰기
                    </Text>
                    <Text className="text-sm text-sky-50 font-medium">
                      바로 시작하기
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </View>
            </LinearGradient>
          ) : (
            <View className="px-6 py-6 bg-white border-2 border-slate-200 rounded-3xl">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-slate-100 rounded-full p-2 mr-3">
                    <Ionicons
                      name="arrow-forward-circle-outline"
                      size={32}
                      color="#64748b"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-black text-slate-800 mb-0.5">
                      건너뛰기
                    </Text>
                    <Text className="text-sm text-slate-500 font-medium">
                      바로 시작하기
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
