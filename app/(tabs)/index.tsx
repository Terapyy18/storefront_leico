import { useProducts, type Product } from '@/hooks/useProducts';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, styles } from './style.index';

// ─── IDs codés en dur pour les meilleures ventes ─────────────────────────────
const BEST_SELLER_IDS = ['REMPLACE_PAR_ID_1', 'REMPLACE_PAR_ID_2'];

// ─── Hero carousel auto + flèches ────────────────────────────────────────────

function HeroCarousel({ products }: { products: Product[] }) {
  const router   = useRouter();
  const { width } = useWindowDimensions();
  const heroHeight = width < 600 ? 280 : 420;

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef  = useRef<ScrollView>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // Défile vers un index donné
  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(index, products.length - 1));
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
    setActiveIndex(clamped);
  }

  // Auto-play : avance toutes les 3 secondes, boucle sur le premier
  function startAutoPlay() {
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = prev + 1 >= products.length ? 0 : prev + 1;
        scrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 3000);
  }

  function stopAutoPlay() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  useEffect(() => {
    if (products.length > 1) startAutoPlay();
    return () => stopAutoPlay();
  }, [products.length, width]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx !== activeIndex) setActiveIndex(idx);
  }

  // Quand l'utilisateur touche le carousel, pause l'autoplay puis reprend
  function onTouchStart() {
    stopAutoPlay();
  }
  function onTouchEnd() {
    if (products.length > 1) startAutoPlay();
  }

  return (
    <View>
      <View style={{ position: 'relative' }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onMomentumScrollEnd={onScroll}
        >
          {products.map((item) => (
            <View key={item.id} style={{ width, height: heroHeight }}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={{ width, height: heroHeight }}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.heroImagePlaceholder, { width, height: heroHeight }]}>
                  <Text style={styles.heroImagePlaceholderText}>🧥</Text>
                </View>
              )}

              {/* Overlay infos */}
              <View style={styles.heroOverlay}>
                {item.category ? (
                  <View style={styles.heroCategoryBadge}>
                    <Text style={styles.heroCategoryText}>{item.category}</Text>
                  </View>
                ) : null}
                <Text style={styles.heroName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.heroPrice}>{item.price.toFixed(2)} €</Text>
              </View>

              {/* Bouton voir */}
              <Pressable
                style={styles.heroBtn}
                onPress={() => router.push(`/(tabs)/product/${item.id}`)}
              >
                <Text style={styles.heroBtnText}>Voir le produit</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        {/* Flèche gauche */}
        {activeIndex > 0 && (
          <Pressable
            style={[styles.arrowBtn, styles.arrowLeft]}
            onPress={() => { stopAutoPlay(); goTo(activeIndex - 1); }}
          >
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>
        )}

        {/* Flèche droite */}
        {activeIndex < products.length - 1 && (
          <Pressable
            style={[styles.arrowBtn, styles.arrowRight]}
            onPress={() => { stopAutoPlay(); goTo(activeIndex + 1); }}
          >
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        )}
      </View>

      {/* Dots */}
      {products.length > 1 && (
        <View style={styles.dotsRow}>
          {products.map((_, i) => (
            <Pressable key={i} onPress={() => { stopAutoPlay(); goTo(i); }}>
              <View style={[styles.dot, i === activeIndex && styles.dotActive]} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Card meilleure vente ─────────────────────────────────────────────────────

function BestSellerCard({ product }: { product: Product }) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.bestSellerCard}
      onPress={() => router.push(`/(tabs)/product/${product.id}`)}
    >
      {product.image_url ? (
        <Image
          source={{ uri: product.image_url }}
          style={styles.bestSellerImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.bestSellerImagePlaceholder}>
          <Text style={styles.bestSellerImagePlaceholderText}>🧥</Text>
        </View>
      )}
      <View style={styles.bestSellerBody}>
        <View>
          <View style={styles.bestSellerBadge}>
            <Text style={styles.bestSellerBadgeText}>⭐ Meilleure vente</Text>
          </View>
          <Text style={styles.bestSellerName} numberOfLines={2}>
            {product.name}
          </Text>
          {product.description ? (
            <Text style={styles.bestSellerDescription} numberOfLines={3}>
              {product.description}
            </Text>
          ) : null}
        </View>
        <View style={styles.bestSellerFooter}>
          <Text style={styles.bestSellerPrice}>
            {product.price.toFixed(2)} €
          </Text>
          <View style={styles.bestSellerBtn}>
            <Text style={styles.bestSellerBtnText}>Voir</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { products, loading, error } = useProducts();

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Chargement des produits…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorTitle}>Impossible de charger les produits</Text>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  // Un produit par catégorie pour le hero carousel
  const heroProducts = Object.values(
    products.reduce<Record<string, Product>>((acc, p) => {
      const cat = p.category ?? 'Autre';
      if (!acc[cat]) acc[cat] = p;
      return acc;
    }, {})
  );

  // Meilleures ventes
  const bestSellers = BEST_SELLER_IDS
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const bestSellersToShow = bestSellers.length > 0
    ? bestSellers
    : products.slice(0, 2);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Leico</Text>
            <Text style={styles.headerSub}>Découvrez notre collection</Text>
          </View>
          <View style={styles.headerLogo}>
            <Text style={styles.headerLogoText}>L</Text>
          </View>
        </View>

        {/* Hero carousel */}
        {heroProducts.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Aucun produit disponible.</Text>
          </View>
        ) : (
          <HeroCarousel products={heroProducts} />
        )}

        {/* Meilleures ventes */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Meilleures ventes</Text>
        </View>

        {bestSellersToShow.map((product) => (
          <BestSellerCard key={product.id} product={product} />
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}