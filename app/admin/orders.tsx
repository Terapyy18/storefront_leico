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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../services/supabaseClient';
import { COLORS, S, STATUS_MAP } from './_styles.order';

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

const STATUSES = Object.entries(STATUS_MAP).map(([key, val]) => ({ key, ...val }));

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
  const [modalVisible, setModalVisible] = useState(false);

  const [addModalVisible, setAddModal] = useState(false);
  const [allVariants, setAllVariants] = useState<Variant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantSearch, setVariantSearch] = useState('');
  const [addingVariantId, setAddingVariantId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchOrders();
  }, []);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  async function fetchItems(orderId: string) {
    setLoadingItems(true);
    const { data } = await supabase
      .from('order_item')
      .select(
        `id, quantity, unit_price, variant_id,
        product_variant ( id, sku, size, color, product ( name ) )`,
      )
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
    setModalVisible(true);
    await fetchItems(order.id);
  }

  async function updateStatus(newStatus: string) {
    if (!selected) return;
    setUpdating(true);
    const { error } = await supabase
      .from('order')
      .update({ status: newStatus })
      .eq('id', selected.id);
    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === selected.id ? { ...o, status: newStatus } : o)),
      );
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
        .select(
          `id, quantity, unit_price, variant_id,
          product_variant ( id, sku, size, color, product ( name ) )`,
        )
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

  // ── Rendu ─────────────────────────────────────────────────────────────────

  if (loading)
    return (
      <View style={S.center}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );

  return (
    <View style={S.container}>
      {/* Header */}
      <View style={S.header}>
        <Text style={S.headerEyebrow}>Gestion</Text>
        <Text style={S.headerTitle}>Commandes</Text>
      </View>

      {/* Recherche */}
      <View style={S.searchContainer}>
        <Ionicons name="search-outline" size={16} color={COLORS.textLight} />
        <TextInput
          style={S.searchInput}
          placeholder="Rechercher par ID..."
          placeholderTextColor={COLORS.textLight}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={S.filtersBar}
        contentContainerStyle={S.filtersContent}
      >
        <TouchableOpacity
          style={[S.filterPill, !filterStatus && S.filterPillActive]}
          onPress={() => setFilter(null)}
        >
          <Text style={[S.filterPillText, !filterStatus && S.filterPillTextActive]}>
            Toutes · {orders.length}
          </Text>
        </TouchableOpacity>
        {STATUSES.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[
              S.filterPill,
              filterStatus === s.key && { backgroundColor: s.bg, borderColor: s.dot },
            ]}
            onPress={() => setFilter(filterStatus === s.key ? null : s.key)}
          >
            <View style={[S.filterPillDot, { backgroundColor: s.dot }]} />
            <Text
              style={[
                S.filterPillText,
                filterStatus === s.key && { color: s.text, fontWeight: '700' },
              ]}
            >
              {s.label} · {orders.filter((o) => o.status === s.key).length}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Count */}
      <View style={S.countBar}>
        <Text style={S.countText}>
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Liste commandes */}
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={S.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
        ListEmptyComponent={
          <View style={S.empty}>
            <Ionicons name="receipt-outline" size={36} color={COLORS.border} />
            <Text style={S.emptyText}>Aucune commande trouvée</Text>
          </View>
        }
        renderItem={({ item }) => {
          const st = STATUS_MAP[item.status] ?? {
            bg: '#F3F4F6',
            text: '#374151',
            dot: '#9CA3AF',
            label: item.status,
          };
          return (
            <TouchableOpacity style={S.card} onPress={() => openOrder(item)} activeOpacity={0.8}>
              <View style={[S.cardAccentBar, { backgroundColor: st.dot }]} />
              <View style={S.cardInner}>
                <View style={S.cardTopRow}>
                  <View>
                    <Text style={S.cardId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                    <Text style={S.cardDate}>
                      {new Date(item.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={S.cardAmount}>{Number(item.total_amount).toFixed(2)} €</Text>
                    <Text style={S.cardAmountLabel}>total TTC</Text>
                  </View>
                </View>
                <View style={S.cardBottomRow}>
                  <Text style={S.cardAddress} numberOfLines={1}>
                    {item.shipping_address || 'Adresse non renseignée'}
                  </Text>
                  <View style={[S.statusBadge, { backgroundColor: st.bg }]}>
                    <View style={[S.statusBadgeDot, { backgroundColor: st.dot }]} />
                    <Text style={[S.statusBadgeText, { color: st.text }]}>{st.label}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* ═══ MODAL DÉTAIL ═══ */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <Pressable style={S.overlay} onPress={() => setModalVisible(false)} />
        <View style={S.sheet}>
          <View style={S.sheetHandle} />

          <View style={S.sheetHeaderArea}>
            <View>
              <Text style={S.sheetOrderId}>#{selected?.id.slice(0, 8).toUpperCase()}</Text>
              <Text style={S.sheetOrderDate}>
                {selected
                  ? new Date(selected.created_at).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={S.closeBtn}>
              <Ionicons name="close" size={18} color={COLORS.textMid} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={S.sheetBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Statuts */}
            <Text style={S.sectionLabel}>Changer le statut</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={S.statusScrollContent}
            >
              {STATUSES.map((s) => {
                const isActive = selected?.status === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    disabled={updatingStatus}
                    style={[
                      S.statusSelectorBtn,
                      { borderColor: s.dot, backgroundColor: isActive ? s.dot : 'transparent' },
                    ]}
                    onPress={() => updateStatus(s.key)}
                  >
                    {updatingStatus && isActive ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[S.statusSelectorText, { color: isActive ? '#fff' : s.dot }]}>
                        {s.label}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Adresse */}
            {selected?.shipping_address ? (
              <>
                <Text style={S.sectionLabel}>Adresse de livraison</Text>
                <View style={S.addressBox}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={COLORS.textLight}
                    style={{ marginTop: 1 }}
                  />
                  <Text style={S.addressText}>{selected.shipping_address}</Text>
                </View>
              </>
            ) : null}

            {/* Articles */}
            <View style={S.itemsHeaderRow}>
              <Text style={S.sectionLabel}>Articles ({orderItems.length})</Text>
              <TouchableOpacity style={S.btnAddItem} onPress={openAddItem}>
                <Ionicons name="add" size={14} color={COLORS.accent} />
                <Text style={S.btnAddItemText}>Ajouter un article</Text>
              </TouchableOpacity>
            </View>

            {loadingItems ? (
              <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 20 }} />
            ) : orderItems.length === 0 ? (
              <View style={S.emptyItems}>
                <Ionicons name="bag-outline" size={28} color={COLORS.border} />
                <Text style={S.emptyText}>Aucun article — appuyez sur Ajouter</Text>
              </View>
            ) : (
              orderItems.map((item) => (
                <View key={item.id} style={S.itemCard}>
                  <View style={S.itemTopRow}>
                    <Text style={S.itemName}>
                      {item.product_variant?.product?.name ?? 'Produit inconnu'}
                    </Text>
                    <TouchableOpacity style={S.itemDeleteBtn} onPress={() => deleteItem(item)}>
                      <Ionicons name="trash-outline" size={13} color="#DC2626" />
                    </TouchableOpacity>
                  </View>

                  <View style={S.itemVariantRow}>
                    {[
                      item.product_variant?.size,
                      item.product_variant?.color,
                      item.product_variant?.sku,
                    ]
                      .filter(Boolean)
                      .map((chip, idx) => (
                        <View key={idx} style={S.itemVariantChip}>
                          <Text style={S.itemVariantChipText}>{chip}</Text>
                        </View>
                      ))}
                  </View>

                  <View style={S.itemBottomRow}>
                    <Text style={S.itemUnitPrice}>{item.unit_price.toFixed(2)} € / unité</Text>
                    <View style={S.stepper}>
                      <TouchableOpacity
                        style={S.stepperBtn}
                        onPress={() => updateQty(item, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Ionicons
                          name="remove"
                          size={16}
                          color={item.quantity <= 1 ? COLORS.border : COLORS.text}
                        />
                      </TouchableOpacity>
                      <TextInput
                        style={S.stepperInput}
                        value={String(item.quantity)}
                        keyboardType="number-pad"
                        selectTextOnFocus
                        onEndEditing={(e) => setQtyDirect(item, e.nativeEvent.text)}
                      />
                      <TouchableOpacity style={S.stepperBtn} onPress={() => updateQty(item, 1)}>
                        <Ionicons name="add" size={16} color={COLORS.text} />
                      </TouchableOpacity>
                    </View>
                    <Text style={S.itemSubtotal}>
                      {(item.unit_price * item.quantity).toFixed(2)} €
                    </Text>
                  </View>
                </View>
              ))
            )}

            {/* Total */}
            <View style={S.totalBox}>
              <Text style={S.totalLabel}>Total commande</Text>
              <Text style={S.totalValue}>{orderTotal.toFixed(2)} €</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ═══ MODAL AJOUT ARTICLE ═══ */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <Pressable style={S.overlay} onPress={() => setAddModal(false)} />
        <View style={[S.sheet, { maxHeight: '80%' }]}>
          <View style={S.sheetHandle} />
          <View style={S.sheetHeaderArea}>
            <Text style={S.sheetOrderId}>Ajouter un article</Text>
            <TouchableOpacity onPress={() => setAddModal(false)} style={S.closeBtn}>
              <Ionicons name="close" size={18} color={COLORS.textMid} />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
            <View style={S.addSheetSearchWrap}>
              <Ionicons name="search-outline" size={16} color={COLORS.textLight} />
              <TextInput
                style={S.addSheetSearchInput}
                placeholder="Nom, taille, couleur, SKU..."
                placeholderTextColor={COLORS.textLight}
                value={variantSearch}
                onChangeText={setVariantSearch}
                autoFocus
              />
            </View>
          </View>

          {loadingVariants ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 30 }} />
          ) : (
            <FlatList
              data={filteredVariants}
              keyExtractor={(v) => v.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 8 }}
              ListEmptyComponent={
                <View style={S.empty}>
                  <Text style={S.emptyText}>Aucun variant trouvé</Text>
                </View>
              }
              renderItem={({ item: variant }) => {
                const alreadyIn = orderItems.find((i) => i.variant_id === variant.id);
                const isAdding = addingVariantId === variant.id;
                return (
                  <TouchableOpacity
                    style={S.variantRow}
                    onPress={() => addItem(variant)}
                    disabled={isAdding}
                    activeOpacity={0.75}
                  >
                    <View style={S.variantInfo}>
                      <Text style={S.variantName}>{variant.product?.name}</Text>
                      <View style={S.variantChips}>
                        {[variant.size, variant.color, variant.sku]
                          .filter(Boolean)
                          .map((chip, idx) => (
                            <View key={idx} style={S.variantChip}>
                              <Text style={S.variantChipText}>{chip}</Text>
                            </View>
                          ))}
                      </View>
                      <Text style={S.variantPrice}>{variant.product?.price?.toFixed(2)} €</Text>
                      <Text style={S.variantStock}>Stock : {variant.stock}</Text>
                    </View>
                    {isAdding ? (
                      <ActivityIndicator size="small" color={COLORS.accent} />
                    ) : alreadyIn ? (
                      <View style={S.alreadyBadge}>
                        <Text style={S.alreadyText}>+1</Text>
                      </View>
                    ) : (
                      <View style={S.addBadge}>
                        <Ionicons name="add" size={18} color={COLORS.accent} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
