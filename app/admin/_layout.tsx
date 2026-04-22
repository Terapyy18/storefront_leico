import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: true,
        headerStyle: { backgroundColor: '#fff' },
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }} 
    >
      <Stack.Screen name="index" options={{ title: 'Accueil Admin' }} />
      <Stack.Screen name="products" options={{ title: 'Stock Produits' }} />
    </Stack>
  );
}