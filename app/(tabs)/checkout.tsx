import { useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  View,
} from 'react-native';
import { useCart } from '@/hooks/useCart';
import { useMockCheckout } from '@/hooks/useMockCheckout';

export default function Checkout() {
  const { items, totalPrice } = useCart();
  const { processPayment, loading } = useMockCheckout();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const handlePay = async () => {
    try {
      if (!fullName || !email || !address) {
        Alert.alert('Error', 'Please fill all fields');
        return;
      }
      await processPayment(fullName, email, address);
    } catch (error: any) {
      Alert.alert('Payment failed', error?.message ?? 'Unknown error');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: '#111' }}>Checkout</Text>

      <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>Order Summary</Text>
      {items.map((item) => (
        <View
          key={item.variant_id}
          style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}
        >
          <Text style={{ color: '#111' }}>
            {item.product_name} x{item.quantity}
          </Text>
          <Text style={{ color: '#111', fontWeight: '600' }}>
            €{(item.product_price * item.quantity).toFixed(2)}
          </Text>
        </View>
      ))}
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#111', textAlign: 'right' }}>
        Total: €{totalPrice.toFixed(2)}
      </Text>

      <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>Shipping Information</Text>

      <TextInput
        placeholder="Full name"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        editable={!loading}
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          padding: 12,
          fontSize: 14,
          color: '#111',
          backgroundColor: '#fafafa',
        }}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          padding: 12,
          fontSize: 14,
          color: '#111',
          backgroundColor: '#fafafa',
        }}
      />
      <TextInput
        placeholder="Shipping address"
        value={address}
        onChangeText={setAddress}
        editable={!loading}
        style={{
          borderWidth: 1,
          borderColor: '#ddd',
          borderRadius: 8,
          padding: 12,
          fontSize: 14,
          color: '#111',
          backgroundColor: '#fafafa',
        }}
      />

      <Pressable
        onPress={handlePay}
        disabled={loading}
        style={({ pressed }) => ({
          backgroundColor: loading ? '#999' : pressed ? '#333' : '#111',
          borderRadius: 10,
          paddingVertical: 16,
          alignItems: 'center',
        })}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
            Pay €{totalPrice.toFixed(2)}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
