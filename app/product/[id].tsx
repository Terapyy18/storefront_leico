import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '@/services/supabaseClient';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import type { Product } from '@/hooks/useProducts';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductVariant = {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  stock: number;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorited, addFavorite, removeFavorite } = useFavorites(user?.id ?? null);

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch produit
      const { data: productData, error: productError } = await supabase
        .from('product')
        .select('*')
        .eq('id', id)
        .single();

      if (productError || !productData) {
        console.error('[ProductDetail] Produit introuvable :', productError?.message);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProduct(productData as Product);

      // Fetch variantes
      const { data: variantData, error: variantError } = await supabase
        .from('product_variant')
        .select('*')
        .eq('product_id', id);

      if (variantError) {
        console.error('[ProductDetail] Erreur variantes :', variantError.message);
      } else {
        setVariants((variantData ?? []) as ProductVariant[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [id]);

  // ── États ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (notFound || !product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Product not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Go back</Text>
        </Pressable>
      </View>
    );
  }

  const favorited = isFavorited(product.id);

  const handleFavoritePress = () => {
    if (!user) {
      Alert.alert('Sign in', 'Please sign in to add favorites');
      return;
    }
    if (favorited) {
      removeFavorite(product.id);
    } else {
      addFavorite(product.id);
    }
  };

  // ── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Image */}
      {product.image_url ? (
        <Image
          source={{ uri: product.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : null}

      {/* Infos principales */}
      <View style={styles.section}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>

        {product.description ? (
          <Text style={styles.description}>{product.description}</Text>
        ) : null}
      </View>

      {/* Variantes */}
      {variants.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Variants</Text>
          {variants.map((v) => (
            <View key={v.id} style={styles.variantRow}>
              {v.size  ? <Text style={styles.variantTag}>Size: {v.size}</Text>  : null}
              {v.color ? <Text style={styles.variantTag}>Color: {v.color}</Text> : null}
              <Text style={[styles.variantTag, v.stock === 0 && styles.outOfStock]}>
                {v.stock > 0 ? `Stock: ${v.stock}` : 'Out of stock'}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.cartButton} onPress={() => {}}>
          <Text style={styles.cartButtonText}>Add to Cart</Text>
        </Pressable>

        <Pressable
          style={[styles.favButton, favorited && styles.favButtonActive]}
          onPress={handleFavoritePress}
        >
          <Text style={[styles.favButtonText, favorited && styles.favButtonTextActive]}>
            {favorited ? '♥ Favorited' : '♡ Add to Favorites'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
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
  notFound: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#111',
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  container: {
    paddingBottom: 40,
  },
  image: {
    width: '100%',
    height: 280,
  },
  section: {
    padding: 16,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d6a4f',
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  variantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  variantTag: {
    fontSize: 13,
    color: '#444',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  outOfStock: {
    color: '#c0392b',
    backgroundColor: '#fdecea',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  cartButton: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  favButton: {
    borderWidth: 1.5,
    borderColor: '#111',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  favButtonActive: {
    backgroundColor: '#fff0f0',
    borderColor: '#c0392b',
  },
  favButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  favButtonTextActive: {
    color: '#c0392b',
  },
});
