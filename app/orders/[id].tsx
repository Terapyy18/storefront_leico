import { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  FlatList,
  View,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabaseClient';

type OrderItem = {
  id: string;
  order_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
};

type OrderDetail = {
  id: string;
  user_id: string;
  total_amount: number;
  shipping_address: string;
  status: string;
  created_at: string;
  order_item: OrderItem[];
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('order')
          .select('*, order_item(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 16, color: '#555' }}>Order not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 24, gap: 20 }}>
      {/* Title */}
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#111' }}>
        Order {order.id.slice(0, 8)}
      </Text>

      {/* Status */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <Text style={{ fontSize: 16, color: '#555' }}>Status</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: order.status === 'paid' ? '#27ae60' : '#f39c12' }}>
          {order.status.toUpperCase()}
        </Text>
      </View>

      {/* Order Date */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <Text style={{ fontSize: 16, color: '#555' }}>Order Date</Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111' }}>
          {new Date(order.created_at).toLocaleDateString()}
        </Text>
      </View>

      {/* Items */}
      <View style={{ gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111' }}>
          Items ({order.order_item?.length || 0})
        </Text>

        <FlatList
          data={order.order_item || []}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: '#fafafa', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 4 }}>
                Product (Variant: {item.variant_id.slice(0, 8)})
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: '#555' }}>Qty: {item.quantity}</Text>
                <Text style={{ fontSize: 14, color: '#555' }}>€{item.unit_price.toFixed(2)} each</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111', marginTop: 8, textAlign: 'right' }}>
                Subtotal: €{(item.quantity * item.unit_price).toFixed(2)}
              </Text>
            </View>
          )}
        />
      </View>

      {/* Total */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111' }}>Total</Text>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#111' }}>
          €{order.total_amount.toFixed(2)}
        </Text>
      </View>

      {/* Shipping Address */}
      <View style={{ paddingVertical: 12, gap: 8 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#111' }}>Shipping Address</Text>
        <View style={{ backgroundColor: '#fafafa', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#eee' }}>
          <Text style={{ fontSize: 15, color: '#555', lineHeight: 22 }}>
            {order.shipping_address}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
