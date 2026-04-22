import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import type { Product } from '@/hooks/useProducts';
import { supabase } from '@/services/supabaseClient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, styles } from './style.favorites';

// ─── Card favori ──────────────────────────────────────────────────────────────

function FavoriteCard({
  product,
  onRemove,
}: {
  product: Product;
  onRemove: () => void;
}) {
  return (
    <View style={styles.card}>
      {product.image_url ? (
        <Image
          source={{ uri: product.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>🧥</Text>
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.infoTop}>
          {product.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          ) : null}
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          {product.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {product.description}
            </Text>
          ) : null}
        </View>

        <View style={styles.infoBottom}>
          <Text style={styles.price}>{product.price.toFixed(2)} €</Text>
          <Pressable style={styles.removeBtn} onPress={onRemove}>
            <Text style={styles.removeBtnText}>♥ Retirer</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function FavoritesScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { favorites, loading: favLoading, removeFavorite, refresh } = useFavorites(user?.id ?? null);

  const [products, setProducts]               = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Re-fetch favoris à chaque focus de l'onglet
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Fetch les infos complètes des produits favoris quand la liste change
  useEffect(() => {
    if (!favorites.length) {
      setProducts([]);
      return;
    }

    const fetchFavoriteProducts = async () => {
      setProductsLoading(true);

      const { data, error } = await supabase
        .from('product')
        .select('*')
        .in('id', favorites);

      if (error) {
        console.error('[FavoritesScreen] Erreur fetch produits favoris :', error.message);
      } else {
        // Conserver l'ordre des favoris
        const ordered = favorites
          .map((id) => (data as Product[]).find((p) => p.id === id))
          .filter((p): p is Product => !!p);
        setProducts(ordered);
      }

      setProductsLoading(false);
    };

    fetchFavoriteProducts();
  }, [favorites]);

  // ── Auth loading ─────────────────────────────────────────────────
  if (authLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </SafeAreaView>
    );
  }

  // ── Non connecté ─────────────────────────────────────────────────
  if (!user) {
    return (
      <SafeAreaView style={styles.centered}>
        <View style={styles.stateCard}>
          <View style={styles.stateIcon}>
            <Text style={styles.stateIconText}>♡</Text>
          </View>
          <Text style={styles.stateTitle}>Vos favoris vous attendent</Text>
          <Text style={styles.stateSubtitle}>
            Connectez-vous pour retrouver vos articles préférés et ne rien manquer.
          </Text>
          <Pressable style={styles.stateBtn} onPress={() => router.push('/login')}>
            <Text style={styles.stateBtnText}>Se connecter</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Chargement des favoris ────────────────────────────────────────
  if (favLoading || productsLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </SafeAreaView>
    );
  }

  // ── Aucun favori ──────────────────────────────────────────────────
  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.centered}>
        <View style={styles.stateCard}>
          <View style={styles.stateIcon}>
            <Text style={styles.stateIconText}>♡</Text>
          </View>
          <Text style={styles.stateTitle}>Aucun favori pour l'instant</Text>
          <Text style={styles.stateSubtitle}>
            Explorez notre collection et ajoutez vos coups de cœur ici.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Liste des favoris ─────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes favoris</Text>
        <Text style={styles.headerSub}>{products.length} article{products.length > 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <FavoriteCard
            product={item}
            onRemove={() => removeFavorite(item.id)}
          />
        )}
      />
    </SafeAreaView>
  );
}