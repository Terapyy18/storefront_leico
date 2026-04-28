/**
 * components/WebNavbar.tsx
 * Barre de navigation web — partagée entre toutes les pages.
 * Utilise useProductsByCategory pour afficher les catégories.
 */
import { CartButton } from '@/components/CartButton';
import { CartModal } from '@/components/CartModal';
import { useAuth } from '@/hooks/useAuth';
import { useProductsByCategory } from '@/hooks/useProductsByCategory';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

// ─── Palette (doit correspondre à celle de HomeScreen) ───────────────────────
export const C = {
  bg: '#FAFAF8',
  surface: '#FFFFFF',
  text: '#111111',
  muted: '#888888',
  border: '#E8E8E4',
  accentText: '#FFFFFF',
  admin: '#C8360A',
};

function useIsAdmin() {
  const { user } = useAuth();
  return (
    user?.app_metadata?.role === 'admin' ||
    user?.user_metadata?.role === 'admin' ||
    false
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface WebNavbarProps {
  /** Valeur de la recherche — optionnel, n'afficher la search que si fourni */
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
  /** Page active pour souligner le lien courant */
  activePath?: 'home' | 'favorites' | 'compte' | 'admin';
}

export function WebNavbar({ searchQuery, onSearchChange, activePath }: WebNavbarProps) {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const { width } = useWindowDimensions();
  const isWide = width >= 1100;
  const { sections } = useProductsByCategory();
  const [cartVisible, setCartVisible] = useState(false);

  return (
    <>
      <View style={s.wrapper}>
        <View style={[s.inner, { maxWidth: isWide ? 1280 : 960 }]}>

          {/* ── Logo ── */}
          <Pressable onPress={() => router.push('/(tabs)')} style={s.logoWrap}>
            <Text style={s.logo}>LEICO</Text>
          </Pressable>

          {/* ── Catégories ── */}
          <View style={s.links}>
            {sections.map((sec) => (
              <Pressable
                key={sec.category_id}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/category/[id]',
                    params: { id: sec.category_id, name: sec.category_name },
                  })
                }
                style={({ pressed }) => [s.link, pressed && { opacity: 0.5 }]}
              >
                <Text style={s.linkText}>{sec.category_name}</Text>
              </Pressable>
            ))}
          </View>

          {/* ── Actions ── */}
          <View style={s.actions}>

            {/* Recherche (optionnelle) */}
            {onSearchChange !== undefined && (
              <View style={s.searchBox}>
                <Ionicons name="search" size={15} color={C.muted} />
                <TextInput
                  style={s.searchInput}
                  placeholder="Rechercher…"
                  placeholderTextColor={C.muted}
                  value={searchQuery ?? ''}
                  onChangeText={onSearchChange}
                />
                {(searchQuery?.length ?? 0) > 0 && (
                  <Pressable onPress={() => onSearchChange?.('')}>
                    <Ionicons name="close-circle" size={14} color={C.muted} />
                  </Pressable>
                )}
              </View>
            )}

            <View style={s.sep} />

            {/* Favoris */}
            <NavIconBtn
              icon={activePath === 'favorites' ? 'heart' : 'heart-outline'}
              active={activePath === 'favorites'}
              label="Favoris"
              onPress={() => router.push('/(tabs)/favorites')}
            />

            {/* Compte */}
            <NavIconBtn
              icon={activePath === 'compte' ? 'person' : 'person-outline'}
              active={activePath === 'compte'}
              label="Mon compte"
              onPress={() => router.push('/(tabs)/compte')}
            />

            {/* Admin */}
            {isAdmin && (
              <Pressable
                onPress={() => router.push('/admin')}
                style={({ pressed }) => [s.adminBtn, pressed && { opacity: 0.75 }]}
              >
                <Ionicons name="shield-checkmark" size={14} color={C.accentText} />
                <Text style={s.adminText}>Admin</Text>
              </Pressable>
            )}

            {/* Panier */}
            <CartButton onPress={() => setCartVisible(true)} />
          </View>
        </View>
      </View>

      <CartModal visible={cartVisible} onClose={() => setCartVisible(false)} />
    </>
  );
}

// ─── Bouton icône avec tooltip accessible ────────────────────────────────────
function NavIconBtn({
  icon,
  active,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  active?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={({ pressed }) => [s.iconBtn, pressed && { opacity: 0.5 }]}
    >
      <Ionicons name={icon} size={20} color={active ? C.text : C.muted} />
      {active && <View style={s.activeDot} />}
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrapper: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    alignItems: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  inner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    gap: 20,
  },
  logoWrap: { marginRight: 8 },
  logo: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 4,
    color: C.text,
  },
  links: { flex: 1, flexDirection: 'row', gap: 24 },
  link: { paddingVertical: 4 },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  searchInput: {
    fontSize: 13,
    color: C.text,
    width: 180,
    outlineStyle: 'none',
  } as any,
  sep: { width: 1, height: 20, backgroundColor: C.border, marginHorizontal: 2 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.text,
  },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.admin,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  adminText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.accentText,
    letterSpacing: 0.5,
  },
});