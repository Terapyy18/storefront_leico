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
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, styles } from './style.product';

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
  const { width } = useWindowDimensions();
  const isWide = width >= 640;

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

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </SafeAreaView>
    );
  }

  // ── Not found ────────────────────────────────────────────────────
  if (notFound || !product) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.notFoundText}>Produit introuvable</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>← Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const favorited = isFavorited(product.id);

  const handleFavoritePress = () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour ajouter aux favoris.');
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
      Alert.alert(
        'Sign in required',
        'Please sign in to add items to your cart.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }
    const variant = variants[0];
    if (!variant) {
      Alert.alert('Indisponible', 'Aucune variante disponible pour ce produit.');
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
    Alert.alert('Ajouté au panier !');
  };

  // ── Taille des panneaux selon la largeur ─────────────────────────
  const imagePaneWidth  = isWide ? width * 0.48 : width;
  const imagePaneHeight = isWide ? '100%'        : 300;

  // ── Rendu ────────────────────────────────────────────────────────
  const InfoPanel = (
    <View style={[styles.infoPane, isWide ? { flex: 1 } : {}]}>
      <ScrollView
        contentContainerStyle={styles.infoScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>

          {/* Catégorie + nom + prix */}
          {product.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          ) : null}

          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>{product.price.toFixed(2)} €</Text>

          <View style={styles.divider} />

          {/* Description */}
          {product.description ? (
            <View>
              <Text style={styles.descriptionLabel}>Description</Text>
              <Text style={styles.descriptionText}>{product.description}</Text>
            </View>
          ) : null}

          {/* Variantes / tailles */}
          {variants.length > 0 ? (
            <View>
              <Text style={styles.variantsLabel}>Tailles & couleurs</Text>
              <View style={styles.variantsGrid}>
                {variants.map((v) => {
                  const outOfStock = v.stock === 0;
                  return (
                    <View
                      key={v.id}
                      style={[
                        styles.variantChip,
                        outOfStock && styles.variantChipOutOfStock,
                      ]}
                    >
                      {v.size ? (
                        <Text
                          style={[
                            styles.variantChipText,
                            outOfStock && styles.variantChipTextOutOfStock,
                          ]}
                        >
                          {v.size}
                        </Text>
                      ) : null}
                      {v.color ? (
                        <Text style={styles.variantColor}>{v.color}</Text>
                      ) : null}
                      <Text style={styles.variantStock}>
                        {outOfStock ? 'Épuisé' : `Stock : ${v.stock}`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.divider} />

          {/* Quantité */}
          <View>
            <Text style={styles.quantityLabel}>Quantité</Text>
            <View style={styles.quantityRow}>
              <Pressable
                style={styles.quantityBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Text style={styles.quantityBtnText}>−</Text>
              </Pressable>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <Pressable
                style={styles.quantityBtn}
                onPress={() => setQuantity((q) => q + 1)}
              >
                <Text style={styles.quantityBtnText}>+</Text>
              </Pressable>
            </View>
          </View>

          {/* Boutons */}
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.btnCart,
                pressed && styles.btnCartPressed,
              ]}
              onPress={handleAddToCart}
            >
              <Text style={styles.btnCartText}>Ajouter au panier</Text>
            </Pressable>
            <Pressable
              style={[styles.btnFav, favorited && styles.btnFavActive]}
              onPress={handleFavoritePress}
            >
              <Text style={styles.btnFavText}>{favorited ? '♥' : '♡'}</Text>
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </View>
  );

  if (isWide) {
    // ── Layout large : image gauche, infos droite ──────────────────
    return (
      <SafeAreaView style={[styles.root, styles.row]}>

        {/* Panneau image */}
        <View style={[styles.imagePane, { width: imagePaneWidth }]}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>🧥</Text>
            </View>
          )}
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>←</Text>
          </Pressable>
        </View>

        {/* Panneau infos */}
        {InfoPanel}

      </SafeAreaView>
    );
  }

  // ── Layout mobile : image haut, infos bas ──────────────────────────
  return (
    <SafeAreaView style={styles.root}>

      {/* Image */}
      <View style={[styles.imagePane, { width: imagePaneWidth, height: imagePaneHeight as number }]}>
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>🧥</Text>
          </View>
        )}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
      </View>

      {/* Infos */}
      {InfoPanel}

    </SafeAreaView>
  );
}