import { useSignup } from '@/hooks/mutations/useAuthMutations';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';

export default function SignUpScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const signupMutation = useSignup();

  // 화면 벗어날 때 에러 초기화
  useFocusEffect(
    useCallback(() => {
      return () => setErrorMessage(null);
    }, []),
  );

  const isDisabled =
    !nickname ||
    !username ||
    !password ||
    !confirmPassword ||
    signupMutation.isPending;

  const handleSubmit = () => {
    if (isDisabled) return;

    if (!nickname || !username || !password || !confirmPassword) {
      setErrorMessage('모든 항목을 입력해 주세요.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    setErrorMessage(null);
    signupMutation.mutate(
      { username, password, nickname },
      {
        onSuccess: () => router.replace('/login'),
        onError: (error) => {
          setErrorMessage(error.message ?? '회원가입에 실패했습니다.');
        },
      },
    );
  };

  return (
    <LinearGradient
      colors={['#0C4A6E', '#0284C7', '#7DD3FC']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid
        enableAutomaticScroll
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={100}
        extraHeight={40}
      >
        <View className="flex-1 justify-center px-6 py-12">
          <View className="w-full max-w-md self-center">
            {/* 헤더 */}
            <View className="mb-10">
              <Text className="mb-2 text-center text-[46px] font-extrabold text-white tracking-tight">
                LingoFit
              </Text>
              <Text className="text-center text-[15px] text-white/90">
                듣고 익히는 진짜 영어 루틴
              </Text>
            </View>

            {/* 카드 */}
            <View className="rounded-3xl bg-white p-6 shadow-[0px_6px_20px_rgba(2,132,199,0.18)]">
              {/* 닉네임 */}
              <AuthInput
                label="닉네임"
                leftIcon="person-circle-outline"
                value={nickname}
                onChangeText={(t) => {
                  setNickname(t);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="어떻게 불러드릴까요?"
                editable={!signupMutation.isPending}
                returnKeyType="next"
                containerClassName="mb-5"
              />

              {/* 아이디 */}
              <AuthInput
                label="아이디"
                leftIcon="person-outline"
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="none"
                textContentType="username"
                placeholder="아이디를 입력하세요"
                editable={!signupMutation.isPending}
                returnKeyType="next"
                containerClassName="mb-5"
              />

              {/* 비밀번호 */}
              <AuthInput
                label="비밀번호"
                leftIcon="lock-closed-outline"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errorMessage) setErrorMessage(null);
                }}
                secureTextEntry
                textContentType="newPassword"
                placeholder="3~30자 비밀번호를 입력하세요"
                editable={!signupMutation.isPending}
                returnKeyType="next"
                containerClassName="mb-5"
              />

              {/* 비밀번호 확인 */}
              <AuthInput
                label="비밀번호 확인"
                leftIcon="lock-closed-outline"
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (errorMessage) setErrorMessage(null);
                }}
                secureTextEntry
                textContentType="newPassword"
                placeholder="비밀번호를 다시 입력하세요"
                editable={!signupMutation.isPending}
                onSubmitEditing={handleSubmit}
                returnKeyType="done"
              />

              {/* 에러 메시지 */}
              {errorMessage ? (
                <View className="mt-3 rounded-lg bg-red-50 px-3 py-2.5">
                  <Text className="text-[13px] font-medium text-red-600">
                    {errorMessage}
                  </Text>
                </View>
              ) : null}

              {/* 회원가입 버튼 */}
              <AuthButton
                title="회원가입"
                onPress={handleSubmit}
                disabled={isDisabled}
                loading={signupMutation.isPending}
                className="mt-6"
              />
            </View>

            {/* 하단 링크 */}
            <View className="mt-8">
              <Pressable
                onPress={() => router.replace('/login')}
                disabled={signupMutation.isPending}
                android_ripple={{
                  color: 'rgba(255,255,255,0.25)',
                  borderless: true,
                }}
              >
                <Text className="text-center text-base text-white/95">
                  이미 계정이 있으신가요?{' '}
                  <Text className="font-bold text-white">로그인</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
}
