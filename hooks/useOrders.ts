import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from './useAuth';

export type Order = {
  id: string;
  user_id: string;
  total_amount: number;
  shipping_address: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export function useOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('order')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setOrders(data || []);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.id]);

  return { orders, loading, error };
}
