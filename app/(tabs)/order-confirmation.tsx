import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, Pressable, View } from 'react-native';

export default function OrderConfirmation() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 16,
      }}
    >
      <Text style={{ fontSize: 64 }}>✅</Text>

      <Text style={{ fontSize: 26, fontWeight: '700', color: '#111', textAlign: 'center' }}>
        Order Confirmed!
      </Text>

      <Text style={{ fontSize: 16, color: '#555', textAlign: 'center' }}>
        Thank you for your purchase
      </Text>

      <Text style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>
        Order ID: {orderId}
      </Text>

      <Text style={{ fontSize: 14, color: '#888', textAlign: 'center' }}>
        Check your email for order details
      </Text>

      <Pressable
        onPress={() => router.push('/')}
        style={{
          backgroundColor: '#000',
          paddingHorizontal: 32,
          paddingVertical: 12,
          borderRadius: 4,
          marginTop: 8,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>
          Continue Shopping
        </Text>
      </Pressable>
    </ScrollView>
  );
}
