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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../services/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

const EMPTY_FORM = {
  name: '',
  slug: '',
  parent_id: null as string | null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // ── Fetch ──────────────────────────────────────────────────────────────────

  async function fetchAll() {
    const { data } = await supabase
      .from('category')
      .select('id, name, slug, parent_id')
      .order('name');
    setCategories(data || []);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, []);

  // ── Modal ─────────────────────────────────────────────────────────────────

  function openNew() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setModalVisible(true);
  }

  function openEdit(c: Category) {
    setForm({ name: c.name, slug: c.slug, parent_id: c.parent_id });
    setEditingId(c.id);
    setModalVisible(true);
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.name.trim()) return Alert.alert('Erreur', 'Le nom est obligatoire.');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || toSlug(form.name),
        parent_id: form.parent_id,
      };
      if (editingId) {
        const { error } = await supabase.from('category').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('category').insert(payload);
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

  // ── Delete ────────────────────────────────────────────────────────────────

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

    const previous = [...categories];
    setCategories((prev) => prev.filter((c) => c.id !== id));

    try {
      // Détacher les sous-catégories (mettre parent_id à null)
      await supabase.from('category').update({ parent_id: null }).eq('parent_id', id);
      // Détacher les produits liés
      await supabase.from('product').update({ category_id: null }).eq('category_id', id);

      const { error } = await supabase.from('category').delete().eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      setCategories(previous);
      alert('Erreur : ' + e.message);
    }
  }

  // ── Filtre + structure parent/enfant ──────────────────────────────────────

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const roots = filtered.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) => filtered.filter((c) => c.parent_id === parentId);

  // ── Rendu ─────────────────────────────────────────────────────────────────

  if (loading)
    return (
      <View style={S.center}>
        <ActivityIndicator size="large" color="#ff4757" />
      </View>
    );

  return (
    <View style={S.container}>
      {/* Top bar */}
      <View style={S.topBar}>
        <View style={S.searchWrap}>
          <Ionicons name="search-outline" size={16} color="#444" style={{ marginRight: 8 }} />
          <TextInput
            style={S.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor="#444"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={S.btnAdd} onPress={openNew}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={S.btnAddText}>Nouvelle</Text>
        </TouchableOpacity>
      </View>

      <Text style={S.count}>
        {filtered.length} catégorie{filtered.length > 1 ? 's' : ''}
      </Text>

      <FlatList
        data={roots}
        keyExtractor={(c) => c.id}
        contentContainerStyle={S.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff4757" />
        }
        ListEmptyComponent={
          <View style={S.empty}>
            <Text style={S.emptyText}>Aucune catégorie</Text>
          </View>
        }
        renderItem={({ item: root }) => (
          <View>
            {/* Catégorie parente */}
            <View style={S.card}>
              <View style={S.parentIcon}>
                <Ionicons name="folder-outline" size={16} color="#ff4757" />
              </View>
              <View style={S.cardBody}>
                <Text style={S.cardName}>{root.name}</Text>
                <Text style={S.cardMeta}>
                  /{root.slug} · {getChildren(root.id).length} sous-cat.
                </Text>
              </View>
              <TouchableOpacity style={S.iconBtn} onPress={() => openEdit(root)}>
                <Ionicons name="pencil-outline" size={17} color="#888" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.iconBtn, S.iconBtnDanger]}
                onPress={() => handleDelete(root.id, root.name)}
              >
                <Ionicons name="trash-outline" size={17} color="#ff4757" />
              </TouchableOpacity>
            </View>

            {/* Sous-catégories */}
            {getChildren(root.id).map((child) => (
              <View key={child.id} style={S.childRow}>
                <Text style={S.childArrow}>└</Text>
                <View style={[S.card, S.childCard]}>
                  <View style={S.childIcon}>
                    <Ionicons name="pricetag-outline" size={14} color="#888" />
                  </View>
                  <View style={S.cardBody}>
                    <Text style={[S.cardName, { fontSize: 14 }]}>{child.name}</Text>
                    <Text style={S.cardMeta}>/{child.slug}</Text>
                  </View>
                  <TouchableOpacity style={S.iconBtn} onPress={() => openEdit(child)}>
                    <Ionicons name="pencil-outline" size={17} color="#888" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[S.iconBtn, S.iconBtnDanger]}
                    onPress={() => handleDelete(child.id, child.name)}
                  >
                    <Ionicons name="trash-outline" size={17} color="#ff4757" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      />

      <TouchableOpacity style={S.fab} onPress={openNew}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={S.overlay} onPress={() => setModalVisible(false)} />
          <View style={S.sheet}>
            <View style={S.sheetHeader}>
              <Text style={S.sheetTitle}>{editingId ? 'Modifier' : 'Nouvelle catégorie'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={S.closeBtn}>
                <Ionicons name="close" size={20} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <SectionLabel text="Informations" />

              <FieldLabel text="Nom *" />
              <TextInput
                style={S.input}
                placeholder="Ex : Hauts"
                placeholderTextColor="#333"
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v, slug: toSlug(v) }))}
              />

              <FieldLabel text="Slug" />
              <TextInput
                style={S.input}
                placeholder="ex : hauts (auto-généré)"
                placeholderTextColor="#333"
                value={form.slug}
                autoCapitalize="none"
                onChangeText={(v) => setForm((f) => ({ ...f, slug: v }))}
              />

              <SectionLabel text="Catégorie parente" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 8 }}
              >
                <TouchableOpacity
                  style={[S.chip, !form.parent_id && S.chipActive]}
                  onPress={() => setForm((f) => ({ ...f, parent_id: null }))}
                >
                  <Text style={[S.chipText, !form.parent_id && S.chipTextActive]}>
                    Aucune (racine)
                  </Text>
                </TouchableOpacity>
                {categories
                  .filter((c) => c.id !== editingId)
                  .map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[S.chip, form.parent_id === c.id && S.chipActive]}
                      onPress={() => setForm((f) => ({ ...f, parent_id: c.id }))}
                    >
                      <Text style={[S.chipText, form.parent_id === c.id && S.chipTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>

              <TouchableOpacity
                style={[S.btnSave, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={S.btnSaveText}>{editingId ? 'Enregistrer' : 'Créer'}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={S.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={S.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        color: '#555',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 24,
        marginBottom: 12,
      }}
    >
      {text}
    </Text>
  );
}
function FieldLabel({ text }: { text: string }) {
  return (
    <Text style={{ fontSize: 12, color: '#555', fontWeight: '600', marginBottom: 6 }}>{text}</Text>
  );
}

const C = {
  bg: '#FBFCFD',
  surface: '#FFFFFF',
  border: '#F2F2F7',
  text: '#1C1C1E',
  muted: '#8E8E93',
  accent: '#007AFF',
};
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  topBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: { flex: 1, height: 42, color: C.text, fontSize: 14 },
  btnAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 42,
  },
  btnAddText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  count: {
    fontSize: 11,
    color: '#444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  list: { padding: 12, paddingTop: 0, gap: 8, paddingBottom: 100 },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
  },
  childRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 16, marginTop: 6 },
  childArrow: { color: '#333', fontSize: 16, marginRight: 8, marginTop: -4 },
  childCard: { backgroundColor: '#131313', borderColor: '#1a1a1a' },
  parentIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#ff47571a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: { flex: 1, gap: 3 },
  cardName: { fontSize: 15, fontWeight: '700', color: C.text },
  cardMeta: { fontSize: 12, color: C.muted },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnDanger: { backgroundColor: '#ff47571a' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#333', fontSize: 14 },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '93%',
    marginTop: 'auto',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1f1f1f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: C.surface,
    borderRadius: 10,
    padding: 13,
    color: C.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 4,
  },
  chip: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { color: C.muted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  btnSave: {
    backgroundColor: C.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  btnSaveText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  btnCancel: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  btnCancelText: { color: '#444', fontSize: 15 },
});
