import { C, WebNavbar } from '@/components/WebNavbar';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useFavorites } from '@/hooks/useFavorites';
import type { Product } from '@/hooks/useProducts';
import { supabase } from '@/services/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────
type ProductVariant = {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  stock: number;
};

// ─── Breakpoint ───────────────────────────────────────────────────────────────
function useBreakpoint() {
  const { width } = useWindowDimensions();
  return { isWeb: width >= 768, isWide: width >= 1100, width };
}

// ════════════════════════════════════════════════════════════════════════════
// SÉLECTEUR DE TAILLE
// ════════════════════════════════════════════════════════════════════════════
function SizeSelector({
  variants,
  selectedVariantId,
  onSelect,
  isWeb,
}: {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onSelect: (id: string) => void;
  isWeb: boolean;
}) {
  if (!variants.length) return null;

  return (
    <View style={sz.wrapper}>
      <View style={sz.labelRow}>
        <Text style={sz.label}>Taille</Text>
        {selectedVariantId && (
          <Text style={sz.selected}>
            {variants.find((v) => v.id === selectedVariantId)?.size ?? ''}
          </Text>
        )}
      </View>
      <View style={sz.grid}>
        {variants.map((v) => {
          const outOfStock = v.stock === 0;
          const selected = v.id === selectedVariantId;
          return (
            <Pressable
              key={v.id}
              onPress={() => { if (!outOfStock) onSelect(v.id); }}
              style={({ pressed }) => [
                sz.chip,
                isWeb && sz.chipWeb,
                selected && sz.chipSelected,
                outOfStock && sz.chipOos,
                pressed && !outOfStock && { opacity: 0.7 },
              ]}
            >
              <Text style={[sz.chipText, selected && sz.chipTextSelected, outOfStock && sz.chipTextOos]}>
                {v.size || v.color || 'Unique'}
              </Text>
              {outOfStock && <View style={sz.strike} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const sz = StyleSheet.create({
  wrapper: { marginBottom: 24 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', color: C.text, letterSpacing: 0.8, textTransform: 'uppercase' },
  selected: { fontSize: 13, fontWeight: '600', color: C.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minWidth: 52,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: C.surface,
  },
  chipWeb: { minWidth: 56, height: 48 },
  chipSelected: { borderColor: C.text, backgroundColor: C.text },
  chipOos: { borderColor: C.border, backgroundColor: C.bg, opacity: 0.5 },
  chipText: { fontSize: 14, fontWeight: '600', color: C.text },
  chipTextSelected: { color: C.accentText },
  chipTextOos: { color: C.muted },
  strike: {
    position: 'absolute',
    left: 0, right: 0,
    top: '50%' as any,
    height: 1,
    backgroundColor: C.muted,
    transform: [{ rotate: '-20deg' }],
  },
});

// ════════════════════════════════════════════════════════════════════════════
// SÉLECTEUR DE QUANTITÉ
// ════════════════════════════════════════════════════════════════════════════
function QuantitySelector({
  value,
  onChange,
  isWeb,
}: {
  value: number;
  onChange: (v: number) => void;
  isWeb: boolean;
}) {
  return (
    <View style={qty.wrapper}>
      <Text style={qty.label}>Quantité</Text>
      <View style={[qty.row, isWeb && qty.rowWeb]}>
        <Pressable
          onPress={() => onChange(Math.max(1, value - 1))}
          style={({ pressed }) => [qty.btn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="remove" size={18} color={C.text} />
        </Pressable>
        <Text style={qty.value}>{value}</Text>
        <Pressable
          onPress={() => onChange(value + 1)}
          style={({ pressed }) => [qty.btn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="add" size={18} color={C.text} />
        </Pressable>
      </View>
    </View>
  );
}

const qty = StyleSheet.create({
  wrapper: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', color: C.text, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: C.surface,
  },
  rowWeb: {},
  btn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F6F4',
  },
  value: { width: 52, textAlign: 'center', fontSize: 16, fontWeight: '700', color: C.text },
});

// ════════════════════════════════════════════════════════════════════════════
// LAYOUT WEB — deux colonnes
// ════════════════════════════════════════════════════════════════════════════
function WebLayout({
  product,
  variants,
  selectedVariantId,
  setSelectedVariantId,
  quantity,
  setQuantity,
  favorited,
  onFavorite,
  onAddToCart,
}: {
  product: Product;
  variants: ProductVariant[];
  selectedVariantId: string | null;
  setSelectedVariantId: (id: string) => void;
  quantity: number;
  setQuantity: (n: number) => void;
  favorited: boolean;
  onFavorite: () => void;
  onAddToCart: () => void;
}) {
  const router = useRouter();
  const { isWide } = useBreakpoint();

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const outOfStock = selectedVariant ? selectedVariant.stock === 0 : true;

  return (
    <ScrollView
      contentContainerStyle={[web.scroll, { maxWidth: isWide ? 1200 : 960 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Fil d'ariane */}
      <View style={web.breadcrumb}>
        <Pressable onPress={() => router.push('/(tabs)')}>
          <Text style={web.breadcrumbLink}>Accueil</Text>
        </Pressable>
        <Text style={web.breadcrumbSep}>/</Text>
        {product.category && (
          <>
            <Text style={web.breadcrumbText}>{product.category}</Text>
            <Text style={web.breadcrumbSep}>/</Text>
          </>
        )}
        <Text style={[web.breadcrumbText, { color: C.text }]} numberOfLines={1}>
          {product.name}
        </Text>
      </View>

      {/* Colonne principale */}
      <View style={web.columns}>

        {/* ── Colonne gauche : galerie image ── */}
        <View style={web.imageCol}>
          <View style={web.imageWrap}>
            {product.image_url ? (
              <Image
                source={{ uri: product.image_url }}
                style={web.image}
                resizeMode="cover"
              />
            ) : (
              <View style={web.imagePlaceholder}>
                <Ionicons name="image-outline" size={64} color={C.muted} />
              </View>
            )}
            {/* Badge favori flottant */}
            <Pressable
              onPress={onFavorite}
              style={({ pressed }) => [web.favBadge, pressed && { opacity: 0.7 }]}
            >
              <Ionicons
                name={favorited ? 'heart' : 'heart-outline'}
                size={20}
                color={favorited ? '#C8360A' : C.text}
              />
            </Pressable>
          </View>
        </View>

        {/* ── Colonne droite : détails ── */}
        <View style={web.detailCol}>

          {/* Catégorie */}
          {product.category && (
            <Text style={web.category}>{product.category.toUpperCase()}</Text>
          )}

          {/* Nom */}
          <Text style={web.name}>{product.name}</Text>

          {/* Prix */}
          <Text style={web.price}>{product.price.toFixed(2)} €</Text>

          <View style={web.divider} />

          {/* Tailles */}
          <SizeSelector
            variants={variants}
            selectedVariantId={selectedVariantId}
            onSelect={setSelectedVariantId}
            isWeb
          />

          {/* Quantité */}
          <QuantitySelector value={quantity} onChange={setQuantity} isWeb />

          <View style={web.divider} />

          {/* Description */}
          {product.description && (
            <View style={web.descBlock}>
              <Text style={web.descLabel}>Description</Text>
              <Text style={web.desc}>{product.description}</Text>
            </View>
          )}

          {/* Stock */}
          {selectedVariant && (
            <View style={web.stockRow}>
              <View style={[web.stockDot, { backgroundColor: outOfStock ? '#C8360A' : '#2E9E5B' }]} />
              <Text style={web.stockText}>
                {outOfStock ? 'Rupture de stock' : `En stock (${selectedVariant.stock} disponibles)`}
              </Text>
            </View>
          )}

          {/* CTA */}
          <Pressable
            onPress={onAddToCart}
            disabled={outOfStock}
            style={({ pressed }) => [
              web.cartBtn,
              outOfStock && web.cartBtnOos,
              pressed && !outOfStock && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="bag-add-outline" size={20} color={outOfStock ? C.muted : C.accentText} />
            <Text style={[web.cartBtnText, outOfStock && { color: C.muted }]}>
              {outOfStock ? 'Indisponible' : 'Ajouter au panier'}
            </Text>
          </Pressable>

          {/* Mentions légales */}
          <View style={web.perks}>
            {[
              { icon: 'shield-checkmark-outline', text: 'Paiement 100 % sécurisé' },
              { icon: 'cube-outline', text: 'Livraison offerte dès 80 €' },
              { icon: 'return-down-back-outline', text: 'Retours gratuits sous 30 jours' },
            ].map(({ icon, text }) => (
              <View key={text} style={web.perkRow}>
                <Ionicons name={icon as any} size={16} color={C.muted} />
                <Text style={web.perkText}>{text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={web.footer}>
        <Text style={web.footerText}>
          © {new Date().getFullYear()} Leico — Tous droits réservés
        </Text>
      </View>
    </ScrollView>
  );
}

const web = StyleSheet.create({
  scroll: {
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 48,
    paddingTop: 32,
    paddingBottom: 64,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 32,
  },
  breadcrumbLink: { fontSize: 13, color: C.muted, fontWeight: '500' },
  breadcrumbSep: { fontSize: 13, color: C.border },
  breadcrumbText: { fontSize: 13, color: C.muted, fontWeight: '500' },

  columns: { flexDirection: 'row', gap: 56, alignItems: 'flex-start' },

  // Image
  imageCol: { flex: 1 },
  imageWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F4F4F0',
    aspectRatio: 3 / 4,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F0',
  },
  favBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  // Détails
  detailCol: { flex: 1, paddingTop: 8 },
  category: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 2,
    marginBottom: 12,
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.8,
    lineHeight: 38,
    marginBottom: 16,
  },
  price: {
    fontSize: 26,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  divider: { height: 1, backgroundColor: C.border, marginBottom: 24 },

  descBlock: { marginBottom: 24 },
  descLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  desc: { fontSize: 15, color: C.muted, lineHeight: 26 },

  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  stockDot: { width: 8, height: 8, borderRadius: 4 },
  stockText: { fontSize: 13, color: C.muted, fontWeight: '500' },

  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.text,
    borderRadius: 10,
    paddingVertical: 16,
    marginBottom: 24,
  },
  cartBtnOos: { backgroundColor: '#F0F0EE' },
  cartBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.accentText,
    letterSpacing: 0.3,
  },

  perks: { gap: 10 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkText: { fontSize: 13, color: C.muted, fontWeight: '500' },

  footer: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 64,
    paddingTop: 24,
    alignItems: 'center',
  },
  footerText: { fontSize: 12, color: C.muted, letterSpacing: 0.5 },
});

// ════════════════════════════════════════════════════════════════════════════
// LAYOUT MOBILE — original préservé, amélioré subtilement
// ════════════════════════════════════════════════════════════════════════════
function MobileLayout({
  product,
  variants,
  selectedVariantId,
  setSelectedVariantId,
  quantity,
  setQuantity,
  favorited,
  onFavorite,
  onAddToCart,
}: {
  product: Product;
  variants: ProductVariant[];
  selectedVariantId: string | null;
  setSelectedVariantId: (id: string) => void;
  quantity: number;
  setQuantity: (n: number) => void;
  favorited: boolean;
  onFavorite: () => void;
  onAddToCart: () => void;
}) {
  const router = useRouter();
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const outOfStock = selectedVariant ? selectedVariant.stock === 0 : true;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image plein largeur */}
        <View style={mob.imageWrap}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={mob.image} resizeMode="cover" />
          ) : (
            <View style={mob.imagePlaceholder}>
              <Ionicons name="image-outline" size={64} color={C.muted} />
            </View>
          )}
          {/* Bouton retour */}
          <Pressable style={mob.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </Pressable>
        </View>

        {/* Contenu */}
        <View style={mob.content}>
          {product.category && (
            <Text style={mob.category}>{product.category.toUpperCase()}</Text>
          )}
          <View style={mob.titleRow}>
            <Text style={mob.name}>{product.name}</Text>
            <Text style={mob.price}>{product.price.toFixed(2)} €</Text>
          </View>

          <View style={mob.divider} />

          <SizeSelector
            variants={variants}
            selectedVariantId={selectedVariantId}
            onSelect={setSelectedVariantId}
            isWeb={false}
          />

          <QuantitySelector value={quantity} onChange={setQuantity} isWeb={false} />

          {product.description && (
            <View style={{ marginBottom: 24 }}>
              <Text style={mob.sectionLabel}>Description</Text>
              <Text style={mob.desc}>{product.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer sticky */}
      <View style={mob.footer}>
        <Pressable
          onPress={onFavorite}
          style={({ pressed }) => [mob.favBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={26}
            color={favorited ? '#C8360A' : C.text}
          />
        </Pressable>
        <Pressable
          onPress={onAddToCart}
          disabled={outOfStock}
          style={({ pressed }) => [mob.cartBtn, outOfStock && mob.cartBtnOos, pressed && !outOfStock && { opacity: 0.85 }]}
        >
          <Text style={[mob.cartBtnText, outOfStock && { color: C.muted }]}>
            {outOfStock ? 'Indisponible' : 'Ajouter au panier'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const mob = StyleSheet.create({
  imageWrap: { width: '100%', height: 420, position: 'relative', backgroundColor: '#F4F4F0' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  content: { padding: 20, paddingBottom: 120 },
  category: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 2, marginBottom: 8 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  name: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5, flex: 1, marginRight: 12 },
  price: { fontSize: 20, fontWeight: '800', color: C.text },
  divider: { height: 1, backgroundColor: C.border, marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: C.text, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  desc: { fontSize: 15, color: C.muted, lineHeight: 24 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 28,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  favBtn: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtn: {
    flex: 1,
    height: 52,
    borderRadius: 10,
    backgroundColor: C.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtnOos: { backgroundColor: '#F0F0EE' },
  cartBtnText: { fontSize: 15, fontWeight: '700', color: C.accentText, letterSpacing: 0.3 },
});

// ════════════════════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isWeb } = useBreakpoint();

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
    (async () => {
      setLoading(true);
      const { data: productData, error: productError } = await supabase
        .from('product').select('*').eq('id', id).single();

      if (productError || !productData) { setNotFound(true); setLoading(false); return; }

      setProduct(productData as Product);

      const { data: variantData, error: variantError } = await supabase
        .from('product_variant').select('*').eq('product_id', id);

      if (!variantError && variantData) {
        const sorted = (variantData as ProductVariant[]).sort(
          (a, b) => a.size?.localeCompare(b.size || '') || 0,
        );
        setVariants(sorted);
        const available = sorted.find((v) => v.stock > 0);
        setSelectedVariantId(available?.id ?? sorted[0]?.id ?? null);
      }
      setLoading(false);
    })();
  }, [id]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={sc.center}>
        {isWeb && <WebNavbar />}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={C.text} />
          <Text style={{ color: C.muted, fontSize: 14 }}>Chargement…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Introuvable ───────────────────────────────────────────────────────────
  if (notFound || !product) {
    return (
      <SafeAreaView style={sc.center}>
        {isWeb && <WebNavbar />}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Ionicons name="alert-circle-outline" size={48} color={C.muted} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: C.text }}>Produit introuvable</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: C.muted, fontWeight: '500' }}>← Retour</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const favorited = isFavorited(product.id);

  const handleFavoritePress = () => {
    if (!user) {
      if (Platform.OS === 'web') window.alert('Connectez-vous pour ajouter aux favoris.');
      else Alert.alert('Connexion requise', 'Connectez-vous pour ajouter aux favoris.');
      return;
    }
    favorited ? removeFavorite(product.id) : addFavorite(product.id);
  };

  const handleAddToCart = () => {
    if (!user) {
      if (Platform.OS === 'web') {
        const ok = window.confirm('Connexion requise. Voulez-vous vous connecter ?');
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
    if (Platform.OS !== 'web') Alert.alert('Succès', 'Ajouté au panier !');
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────
  const sharedProps = {
    product,
    variants,
    selectedVariantId,
    setSelectedVariantId,
    quantity,
    setQuantity,
    favorited,
    onFavorite: handleFavoritePress,
    onAddToCart: handleAddToCart,
  };

  if (isWeb) {
    return (
      <SafeAreaView style={sc.root}>
        <WebNavbar />
        <WebLayout {...sharedProps} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={sc.root} edges={['bottom']}>
      <MobileLayout {...sharedProps} />
    </SafeAreaView>
  );
}

const sc = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, backgroundColor: C.bg },
});