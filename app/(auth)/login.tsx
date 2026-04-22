import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

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
      setError(authError.message);
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 8 }}>Connexion</Text>

        {error && (
          <Text style={{ color: '#c0392b', fontSize: 13 }}>{error}</Text>
        )}

        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, color: '#111', backgroundColor: '#fafafa' }}
        />

        <TextInput
          placeholder="Mot de passe"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, color: '#111', backgroundColor: '#fafafa' }}
        />

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={{ backgroundColor: loading ? '#999' : '#111', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 4 }}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Se connecter</Text>
          }
        </Pressable>

        <Pressable onPress={() => router.push('/signup')} disabled={loading} style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ color: '#555', fontSize: 14 }}>Pas encore de compte ? <Text style={{ color: '#111', fontWeight: '600' }}>S&apos;inscrire</Text></Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
