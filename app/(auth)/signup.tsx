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
      <View>
        <Text>Vérifiez votre email</Text>
        <Text>Un lien de confirmation a été envoyé à {email}. Cliquez sur le lien pour activer votre compte, puis connectez-vous.</Text>
        <Pressable onPress={() => router.push('/login')}>
          <Text>Aller à la connexion</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View>
        <Text>Créer un compte</Text>

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
          placeholder="Mot de passe (min. 6 caractères)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TextInput
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
        />

        <Pressable onPress={handleSignup} disabled={loading}>
          {loading
            ? <ActivityIndicator />
            : <Text>S'inscrire</Text>
          }
        </Pressable>

        <Pressable onPress={() => router.push('/login')} disabled={loading}>
          <Text>Déjà un compte ? Se connecter</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
