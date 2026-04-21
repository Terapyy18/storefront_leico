import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabaseClient';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import type { Product } from '@/hooks/useProducts';

type ProductVariant = {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  stock: number;
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isFavorited, addFavorite, removeFavorite } = useFavorites(user?.id ?? null);

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);

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

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (notFound || !product) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Product not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text>← Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const favorited = isFavorited(product.id);

  const handleFavoritePress = () => {
    if (!user) {
      Alert.alert('Sign in', 'Please sign in to add favorites');
      return;
    }
    favorited ? removeFavorite(product.id) : addFavorite(product.id);
  };

  const handleAddToCart = () => {
    const variant = variants[0];
    if (!variant) {
      Alert.alert('Unavailable', 'No variants available for this product.');
      return;
    }
    addItem({
      variant_id: variant.id,
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      quantity,
      size: variant.size ?? undefined,
      color: variant.color ?? undefined,
    });
    Alert.alert('Added to cart!');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {product.image_url ? (
        <Image
          source={{ uri: product.image_url }}
          style={{ width: '100%', height: 220 }}
          resizeMode="cover"
        />
      ) : null}

      <Text>{product.name}</Text>
      <Text>${product.price.toFixed(2)}</Text>
      {product.description ? <Text>{product.description}</Text> : null}

      {variants.length > 0 ? (
        <View>
          <Text>Variants</Text>
          {variants.map((v) => (
            <View key={v.id} style={{ flexDirection: 'row', gap: 8 }}>
              {v.size  ? <Text>Size: {v.size}</Text>  : null}
              {v.color ? <Text>Color: {v.color}</Text> : null}
              <Text>{v.stock > 0 ? `Stock: ${v.stock}` : 'Out of stock'}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Pressable onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
          <Text>−</Text>
        </Pressable>
        <Text>{quantity}</Text>
        <Pressable onPress={() => setQuantity((q) => q + 1)}>
          <Text>+</Text>
        </Pressable>
      </View>

      <Pressable onPress={handleAddToCart}>
        <Text>Add to Cart</Text>
      </Pressable>

      <Pressable onPress={handleFavoritePress}>
        <Text>{favorited ? '♥ Favorited' : '♡ Add to Favorites'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}
