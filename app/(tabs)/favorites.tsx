import { C, WebNavbar } from '@/components/WebNavbar';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import type { Product } from '@/hooks/useProducts';
import { supabase } from '@/services/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Breakpoint ───────────────────────────────────────────────────────────────
function useBreakpoint() {
  const { width } = useWindowDimensions();
  return { isWeb: width >= 768, isWide: width >= 1100, width };
}

// ════════════════════════════════════════════════════════════════════════════
// NAVBAR MOBILE (identique à HomeScreen)
// ════════════════════════════════════════════════════════════════════════════
function MobileHeader({ onCartPress }: { onCartPress: () => void }) {
  const router = useRouter();
  return (
    <View style={mob.header}>
      <Pressable onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="arrow-back" size={24} color={C.text} />
      </Pressable>
      <Text style={mob.title}>Mes favoris</Text>
      {/* Espace pour équilibrer */}
      <View style={{ width: 24 }} />
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CARD — WEB (horizontale, spacieuse)
// ════════════════════════════════════════════════════════════════════════════
function WebFavoriteCard({
  product,
  onRemove,
  onPress,
}: {
  product: Product;
  onRemove: () => void;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      // @ts-ignore — web only
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={[webCard.wrapper, hovered && webCard.wrapperHovered]}
    >
      {/* Image */}
      <View style={webCard.imgWrap}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={[webCard.img, hovered && webCard.imgHovered]}
            resizeMode="cover"
          />
        ) : (
          <View style={webCard.imgPlaceholder}>
            <Text style={{ fontSize: 36 }}>🧥</Text>
          </View>
        )}
      </View>

      {/* Infos */}
      <View style={webCard.body}>
        {product.category && (
          <View style={webCard.badge}>
            <Text style={webCard.badgeText}>{product.category.toUpperCase()}</Text>
          </View>
        )}
        <Text style={webCard.name} numberOfLines={2}>
          {product.name}
        </Text>
        {product.description ? (
          <Text style={webCard.desc} numberOfLines={3}>
            {product.description}
          </Text>
        ) : null}
        <View style={webCard.footer}>
          <Text style={webCard.price}>{product.price.toFixed(2)} €</Text>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onRemove();
            }}
            style={({ pressed }) => [webCard.removeBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="heart" size={14} color="#C8360A" />
            <Text style={webCard.removeBtnText}>Retirer</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const webCard = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 16,
    transition: 'box-shadow 0.2s, transform 0.2s',
  } as any,
  wrapperHovered: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    transform: [{ translateY: -2 }],
  },
  imgWrap: { width: 180, height: 220, backgroundColor: '#F4F4F0', overflow: 'hidden' },
  img: { width: '100%', height: '100%', transition: 'transform 0.4s' } as any,
  imgHovered: { transform: [{ scale: 1.04 }] },
  imgPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F0',
  },
  body: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 1.5,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  desc: {
    fontSize: 14,
    color: C.muted,
    lineHeight: 22,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.5,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F2D0C8',
    backgroundColor: '#FFF5F3',
  },
  removeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C8360A',
  },
});

// ════════════════════════════════════════════════════════════════════════════
// CARD — MOBILE (verticale, compacte)
// ════════════════════════════════════════════════════════════════════════════
function MobileFavoriteCard({
  product,
  onRemove,
  onPress,
}: {
  product: Product;
  onRemove: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={mobCard.wrapper}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={mobCard.img} resizeMode="cover" />
      ) : (
        <View style={mobCard.imgPlaceholder}>
          <Text style={{ fontSize: 28 }}>🧥</Text>
        </View>
      )}

      <View style={mobCard.body}>
        <View style={mobCard.top}>
          {product.category && (
            <Text style={mobCard.cat}>{product.category.toUpperCase()}</Text>
          )}
          <Text style={mobCard.name} numberOfLines={2}>
            {product.name}
          </Text>
          {product.description ? (
            <Text style={mobCard.desc} numberOfLines={2}>
              {product.description}
            </Text>
          ) : null}
        </View>

        <View style={mobCard.bottom}>
          <Text style={mobCard.price}>{product.price.toFixed(2)} €</Text>
          <Pressable
            onPress={(e) => { e.stopPropagation?.(); onRemove(); }}
            style={mobCard.removeBtn}
          >
            <Ionicons name="heart" size={14} color="#C8360A" />
            <Text style={mobCard.removeBtnText}>Retirer</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const mobCard = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  img: { width: 110, height: 140 },
  imgPlaceholder: {
    width: 110,
    height: 140,
    backgroundColor: '#F4F4F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  top: { gap: 4 },
  cat: {
    fontSize: 9,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 1.5,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    lineHeight: 20,
  },
  desc: { fontSize: 12, color: C.muted, lineHeight: 18 },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  price: { fontSize: 16, fontWeight: '800', color: C.text },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFF5F3',
    borderWidth: 1,
    borderColor: '#F2D0C8',
  },
  removeBtnText: { fontSize: 12, fontWeight: '600', color: '#C8360A' },
});

// ════════════════════════════════════════════════════════════════════════════
// ÉTAT VIDE / NON CONNECTÉ
// ════════════════════════════════════════════════════════════════════════════
function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: string;
  title: string;
  subtitle: string;
  action?: { label: string; onPress: () => void };
}) {
  const { isWeb } = useBreakpoint();
  return (
    <View style={[empty.wrapper, isWeb && empty.wrapperWeb]}>
      <View style={empty.iconWrap}>
        <Text style={empty.icon}>{icon}</Text>
      </View>
      <Text style={empty.title}>{title}</Text>
      <Text style={empty.sub}>{subtitle}</Text>
      {action && (
        <Pressable
          onPress={action.onPress}
          style={({ pressed }) => [empty.btn, pressed && { opacity: 0.7 }]}
        >
          <Text style={empty.btnText}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const empty = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
    gap: 12,
  },
  wrapperWeb: { paddingVertical: 120 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F4F4F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: { fontSize: 30 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  btn: {
    marginTop: 16,
    backgroundColor: C.text,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.accentText,
    letterSpacing: 0.5,
  },
});

// ════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function FavoritesScreen() {
  const router = useRouter();
  const { isWeb, isWide } = useBreakpoint();
  const { user, loading: authLoading } = useAuth();
  const { favorites, loading: favLoading, removeFavorite, refresh } = useFavorites(
    user?.id ?? null,
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  useEffect(() => {
    if (!favorites.length) { setProducts([]); return; }

    (async () => {
      setProductsLoading(true);
      const { data, error } = await supabase
        .from('product')
        .select('*')
        .in('id', favorites);

      if (!error && data) {
        const ordered = favorites
          .map((id) => (data as Product[]).find((p) => p.id === id))
          .filter((p): p is Product => !!p);
        setProducts(ordered);
      }
      setProductsLoading(false);
    })();
  }, [favorites]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (authLoading || favLoading || productsLoading) {
    return (
      <SafeAreaView style={sc.center}>
        {isWeb && <WebNavbar activePath="favorites" />}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={C.text} />
          <Text style={{ color: C.muted, fontSize: 14 }}>Chargement…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Non connecté ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <SafeAreaView style={sc.root}>
        {isWeb ? (
          <WebNavbar activePath="favorites" />
        ) : (
          <MobileHeader onCartPress={() => {}} />
        )}
        <EmptyState
          icon="♡"
          title="Vos favoris vous attendent"
          subtitle="Connectez-vous pour retrouver vos articles préférés et ne rien manquer."
          action={{ label: 'Se connecter', onPress: () => router.push('/login') }}
        />
      </SafeAreaView>
    );
  }

  // ── Aucun favori ──────────────────────────────────────────────────────────
  if (!favorites.length) {
    return (
      <SafeAreaView style={sc.root}>
        {isWeb ? (
          <WebNavbar activePath="favorites" />
        ) : (
          <MobileHeader onCartPress={() => {}} />
        )}
        <EmptyState
          icon="♡"
          title="Aucun favori pour l'instant"
          subtitle="Explorez notre collection et ajoutez vos coups de cœur ici."
          action={{ label: 'Découvrir la collection', onPress: () => router.push('/(tabs)') }}
        />
      </SafeAreaView>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // RENDU PRINCIPAL
  // ════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={sc.root}>

      {/* ── Navbar ── */}
      {isWeb ? (
        <WebNavbar activePath="favorites" />
      ) : (
        <MobileHeader onCartPress={() => {}} />
      )}

      {/* ── Contenu ── */}
      {isWeb ? (
        // ─── WEB : liste colonne centée ───────────────────────────────────
        <ScrollView
          contentContainerStyle={[sc.webScroll, { maxWidth: isWide ? 960 : 760 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* En-tête de page */}
          <View style={sc.pageHeader}>
            <View>
              <Text style={sc.pageTitle}>Mes favoris</Text>
              <Text style={sc.pageSub}>
                {products.length} article{products.length > 1 ? 's' : ''} sauvegardé
                {products.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Cartes */}
          {products.map((item) => (
            <WebFavoriteCard
              key={item.id}
              product={item}
              onRemove={() => removeFavorite(item.id)}
              onPress={() => router.push(`/(tabs)/product/${item.id}`)}
            />
          ))}

          {/* Footer */}
          <View style={sc.footer}>
            <Text style={sc.footerText}>
              © {new Date().getFullYear()} Leico — Tous droits réservés
            </Text>
          </View>
        </ScrollView>
      ) : (
        // ─── MOBILE : FlatList ────────────────────────────────────────────
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={mob.listHeader}>
              <Text style={mob.listCount}>
                {products.length} article{products.length > 1 ? 's' : ''}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <MobileFavoriteCard
              product={item}
              onRemove={() => removeFavorite(item.id)}
              onPress={() => router.push(`/(tabs)/product/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles globaux ───────────────────────────────────────────────────────────
const sc = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg },
  webScroll: {
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 48,
    paddingTop: 48,
    paddingBottom: 64,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -1,
  },
  pageSub: {
    fontSize: 14,
    color: C.muted,
    marginTop: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 48,
    paddingTop: 24,
    alignItems: 'center',
  },
  footerText: { fontSize: 12, color: C.muted, letterSpacing: 0.5 },
});

const mob = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
  },
  listHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listCount: {
    fontSize: 13,
    color: C.muted,
    fontWeight: '500',
  },
});