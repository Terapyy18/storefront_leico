import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from './../../context/AuthContext'; // Vérifie bien ce chemin

export default function AdminLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const isAdmin = user?.app_metadata?.role === 'admin';

  if (!isAdmin) {
    return <Redirect href="/" />;
  }

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
      <Stack.Screen name="categories" options={{ title: 'Catégories' }} />
      <Stack.Screen name="orders" options={{ title: 'Commandes' }} />
    </Stack>
  );
}