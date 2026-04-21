import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '@/hooks/useCart';
import type { CartItem } from '@/context/CartContext';

// ─── Props ────────────────────────────────────────────────────────────────────

type CartModalProps = {
  visible: boolean;
  onClose: () => void;
};

// ─── Cart Item Row ────────────────────────────────────────────────────────────

function CartItemRow({ item }: { item: CartItem }) {
  const { removeItem, updateQuantity } = useCart();

  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.itemName}>{item.product_name}</Text>
        {(item.size || item.color) ? (
          <Text style={styles.itemVariant}>
            {[item.size, item.color].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        <Text style={styles.itemPrice}>
          €{(item.product_price * item.quantity).toFixed(2)}
        </Text>
      </View>

      <View style={styles.qtyControls}>
        <Pressable
          style={styles.qtyButton}
          onPress={() => updateQuantity(item.variant_id, item.quantity - 1)}
        >
          <Text style={styles.qtyButtonText}>−</Text>
        </Pressable>

        <Text style={styles.qtyValue}>{item.quantity}</Text>

        <Pressable
          style={styles.qtyButton}
          onPress={() => updateQuantity(item.variant_id, item.quantity + 1)}
        >
          <Text style={styles.qtyButtonText}>+</Text>
        </Pressable>

        <Pressable
          style={styles.removeButton}
          onPress={() => removeItem(item.variant_id)}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function CartModal({ visible, onClose }: CartModalProps) {
  const { items, totalPrice } = useCart();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Cart</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        {/* Corps */}
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={(item) => item.variant_id}
              renderItem={({ item }) => <CartItemRow item={item} />}
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalPrice}>€{totalPrice.toFixed(2)}</Text>
              </View>

              <Pressable style={styles.checkoutButton} onPress={() => {}}>
                <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={onClose}>
                <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
              </Pressable>
            </View>
          </>
        )}

      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
  },
  list: {
    padding: 16,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  itemVariant: {
    fontSize: 12,
    color: '#888',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d6a4f',
    marginTop: 2,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 18,
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#fdecea',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  removeButtonText: {
    fontSize: 12,
    color: '#c0392b',
  },
  footer: {
    padding: 16,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  checkoutButton: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
});
