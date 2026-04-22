import { useState } from 'react';
import { useAuth } from './useAuth';
import { useCart } from './useCart';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabaseClient';

export function useMockCheckout() {
  const { user } = useAuth();
  const { items: cartItems, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const processPayment = async (
    fullName: string,
    email: string,
    address: string
  ) => {
    try {
      setLoading(true);

      if (!user) throw new Error('Not authenticated');
      if (cartItems.length === 0) throw new Error('Cart is empty');
      if (!fullName || !email || !address) {
        throw new Error('All fields are required');
      }

      const { data: order, error: orderError } = await supabase
        .from('order')
        .insert({
          user_id: user.id,
          total_amount: totalPrice,
          shipping_address: address,
          status: 'paid',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: item.product_price,
      }));

      const { error: itemsError } = await supabase
        .from('order_item')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      clearCart();

      router.push({
        pathname: '/order-confirmation',
        params: { orderId: order.id },
      });
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { processPayment, loading };
}
