import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  View,
} from 'react-native';
import { supabase } from '../../services/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = { id: string; name: string };

type Variant = {
  id?: string;       // absent si nouveau
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function totalStock(variants: Variant[]) {
  return variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AdminProducts() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState('');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [form, setForm]                 = useState({ ...EMPTY_FORM });

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
    if (catRes.data)  setCategories(catRes.data);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { fetchAll(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchAll(); }, []);

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
    // Charger les variants existants
    const { data: variants } = await supabase
      .from('product_variant')
      .select('id, size, color, stock, sku')
      .eq('product_id', product.id);

    setForm({
      name:        product.name,
      description: product.description ?? '',
      price:       String(product.price),
      image_url:   product.image_url ?? '',
      is_active:   product.is_active,
      category_id: product.category_id,
      variants:    variants && variants.length > 0
        ? variants
        : [{ ...EMPTY_VARIANT }],
    });
    setEditingId(product.id);
    setModalVisible(true);
  }

  // ── Sauvegarder ───────────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.name.trim()) return Alert.alert('Erreur', 'Le nom est obligatoire.');
    if (!form.price)       return Alert.alert('Erreur', 'Le prix est obligatoire.');

    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim(),
        price:       parseFloat(form.price.replace(',', '.')),
        image_url:   form.image_url.trim() ||
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
        is_active:   form.is_active,
        category_id: form.category_id,
      };

      let productId = editingId;

      if (editingId) {
        // Mise à jour produit
        const { error } = await supabase.from('product').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        // Création produit
        const { data, error } = await supabase.from('product').insert(payload).select().single();
        if (error) throw error;
        productId = data.id;
      }

      // ── Sync variants ──────────────────────────────────────────────────────
      const validVariants = form.variants.filter(v => v.size.trim() || v.color.trim());

      if (editingId) {
        // Supprimer les anciens variants (simplifié : on recrée tout)
        await supabase.from('product_variant').delete().eq('product_id', productId!);
      }

      if (validVariants.length > 0) {
        const variantPayload = validVariants.map(v => ({
          product_id: productId!,
          size:  v.size.trim(),
          color: v.color.trim(),
          stock: Number(v.stock) || 0,
          sku:   v.sku.trim() || `${form.name.slice(0, 3).toUpperCase()}-${v.size}-${v.color}`.toUpperCase(),
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

  // ── Supprimer ──────────────────────────────────────────────────────────────

  function handleDelete(id: string, name: string) {
    Alert.alert('Supprimer', `Supprimer "${name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          // Optimistic update
          const previous = [...products];
          setProducts(prev => prev.filter(p => p.id !== id));

          // Cascade manuelle
          const { data: variants } = await supabase
            .from('product_variant').select('id').eq('product_id', id);
          const variantIds = variants?.map(v => v.id) ?? [];

          if (variantIds.length > 0) {
            await supabase.from('order_item').delete().in('variant_id', variantIds);
          }
          await supabase.from('product_variant').delete().eq('product_id', id);
          await supabase.from('favorite').delete().eq('product_id', id);

          const { error } = await supabase.from('product').delete().eq('id', id);
          if (error) {
            setProducts(previous);
            Alert.alert('Erreur', error.message);
          }
        },
      },
    ]);
  }

  // ── Variants helpers ───────────────────────────────────────────────────────

  function updateVariant(index: number, field: keyof Variant, value: string) {
    setForm(f => {
      const variants = [...f.variants];
      variants[index] = { ...variants[index], [field]: value };
      return { ...f, variants };
    });
  }

  function addVariant() {
    setForm(f => ({ ...f, variants: [...f.variants, { ...EMPTY_VARIANT }] }));
  }

  function removeVariant(index: number) {
    setForm(f => ({
      ...f,
      variants: f.variants.filter((_, i) => i !== index),
    }));
  }

  // ── Filtre ─────────────────────────────────────────────────────────────────

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Rendu ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff4757" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color="#444" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor="#444"
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

      {/* ── Liste ── */}
      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff4757" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun produit</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Indicateur actif */}
            <View style={[styles.activeDot, { backgroundColor: item.is_active ? '#10b981' : '#333' }]} />

            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardMeta}>
                {item.price.toFixed(2)} €
                {categories.find(c => c.id === item.category_id)
                  ? '  ·  ' + categories.find(c => c.id === item.category_id)!.name
                  : ''}
              </Text>
            </View>

            <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
              <Ionicons name="pencil-outline" size={17} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDanger]} onPress={() => handleDelete(item.id, item.name)}>
              <Ionicons name="trash-outline" size={17} color="#ff4757" />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* ── FAB ── */}
      <TouchableOpacity style={styles.fab} onPress={openNew}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* ── Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.overlay} onPress={() => setModalVisible(false)} />
          <View style={styles.sheet}>
            {/* Header modal */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {editingId ? 'Modifier le produit' : 'Nouveau produit'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* ── Infos générales ── */}
              <SectionLabel text="Informations" />

              <FieldLabel text="Nom *" />
              <TextInput
                style={styles.input}
                placeholder="Ex : T-shirt oversize"
                placeholderTextColor="#333"
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
              />

              <FieldLabel text="Description" />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Description du produit..."
                placeholderTextColor="#333"
                multiline
                value={form.description}
                onChangeText={v => setForm(f => ({ ...f, description: v }))}
              />

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <FieldLabel text="Prix (€) *" />
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#333"
                    keyboardType="decimal-pad"
                    value={form.price}
                    onChangeText={v => setForm(f => ({ ...f, price: v }))}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <FieldLabel text="Actif" />
                  <View style={styles.switchBox}>
                    <Switch
                      value={form.is_active}
                      onValueChange={v => setForm(f => ({ ...f, is_active: v }))}
                      trackColor={{ false: '#1f1f1f', true: '#ff4757' }}
                      thumbColor="#fff"
                    />
                    <Text style={styles.switchLabel}>
                      {form.is_active ? 'Visible' : 'Masqué'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ── Catégorie ── */}
              <SectionLabel text="Catégorie" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
                {categories.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, form.category_id === c.id && styles.chipActive]}
                    onPress={() => setForm(f => ({ ...f, category_id: c.id }))}
                  >
                    <Text style={[styles.chipText, form.category_id === c.id && styles.chipTextActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* ── Variants ── */}
              <View style={styles.variantsHeader}>
                <SectionLabel text={`Variants (${form.variants.length})`} />
                <TouchableOpacity style={styles.btnAddVariant} onPress={addVariant}>
                  <Ionicons name="add-circle-outline" size={16} color="#ff4757" />
                  <Text style={styles.btnAddVariantText}>Ajouter</Text>
                </TouchableOpacity>
              </View>

              {form.variants.map((v, i) => (
                <View key={i} style={styles.variantCard}>
                  <View style={styles.variantCardHeader}>
                    <Text style={styles.variantCardTitle}>Variant {i + 1}</Text>
                    {form.variants.length > 1 && (
                      <TouchableOpacity onPress={() => removeVariant(i)}>
                        <Ionicons name="close-circle-outline" size={18} color="#555" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.row2}>
                    <View style={{ flex: 1 }}>
                      <FieldLabel text="Taille" />
                      <TextInput
                        style={styles.input}
                        placeholder="S, M, L, XL..."
                        placeholderTextColor="#333"
                        value={v.size}
                        onChangeText={val => updateVariant(i, 'size', val)}
                      />
                    </View>
                    <View style={{ width: 10 }} />
                    <View style={{ flex: 1 }}>
                      <FieldLabel text="Couleur" />
                      <TextInput
                        style={styles.input}
                        placeholder="Noir, Blanc..."
                        placeholderTextColor="#333"
                        value={v.color}
                        onChangeText={val => updateVariant(i, 'color', val)}
                      />
                    </View>
                  </View>

                  <View style={styles.row2}>
                    <View style={{ flex: 1 }}>
                      <FieldLabel text="Stock" />
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#333"
                        keyboardType="number-pad"
                        value={String(v.stock || '')}
                        onChangeText={val => updateVariant(i, 'stock', val)}
                      />
                    </View>
                    <View style={{ width: 10 }} />
                    <View style={{ flex: 1 }}>
                      <FieldLabel text="SKU (optionnel)" />
                      <TextInput
                        style={styles.input}
                        placeholder="Auto-généré"
                        placeholderTextColor="#333"
                        value={v.sku}
                        autoCapitalize="characters"
                        onChangeText={val => updateVariant(i, 'sku', val)}
                      />
                    </View>
                  </View>
                </View>
              ))}

              {/* ── Boutons ── */}
              <TouchableOpacity
                style={[styles.btnSave, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnSaveText}>
                      {editingId ? 'Enregistrer les modifications' : 'Créer le produit'}
                    </Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnCancelText}>Annuler</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
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
      fontSize: 11, color: '#555', fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 1,
      marginTop: 24, marginBottom: 12,
    }}>
      {text}
    </Text>
  );
}

function FieldLabel({ text }: { text: string }) {
  return (
    <Text style={{
      fontSize: 12, color: '#555', fontWeight: '600',
      marginBottom: 6, letterSpacing: 0.3,
    }}>
      {text}
    </Text>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  bg:        '#0d0d0d',
  surface:   '#161616',
  border:    '#1f1f1f',
  text:      '#f0f0f0',
  muted:     '#555',
  accent:    '#ff4757',
  success:   '#10b981',
};

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: S.bg },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: S.bg },

  // Top bar
  topBar:     { flexDirection: 'row', padding: 12, gap: 10, borderBottomWidth: 1, borderColor: S.border },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: S.surface, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: S.border },
  searchInput:{ flex: 1, height: 42, color: S.text, fontSize: 14 },
  btnAdd:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: S.accent, borderRadius: 10, paddingHorizontal: 14, height: 42 },
  btnAddText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  count:      { fontSize: 11, color: '#444', paddingHorizontal: 16, paddingVertical: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // List
  list:       { padding: 12, paddingTop: 0, gap: 8, paddingBottom: 100 },
  card:       { flexDirection: 'row', alignItems: 'center', backgroundColor: S.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: S.border, gap: 10 },
  activeDot:  { width: 8, height: 8, borderRadius: 4 },
  cardBody:   { flex: 1, gap: 4 },
  cardName:   { fontSize: 15, fontWeight: '700', color: S.text },
  cardMeta:   { fontSize: 12, color: S.muted },
  iconBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
  iconBtnDanger: { backgroundColor: '#ff47571a' },

  empty:      { alignItems: 'center', paddingVertical: 60 },
  emptyText:  { color: '#333', fontSize: 14 },

  fab: {
    position: 'absolute', bottom: 28, right: 20,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: S.accent,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: S.accent, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  // Modal
  overlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:      { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '93%', marginTop: 'auto' },
  sheetHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: S.text, letterSpacing: -0.3 },
  closeBtn:   { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1f1f1f', justifyContent: 'center', alignItems: 'center' },

  // Inputs
  input:      { backgroundColor: S.surface, borderRadius: 10, padding: 13, color: S.text, fontSize: 14, borderWidth: 1, borderColor: S.border, marginBottom: 4 },
  textarea:   { height: 80, textAlignVertical: 'top' },
  row2:       { flexDirection: 'row', marginBottom: 4 },
  switchBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: S.surface, borderRadius: 10, borderWidth: 1, borderColor: S.border, padding: 10, height: 46 },
  switchLabel:{ color: S.muted, fontSize: 13, fontWeight: '600' },

  // Chips catégorie
  chips:      { marginBottom: 4 },
  chip:       { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: S.surface, borderWidth: 1, borderColor: S.border, marginRight: 8 },
  chipActive: { backgroundColor: S.accent, borderColor: S.accent },
  chipText:   { color: S.muted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  // Variants
  variantsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  btnAddVariant:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  btnAddVariantText: { color: S.accent, fontSize: 13, fontWeight: '700' },
  variantCard:    { backgroundColor: '#0a0a0a', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#252525' },
  variantCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  variantCardTitle: { fontSize: 12, color: S.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Buttons
  btnSave:     { backgroundColor: S.accent, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 28 },
  btnSaveText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  btnCancel:   { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  btnCancelText: { color: '#444', fontSize: 15 },
});