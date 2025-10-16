import { useLogin } from '@/hooks/mutations/useAuthMutations';
import { validatePassword, validateUsername } from '@/utils/authValidation';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = useLogin();

  const handleSubmit = () => {
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);

    if (usernameError || passwordError) {
      setErrorMessage(usernameError || passwordError);
      return;
    }

    setErrorMessage(null);

    loginMutation.mutate(
      { username, password },
      {
        onSuccess: () => {
          router.replace('/');
        },
        onError: (error) => {
          setErrorMessage(error.message ?? 'Login failed. Please try again.');
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={{ flex: 1 }}
    >
      <View className="flex-1 justify-center bg-white px-6 dark:bg-neutral-950">
        <View className="w-full max-w-md self-center">
          <Text className="mb-8 text-center text-3xl font-semibold text-neutral-900 dark:text-white">
            LingoFit
          </Text>

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
              className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-neutral-900 focus:border-sky-500 focus:outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-white"
              editable={!loginMutation.isPending}
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
              textContentType="password"
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-neutral-900 focus:border-sky-500 focus:outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-white"
              editable={!loginMutation.isPending}
            />
          </View>

          {errorMessage ? (
            <Text className="mb-4 text-sm text-red-500">{errorMessage}</Text>
          ) : null}

          <Pressable
            className="rounded-lg bg-sky-500 py-3 disabled:opacity-60"
            onPress={handleSubmit}
            disabled={loginMutation.isPending}
          >
            <Text className="text-center text-base font-semibold text-white">
              {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
            </Text>
          </Pressable>

          <Pressable
            className="mt-6"
            onPress={() => {
              router.push('/signup');
            }}
          >
            <Text className="text-center text-sm text-neutral-600 dark:text-neutral-300">
              Need an account?{' '}
              <Text className="font-semibold text-sky-500">Sign up</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
