import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';
import type { Product } from '@/hooks/useProducts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductSection = {
  category_id: string;
  category_name: string;
  data: Product[];
};

type UseProductsByCategoryResult = {
  sections: ProductSection[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

// ─── Résultat brut de la requête Supabase (avec join imbriqué) ────────────────

type RawProduct = Product & {
  category: {
    id: string;
    name: string;
  } | null;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProductsByCategory(): UseProductsByCategoryResult {
  const [sections, setSections] = useState<ProductSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Une seule requête : produits + catégorie jointe via foreign key
    const { data, error: supabaseError } = await supabase
      .from('product')
      .select(
        `
        id,
        name,
        price,
        description,
        image_url,
        category_id,
        is_active,
        category:category_id (
          id,
          name
        )
      `,
      )
      .eq('is_active', true)
      .order('name');

    if (supabaseError) {
      console.error('[useProductsByCategory] Erreur fetch :', supabaseError.message);
      setError(supabaseError.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as RawProduct[];

    // ── Grouper par category_id en JS ──────────────────────────────────────

    const grouped: Record<string, ProductSection> = {};

    rows.forEach((product) => {
      const catId = product.category?.id ?? '__none__';
      const catName = product.category?.name ?? 'Uncategorized';

      if (!grouped[catId]) {
        grouped[catId] = { category_id: catId, category_name: catName, data: [] };
      }

      grouped[catId].data.push({
        id: product.id,
        name: product.name,
        price: product.price,
        description: product.description,
        image_url: product.image_url,
        category_id: product.category_id,
        is_active: product.is_active,
      });
    });

    // Trier les sections par nom de catégorie
    const sortedSections = Object.values(grouped).sort((a, b) =>
      a.category_name.localeCompare(b.category_name),
    );

    setSections(sortedSections);
    setLoading(false);
  }, []);

  // Fetch une seule fois au mount (résultat mis en cache dans le state)
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { sections, loading, error, refresh: fetchAll };
}
