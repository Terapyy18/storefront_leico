import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { COLORS, styles } from './style.signup';

// ─── Helpers ────────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Sous-composants ────────────────────────────────────────────────────────

function Field({
  label,
  icon,
  ...props
}: {
  label: string;
  icon?: string;
} & React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
        {icon && <Text style={styles.inputIcon}>{icon}</Text>}
        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.muted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
    </View>
  );
}

// ─── Écran principal ────────────────────────────────────────────────────────

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
  // ─── Écran de confirmation ─────────────────────────────────────
  if (emailSent) {
    return (
      <View style={styles.confirmRoot}>
        <View style={styles.confirmCard}>
          <View style={styles.confirmIcon}>
            <Text style={styles.confirmIconText}>✉</Text>
          </View>
          <Text style={styles.confirmTitle}>Vérifiez votre email</Text>
          <Text style={styles.confirmText}>
            Un lien de confirmation a été envoyé à{' '}
            <Text style={styles.confirmEmail}>{email}</Text>.{'\n'}
            Cliquez sur le lien pour activer votre compte, puis connectez-vous.
          </Text>
          <Pressable
            style={styles.confirmBtn}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.confirmBtnText}>Aller à la connexion</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Formulaire d'inscription ──────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>

          {/* En-tête */}
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>L</Text>
            </View>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>Rejoignez Leico en quelques secondes</Text>
          </View>

          {/* Erreur */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Champs */}
          <Field
            label="Email"
            icon="✉"
            placeholder="vous@exemple.fr"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <Field
            label="Mot de passe"
            icon="🔒"
            placeholder="Min. 6 caractères"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <Field
            label="Confirmer le mot de passe"
            icon="🔒"
            placeholder="Répétez le mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          {/* Bouton inscription */}
          <Pressable
            onPress={handleSignup}
            disabled={loading}
            style={({ pressed }) => [
              styles.btn,
              pressed  && styles.btnPressed,
              loading  && styles.btnDisabled,
            ]}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.btnText}>S&apos;inscrire</Text>
            }
          </Pressable>

          {/* Lien connexion */}
          <View style={styles.loginRow}>
            <Pressable onPress={() => router.push('/login')} disabled={loading}>
              <Text style={styles.loginText}>
                Déjà un compte ?{' '}
                <Text style={styles.loginLink}>Se connecter</Text>
              </Text>
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}