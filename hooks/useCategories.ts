import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';

export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

type UseCategoriesResult = {
  categories: Category[];
  loading: boolean;
  error: string | null;
};

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('category')
        .select('*')
        .is('parent_id', null); // catégories racines uniquement

      if (!isMounted) return;

      if (supabaseError) {
        console.error('[useCategories] Erreur fetch :', supabaseError.message);
        setError(supabaseError.message);
      } else {
        setCategories((data ?? []) as Category[]);
      }

      setLoading(false);
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []); // ← tableau vide : fetch une seule fois au mount

  return { categories, loading, error };
}
