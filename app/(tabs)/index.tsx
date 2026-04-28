import { CartButton } from '@/components/CartButton';
import { CartModal } from '@/components/CartModal';
import ProductCard from '@/components/ProductCard';
import { useProductsByCategory } from '@/hooks/useProductsByCategory';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg: '#FAFAF8',
  surface: '#FFFFFF',
  text: '#111111',
  muted: '#888888',
  border: '#E8E8E4',
  accent: '#111111',
  accentText: '#FFFFFF',
  admin: '#C8360A',
};

// ─── Hook utilitaire ─────────────────────────────────────────────────────────
function useBreakpoint() {
  const { width } = useWindowDimensions();
  return {
    isWeb: width >= 768,
    isWide: width >= 1100,
    width,
  };
}

// ─── Vérifie si l'user est admin ─────────────────────────────────────────────
function useIsAdmin() {
  const { user } = useAuth();
  return (
    user?.app_metadata?.role === 'admin' ||
    user?.user_metadata?.role === 'admin' ||
    false
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CAROUSEL
// Prend un lot d'images aléatoires extraites des produits de la BDD
// ════════════════════════════════════════════════════════════════════════════
const CAROUSEL_HEIGHT = 480;
const CAROUSEL_INTERVAL = 4000;
const CAROUSEL_SAMPLE = 8; // nb d'images max dans le carousel

/** Extrait et mélange aléatoirement des images depuis toutes les sections */
function pickRandomImages(sections: any[], count: number): { url: string; name: string; id: string }[] {
  const all: { url: string; name: string; id: string }[] = [];

  for (const section of sections) {
    for (const product of section.data) {
      // Supporte image_url, images (tableau), ou image (string)
      const url =
        product.image_url ||
        (Array.isArray(product.images) && product.images[0]) ||
        product.image ||
        null;
      if (url) {
        all.push({ url, name: product.name, id: product.id });
      }
    }
  }

  // Fisher-Yates shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }

  return all.slice(0, count);
}

function ProductCarousel({ sections }: { sections: any[] }) {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const slides = useMemo(() => pickRandomImages(sections, CAROUSEL_SAMPLE), [sections]);

  const [current, setCurrent] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (index: number) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setCurrent(index);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    },
    [fadeAnim],
  );

  // Autoplay
  useEffect(() => {
    if (slides.length < 2) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % slides.length;
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]).start();
        return next;
      });
    }, CAROUSEL_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, fadeAnim]);

  if (slides.length === 0) return null;

  const slide = slides[current];

  const handlePrev = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    goTo((current - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    goTo((current + 1) % slides.length);
  };

  return (
    <View style={[carouselStyles.wrapper, { height: CAROUSEL_HEIGHT }]}>
      {/* Image avec fade */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <Image
          source={{ uri: slide.url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        {/* Gradient overlay (simulé avec une View semi-transparente) */}
        <View style={carouselStyles.overlay} />
      </Animated.View>

      {/* Texte slide */}
      <Animated.View style={[carouselStyles.caption, { opacity: fadeAnim }]}>
        <Text style={carouselStyles.captionLabel}>DÉCOUVRIR</Text>
        <Text style={carouselStyles.captionTitle} numberOfLines={2}>
          {slide.name}
        </Text>
        <Pressable
          onPress={() => router.push(`/(tabs)/product/${slide.id}`)}
          style={({ pressed }) => [carouselStyles.captionBtn, pressed && { opacity: 0.75 }]}
        >
          <Text style={carouselStyles.captionBtnText}>Voir le produit</Text>
        </Pressable>
      </Animated.View>

      {/* Flèche gauche */}
      <Pressable
        onPress={handlePrev}
        style={[carouselStyles.arrow, carouselStyles.arrowLeft]}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={22} color="#fff" />
      </Pressable>

      {/* Flèche droite */}
      <Pressable
        onPress={handleNext}
        style={[carouselStyles.arrow, carouselStyles.arrowRight]}
        hitSlop={12}
      >
        <Ionicons name="chevron-forward" size={22} color="#fff" />
      </Pressable>

      {/* Dots */}
      <View style={carouselStyles.dots}>
        {slides.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              goTo(i);
            }}
            style={[
              carouselStyles.dot,
              i === current && carouselStyles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const carouselStyles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: C.text,
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  caption: {
    position: 'absolute',
    bottom: 72,
    left: 64,
    maxWidth: 440,
    gap: 12,
  },
  captionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
  },
  captionTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  captionBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  captionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: { left: 20 },
  arrowRight: { right: 20 },
  dots: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.40)',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#FFFFFF',
  },
});

// ════════════════════════════════════════════════════════════════════════════
// NAVBAR WEB
// ════════════════════════════════════════════════════════════════════════════
function WebNavbar({
  sections,
  searchQuery,
  setSearchQuery,
  onCartPress,
}: {
  sections: any[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onCartPress: () => void;
}) {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const { isWide } = useBreakpoint();

  return (
    <View style={webNavStyles.wrapper}>
      <View style={[webNavStyles.inner, { maxWidth: isWide ? 1280 : 960 }]}>
        <Pressable onPress={() => router.push('/')} style={webNavStyles.logo}>
          <Text style={webNavStyles.logoText}>LEICO</Text>
        </Pressable>

        <View style={webNavStyles.links}>
          {sections.map((s) => (
            <Pressable
              key={s.category_id}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/category/[id]',
                  params: { id: s.category_id, name: s.category_name },
                })
              }
              style={({ pressed }) => [webNavStyles.link, pressed && { opacity: 0.5 }]}
            >
              <Text style={webNavStyles.linkText}>{s.category_name}</Text>
            </Pressable>
          ))}
        </View>

        <View style={webNavStyles.actions}>
          <View style={webNavStyles.searchBox}>
            <Ionicons name="search" size={16} color={C.muted} />
            <TextInput
              style={webNavStyles.searchInput}
              placeholder="Rechercher…"
              placeholderTextColor={C.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={webNavStyles.sep} />

          <Pressable
            onPress={() => router.push('/(tabs)/favorites')}
            style={({ pressed }) => [webNavStyles.iconBtn, pressed && { opacity: 0.5 }]}
            accessibilityLabel="Favoris"
          >
            <Ionicons name="heart-outline" size={20} color={C.text} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/compte')}
            style={({ pressed }) => [webNavStyles.iconBtn, pressed && { opacity: 0.5 }]}
            accessibilityLabel="Mon compte"
          >
            <Ionicons name="person-outline" size={20} color={C.text} />
          </Pressable>

          {isAdmin && (
            <Pressable
              onPress={() => router.push('/admin')}
              style={({ pressed }) => [
                webNavStyles.adminBtn,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Ionicons name="shield-checkmark" size={14} color={C.accentText} />
              <Text style={webNavStyles.adminBtnText}>Admin</Text>
            </Pressable>
          )}

          <CartButton onPress={onCartPress} />
        </View>
      </View>
    </View>
  );
}

const webNavStyles = StyleSheet.create({
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
    gap: 24,
  },
  logo: { marginRight: 8 },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 4,
    color: C.text,
  },
  links: { flex: 1, flexDirection: 'row', gap: 28 },
  link: { paddingVertical: 4 },
  linkText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
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
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  sep: { width: 1, height: 20, backgroundColor: C.border, marginHorizontal: 4 },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.admin,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  adminBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.accentText,
    letterSpacing: 0.5,
  },
});

// ════════════════════════════════════════════════════════════════════════════
// NAVBAR MOBILE
// ════════════════════════════════════════════════════════════════════════════
function MobileNavbar({
  onMenuPress,
  onCartPress,
}: {
  onMenuPress: () => void;
  onCartPress: () => void;
}) {
  const router = useRouter();
  const isAdmin = useIsAdmin();

  return (
    <View style={mobileNavStyles.wrapper}>
      <Pressable onPress={onMenuPress} hitSlop={8}>
        <Ionicons name="menu" size={26} color={C.text} />
      </Pressable>

      <Text style={mobileNavStyles.logo}>LEICO</Text>

      <View style={mobileNavStyles.actions}>
        {isAdmin && (
          <Pressable
            onPress={() => router.push('/admin')}
            style={({ pressed }) => [
              mobileNavStyles.adminIcon,
              pressed && { opacity: 0.6 },
            ]}
            hitSlop={8}
          >
            <Ionicons name="shield-checkmark" size={20} color={C.admin} />
          </Pressable>
        )}
        <CartButton onPress={onCartPress} />
      </View>
    </View>
  );
}

const mobileNavStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  logo: { fontSize: 18, fontWeight: '800', letterSpacing: 4, color: C.text },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  adminIcon: { padding: 2 },
});

// ════════════════════════════════════════════════════════════════════════════
// HERO (web uniquement) — plus compact car remplacé par le carousel
// ════════════════════════════════════════════════════════════════════════════

const heroStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: C.text,
    paddingVertical: 72,
    paddingHorizontal: 48,
    alignItems: 'flex-start',
  },
  content: { maxWidth: 560 },
  eyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  title: {
    fontSize: 56,
    fontWeight: '800',
    color: C.accentText,
    lineHeight: 60,
    letterSpacing: -1,
    marginBottom: 20,
  },
  sub: { fontSize: 16, color: '#AAAAAA', lineHeight: 24 },
});

// ════════════════════════════════════════════════════════════════════════════
// SECTION PRODUITS WEB
// ════════════════════════════════════════════════════════════════════════════
function WebSection({
  section,
  onProductPress,
  isWide,
}: {
  section: any;
  onProductPress: (id: string) => void;
  isWide: boolean;
}) {
  const router = useRouter();
  const cols = isWide ? 4 : 3;
  const preview = section.data.slice(0, cols);

  return (
    <View style={webSectionStyles.wrapper}>
      <View style={webSectionStyles.header}>
        <Text style={webSectionStyles.title}>{section.category_name}</Text>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/(tabs)/category/[id]',
              params: { id: section.category_id, name: section.category_name },
            })
          }
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <Text style={webSectionStyles.viewAll}>Voir tout →</Text>
        </Pressable>
      </View>

      <View style={[webSectionStyles.grid, { gap: 16 }]}>
        {preview.map((product: any) => (
          <View
            key={product.id}
            style={{ flex: 1, minWidth: 180, maxWidth: `${100 / cols}%` as any }}
          >
            <ProductCard product={product} onPress={onProductPress} />
          </View>
        ))}
      </View>
    </View>
  );
}

const webSectionStyles = StyleSheet.create({
  wrapper: { marginBottom: 56, paddingHorizontal: 48 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  viewAll: { fontSize: 13, fontWeight: '500', color: C.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});

// ════════════════════════════════════════════════════════════════════════════
// SECTION PRODUITS MOBILE
// ════════════════════════════════════════════════════════════════════════════
function MobileSection({
  section,
  onProductPress,
}: {
  section: any;
  onProductPress: (id: string) => void;
}) {
  const router = useRouter();
  return (
    <View style={{ marginBottom: 32 }}>
      <View style={mobileSectionStyles.header}>
        <Text style={mobileSectionStyles.title}>{section.category_name}</Text>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/(tabs)/category/[id]',
              params: { id: section.category_id, name: section.category_name },
            })
          }
        >
          <Text style={mobileSectionStyles.viewAll}>Voir tout →</Text>
        </Pressable>
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        data={section.data}
        keyExtractor={(p: any) => p.id}
        renderItem={({ item: product }) => (
          <View style={{ width: 155 }}>
            <ProductCard product={product} onPress={onProductPress} />
          </View>
        )}
      />
    </View>
  );
}

const mobileSectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: '700', color: C.text },
  viewAll: { fontSize: 13, color: C.muted },
});

// ════════════════════════════════════════════════════════════════════════════
// MENU MOBILE (drawer)
// ════════════════════════════════════════════════════════════════════════════
function MobileDrawer({
  visible,
  sections,
  onClose,
}: {
  visible: boolean;
  sections: any[];
  onClose: () => void;
}) {
  const router = useRouter();
  const isAdmin = useIsAdmin();

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={drawerStyles.overlay}>
        <View style={drawerStyles.drawer}>
          <Pressable onPress={onClose} style={drawerStyles.closeBtn}>
            <Ionicons name="close" size={26} color={C.text} />
          </Pressable>

          <Text style={drawerStyles.brand}>LEICO</Text>

          {isAdmin && (
            <Pressable
              onPress={() => { onClose(); router.push('/admin'); }}
              style={drawerStyles.adminRow}
            >
              <Ionicons name="shield-checkmark" size={18} color={C.admin} />
              <Text style={drawerStyles.adminText}>Administration</Text>
            </Pressable>
          )}

          <View style={drawerStyles.divider} />
          <Text style={drawerStyles.label}>Catégories</Text>

          {sections.map((s) => (
            <Pressable
              key={s.category_id}
              onPress={() => {
                onClose();
                router.push({
                  pathname: '/(tabs)/category/[id]',
                  params: { id: s.category_id, name: s.category_name },
                });
              }}
              style={drawerStyles.row}
            >
              <Text style={drawerStyles.rowText}>{s.category_name}</Text>
              <Ionicons name="chevron-forward" size={16} color={C.muted} />
            </Pressable>
          ))}
        </View>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </View>
    </Modal>
  );
}

const drawerStyles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.45)' },
  drawer: {
    width: '78%',
    maxWidth: 320,
    backgroundColor: C.surface,
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  closeBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  brand: { fontSize: 22, fontWeight: '800', letterSpacing: 4, color: C.text, marginBottom: 28 },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#FFF0EC',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  adminText: { fontSize: 15, fontWeight: '700', color: C.admin },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 16 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: C.muted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rowText: { fontSize: 16, color: C.text, fontWeight: '500' },
});

// ════════════════════════════════════════════════════════════════════════════
// HOME SCREEN
// ════════════════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const router = useRouter();
  const { sections, loading, error } = useProductsByCategory();
  const { isWeb, isWide } = useBreakpoint();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections
      .map((s) => ({
        ...s,
        data: s.data.filter(
          (p: any) =>
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q)),
        ),
      }))
      .filter((s) => s.data.length > 0);
  }, [sections, searchQuery]);

  const handlePress = useCallback(
    (id: string) => router.push(`/(tabs)/product/${id}`),
    [router],
  );

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={C.text} />
        <Text style={{ marginTop: 12, color: C.muted }}>Chargement…</Text>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={C.admin} />
        <Text style={{ marginTop: 12, color: C.text, fontWeight: '600' }}>
          Erreur de chargement
        </Text>
        <Text style={{ marginTop: 4, color: C.muted, fontSize: 13 }}>{error}</Text>
      </SafeAreaView>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      {/* ── Navbar ── */}
      {isWeb ? (
        <WebNavbar
          sections={sections}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onCartPress={() => setCartModalVisible(true)}
        />
      ) : (
        <MobileNavbar
          onMenuPress={() => setDrawerVisible(true)}
          onCartPress={() => setCartModalVisible(true)}
        />
      )}

      {/* ── Contenu scrollable ── */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isWeb && { paddingTop: 0 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Barre de recherche mobile */}
        {!isWeb && (
          <View style={styles.mobileSearch}>
            <Ionicons name="search" size={18} color={C.muted} />
            <TextInput
              style={styles.mobileSearchInput}
              placeholder="Rechercher un produit…"
              placeholderTextColor={C.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={C.muted} />
              </Pressable>
            )}
          </View>
        )}

        {/* ── CAROUSEL (web + mobile, affiché avant le hero sur web) ── */}
        {sections.length > 0 && !searchQuery && (
          <ProductCarousel sections={sections} />
        )}

        {/* Hero (web uniquement, après le carousel) */}
        {isWeb && !searchQuery}

        {/* Sections produits */}
        <View style={isWeb ? { paddingTop: 48 } : { paddingTop: 16 }}>
          {filteredSections.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={40} color={C.muted} />
              <Text style={styles.emptyText}>Aucun produit trouvé</Text>
            </View>
          ) : (
            filteredSections.map((section) =>
              isWeb ? (
                <WebSection
                  key={section.category_id}
                  section={section}
                  onProductPress={handlePress}
                  isWide={isWide}
                />
              ) : (
                <MobileSection
                  key={section.category_id}
                  section={section}
                  onProductPress={handlePress}
                />
              ),
            )
          )}
        </View>

        {/* Footer web minimal */}
        {isWeb && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} Leico — Tous droits réservés
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Drawer mobile ── */}
      <MobileDrawer
        visible={drawerVisible}
        sections={sections}
        onClose={() => setDrawerVisible(false)}
      />

      {/* ── Panier ── */}
      <CartModal
        visible={cartModalVisible}
        onClose={() => setCartModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  scrollContent: { flexGrow: 1, paddingBottom: 32 },
  mobileSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: C.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  mobileSearchInput: { flex: 1, fontSize: 15, color: C.text },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: C.muted, fontSize: 15 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 32,
    paddingVertical: 24,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  footerText: { fontSize: 12, color: C.muted, letterSpacing: 0.5 },
});