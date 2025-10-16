import Button from '@/components/Button';
import { useLogout } from '@/hooks/mutations/useAuthMutations';
import { useUser } from '@/hooks/queries/useUserQueries';
import { Text, View } from 'react-native';
import { useState } from 'react';

export default function ProfileScreen() {
  const { data: user, isLoading: isAuthLoading } = useUser();

  const logout = useLogout();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>
        {isAuthLoading
          ? 'Loading profile...'
          : user
            ? `Logged in as ${user.nickname}`
            : 'No user information available.'}
      </Text>
      <Button
        title="Logout"
        onPress={logout}
        disabled={isAuthLoading || !user}
        style={{ marginTop: 24, width: '60%' }}
      />
    </View>
  );
}
