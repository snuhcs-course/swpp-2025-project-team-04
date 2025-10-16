import { useSignup } from '@/hooks/mutations/useAuthMutations';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function SignUpScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const signupMutation = useSignup();

  const handleSubmit = () => {
    if (!username || !password || !nickname) {
      setErrorMessage('All fields are required.');
      return;
    }

    setErrorMessage(null);

    signupMutation.mutate(
      { username, password, nickname },
      {
        onSuccess: () => {
          router.replace('/login');
        },
        onError: (error) => {
          setErrorMessage(error.message ?? 'Sign up failed. Please try again.');
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="bg-white dark:bg-neutral-950"
      >
        <View className="flex-1 justify-center px-6 py-10">
          <View className="w-full max-w-md self-center">
            <Text className="mb-8 text-center text-3xl font-semibold text-neutral-900 dark:text-white">
              Create an account
            </Text>

            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Nickname
              </Text>
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                placeholder="your nickname"
                placeholderTextColor="#9ca3af"
                className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-neutral-900  focus:border-sky-500 focus:outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-white"
                editable={!signupMutation.isPending}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                ID
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                textContentType="username"
                placeholder="your id"
                placeholderTextColor="#9ca3af"
                className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-neutral-900  focus:border-sky-500 focus:outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-white"
                editable={!signupMutation.isPending}
              />
            </View>

            <View className="mb-3">
              <Text className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="newPassword"
                placeholder="At least 8 characters"
                placeholderTextColor="#9ca3af"
                className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-neutral-900 focus:border-sky-500 focus:outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-white"
                editable={!signupMutation.isPending}
              />
            </View>

            {errorMessage ? (
              <Text className="mb-4 text-sm text-red-500">{errorMessage}</Text>
            ) : null}

            <Pressable
              className="rounded-lg bg-sky-500 py-3 disabled:opacity-60"
              onPress={handleSubmit}
              disabled={signupMutation.isPending}
            >
              <Text className="text-center text-base font-semibold text-white">
                {signupMutation.isPending ? 'Creating account…' : 'Sign up'}
              </Text>
            </Pressable>

            <Pressable
              className="mt-6"
              onPress={() => {
                router.back();
              }}
            >
              <Text className="text-center text-sm text-neutral-600 dark:text-neutral-300">
                Already have an account?{' '}
                <Text className="font-semibold text-sky-500">Sign in</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
