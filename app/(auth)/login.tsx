import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

function translateError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (message.includes('Email not confirmed')) return 'Confirmez votre email avant de vous connecter.';
  if (message.includes('Too many requests')) return 'Trop de tentatives. Réessayez dans quelques minutes.';
  if (message.includes('User not found')) return 'Aucun compte trouvé avec cet email.';
  if (message.includes('network')) return 'Erreur réseau. Vérifiez votre connexion.';
  return message;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);

    if (!email.trim()) { setError('L\'email est requis.'); return; }
    if (!isValidEmail(email)) { setError('Format d\'email invalide.'); return; }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }

    setLoading(true);
    const { error: authError } = await signIn(email.trim(), password);
    setLoading(false);

    if (authError) {
      setError(translateError(authError.message));
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View>
        <Text>Connexion</Text>

        {error && <Text>{error}</Text>}

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <TextInput
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <Pressable onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator />
            : <Text>Se connecter</Text>
          }
        </Pressable>

        <Pressable onPress={() => router.push('/signup')} disabled={loading}>
          <Text>Pas encore de compte ? S'inscrire</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
