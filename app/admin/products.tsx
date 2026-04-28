import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { supabase } from '../../services/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = { id: string; name: string };

type Variant = {
  id?: string;
  size: string;
  color: string;
  stock: number;
  sku: string;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_active: boolean;
  category_id: string | null;
  variants?: Variant[];
};

const EMPTY_VARIANT: Variant = { size: '', color: '', stock: 0, sku: '' };

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  image_url: '',
  is_active: true,
  category_id: null as string | null,
  variants: [{ ...EMPTY_VARIANT }] as Variant[],
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  bg: '#F7F8FA',
  surface: '#FFFFFF',
  border: '#E8EAF0',
  borderStrong: '#D0D3DE',
  text: '#111827',
  muted: '#6B7280',
  subtle: '#9CA3AF',
  accent: '#4F46E5',        // indigo vif
  accentLight: '#EEF2FF',
  accentMid: '#C7D2FE',
  success: '#10B981',
  successLight: '#ECFDF5',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
};

// ─── Breakpoint ──────────────────────────────────────────────────────────────

const WEB_BREAKPOINT = 768;

function useIsWeb() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= WEB_BREAKPOINT;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function totalStock(variants: Variant[]) {
  return variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
}

function getCategoryName(categories: Category[], id: string | null) {
  if (!id) return null;
  return categories.find((c) => c.id === id)?.name ?? null;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const isWeb = useIsWeb();

  // ── Fetch ──────────────────────────────────────────────────────────────────

  async function fetchAll() {
    const [prodRes, catRes] = await Promise.all([
      supabase
        .from('product')
        .select('id, name, description, price, image_url, is_active, category_id')
        .order('created_at', { ascending: false }),
      supabase.from('category').select('id, name').order('name'),
    ]);
    if (prodRes.data) setProducts(prodRes.data);
    if (catRes.data) setCategories(catRes.data);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { fetchAll(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, []);

  // ── Ouvrir modal ───────────────────────────────────────────────────────────

  async function openNew() {
    setForm({
      ...EMPTY_FORM,
      category_id: categories[0]?.id ?? null,
      variants: [{ ...EMPTY_VARIANT }],
    });
    setEditingId(null);
    setModalVisible(true);
  }

  async function openEdit(product: Product) {
    const { data: variants } = await supabase
      .from('product_variant')
      .select('id, size, color, stock, sku')
      .eq('product_id', product.id);

    setForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      image_url: product.image_url ?? '',
      is_active: product.is_active,
      category_id: product.category_id,
      variants: variants && variants.length > 0 ? variants : [{ ...EMPTY_VARIANT }],
    });
    setEditingId(product.id);
    setModalVisible(true);
  }

  // ── Sauvegarder ───────────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.name.trim()) return Alert.alert('Erreur', 'Le nom est obligatoire.');
    if (!form.price) return Alert.alert('Erreur', 'Le prix est obligatoire.');

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price.replace(',', '.')),
        image_url: form.image_url.trim() || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
        is_active: form.is_active,
        category_id: form.category_id,
      };

      let productId = editingId;

      if (editingId) {
        const { error } = await supabase.from('product').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('product').insert(payload).select().single();
        if (error) throw error;
        productId = data.id;
      }

      const validVariants = form.variants.filter((v) => v.size.trim() || v.color.trim());
      if (editingId) {
        await supabase.from('product_variant').delete().eq('product_id', productId!);
      }
      if (validVariants.length > 0) {
        const variantPayload = validVariants.map((v) => ({
          product_id: productId!,
          size: v.size.trim(),
          color: v.color.trim(),
          stock: Number(v.stock) || 0,
          sku: v.sku.trim() || `${form.name.slice(0, 3).toUpperCase()}-${v.size}-${v.color}`.toUpperCase(),
        }));
        const { error } = await supabase.from('product_variant').insert(variantPayload);
        if (error) throw error;
      }

      setModalVisible(false);
      fetchAll();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Supprimer ─────────────────────────────────────────────────────────────

  async function handleDelete(id: string, name: string) {
    const confirmed =
      Platform.OS === 'web'
        ? window.confirm(`Supprimer "${name}" ?`)
        : await new Promise<boolean>((resolve) =>
            Alert.alert('Supprimer', `Supprimer "${name}" ?`, [
              { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Supprimer', style: 'destructive', onPress: () => resolve(true) },
            ]),
          );

    if (!confirmed) return;

    const previous = [...products];
    setProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      const { data: variants } = await supabase
        .from('product_variant')
        .select('id')
        .eq('product_id', id);

      const variantIds = variants?.map((v) => v.id) ?? [];
      if (variantIds.length > 0) {
        await supabase.from('order_item').delete().in('variant_id', variantIds);
      }
      await supabase.from('product_variant').delete().eq('product_id', id);
      await supabase.from('favorite').delete().eq('product_id', id);

      const { error } = await supabase.from('product').delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      setProducts(previous);
      alert('Erreur : ' + e.message);
    }
  }

  // ── Variants helpers ───────────────────────────────────────────────────────

  function updateVariant(index: number, field: keyof Variant, value: string) {
    setForm((f) => {
      const variants = [...f.variants];
      variants[index] = { ...variants[index], [field]: value };
      return { ...f, variants };
    });
  }

  function addVariant() {
    setForm((f) => ({ ...f, variants: [...f.variants, { ...EMPTY_VARIANT }] }));
  }

  function removeVariant(index: number) {
    setForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== index) }));
  }

  // ── Filtre ─────────────────────────────────────────────────────────────────

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={T.accent} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // ── Rendu formulaire partagé ───────────────────────────────────────────────

  const FormContent = (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Section : Informations */}
      <SectionLabel text="Informations générales" />

      <FieldLabel text="Nom du produit *" />
      <TextInput
        style={styles.input}
        placeholder="Ex : T-shirt oversize blanc"
        placeholderTextColor={T.subtle}
        value={form.name}
        onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
      />

      <FieldLabel text="Description" />
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Décrivez votre produit..."
        placeholderTextColor={T.subtle}
        multiline
        value={form.description}
        onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
      />

      <FieldLabel text="URL de l'image" />
      <TextInput
        style={styles.input}
        placeholder="https://exemple.com/image.jpg"
        placeholderTextColor={T.subtle}
        autoCapitalize="none"
        keyboardType="url"
        value={form.image_url}
        onChangeText={(v) => setForm((f) => ({ ...f, image_url: v }))}
      />
      {/* Aperçu image */}
      {form.image_url.trim().length > 0 && (
        <View style={styles.imagePreviewWrap}>
          <Image
            source={{ uri: form.image_url.trim() }}
            style={styles.imagePreview}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <FieldLabel text="Prix (€) *" />
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={T.subtle}
            value={form.price}
            onChangeText={(v) => setForm((f) => ({ ...f, price: v }))}
          />
        </View>
        <View style={{ width: 14 }} />
        <View style={{ flex: 1 }}>
          <FieldLabel text="Statut" />
          <View style={styles.switchBox}>
            <Switch
              value={form.is_active}
              onValueChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              trackColor={{ false: T.border, true: T.accentMid }}
              thumbColor={form.is_active ? T.accent : T.subtle}
            />
            <Text style={[styles.switchLabel, { color: form.is_active ? T.accent : T.muted }]}>
              {form.is_active ? 'Visible' : 'Masqué'}
            </Text>
          </View>
        </View>
      </View>

      {/* Section : Catégorie */}
      <SectionLabel text="Catégorie" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {categories.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, form.category_id === c.id && styles.chipActive]}
            onPress={() => setForm((f) => ({ ...f, category_id: c.id }))}
          >
            <Text style={[styles.chipText, form.category_id === c.id && styles.chipTextActive]}>
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section : Variants */}
      <View style={styles.variantsHeader}>
        <SectionLabel text={`Variants (${form.variants.length})`} />
        <TouchableOpacity style={styles.btnAddVariant} onPress={addVariant}>
          <Ionicons name="add-circle-outline" size={16} color={T.accent} />
          <Text style={styles.btnAddVariantText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {form.variants.map((v, i) => (
        <View key={i} style={styles.variantCard}>
          <View style={styles.variantCardHeader}>
            <Text style={styles.variantCardTitle}>Variant {i + 1}</Text>
            {form.variants.length > 1 && (
              <TouchableOpacity onPress={() => removeVariant(i)} style={styles.removeVariantBtn}>
                <Ionicons name="close" size={14} color={T.danger} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <FieldLabel text="Taille" />
              <TextInput
                style={styles.input}
                placeholder="S, M, L..."
                placeholderTextColor={T.subtle}
                value={v.size}
                onChangeText={(val) => updateVariant(i, 'size', val)}
              />
            </View>
            <View style={{ width: 10 }} />
            <View style={{ flex: 1 }}>
              <FieldLabel text="Couleur" />
              <TextInput
                style={styles.input}
                placeholder="Blanc, Noir..."
                placeholderTextColor={T.subtle}
                value={v.color}
                onChangeText={(val) => updateVariant(i, 'color', val)}
              />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <FieldLabel text="Stock" />
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={T.subtle}
                value={String(v.stock || '')}
                onChangeText={(val) => updateVariant(i, 'stock', val)}
              />
            </View>
            <View style={{ width: 10 }} />
            <View style={{ flex: 1 }}>
              <FieldLabel text="SKU" />
              <TextInput
                style={styles.input}
                placeholder="AUTO"
                placeholderTextColor={T.subtle}
                value={v.sku}
                autoCapitalize="characters"
                onChangeText={(val) => updateVariant(i, 'sku', val)}
              />
            </View>
          </View>
        </View>
      ))}

      {/* Actions */}
      <TouchableOpacity
        style={[styles.btnSave, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnSaveText}>
            {editingId ? '✓  Enregistrer les modifications' : '✓  Créer le produit'}
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
        <Text style={styles.btnCancelText}>Annuler</Text>
      </TouchableOpacity>
      <View style={{ height: 48 }} />
    </ScrollView>
  );

  // ── Vue WEB ────────────────────────────────────────────────────────────────

  if (isWeb) {
    return (
      <View style={webStyles.container}>
        {/* Sidebar */}
        <View style={webStyles.sidebar}>
          <View style={webStyles.sidebarHeader}>
            <Text style={webStyles.sidebarTitle}>Produits</Text>
            <Text style={webStyles.sidebarCount}>
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Search */}
          <View style={webStyles.searchWrap}>
            <Ionicons name="search-outline" size={15} color={T.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={webStyles.searchInput}
              placeholder="Rechercher un produit..."
              placeholderTextColor={T.subtle}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Liste */}
          <FlatList
            data={filtered}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ gap: 6, paddingBottom: 80 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="cube-outline" size={36} color={T.border} />
                <Text style={styles.emptyText}>Aucun produit trouvé</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={webStyles.sidebarItem}>
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={webStyles.sidebarItemThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[webStyles.sidebarItemThumb, webStyles.sidebarItemThumbEmpty]}>
                    <Ionicons name="image-outline" size={18} color={T.subtle} />
                  </View>
                )}
                <View style={webStyles.sidebarItemBody}>
                  <View style={webStyles.sidebarItemTop}>
                    <Text style={webStyles.sidebarItemName} numberOfLines={1}>{item.name}</Text>
                    <View style={[webStyles.dot, { backgroundColor: item.is_active ? T.success : T.border }]} />
                  </View>
                  <Text style={webStyles.sidebarItemMeta}>
                    {Number(item.price).toFixed(2)} €
                    {getCategoryName(categories, item.category_id)
                      ? '  ·  ' + getCategoryName(categories, item.category_id)
                      : ''}
                  </Text>
                </View>
                <View style={webStyles.sidebarItemActions}>
                  <TouchableOpacity style={webStyles.iconBtnSm} onPress={() => openEdit(item)}>
                    <Ionicons name="pencil-outline" size={14} color={T.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[webStyles.iconBtnSm, webStyles.iconBtnDanger]}
                    onPress={() => handleDelete(item.id, item.name)}
                  >
                    <Ionicons name="trash-outline" size={14} color={T.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          
        </View>

        {/* Main panel : formulaire ou état vide */}
        <View style={webStyles.main}>
          {modalVisible ? (
            <View style={webStyles.mainPanel}>
              <View style={webStyles.mainPanelHeader}>
                <Text style={webStyles.mainPanelTitle}>
                  {editingId ? 'Modifier le produit' : 'Nouveau produit'}
                </Text>
                <TouchableOpacity style={webStyles.closeBtn} onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={18} color={T.muted} />
                </TouchableOpacity>
              </View>
              {FormContent}
            </View>
          ) : (
            <View style={webStyles.mainEmpty}>
              <View style={webStyles.mainEmptyIcon}>
                <Ionicons name="cube-outline" size={40} color={T.accent} />
              </View>
              <Text style={webStyles.mainEmptyTitle}>Sélectionnez ou créez un produit</Text>
              <Text style={webStyles.mainEmptySubtitle}>
                Cliquez sur un produit dans la liste ou créez-en un nouveau pour commencer.
              </Text>
              <TouchableOpacity style={webStyles.mainEmptyBtn} onPress={openNew}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={webStyles.mainEmptyBtnText}>Créer un produit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  // ── Vue MOBILE ─────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={T.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor={T.subtle}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.btnAdd} onPress={openNew}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.btnAddText}>Nouveau</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.count}>
        {filtered.length} produit{filtered.length > 1 ? 's' : ''}
      </Text>

      {/* Liste mobile */}
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={40} color={T.border} />
            <Text style={styles.emptyText}>Aucun produit</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.cardThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.cardThumb, styles.cardThumbEmpty]}>
                <Ionicons name="image-outline" size={20} color={T.subtle} />
              </View>
            )}
            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: item.is_active ? T.successLight : T.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: item.is_active ? T.success : T.muted },
                    ]}
                  >
                    {item.is_active ? 'Actif' : 'Masqué'}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                {Number(item.price).toFixed(2)} €
                {getCategoryName(categories, item.category_id)
                  ? '  ·  ' + getCategoryName(categories, item.category_id)
                  : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
              <Ionicons name="pencil-outline" size={16} color={T.muted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, styles.iconBtnDanger]}
              onPress={() => handleDelete(item.id, item.name)}
            >
              <Ionicons name="trash-outline" size={16} color={T.danger} />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openNew}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal mobile */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.overlay} onPress={() => setModalVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {editingId ? 'Modifier le produit' : 'Nouveau produit'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color={T.muted} />
              </TouchableOpacity>
            </View>
            {FormContent}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Petits composants ────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <Text style={{
      fontSize: 10,
      color: T.muted,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginTop: 28,
      marginBottom: 10,
    }}>
      {text}
    </Text>
  );
}

function FieldLabel({ text }: { text: string }) {
  return (
    <Text style={{
      fontSize: 12,
      color: T.muted,
      fontWeight: '600',
      marginBottom: 6,
      letterSpacing: 0.2,
    }}>
      {text}
    </Text>
  );
}

// ─── Styles communs ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg, gap: 12 },
  loadingText: { fontSize: 14, color: T.muted },

  // Top bar
  topBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    backgroundColor: T.surface,
    borderBottomWidth: 1,
    borderColor: T.border,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: T.border,
  },
  searchInput: { flex: 1, height: 40, color: T.text, fontSize: 14 },
  btnAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 40,
  },
  btnAddText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Count
  count: {
    fontSize: 11,
    color: T.muted,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // List
  list: { padding: 12, paddingTop: 4, gap: 8, paddingBottom: 100 },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
    gap: 12,
    paddingRight: 10,
  },
  cardThumb: {
    width: 60,
    height: 60,
  },
  cardThumbEmpty: {
    backgroundColor: T.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1, gap: 4, paddingVertical: 12 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { flex: 1, fontSize: 15, fontWeight: '700', color: T.text },
  cardMeta: { fontSize: 12, color: T.muted },

  // Status badge
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  // Icon buttons
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: T.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  iconBtnDanger: { backgroundColor: T.dangerLight, borderColor: '#FECACA' },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { color: T.muted, fontSize: 14, fontWeight: '500' },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: T.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },

  // Modal
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: T.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
    maxHeight: '93%',
    marginTop: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: T.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: T.text },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },

  // Form
  input: {
    backgroundColor: T.surface,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: T.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 10,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', marginBottom: 4 },

  // Image preview
  imagePreviewWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.border,
    height: 140,
  },
  imagePreview: { width: '100%', height: '100%' },

  switchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: T.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 12,
    height: 44,
  },
  switchLabel: { fontSize: 13, fontWeight: '600' },

  chips: { marginBottom: 4 },
  chip: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: T.accentLight, borderColor: T.accentMid },
  chipText: { color: T.muted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: T.accent },

  variantsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  btnAddVariant: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  btnAddVariantText: { color: T.accent, fontSize: 13, fontWeight: '700' },

  variantCard: {
    backgroundColor: T.bg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.border,
  },
  variantCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  variantCardTitle: { fontSize: 11, color: T.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  removeVariantBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: T.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  btnSave: {
    backgroundColor: T.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnSaveText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  btnCancel: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 6 },
  btnCancelText: { color: T.muted, fontSize: 14, fontWeight: '600' },
});

// ─── Styles WEB uniquement ────────────────────────────────────────────────────

const webStyles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: T.bg },

  // Sidebar
  sidebar: {
    width: 340,
    backgroundColor: T.surface,
    borderRightWidth: 1,
    borderColor: T.border,
    padding: 16,
    paddingTop: 24,
  },
  sidebarHeader: { marginBottom: 16 },
  sidebarTitle: { fontSize: 22, fontWeight: '800', color: T.text, marginBottom: 4 },
  sidebarCount: { fontSize: 12, color: T.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 14,
  },
  searchInput: { flex: 1, height: 38, color: T.text, fontSize: 14 },

  // Sidebar items
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.bg,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
    gap: 10,
    paddingRight: 8,
  },
  sidebarItemThumb: { width: 50, height: 50 },
  sidebarItemThumbEmpty: {
    backgroundColor: T.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarItemBody: { flex: 1, paddingVertical: 10, gap: 4 },
  sidebarItemTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sidebarItemName: { flex: 1, fontSize: 13, fontWeight: '700', color: T.text },
  sidebarItemMeta: { fontSize: 11, color: T.muted },
  dot: { width: 7, height: 7, borderRadius: 4 },
  sidebarItemActions: { flexDirection: 'row', gap: 6 },
  iconBtnSm: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: T.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  iconBtnDanger: { backgroundColor: T.dangerLight, borderColor: '#FECACA' },

  // Sidebar new button
  sidebarNewBtn: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: T.accent,
    borderRadius: 12,
    padding: 14,
    shadowColor: T.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  sidebarNewBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Main panel
  main: { flex: 1, justifyContent: 'center', alignItems: 'stretch' },
  mainPanel: {
    flex: 1,
    backgroundColor: T.surface,
    margin: 24,
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
  },
  mainPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: T.border,
  },
  mainPanelTitle: { fontSize: 20, fontWeight: '800', color: T.text },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },

  // Main empty state
  mainEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: 40,
    gap: 12,
  },
  mainEmptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: T.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mainEmptyTitle: { fontSize: 20, fontWeight: '800', color: T.text, textAlign: 'center' },
  mainEmptySubtitle: { fontSize: 14, color: T.muted, textAlign: 'center', maxWidth: 300, lineHeight: 22 },
  mainEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: T.accent,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 8,
  },
  mainEmptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});