import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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

// ─── Design tokens (identiques à Products) ───────────────────────────────────

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
  successMid: '#A7F3D0',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  warningMid: '#FCD34D',
  info: '#3B82F6',
  infoLight: '#EFF6FF',
  infoMid: '#BFDBFE',
};

// ─── Statuts ──────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending:    { label: 'En attente',  bg: T.warningLight, text: '#92400E', dot: T.warning },
  confirmed:  { label: 'Confirmée',   bg: T.infoLight,    text: '#1E3A8A', dot: T.info },
  shipped:    { label: 'Expédiée',    bg: T.accentLight,  text: '#3730A3', dot: T.accent },
  delivered:  { label: 'Livrée',      bg: T.successLight, text: '#065F46', dot: T.success },
  cancelled:  { label: 'Annulée',     bg: T.dangerLight,  text: '#991B1B', dot: T.danger },
};

const STATUSES = Object.entries(STATUS_MAP).map(([key, val]) => ({ key, ...val }));

// ─── Types ────────────────────────────────────────────────────────────────────

type Order = {
  id: string;
  user_id: string;
  total_amount: number;
  shipping_address: string;
  status: string;
  created_at: string;
};

type OrderItem = {
  id: string;
  quantity: number;
  unit_price: number;
  variant_id: string;
  product_variant: {
    id: string;
    sku: string;
    size: string;
    color: string;
    product: { name: string };
  } | null;
};

type Variant = {
  id: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
  product: { id: string; name: string; price: number };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WEB_BREAKPOINT = 768;

function useIsWeb() {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= WEB_BREAKPOINT;
}

function formatDate(iso: string, long = false) {
  return new Date(iso).toLocaleDateString('fr-FR', long
    ? { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }
    : { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  );
}

function getStatus(status: string) {
  return STATUS_MAP[status] ?? { label: status, bg: T.bg, text: T.muted, dot: T.subtle };
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilter] = useState<string | null>(null);

  const [selected, setSelected] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [updatingStatus, setUpdating] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false); // web: panel, mobile: modal

  const [addModalVisible, setAddModal] = useState(false);
  const [allVariants, setAllVariants] = useState<Variant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantSearch, setVariantSearch] = useState('');
  const [addingVariantId, setAddingVariantId] = useState<string | null>(null);

  const isWeb = useIsWeb();

  // ── Fetch ──────────────────────────────────────────────────────────────────

  async function fetchOrders() {
    const { data } = await supabase
      .from('order')
      .select('id, user_id, total_amount, shipping_address, status, created_at')
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { fetchOrders(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  async function fetchItems(orderId: string) {
    setLoadingItems(true);
    const { data } = await supabase
      .from('order_item')
      .select(`id, quantity, unit_price, variant_id,
        product_variant ( id, sku, size, color, product ( name ) )`)
      .eq('order_id', orderId);
    setOrderItems((data as any) || []);
    setLoadingItems(false);
  }

  async function recalcTotal(orderId: string, items: OrderItem[]) {
    const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    await supabase.from('order').update({ total_amount: total }).eq('id', orderId);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, total_amount: total } : o)));
    setSelected((s) => (s ? { ...s, total_amount: total } : null));
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async function openOrder(order: Order) {
    setSelected(order);
    setPanelVisible(true);
    await fetchItems(order.id);
  }

  async function updateStatus(newStatus: string) {
    if (!selected) return;
    setUpdating(true);
    const { error } = await supabase.from('order').update({ status: newStatus }).eq('id', selected.id);
    if (!error) {
      setOrders((prev) => prev.map((o) => (o.id === selected.id ? { ...o, status: newStatus } : o)));
      setSelected((s) => (s ? { ...s, status: newStatus } : null));
    }
    setUpdating(false);
  }

  async function updateQty(item: OrderItem, delta: number) {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    const updatedItems = orderItems.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i));
    setOrderItems(updatedItems);
    await supabase.from('order_item').update({ quantity: newQty }).eq('id', item.id);
    await recalcTotal(selected!.id, updatedItems);
  }

  async function setQtyDirect(item: OrderItem, value: string) {
    const newQty = parseInt(value) || 1;
    const updatedItems = orderItems.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i));
    setOrderItems(updatedItems);
    await supabase.from('order_item').update({ quantity: newQty }).eq('id', item.id);
    await recalcTotal(selected!.id, updatedItems);
  }

  async function deleteItem(item: OrderItem) {
    const name = item.product_variant?.product?.name ?? 'cet article';
    const confirmed =
      Platform.OS === 'web'
        ? window.confirm(`Retirer "${name}" de la commande ?`)
        : await new Promise<boolean>((resolve) =>
            require('react-native').Alert.alert('Retirer', `Retirer "${name}" ?`, [
              { text: 'Annuler', onPress: () => resolve(false) },
              { text: 'Retirer', style: 'destructive', onPress: () => resolve(true) },
            ]),
          );
    if (!confirmed) return;
    const updatedItems = orderItems.filter((i) => i.id !== item.id);
    setOrderItems(updatedItems);
    await supabase.from('order_item').delete().eq('id', item.id);
    await recalcTotal(selected!.id, updatedItems);
  }

  async function openAddItem() {
    setAddModal(true);
    setVariantSearch('');
    setLoadingVariants(true);
    const { data } = await supabase
      .from('product_variant')
      .select('id, sku, size, color, stock, product ( id, name, price )');
    setAllVariants((data as any) || []);
    setLoadingVariants(false);
  }

  async function addItem(variant: Variant) {
    if (!selected) return;
    setAddingVariantId(variant.id);
    const existing = orderItems.find((i) => i.variant_id === variant.id);
    if (existing) {
      await updateQty(existing, 1);
    } else {
      const { data, error } = await supabase
        .from('order_item')
        .insert({
          order_id: selected.id,
          variant_id: variant.id,
          quantity: 1,
          unit_price: variant.product.price,
        })
        .select(`id, quantity, unit_price, variant_id,
          product_variant ( id, sku, size, color, product ( name ) )`)
        .single();
      if (!error && data) {
        const updatedItems = [...orderItems, data as any];
        setOrderItems(updatedItems);
        await recalcTotal(selected.id, updatedItems);
      }
    }
    setAddingVariantId(null);
    setAddModal(false);
  }

  // ── Filtres ───────────────────────────────────────────────────────────────

  const filtered = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(search.toLowerCase()) &&
      (!filterStatus || o.status === filterStatus),
  );

  const filteredVariants = allVariants.filter(
    (v) =>
      v.product?.name?.toLowerCase().includes(variantSearch.toLowerCase()) ||
      v.sku?.toLowerCase().includes(variantSearch.toLowerCase()) ||
      v.size?.toLowerCase().includes(variantSearch.toLowerCase()) ||
      v.color?.toLowerCase().includes(variantSearch.toLowerCase()),
  );

  const orderTotal = orderItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={T.accent} />
        <Text style={s.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // ── Contenu du panneau détail (partagé web + mobile) ──────────────────────

  const DetailPanel = selected ? (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* En-tête commande */}
      <View style={s.detailOrderHead}>
        <View>
          <Text style={s.detailOrderId}>#{selected.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={s.detailOrderDate}>{formatDate(selected.created_at, true)}</Text>
        </View>
        <View>
          <Text style={s.detailAmount}>{Number(selected.total_amount).toFixed(2)} €</Text>
          <Text style={s.detailAmountLabel}>total TTC</Text>
        </View>
      </View>

      {/* Statut courant */}
      {(() => {
        const st = getStatus(selected.status);
        return (
          <View style={[s.currentStatusBadge, { backgroundColor: st.bg }]}>
            <View style={[s.dot, { backgroundColor: st.dot }]} />
            <Text style={[s.currentStatusText, { color: st.text }]}>{st.label}</Text>
          </View>
        );
      })()}

      {/* Changer statut */}
      <SectionLabel text="Changer le statut" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
          {STATUSES.map((st) => {
            const isActive = selected.status === st.key;
            return (
              <TouchableOpacity
                key={st.key}
                disabled={updatingStatus}
                style={[
                  s.statusBtn,
                  {
                    borderColor: st.dot,
                    backgroundColor: isActive ? st.dot : 'transparent',
                  },
                ]}
                onPress={() => updateStatus(st.key)}
              >
                {updatingStatus && isActive ? (
                  <ActivityIndicator size="small" color={isActive ? '#fff' : st.dot} />
                ) : (
                  <Text style={[s.statusBtnText, { color: isActive ? '#fff' : st.dot }]}>
                    {st.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Adresse */}
      {selected.shipping_address ? (
        <>
          <SectionLabel text="Adresse de livraison" />
          <View style={s.addressBox}>
            <Ionicons name="location-outline" size={15} color={T.muted} style={{ marginTop: 1 }} />
            <Text style={s.addressText}>{selected.shipping_address}</Text>
          </View>
        </>
      ) : null}

      {/* Articles */}
      <View style={s.itemsHeaderRow}>
        <SectionLabel text={`Articles (${orderItems.length})`} />
        <TouchableOpacity style={s.btnAddItem} onPress={openAddItem}>
          <Ionicons name="add-circle-outline" size={15} color={T.accent} />
          <Text style={s.btnAddItemText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      {loadingItems ? (
        <ActivityIndicator color={T.accent} style={{ marginVertical: 20 }} />
      ) : orderItems.length === 0 ? (
        <View style={s.emptyItems}>
          <Ionicons name="bag-outline" size={28} color={T.border} />
          <Text style={s.emptyText}>Aucun article</Text>
        </View>
      ) : (
        orderItems.map((item) => (
          <View key={item.id} style={s.itemCard}>
            <View style={s.itemTopRow}>
              <Text style={s.itemName}>
                {item.product_variant?.product?.name ?? 'Produit inconnu'}
              </Text>
              <TouchableOpacity style={s.itemDeleteBtn} onPress={() => deleteItem(item)}>
                <Ionicons name="trash-outline" size={13} color={T.danger} />
              </TouchableOpacity>
            </View>
            <View style={s.itemChips}>
              {[item.product_variant?.size, item.product_variant?.color, item.product_variant?.sku]
                .filter(Boolean)
                .map((chip, idx) => (
                  <View key={idx} style={s.chip}>
                    <Text style={s.chipText}>{chip}</Text>
                  </View>
                ))}
            </View>
            <View style={s.itemBottomRow}>
              <Text style={s.itemUnitPrice}>{item.unit_price.toFixed(2)} € / u</Text>
              <View style={s.stepper}>
                <TouchableOpacity
                  style={s.stepperBtn}
                  onPress={() => updateQty(item, -1)}
                  disabled={item.quantity <= 1}
                >
                  <Ionicons name="remove" size={15} color={item.quantity <= 1 ? T.border : T.text} />
                </TouchableOpacity>
                <TextInput
                  style={s.stepperInput}
                  value={String(item.quantity)}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  onEndEditing={(e) => setQtyDirect(item, e.nativeEvent.text)}
                />
                <TouchableOpacity style={s.stepperBtn} onPress={() => updateQty(item, 1)}>
                  <Ionicons name="add" size={15} color={T.text} />
                </TouchableOpacity>
              </View>
              <Text style={s.itemSubtotal}>{(item.unit_price * item.quantity).toFixed(2)} €</Text>
            </View>
          </View>
        ))
      )}

      {/* Total */}
      <View style={s.totalBox}>
        <Text style={s.totalLabel}>Total commande</Text>
        <Text style={s.totalValue}>{orderTotal.toFixed(2)} €</Text>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  ) : null;

  // ── Vue WEB ────────────────────────────────────────────────────────────────

  if (isWeb) {
    return (
      <View style={ws.container}>
        {/* Sidebar */}
        <View style={ws.sidebar}>
          <View style={ws.sidebarHeader}>
            <Text style={ws.sidebarTitle}>Commandes</Text>
            <Text style={ws.sidebarCount}>
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Search */}
          <View style={ws.searchWrap}>
            <Ionicons name="search-outline" size={15} color={T.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={ws.searchInput}
              placeholder="Rechercher par ID..."
              placeholderTextColor={T.subtle}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={15} color={T.subtle} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filtres statut */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={[ws.filterChip, !filterStatus && ws.filterChipActive]}
                onPress={() => setFilter(null)}
              >
                <Text style={[ws.filterChipText, !filterStatus && ws.filterChipTextActive]}>
                  Toutes · {orders.length}
                </Text>
              </TouchableOpacity>
              {STATUSES.map((st) => (
                <TouchableOpacity
                  key={st.key}
                  style={[
                    ws.filterChip,
                    filterStatus === st.key && { backgroundColor: st.bg, borderColor: st.dot },
                  ]}
                  onPress={() => setFilter(filterStatus === st.key ? null : st.key)}
                >
                  <View style={[ws.filterDot, { backgroundColor: st.dot }]} />
                  <Text style={[ws.filterChipText, filterStatus === st.key && { color: st.text, fontWeight: '700' }]}>
                    {st.label} · {orders.filter((o) => o.status === st.key).length}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Liste */}
          <FlatList
            data={filtered}
            keyExtractor={(o) => o.id}
            contentContainerStyle={{ gap: 6, paddingBottom: 20 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />
            }
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="receipt-outline" size={32} color={T.border} />
                <Text style={s.emptyText}>Aucune commande</Text>
              </View>
            }
            renderItem={({ item }) => {
              const st = getStatus(item.status);
              const isSelected = selected?.id === item.id;
              return (
                <TouchableOpacity
                  style={[ws.sidebarItem, isSelected && ws.sidebarItemActive]}
                  onPress={() => openOrder(item)}
                  activeOpacity={0.8}
                >
                  <View style={[ws.accentBar, { backgroundColor: st.dot }]} />
                  <View style={ws.sidebarItemBody}>
                    <View style={ws.sidebarItemTop}>
                      <Text style={ws.sidebarItemId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                      <View style={[ws.statusBadge, { backgroundColor: st.bg }]}>
                        <View style={[ws.statusDot, { backgroundColor: st.dot }]} />
                        <Text style={[ws.statusBadgeText, { color: st.text }]}>{st.label}</Text>
                      </View>
                    </View>
                    <View style={ws.sidebarItemBottom}>
                      <Text style={ws.sidebarItemDate}>
                        {new Date(item.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </Text>
                      <Text style={ws.sidebarItemAmount}>
                        {Number(item.total_amount).toFixed(2)} €
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Main panel */}
        <View style={ws.main}>
          {panelVisible && selected ? (
            <View style={ws.mainPanel}>
              <View style={ws.mainPanelHeader}>
                <Text style={ws.mainPanelTitle}>Détail de la commande</Text>
                <TouchableOpacity style={ws.closeBtn} onPress={() => setPanelVisible(false)}>
                  <Ionicons name="close" size={18} color={T.muted} />
                </TouchableOpacity>
              </View>
              {DetailPanel}
            </View>
          ) : (
            <View style={ws.mainEmpty}>
              <View style={ws.mainEmptyIcon}>
                <Ionicons name="receipt-outline" size={40} color={T.accent} />
              </View>
              <Text style={ws.mainEmptyTitle}>Sélectionnez une commande</Text>
              <Text style={ws.mainEmptySubtitle}>
                Cliquez sur une commande dans la liste pour voir son détail et gérer son statut.
              </Text>
            </View>
          )}
        </View>

        {/* Modal ajout article (web aussi) */}
        <AddItemModal
          visible={addModalVisible}
          onClose={() => setAddModal(false)}
          loading={loadingVariants}
          variants={filteredVariants}
          variantSearch={variantSearch}
          onSearch={setVariantSearch}
          orderItems={orderItems}
          addingVariantId={addingVariantId}
          onAdd={addItem}
        />
      </View>
    );
  }

  // ── Vue MOBILE ─────────────────────────────────────────────────────────────

  return (
    <View style={s.container}>
      {/* Top bar */}
      <View style={s.topBar}>
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={16} color={T.muted} style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Rechercher par ID..."
            placeholderTextColor={T.subtle}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={15} color={T.subtle} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtres statut */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filtersBar}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}
      >
        <TouchableOpacity
          style={[s.filterChip, !filterStatus && s.filterChipActive]}
          onPress={() => setFilter(null)}
        >
          <Text style={[s.filterChipText, !filterStatus && s.filterChipTextActive]}>
            Toutes · {orders.length}
          </Text>
        </TouchableOpacity>
        {STATUSES.map((st) => (
          <TouchableOpacity
            key={st.key}
            style={[
              s.filterChip,
              filterStatus === st.key && { backgroundColor: st.bg, borderColor: st.dot },
            ]}
            onPress={() => setFilter(filterStatus === st.key ? null : st.key)}
          >
            <View style={[s.filterDot, { backgroundColor: st.dot }]} />
            <Text style={[s.filterChipText, filterStatus === st.key && { color: st.text, fontWeight: '700' }]}>
              {st.label} · {orders.filter((o) => o.status === st.key).length}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.count}>
        {filtered.length} commande{filtered.length > 1 ? 's' : ''}
      </Text>

      {/* Liste */}
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.accent} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="receipt-outline" size={40} color={T.border} />
            <Text style={s.emptyText}>Aucune commande trouvée</Text>
          </View>
        }
        renderItem={({ item }) => {
          const st = getStatus(item.status);
          return (
            <TouchableOpacity style={s.card} onPress={() => openOrder(item)} activeOpacity={0.8}>
              <View style={[s.cardAccentBar, { backgroundColor: st.dot }]} />
              <View style={s.cardBody}>
                <View style={s.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                    <Text style={s.cardDate}>{formatDate(item.created_at)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={s.cardAmount}>{Number(item.total_amount).toFixed(2)} €</Text>
                    <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                      <View style={[s.dot, { backgroundColor: st.dot }]} />
                      <Text style={[s.statusBadgeText, { color: st.text }]}>{st.label}</Text>
                    </View>
                  </View>
                </View>
                {item.shipping_address ? (
                  <Text style={s.cardAddress} numberOfLines={1}>
                    {item.shipping_address}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Modal détail mobile */}
      <Modal visible={panelVisible} animationType="slide" transparent>
        <Pressable style={s.overlay} onPress={() => setPanelVisible(false)} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>Détail de la commande</Text>
            <TouchableOpacity style={s.closeBtn} onPress={() => setPanelVisible(false)}>
              <Ionicons name="close" size={18} color={T.muted} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            {DetailPanel}
          </View>
        </View>
      </Modal>

      {/* Modal ajout article */}
      <AddItemModal
        visible={addModalVisible}
        onClose={() => setAddModal(false)}
        loading={loadingVariants}
        variants={filteredVariants}
        variantSearch={variantSearch}
        onSearch={setVariantSearch}
        orderItems={orderItems}
        addingVariantId={addingVariantId}
        onAdd={addItem}
      />
    </View>
  );
}

// ─── Modal ajout article (composant partagé) ──────────────────────────────────

function AddItemModal({
  visible, onClose, loading, variants, variantSearch, onSearch,
  orderItems, addingVariantId, onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  variants: Variant[];
  variantSearch: string;
  onSearch: (v: string) => void;
  orderItems: OrderItem[];
  addingVariantId: string | null;
  onAdd: (v: Variant) => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={s.overlay} onPress={onClose} />
      <View style={[s.sheet, { maxHeight: '80%' }]}>
        <View style={s.sheetHandle} />
        <View style={s.sheetHeader}>
          <Text style={s.sheetTitle}>Ajouter un article</Text>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={18} color={T.muted} />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <View style={s.searchWrap}>
            <Ionicons name="search-outline" size={15} color={T.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={s.searchInput}
              placeholder="Nom, taille, couleur, SKU..."
              placeholderTextColor={T.subtle}
              value={variantSearch}
              onChangeText={onSearch}
              autoFocus
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={T.accent} style={{ marginVertical: 30 }} />
        ) : (
          <FlatList
            data={variants}
            keyExtractor={(v) => v.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 8 }}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyText}>Aucun variant trouvé</Text>
              </View>
            }
            renderItem={({ item: variant }) => {
              const alreadyIn = orderItems.find((i) => i.variant_id === variant.id);
              const isAdding = addingVariantId === variant.id;
              return (
                <TouchableOpacity
                  style={s.variantRow}
                  onPress={() => onAdd(variant)}
                  disabled={isAdding}
                  activeOpacity={0.75}
                >
                  <View style={{ flex: 1, gap: 5 }}>
                    <Text style={s.variantName}>{variant.product?.name}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                      {[variant.size, variant.color, variant.sku].filter(Boolean).map((chip, idx) => (
                        <View key={idx} style={s.chip}>
                          <Text style={s.chipText}>{chip}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Text style={s.variantPrice}>{variant.product?.price?.toFixed(2)} €</Text>
                      <Text style={s.variantStock}>Stock : {variant.stock}</Text>
                    </View>
                  </View>
                  {isAdding ? (
                    <ActivityIndicator size="small" color={T.accent} />
                  ) : alreadyIn ? (
                    <View style={s.addBadgeSecondary}>
                      <Text style={s.addBadgeSecondaryText}>+1</Text>
                    </View>
                  ) : (
                    <View style={s.addBadge}>
                      <Ionicons name="add" size={18} color={T.accent} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </Modal>
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
      marginTop: 24,
      marginBottom: 10,
    }}>
      {text}
    </Text>
  );
}

// ─── Styles communs (mobile + partagés) ──────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: T.bg, gap: 12 },
  loadingText: { fontSize: 14, color: T.muted },

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
    height: 40,
  },
  searchInput: { flex: 1, color: T.text, fontSize: 14 },

  filtersBar: { backgroundColor: T.surface, borderBottomWidth: 1, borderColor: T.border },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    marginVertical: 8,
    gap: 6,
  },
  filterChipActive: { backgroundColor: T.accentLight, borderColor: T.accentMid },
  filterChipText: { fontSize: 12, color: T.muted, fontWeight: '600' },
  filterChipTextActive: { color: T.accent },
  filterDot: { width: 6, height: 6, borderRadius: 3 },

  count: {
    fontSize: 11,
    color: T.muted,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  list: { padding: 12, paddingTop: 4, gap: 8, paddingBottom: 40 },

  // Card commande
  card: {
    flexDirection: 'row',
    backgroundColor: T.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: T.border,
  },
  cardAccentBar: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 8 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardId: { fontSize: 15, fontWeight: '800', color: T.text, marginBottom: 3 },
  cardDate: { fontSize: 11, color: T.muted },
  cardAmount: { fontSize: 17, fontWeight: '800', color: T.text },
  cardAddress: { fontSize: 12, color: T.muted },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  dot: { width: 6, height: 6, borderRadius: 3 },

  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { color: T.muted, fontSize: 14, fontWeight: '500' },

  // Modal
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: T.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
    maxHeight: '93%',
    marginTop: 'auto',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: T.border, borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: T.text },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: T.bg,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.border,
  },

  // Détail
  detailOrderHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8,
  },
  detailOrderId: { fontSize: 20, fontWeight: '800', color: T.text },
  detailOrderDate: { fontSize: 12, color: T.muted, marginTop: 3 },
  detailAmount: { fontSize: 22, fontWeight: '800', color: T.text, textAlign: 'right' },
  detailAmountLabel: { fontSize: 11, color: T.muted, textAlign: 'right' },

  currentStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginTop: 14, alignSelf: 'flex-start',
  },
  currentStatusText: { fontSize: 13, fontWeight: '700' },

  statusBtn: {
    borderRadius: 8, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 8, minWidth: 90, alignItems: 'center',
  },
  statusBtnText: { fontSize: 12, fontWeight: '700' },

  addressBox: {
    flexDirection: 'row', gap: 8, backgroundColor: T.bg,
    borderRadius: 10, padding: 12, borderWidth: 1, borderColor: T.border,
  },
  addressText: { flex: 1, fontSize: 13, color: T.text, lineHeight: 20 },

  itemsHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  btnAddItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  btnAddItemText: { color: T.accent, fontSize: 13, fontWeight: '700' },

  emptyItems: { alignItems: 'center', paddingVertical: 24, gap: 8 },

  itemCard: {
    backgroundColor: T.bg, borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: T.border, gap: 8,
  },
  itemTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: { flex: 1, fontSize: 14, fontWeight: '700', color: T.text },
  itemDeleteBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: T.dangerLight,
    justifyContent: 'center', alignItems: 'center',
  },
  itemChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
  },
  chipText: { fontSize: 11, color: T.muted, fontWeight: '600' },

  itemBottomRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  itemUnitPrice: { fontSize: 12, color: T.muted, flex: 1 },
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.surface, borderRadius: 8,
    borderWidth: 1, borderColor: T.border, overflow: 'hidden',
  },
  stepperBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  stepperInput: {
    width: 36, height: 32, textAlign: 'center', fontSize: 14,
    fontWeight: '700', color: T.text, borderLeftWidth: 1, borderRightWidth: 1, borderColor: T.border,
  },
  itemSubtotal: { fontSize: 14, fontWeight: '800', color: T.text, minWidth: 60, textAlign: 'right' },

  totalBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: T.accentLight, borderRadius: 12, padding: 16, marginTop: 12,
    borderWidth: 1, borderColor: T.accentMid,
  },
  totalLabel: { fontSize: 13, fontWeight: '700', color: T.accent },
  totalValue: { fontSize: 20, fontWeight: '800', color: T.accent },

  // Variant rows (modal ajout)
  variantRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface,
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: T.border, gap: 12,
  },
  variantName: { fontSize: 14, fontWeight: '700', color: T.text },
  variantPrice: { fontSize: 13, fontWeight: '700', color: T.accent },
  variantStock: { fontSize: 12, color: T.muted },
  addBadge: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: T.accentLight,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.accentMid,
  },
  addBadgeSecondary: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: T.successLight,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.successMid,
  },
  addBadgeSecondaryText: { fontSize: 12, fontWeight: '800', color: T.success },
});

// ─── Styles WEB ───────────────────────────────────────────────────────────────

const ws = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: T.bg },

  sidebar: {
    width: 340, backgroundColor: T.surface,
    borderRightWidth: 1, borderColor: T.border,
    padding: 16, paddingTop: 24,
  },
  sidebarHeader: { marginBottom: 14 },
  sidebarTitle: { fontSize: 22, fontWeight: '800', color: T.text, marginBottom: 4 },
  sidebarCount: { fontSize: 12, color: T.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.bg, borderRadius: 10,
    paddingHorizontal: 12, borderWidth: 1, borderColor: T.border,
    marginBottom: 10, height: 38,
  },
  searchInput: { flex: 1, color: T.text, fontSize: 14 },

  filterChip: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, gap: 5,
  },
  filterChipActive: { backgroundColor: T.accentLight, borderColor: T.accentMid },
  filterChipText: { fontSize: 11, color: T.muted, fontWeight: '600' },
  filterChipTextActive: { color: T.accent },
  filterDot: { width: 6, height: 6, borderRadius: 3 },

  sidebarItem: {
    flexDirection: 'row', backgroundColor: T.bg,
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: T.border,
  },
  sidebarItemActive: { borderColor: T.accentMid, backgroundColor: T.accentLight },
  accentBar: { width: 4 },
  sidebarItemBody: { flex: 1, padding: 12, gap: 6 },
  sidebarItemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sidebarItemId: { fontSize: 13, fontWeight: '800', color: T.text },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  sidebarItemBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sidebarItemDate: { fontSize: 11, color: T.muted },
  sidebarItemAmount: { fontSize: 13, fontWeight: '800', color: T.text },

  main: { flex: 1 },
  mainPanel: {
    flex: 1, backgroundColor: T.surface,
    margin: 24, borderRadius: 20, padding: 28,
    borderWidth: 1, borderColor: T.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 16,
  },
  mainPanelHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, paddingBottom: 16, borderBottomWidth: 1, borderColor: T.border,
  },
  mainPanelTitle: { fontSize: 18, fontWeight: '800', color: T.text },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: T.bg,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: T.border,
  },

  mainEmpty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12,
  },
  mainEmptyIcon: {
    width: 80, height: 80, borderRadius: 20, backgroundColor: T.accentLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  mainEmptyTitle: { fontSize: 20, fontWeight: '800', color: T.text, textAlign: 'center' },
  mainEmptySubtitle: {
    fontSize: 14, color: T.muted, textAlign: 'center', maxWidth: 300, lineHeight: 22,
  },
});