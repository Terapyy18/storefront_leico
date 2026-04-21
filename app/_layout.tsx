import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

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

    // Connecté et encore sur un écran auth (ex: après login) → tabs
    if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
    // Non connecté → on laisse accéder aux tabs normalement (app publique)
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
        name="orders/[id]"
        options={{ presentation: 'modal', headerShown: false, title: 'Order Details' }}
      />
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
