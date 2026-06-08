import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';
import { LoadingOverlay } from '../../src/components/shared/LoadingOverlay';

export default function AppLayout() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <LoadingOverlay />;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="daily" />
      <Stack.Screen name="quick" />
      <Stack.Screen name="upgrade" />
      <Stack.Screen name="payments/verify" />
    </Stack>
  );
}
