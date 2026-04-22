import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import OrderCard from '@/components/OrderCard';

export default function CompteScreen() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { orders, loading: ordersLoading, error } = useOrders();

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
          
          {/* ── Section Profil ── */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#111' }}>Profil</Text>
            <Text style={{ fontSize: 16, color: '#555' }}>{user.email}</Text>
            <Text style={{ fontSize: 14, color: '#888' }}>
              Membre depuis le {new Date(user.created_at).toLocaleDateString('fr-FR')}
            </Text>
            <Pressable 
              onPress={signOut}
              style={({ pressed }) => ({
                marginTop: 8,
                paddingVertical: 12,
                paddingHorizontal: 24,
                backgroundColor: pressed ? '#f5d6d3' : '#fdecea',
                borderRadius: 8,
                alignSelf: 'flex-start'
              })}
            >
              <Text style={{ color: '#c0392b', fontWeight: '600' }}>Se déconnecter</Text>
            </Pressable>
          </View>

          {/* ── Section Commandes ── */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111' }}>Mes commandes</Text>
            
            {ordersLoading ? (
              <ActivityIndicator style={{ alignSelf: 'flex-start' }} />
            ) : error ? (
              <Text style={{ color: '#c0392b' }}>{error}</Text>
            ) : orders.length === 0 ? (
              <View style={{ backgroundColor: '#fafafa', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#eee' }}>
                <Text style={{ color: '#555', textAlign: 'center' }}>Vous n&apos;avez passé aucune commande pour le moment.</Text>
              </View>
            ) : (
              orders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onPress={(orderId) => {
                    router.push({
                      pathname: '/orders/[id]',
                      params: { id: orderId }
                    } as any);
                  }} 
                />
              ))
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Non connecté ──
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff', gap: 16 }}>
      <Text style={{ fontSize: 26, fontWeight: '700', color: '#111', textAlign: 'center' }}>Mon compte</Text>
      <Text style={{ fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22 }}>
        Connectez-vous pour accéder à votre historique de commandes, vos favoris et gérer votre profil.
      </Text>
      
      <View style={{ gap: 12, marginTop: 16 }}>
        <Pressable 
          onPress={() => router.push('/login')}
          style={({ pressed }) => ({ 
            backgroundColor: pressed ? '#333' : '#111', 
            paddingVertical: 14, 
            borderRadius: 8, 
            alignItems: 'center' 
          })}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Se connecter</Text>
        </Pressable>
        <Pressable 
          onPress={() => router.push('/signup')}
          style={({ pressed }) => ({ 
            borderWidth: 1, 
            borderColor: '#ddd', 
            paddingVertical: 14, 
            borderRadius: 8, 
            alignItems: 'center',
            backgroundColor: pressed ? '#f9f9f9' : 'transparent'
          })}
        >
          <Text style={{ color: '#111', fontSize: 15, fontWeight: '600' }}>Créer un compte</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
