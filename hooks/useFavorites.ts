import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';

type UseFavoritesResult = {
  favorites: string[];
  loading: boolean;
  addFavorite: (productId: string) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  isFavorited: (productId: string) => boolean;
};

export function useFavorites(userId: string | null): UseFavoritesResult {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // ─── Fetch ───────────────────────────────────────────────────────────────

  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setFavorites([]);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('favorite')
      .select('product_id')
      .eq('user_id', userId);

    if (error) {
      console.error('[useFavorites] Erreur lors du fetch des favoris :', error.message);
    } else {
      setFavorites((data ?? []).map((row: { product_id: string }) => row.product_id));
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // ─── Add ─────────────────────────────────────────────────────────────────

  const addFavorite = useCallback(async (productId: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from('favorite')
      .insert({ user_id: userId, product_id: productId });

    if (error) {
      // Code 23505 = violation de contrainte unique (déjà en favori) → pas un vrai crash
      if (error.code === '23505') {
        console.warn('[useFavorites] Produit déjà dans les favoris :', productId);
      } else {
        console.error('[useFavorites] Erreur lors de l\'ajout du favori :', error.message);
      }
      return;
    }

    await fetchFavorites();
  }, [userId, fetchFavorites]);

  // ─── Remove ──────────────────────────────────────────────────────────────

  const removeFavorite = useCallback(async (productId: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from('favorite')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      console.error('[useFavorites] Erreur lors de la suppression du favori :', error.message);
      return;
    }

    await fetchFavorites();
  }, [userId, fetchFavorites]);

  // ─── isFavorited ─────────────────────────────────────────────────────────

  const isFavorited = useCallback(
    (productId: string) => favorites.includes(productId),
    [favorites]
  );

  return { favorites, loading, addFavorite, removeFavorite, isFavorited };
}
