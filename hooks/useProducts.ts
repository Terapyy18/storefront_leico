import { useCallback, useEffect, useRef, useState } from 'react';
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

const PAGE_SIZE = 10;

type UseProductsResult = {
  products: Product[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
};

export function useProducts(categoryId?: string | null): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const pageRef = useRef(0);
  const loadingRef = useRef(false);

  const fetchPage = useCallback(async (page: number) => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    let query = supabase
      .from('product')
      .select('*')
      .eq('is_active', true)
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error: supabaseError } = await query;

    if (supabaseError) {
      console.error('[useProducts] Erreur fetch :', supabaseError.message);
      setError(supabaseError.message);
    } else {
      const newItems = (data ?? []) as Product[];
      setProducts((prev) => (page === 0 ? newItems : [...prev, ...newItems]));
      setHasMore(newItems.length === PAGE_SIZE);
    }

    loadingRef.current = false;
    setLoading(false);
  }, [categoryId]);

  // Repart de la page 0 à chaque changement de catégorie (ou au mount)
  useEffect(() => {
    pageRef.current = 0;
    setHasMore(true);
    fetchPage(0);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingRef.current) return;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    await fetchPage(nextPage);
  }, [hasMore, fetchPage]);

  return { products, loading, error, hasMore, loadMore };
}
