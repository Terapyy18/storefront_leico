import ProductCard from '@/components/ProductCard';
import { C, WebNavbar } from '@/components/WebNavbar';
import { useProducts } from '@/hooks/useProducts';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Breakpoint ───────────────────────────────────────────────────────────────
function useBreakpoint() {
  const { width } = useWindowDimensions();
  return {
    isWeb: width >= 768,
    cols: width >= 1200 ? 4 : width >= 960 ? 3 : width >= 768 ? 2 : 2,
    width,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// HEADER MOBILE
// ════════════════════════════════════════════════════════════════════════════
function MobileHeader({ name }: { name: string }) {
  const router = useRouter();
  return (
    <View style={mob.header}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={mob.backBtn}>
        <Ionicons name="arrow-back" size={24} color={C.text} />
      </Pressable>
      <Text style={mob.title} numberOfLines={1}>
        {name}
      </Text>
      <View style={{ width: 32 }} />
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BARRE DE FILTRES / COMPTEUR (web)
// ════════════════════════════════════════════════════════════════════════════
function WebSubHeader({
  name,
  count,
  search,
  onSearchChange,
}: {
  name: string;
  count: number;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const router = useRouter();
  return (
    <View style={sub.wrapper}>
      {/* Fil d'ariane */}
      <View style={sub.breadcrumb}>
        <Pressable onPress={() => router.push('/(tabs)')}>
          <Text style={sub.link}>Accueil</Text>
        </Pressable>
        <Text style={sub.sep}>/</Text>
        <Text style={sub.current}>{name}</Text>
      </View>

      {/* Titre + compteur */}
      <View style={sub.titleRow}>
        <View>
          <Text style={sub.title}>{name}</Text>
          <Text style={sub.count}>
            {count} article{count > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Recherche dans la catégorie */}
        <View style={sub.searchBox}>
          <Ionicons name="search" size={15} color={C.muted} />
          <TextInput
            style={sub.searchInput}
            placeholder={`Rechercher dans ${name}…`}
            placeholderTextColor={C.muted}
            value={search}
            onChangeText={onSearchChange}
          />
          {search.length > 0 && (
            <Pressable onPress={() => onSearchChange('')}>
              <Ionicons name="close-circle" size={14} color={C.muted} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const sub = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 48,
    paddingTop: 28,
    paddingBottom: 20,
    backgroundColor: C.surface,
  },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  link: { fontSize: 13, color: C.muted, fontWeight: '500' },
  sep: { fontSize: 13, color: C.border },
  current: { fontSize: 13, color: C.text, fontWeight: '600' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.6,
  },
  count: { fontSize: 13, color: C.muted, marginTop: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.bg,
    minWidth: 260,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    outlineStyle: 'none',
  } as any,
});

// ════════════════════════════════════════════════════════════════════════════
// GRILLE WEB — layout adaptatif
// ════════════════════════════════════════════════════════════════════════════
function WebGrid({
  products,
  onPress,
  loading,
  hasMore,
  loadMore,
  cols,
}: {
  products: any[];
  onPress: (id: string) => void;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  cols: number;
}) {
  const gap = 20;

  return (
    <ScrollView
      contentContainerStyle={[grid.scroll, { paddingHorizontal: 48 }]}
      showsVerticalScrollIndicator={false}
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const nearBottom =
          layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;
        if (nearBottom && hasMore && !loading) loadMore();
      }}
      scrollEventThrottle={300}
    >
      <View style={[grid.row, { gap }]}>
        {products.map((product) => (
          <View
            key={product.id}
            style={{
              width: `${(100 - gap * (cols - 1)) / cols}%` as any,
              // On utilise un calcul approximatif pour la largeur
              flex: 1,
              minWidth: 180,
              maxWidth: `${100 / cols}%` as any,
            }}
          >
            <ProductCard product={product} onPress={onPress} />
          </View>
        ))}
      </View>

      {loading && (
        <View style={grid.loaderWrap}>
          <ActivityIndicator size="small" color={C.text} />
          <Text style={grid.loaderText}>Chargement…</Text>
        </View>
      )}

      {!hasMore && products.length > 0 && (
        <View style={grid.endWrap}>
          <View style={grid.endLine} />
          <Text style={grid.endText}>Fin du catalogue</Text>
          <View style={grid.endLine} />
        </View>
      )}

      {/* Footer */}
      <View style={grid.footer}>
        <Text style={grid.footerText}>
          © {new Date().getFullYear()} Leico — Tous droits réservés
        </Text>
      </View>
    </ScrollView>
  );
}

const grid = StyleSheet.create({
  scroll: { paddingTop: 32, paddingBottom: 64 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  loaderWrap: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  loaderText: { fontSize: 13, color: C.muted },
  endWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 40,
    paddingHorizontal: 16,
  },
  endLine: { flex: 1, height: 1, backgroundColor: C.border },
  endText: { fontSize: 12, color: C.muted, letterSpacing: 1, fontWeight: '600' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 24,
    alignItems: 'center',
  },
  footerText: { fontSize: 12, color: C.muted, letterSpacing: 0.5 },
});

// ════════════════════════════════════════════════════════════════════════════
// ÉTAT VIDE
// ════════════════════════════════════════════════════════════════════════════
function EmptyState({ isWeb }: { isWeb: boolean }) {
  return (
    <View style={[empty.wrapper, isWeb && empty.wrapperWeb]}>
      <View style={empty.iconWrap}>
        <Ionicons name="cube-outline" size={32} color={C.muted} />
      </View>
      <Text style={empty.title}>Aucun produit trouvé</Text>
      <Text style={empty.sub}>Essayez de modifier votre recherche.</Text>
    </View>
  );
}

const empty = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingTop: 60, gap: 10 },
  wrapperWeb: { paddingTop: 100 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F4F4F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: '700', color: C.text },
  sub: { fontSize: 14, color: C.muted },
});

// ════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function CategoryScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();
  const { isWeb, cols } = useBreakpoint();
  const [search, setSearch] = useState('');

  const { products, loading, error, hasMore, loadMore } = useProducts(id);

  const handlePress = useCallback(
    (productId: string) => router.push(`/(tabs)/product/${productId}`),
    [router],
  );

  const categoryName = name ?? 'Catégorie';

  // Filtrage local par recherche (web uniquement)
  const displayed = isWeb && search.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(search.toLowerCase())),
      )
    : products;

  // ── Loading initial ───────────────────────────────────────────────────────
  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={sc.center}>
        {isWeb && <WebNavbar />}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={C.text} />
          <Text style={{ color: C.muted, fontSize: 14 }}>Chargement de {categoryName}…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Erreur ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={sc.center}>
        {isWeb && <WebNavbar />}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Ionicons name="alert-circle-outline" size={40} color="#C8360A" />
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.text }}>
            Erreur de chargement
          </Text>
          <Text style={{ fontSize: 13, color: C.muted }}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── WEB ───────────────────────────────────────────────────────────────────
  if (isWeb) {
    return (
      <SafeAreaView style={sc.root}>
        <WebNavbar />
        <WebSubHeader
          name={categoryName}
          count={displayed.length}
          search={search}
          onSearchChange={setSearch}
        />
        {displayed.length === 0 && !loading ? (
          <EmptyState isWeb />
        ) : (
          <WebGrid
            products={displayed}
            onPress={handlePress}
            loading={loading}
            hasMore={hasMore}
            loadMore={loadMore}
            cols={cols}
          />
        )}
      </SafeAreaView>
    );
  }

  // ── MOBILE ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={sc.root}>
      <MobileHeader name={categoryName} />

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={mob.columnWrapper}
        contentContainerStyle={mob.listContent}
        renderItem={({ item }) => (
          <View style={mob.cardWrap}>
            <ProductCard product={item} onPress={handlePress} />
          </View>
        )}
        ListEmptyComponent={loading ? null : <EmptyState isWeb={false} />}
        onEndReached={() => hasMore && loadMore()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && products.length > 0 ? (
            <ActivityIndicator style={{ padding: 20 }} color={C.text} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const sc = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg },
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
  backBtn: { padding: 2 },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.3,
  },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 16 },
  listContent: { paddingVertical: 16, gap: 4 },
  cardWrap: { width: '48%', marginBottom: 16 },
});