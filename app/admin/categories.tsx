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
  useWindowDimensions,
  View,
} from 'react-native';
import { supabase } from '../../services/supabaseClient';

// ─── Design tokens (identiques à Products & Orders) ───────────────────────────

const T = {
  bg: '#F7F8FA',
  surface: '#FFFFFF',
  border: '#E8EAF0',
  borderStrong: '#D0D3DE',
  text: '#111827',
  muted: '#6B7280',
  subtle: '#9CA3AF',
  accent: '#4F46E5',
  accentLight: '#EEF2FF',
  accentMid: '#C7D2FE',
  success: '#10B981',
  successLight: '#ECFDF5',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
};

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

const WEB_BREAKPOINT = 768;

function useIsWeb() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= WEB_BREAKPOINT;
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

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

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AdminCategories() {
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
    const { data } = await supabase
      .from('category')
      .select('id, name, slug, parent_id')
      .order('name');
    setCategories(data || []);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { fetchAll(); }, []);

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
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Une erreur est survenue');
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
      await supabase.from('category').update({ parent_id: null }).eq('parent_id', id);
      await supabase.from('product').update({ category_id: null }).eq('category_id', id);
      const { error } = await supabase.from('category').delete().eq('id', id);
      if (error) throw error;
    } catch (e: unknown) {
      setCategories(previous);
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Une erreur est survenue');
    }
  }

  // ── Filtres ───────────────────────────────────────────────────────────────

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );
  const roots = filtered.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) => filtered.filter((c) => c.parent_id === parentId);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={T.accent} />
        <Text style={s.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // ── Formulaire partagé ────────────────────────────────────────────────────

  const FormContent = (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <SectionLabel text="Informations" />

      <FieldLabel text="Nom *" />
      <TextInput
        style={s.input}
        placeholder="Ex : Hauts"
        placeholderTextColor={T.subtle}
        value={form.name}
        onChangeText={(v) => setForm((f) => ({ ...f, name: v, slug: toSlug(v) }))}
      />

      <FieldLabel text="Slug" />
      <TextInput
        style={[s.input, s.inputMono]}
        placeholder="ex : hauts (auto-généré)"
        placeholderTextColor={T.subtle}
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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[s.chip, !form.parent_id && s.chipActive]}
            onPress={() => setForm((f) => ({ ...f, parent_id: null }))}
          >
            <Text style={[s.chipText, !form.parent_id && s.chipTextActive]}>
              Aucune (racine)
            </Text>
          </TouchableOpacity>
          {categories
            .filter((c) => c.id !== editingId)
            .map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[s.chip, form.parent_id === c.id && s.chipActive]}
                onPress={() => setForm((f) => ({ ...f, parent_id: c.id }))}
              >
                <Text style={[s.chipText, form.parent_id === c.id && s.chipTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[s.btnSave, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.btnSaveText}>
            {editingId ? '✓  Enregistrer les modifications' : '✓  Créer la catégorie'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={s.btnCancel} onPress={() => setModalVisible(false)}>
        <Text style={s.btnCancelText}>Annuler</Text>
      </TouchableOpacity>
      <View style={{ height: 48 }} />
    </ScrollView>
  );

  // ── Rendu d'un groupe (parent + enfants) ──────────────────────────────────

  function renderGroup(root: Category) {
    const children = getChildren(root.id);
    return (
      <View key={root.id} style={s.group}>
        {/* Parent */}
        <View style={s.card}>
          <View style={s.iconBoxParent}>
            <Ionicons name="folder-outline" size={16} color={T.accent} />
          </View>
          <View style={s.cardBody}>
            <Text style={s.cardName}>{root.name}</Text>
            <View style={s.cardMeta}>
              <Text style={s.cardSlug}>/{root.slug}</Text>
              {children.length > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{children.length} sous-cat.</Text>
                </View>
              )}
            </View>
          </View>
          <View style={s.actions}>
            <TouchableOpacity style={s.actionBtn} onPress={() => openEdit(root)}>
              <Ionicons name="pencil-outline" size={14} color={T.muted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, s.actionBtnDanger]}
              onPress={() => handleDelete(root.id, root.name)}
            >
              <Ionicons name="trash-outline" size={14} color={T.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Enfants */}
        {children.map((child) => (
          <View key={child.id} style={s.childRow}>
            <View style={s.connector}>
              <View style={s.connectorLine} />
              <View style={s.connectorDot} />
            </View>
            <View style={[s.card, s.childCard]}>
              <View style={s.iconBoxChild}>
                <Ionicons name="pricetag-outline" size={13} color={T.muted} />
              </View>
              <View style={s.cardBody}>
                <Text style={[s.cardName, s.childCardName]}>{child.name}</Text>
                <Text style={s.cardSlug}>/{child.slug}</Text>
              </View>
              <View style={s.actions}>
                <TouchableOpacity style={s.actionBtn} onPress={() => openEdit(child)}>
                  <Ionicons name="pencil-outline" size={14} color={T.muted} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.actionBtn, s.actionBtnDanger]}
                  onPress={() => handleDelete(child.id, child.name)}
                >
                  <Ionicons name="trash-outline" size={14} color={T.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  // ── Vue WEB ────────────────────────────────────────────────────────────────

  if (isWeb) {
    return (
      <View style={ws.container}>
        {/* Sidebar */}
        <View style={ws.sidebar}>
          <View style={ws.sidebarHeader}>
            <Text style={ws.sidebarTitle}>Catégories</Text>
            <Text style={ws.sidebarCount}>
              {filtered.length} catégorie{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Recherche */}
          <View style={ws.searchWrap}>
            <Ionicons name="search-outline" size={15} color={T.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={ws.searchInput}
              placeholder="Rechercher..."
              placeholderTextColor={T.subtle}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={15} color={T.subtle} />
              </TouchableOpacity>
            )}
          </View>

          {/* Stats rapides */}
          <View style={ws.statsRow}>
            <View style={ws.statBox}>
              <Text style={ws.statValue}>{roots.length}</Text>
              <Text style={ws.statLabel}>Racines</Text>
            </View>
            <View style={ws.statDivider} />
            <View style={ws.statBox}>
              <Text style={ws.statValue}>{filtered.length - roots.length}</Text>
              <Text style={ws.statLabel}>Sous-cat.</Text>
            </View>
            <View style={ws.statDivider} />
            <View style={ws.statBox}>
              <Text style={ws.statValue}>{filtered.length}</Text>
              <Text style={ws.statLabel}>Total</Text>
            </View>
          </View>

          {/* Liste */}
          <FlatList
            data={roots}
            keyExtractor={(c) => c.id}
            contentContainerStyle={{ gap: 6, paddingBottom: 80 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />
            }
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Ionicons name="folder-open-outline" size={32} color={T.border} />
                <Text style={s.emptyText}>Aucune catégorie</Text>
              </View>
            }
            renderItem={({ item: root }) => {
              const children = getChildren(root.id);
              return (
                <View style={ws.groupItem}>
                  {/* Parent */}
                  <View style={ws.parentRow}>
                    <View style={ws.iconBoxParent}>
                      <Ionicons name="folder-outline" size={14} color={T.accent} />
                    </View>
                    <View style={ws.itemBody}>
                      <Text style={ws.parentName}>{root.name}</Text>
                      <Text style={ws.itemSlug}>/{root.slug}</Text>
                    </View>
                    {children.length > 0 && (
                      <View style={ws.countBadge}>
                        <Text style={ws.countBadgeText}>{children.length}</Text>
                      </View>
                    )}
                    <View style={ws.itemActions}>
                      <TouchableOpacity style={ws.iconBtnSm} onPress={() => openEdit(root)}>
                        <Ionicons name="pencil-outline" size={13} color={T.muted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[ws.iconBtnSm, ws.iconBtnDanger]}
                        onPress={() => handleDelete(root.id, root.name)}
                      >
                        <Ionicons name="trash-outline" size={13} color={T.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Enfants */}
                  {children.map((child) => (
                    <View key={child.id} style={ws.childRow}>
                      <View style={ws.childConnector}>
                        <View style={ws.connectorLine} />
                        <View style={ws.connectorDot} />
                      </View>
                      <View style={ws.iconBoxChild}>
                        <Ionicons name="pricetag-outline" size={11} color={T.muted} />
                      </View>
                      <View style={ws.itemBody}>
                        <Text style={ws.childName}>{child.name}</Text>
                        <Text style={ws.itemSlug}>/{child.slug}</Text>
                      </View>
                      <View style={ws.itemActions}>
                        <TouchableOpacity style={ws.iconBtnSm} onPress={() => openEdit(child)}>
                          <Ionicons name="pencil-outline" size={13} color={T.muted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[ws.iconBtnSm, ws.iconBtnDanger]}
                          onPress={() => handleDelete(child.id, child.name)}
                        >
                          <Ionicons name="trash-outline" size={13} color={T.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              );
            }}
          />

        </View>

        {/* Main panel */}
        <View style={ws.main}>
          {modalVisible ? (
            <View style={ws.mainPanel}>
              <View style={ws.mainPanelHeader}>
                <Text style={ws.mainPanelTitle}>
                  {editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                </Text>
                <TouchableOpacity style={ws.closeBtn} onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={18} color={T.muted} />
                </TouchableOpacity>
              </View>
              {FormContent}
            </View>
          ) : (
            <View style={ws.mainEmpty}>
              <View style={ws.mainEmptyIcon}>
                <Ionicons name="folder-open-outline" size={40} color={T.accent} />
              </View>
              <Text style={ws.mainEmptyTitle}>Gérez vos catégories</Text>
              <Text style={ws.mainEmptySubtitle}>
                Créez des catégories racines et organisez-les en sous-catégories pour structurer votre catalogue.
              </Text>
              <TouchableOpacity style={ws.mainEmptyBtn} onPress={openNew}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={ws.mainEmptyBtnText}>Nouvelle catégorie</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  // ── Vue MOBILE ─────────────────────────────────────────────────────────────

  return (
    <View style={s.container}>
      {/* Top bar */}
      <View style={s.topBar}>
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={15} color={T.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Rechercher une catégorie..."
            placeholderTextColor={T.subtle}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={15} color={T.subtle} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.btnNew} onPress={openNew}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.btnNewText}>Nouvelle</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.counter}>
        {filtered.length} catégorie{filtered.length > 1 ? 's' : ''}
      </Text>

      <FlatList
        data={roots}
        keyExtractor={(c) => c.id}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />
        }
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Ionicons name="folder-open-outline" size={40} color={T.border} />
            <Text style={s.emptyText}>Aucune catégorie</Text>
          </View>
        }
        renderItem={({ item: root }) => renderGroup(root)}
      />

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={openNew}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal mobile */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={s.overlay} onPress={() => setModalVisible(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>
                {editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </Text>
              <TouchableOpacity style={s.closeBtn} onPress={() => setModalVisible(false)}>
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

// ─── Styles communs (mobile + partagés) ──────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg, gap: 12 },
  loadingText: { fontSize: 14, color: T.muted },

  topBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
    borderColor: T.border,
    backgroundColor: T.surface,
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
    height: 40,
  },
  searchInput: { flex: 1, color: T.text, fontSize: 14 },

  btnNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 40,
  },
  btnNewText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  counter: {
    fontSize: 11,
    color: T.muted,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  list: { padding: 12, paddingTop: 4, gap: 8, paddingBottom: 100 },

  // Groupe parent + enfants
  group: { gap: 4 },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: T.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: T.border,
  },
  childCard: {
    backgroundColor: T.bg,
    borderRadius: 11,
  },
  childCardName: { fontSize: 13 },

  // Icon boxes
  iconBoxParent: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: T.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.accentMid,
    flexShrink: 0,
  },
  iconBoxChild: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: T.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
    flexShrink: 0,
  },

  cardBody: { flex: 1, gap: 3 },
  cardName: { fontSize: 14, fontWeight: '700', color: T.text },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardSlug: {
    fontSize: 11,
    color: T.subtle,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  badge: {
    backgroundColor: T.accentLight,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: T.accentMid,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: T.accent },

  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: T.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: T.surface,
  },
  actionBtnDanger: { backgroundColor: T.dangerLight, borderColor: '#FECACA' },

  // Connecteur enfant
  childRow: { flexDirection: 'row', alignItems: 'flex-start', marginLeft: 22 },
  connector: { alignItems: 'center', paddingRight: 8, paddingTop: 12, flexShrink: 0 },
  connectorLine: { width: 1.5, height: 14, backgroundColor: T.border },
  connectorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: T.borderStrong,
    backgroundColor: T.surface,
  },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 10 },
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
    maxHeight: '90%',
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
  sheetTitle: { fontSize: 18, fontWeight: '800', color: T.text },
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

  // Formulaire
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
  inputMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },

  chip: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
  },
  chipActive: { backgroundColor: T.accentLight, borderColor: T.accentMid },
  chipText: { color: T.muted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: T.accent },

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

// ─── Styles WEB ───────────────────────────────────────────────────────────────

const ws = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: T.bg },

  sidebar: {
    width: 340,
    backgroundColor: T.surface,
    borderRightWidth: 1,
    borderColor: T.border,
    padding: 16,
    paddingTop: 24,
  },
  sidebarHeader: { marginBottom: 14 },
  sidebarTitle: { fontSize: 22, fontWeight: '800', color: T.text, marginBottom: 4 },
  sidebarCount: {
    fontSize: 12,
    color: T.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 12,
    height: 38,
  },
  searchInput: { flex: 1, color: T.text, fontSize: 14 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: T.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '800', color: T.text },
  statLabel: { fontSize: 11, color: T.muted, fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: T.border },

  // Items liste
  groupItem: {
    backgroundColor: T.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  parentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: T.surface,
  },
  iconBoxParent: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: T.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.accentMid,
    flexShrink: 0,
  },
  iconBoxChild: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: T.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
    flexShrink: 0,
  },
  itemBody: { flex: 1, gap: 2 },
  parentName: { fontSize: 13, fontWeight: '700', color: T.text },
  childName: { fontSize: 12, fontWeight: '600', color: T.muted },
  itemSlug: {
    fontSize: 10,
    color: T.subtle,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  countBadge: {
    backgroundColor: T.accentLight,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: T.accentMid,
  },
  countBadgeText: { fontSize: 10, fontWeight: '700', color: T.accent },
  itemActions: { flexDirection: 'row', gap: 4 },
  iconBtnSm: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: T.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  iconBtnDanger: { backgroundColor: T.dangerLight, borderColor: '#FECACA' },

  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderColor: T.border,
  },
  childConnector: { alignItems: 'center', paddingRight: 2, flexShrink: 0 },
  connectorLine: { width: 1, height: 8, backgroundColor: T.border },
  connectorDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: T.borderStrong,
    backgroundColor: T.surface,
  },

  // Bouton nouveau
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
  main: { flex: 1 },
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
  mainPanelTitle: { fontSize: 18, fontWeight: '800', color: T.text },
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

  mainEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  mainEmptySubtitle: {
    fontSize: 14,
    color: T.muted,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
  },
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