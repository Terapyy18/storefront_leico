import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ActivityIndicator, View } from 'react-native';
import { useEffect } from 'react';

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';

export const unstable_settings = {
  anchor: '(tabs)',
};

// ─── Navigator ────────────────────────────────────────────────────────────────
// Tous les screens sont déclarés statiquement (requis par expo-router).
// La protection des routes se fait via useEffect + redirect.

function RootNavigator() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Non connecté et hors du groupe auth → login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Connecté et dans le groupe auth → tabs
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{ presentation: 'modal', headerShown: true, title: 'Modal' }}
      />
    </Stack>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </CartProvider>
    </AuthProvider>
  );
}
