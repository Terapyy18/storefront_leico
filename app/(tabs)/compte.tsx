import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, styles } from './_style.compte';

import { useOrders } from '@/hooks/useOrders';

// ─── Sous-composants ─────────────────────────────────────────────────────────

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

// ─── Section : historique des commandes ──────────────────────────────────────

function OrderHistory() {
  const { orders, loading, error } = useOrders();
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historique des commandes</Text>
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 10 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historique des commandes</Text>
        <Text style={styles.orderEmpty}>Impossible de charger les commandes.</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Historique des commandes</Text>

      {orders.length === 0 ? (
        <Text style={styles.orderEmpty}>Aucune commande pour le moment.</Text>
      ) : (
        orders.map((order, i) => {
          // Format date and ref
          const dateStr = new Date(order.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
          const refStr = `#${order.id.split('-')[0].toUpperCase()}`;

          // Format status
          const statusMap: Record<string, string> = {
            pending: 'En cours',
            completed: 'Livré',
            shipped: 'Expédié',
            cancelled: 'Annulé',
          };
          const displayStatus = statusMap[order.status] || order.status;

          return (
            <Pressable
              key={order.id}
              style={({ pressed }) => [
                styles.orderItem,
                i === orders.length - 1 && { borderBottomWidth: 0 },
                pressed && { opacity: 0.6 },
              ]}
              onPress={() => router.push(`/orders/${order.id}`)}
            >
              <View style={styles.orderLeft}>
                <Text style={styles.orderRef}>{refStr}</Text>
                <Text style={styles.orderDate}>{dateStr}</Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderAmount}>{order.total_amount.toFixed(2)} €</Text>
                <Text style={styles.orderBadge}>{displayStatus}</Text>
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

// ─── Section : modifier l'email ───────────────────────────────────────────────

function EditEmail({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState('');

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Modifier l&apos;adresse email</Text>
      <Field label="Email actuel" icon="✉" value={currentEmail} editable={false} />
      <Field
        label="Nouvel email"
        icon="✉"
        placeholder="nouveau@exemple.fr"
        value={newEmail}
        onChangeText={setNewEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable
        style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
        onPress={() => {
          /* TODO: appel Supabase updateUser */
        }}
      >
        <Text style={styles.btnPrimaryText}>Mettre à jour l&apos;email</Text>
      </Pressable>
    </View>
  );
}

// ─── Section : modifier le mot de passe ──────────────────────────────────────

function EditPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Modifier le mot de passe</Text>
      <Field
        label="Nouveau mot de passe"
        icon="🔒"
        placeholder="Min. 6 caractères"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />
      <Field
        label="Confirmer le mot de passe"
        icon="🔒"
        placeholder="Répétez le mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <Pressable
        style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
        onPress={() => {
          /* TODO: appel Supabase updateUser */
        }}
      >
        <Text style={styles.btnPrimaryText}>Mettre à jour le mot de passe</Text>
      </Pressable>
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function CompteScreen() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  // ── Chargement ──────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  // ── Non connecté ─────────────────────────────────────────────────
  if (!user) {
    return (
      <SafeAreaView style={styles.guestRoot}>
        <View style={styles.guestCard}>
          <View style={styles.guestIcon}>
            <Text style={styles.guestIconText}>👤</Text>
          </View>
          <Text style={styles.guestTitle}>Mon compte</Text>
          <Text style={styles.guestSubtitle}>
            Connectez-vous pour accéder à vos commandes, favoris et profil.
          </Text>
          <View style={styles.guestBtnRow}>
            <Pressable
              style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPrimaryPressed]}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.btnPrimaryText}>Se connecter</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btnDanger, pressed && styles.btnDangerPressed]}
              onPress={() => router.push('/signup')}
            >
              <Text style={styles.btnDangerText}>Créer un compte</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Connecté ──────────────────────────────────────────────────────
  const initials = user.email ? user.email.slice(0, 2).toUpperCase() : '?';

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profil */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.profileEmail}>{user.email}</Text>
          <Text style={styles.profileSince}>
            Membre depuis {new Date(user.created_at).toLocaleDateString('fr-FR')}
          </Text>
        </View>

        {/* Historique commandes */}
        <OrderHistory />

        {/* Modifier email */}
        <EditEmail currentEmail={user.email ?? ''} />

        {/* Modifier mot de passe */}
        <EditPassword />

        {/* Déconnexion */}
        <Pressable
          style={({ pressed }) => [styles.btnDanger, pressed && styles.btnDangerPressed]}
          onPress={signOut}
        >
          <Text style={styles.btnDangerText}>Se déconnecter</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
