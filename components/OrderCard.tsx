import { Pressable, Text, View } from 'react-native';
import { Order } from '@/hooks/useOrders';

type OrderCardProps = {
  order: Order;
  onPress: (orderId: string) => void;
};

export default function OrderCard({ order, onPress }: OrderCardProps) {
  return (
    <Pressable
      onPress={() => onPress(order.id)}
      style={{
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 12,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontWeight: '600', color: '#111', fontSize: 14 }}>
          Order {order.id.slice(0, 8)}
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: order.status === 'paid' ? '#27ae60' : '#f39c12',
          }}
        >
          {order.status.toUpperCase()}
        </Text>
      </View>

      <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 4, color: '#111' }}>
        €{order.total_amount.toFixed(2)}
      </Text>

      <Text style={{ fontSize: 12, color: '#888' }}>
        {new Date(order.created_at).toLocaleDateString()}
      </Text>
    </Pressable>
  );
}
