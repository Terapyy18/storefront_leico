import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';

export type Product = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  category_id: string | null;
  is_active: boolean;
};

type UseProductsResult = {
  products: Product[];
  loading: boolean;
  error: string | null;
};

export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('product')
        .select('*')
        .eq('is_active', true);

      if (!isMounted) return;

      if (supabaseError) {
        console.error('[useProducts] Erreur lors du fetch des produits :', supabaseError.message);
        setError(supabaseError.message);
      } else {
        setProducts(data as Product[]);
      }

      setLoading(false);
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  return { products, loading, error };
}
