import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function CompteScreen() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <SafeAreaView>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (user) {
    return (
      <SafeAreaView>
        <Text>{user.email}</Text>
        <Text>Membre depuis {new Date(user.created_at).toLocaleDateString('fr-FR')}</Text>
        <Pressable onPress={signOut}>
          <Text>Se déconnecter</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <Text>Mon compte</Text>
      <Text>Connectez-vous pour accéder à vos commandes, favoris et profil.</Text>
      <Pressable onPress={() => router.push('/login')}>
        <Text>Se connecter</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/signup')}>
        <Text>Créer un compte</Text>
      </Pressable>
    </SafeAreaView>
  );
}
