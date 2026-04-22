import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSignup() {
    setError(null);

    if (!email.trim()) { setError('L\'email est requis.'); return; }
    if (!isValidEmail(email)) { setError('Format d\'email invalide.'); return; }
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return; }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }

    setLoading(true);
    const { error: authError } = await signUp(email.trim(), password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setEmailSent(true);
  }

  if (emailSent) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff', gap: 16 }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: '#111', textAlign: 'center' }}>Vérifiez votre email</Text>
        <Text style={{ fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22 }}>
          Un lien de confirmation a été envoyé à{' '}
          <Text style={{ fontWeight: '600', color: '#111' }}>{email}</Text>.{' '}
          Cliquez sur le lien pour activer votre compte, puis connectez-vous.
        </Text>
        <Pressable
          onPress={() => router.push('/login')}
          style={{ backgroundColor: '#111', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 }}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Aller à la connexion</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12 }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 8 }}>Créer un compte</Text>

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
          placeholder="Mot de passe (min. 6 caractères)"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, color: '#111', backgroundColor: '#fafafa' }}
        />

        <TextInput
          placeholder="Confirmer le mot de passe"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15, color: '#111', backgroundColor: '#fafafa' }}
        />

        <Pressable
          onPress={handleSignup}
          disabled={loading}
          style={{ backgroundColor: loading ? '#999' : '#111', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 4 }}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>S&apos;inscrire</Text>
          }
        </Pressable>

        <Pressable onPress={() => router.push('/login')} disabled={loading} style={{ alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ color: '#555', fontSize: 14 }}>Déjà un compte ? <Text style={{ color: '#111', fontWeight: '600' }}>Se connecter</Text></Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
