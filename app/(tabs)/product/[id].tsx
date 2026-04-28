import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import type { Product } from '@/hooks/useProducts';
import { supabase } from '@/services/supabaseClient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, styles } from './_style.product';

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
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
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
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProduct(productData as Product);

      const { data: variantData, error: variantError } = await supabase
        .from('product_variant')
        .select('*')
        .eq('product_id', id);

      if (!variantError && variantData) {
        const sortedVariants = (variantData as ProductVariant[]).sort(
          (a, b) => a.size?.localeCompare(b.size || '') || 0,
        );
        setVariants(sortedVariants);
        const available = sortedVariants.find((v) => v.stock > 0);
        if (available) {
          setSelectedVariantId(available.id);
        } else if (sortedVariants.length > 0) {
          setSelectedVariantId(sortedVariants[0].id);
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (notFound || !product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundText}>Produit introuvable</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>← Retour</Text>
        </Pressable>
      </View>
    );
  }

  const favorited = isFavorited(product.id);

  const handleFavoritePress = () => {
    if (!user) {
      if (Platform.OS === 'web') {
        window.alert('Connectez-vous pour ajouter aux favoris.');
      } else {
        Alert.alert('Connexion requise', 'Connectez-vous pour ajouter aux favoris.');
      }
      return;
    }
    if (favorited) {
      removeFavorite(product.id);
    } else {
      addFavorite(product.id);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      if (Platform.OS === 'web') {
        const ok = window.confirm(
          'Connexion requise. Voulez-vous vous connecter pour ajouter au panier ?',
        );
        if (ok) router.push('/(auth)/login');
      } else {
        Alert.alert('Connexion requise', 'Connectez-vous pour ajouter au panier.', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Connexion', onPress: () => router.push('/(auth)/login') },
        ]);
      }
      return;
    }
    const variant = variants.find((v) => v.id === selectedVariantId) || variants[0];
    if (!variant || variant.stock <= 0) {
      Alert.alert('Indisponible', 'Ce produit est épuisé dans cette taille.');
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
    Alert.alert('Succès', 'Ajouté au panier !');
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Container */}
        <View style={styles.imageContainer}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={64} color={COLORS.muted} />
            </View>
          )}

          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {product.category && <Text style={styles.categoryText}>{product.category}</Text>}

          <View style={styles.titleRow}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPrice}>{product.price.toFixed(2)} €</Text>
          </View>

          {/* Variants */}
          {variants.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Taille</Text>
              <View style={styles.variantsGrid}>
                {variants.map((v) => {
                  const outOfStock = v.stock === 0;
                  const selected = v.id === selectedVariantId;
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => {
                        if (!outOfStock) setSelectedVariantId(v.id);
                      }}
                      style={[
                        styles.variantChip,
                        selected && styles.variantChipSelected,
                        outOfStock && styles.variantChipOutOfStock,
                      ]}
                    >
                      <Text
                        style={[styles.variantChipText, selected && styles.variantChipTextSelected]}
                      >
                        {v.size || v.color || 'Unique'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Quantity */}
          <Text style={styles.sectionTitle}>Quantité</Text>
          <View style={styles.quantityRow}>
            <Pressable
              style={styles.quantityBtn}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Ionicons name="remove" size={20} color={COLORS.primary} />
            </Pressable>
            <Text style={styles.quantityValue}>{quantity}</Text>
            <Pressable style={styles.quantityBtn} onPress={() => setQuantity((q) => q + 1)}>
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </Pressable>
          </View>

          {/* Description */}
          {product.description && (
            <View>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.footer}>
        <Pressable style={styles.btnFav} onPress={handleFavoritePress}>
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={26}
            color={favorited ? COLORS.error : COLORS.primary}
          />
        </Pressable>

        <Pressable style={styles.btnCart} onPress={handleAddToCart}>
          <Text style={styles.btnCartText}>Ajouter au panier</Text>
        </Pressable>
      </View>
    </View>
  );
}
