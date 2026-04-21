import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import type { Product } from '@/hooks/useProducts';

// ─── Favorite Product Card ────────────────────────────────────────────────────

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
      ) : null}
      <View style={styles.info}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        <Pressable style={styles.removeButton} onPress={onRemove}>
          <Text style={styles.removeText}>Remove from Favorites</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FavoritesScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { favorites, loading: favLoading, removeFavorite } = useFavorites(user?.id ?? null);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

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

  // ── Auth loading ────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  // ── Non connecté ────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.message}>Sign in to view favorites</Text>
        <Pressable style={styles.signInButton} onPress={() => router.push('/login')}>
          <Text style={styles.signInText}>Sign In</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── Chargement des favoris ──────────────────────────────────────────────────

  if (favLoading || productsLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  // ── Aucun favori ────────────────────────────────────────────────────────────

  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.message}>No favorites yet</Text>
      </SafeAreaView>
    );
  }

  // ── Liste des favoris ───────────────────────────────────────────────────────

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <FavoriteCard
          product={item}
          onRemove={() => removeFavorite(item.id)}
        />
      )}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    fontSize: 15,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  signInButton: {
    backgroundColor: '#111',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  signInText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  image: {
    width: 100,
    height: 100,
  },
  info: {
    flex: 1,
    padding: 12,
    gap: 4,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d6a4f',
  },
  removeButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#c0392b',
    borderRadius: 4,
  },
  removeText: {
    fontSize: 12,
    color: '#c0392b',
    fontWeight: '500',
  },
});
