import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartProvider, useCart, type CartItem } from '@/context/CartContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

/**
 * Renders a fresh CartProvider and waits for the async loadCart effect to
 * finish before any test action runs, avoiding a race condition where
 * loadCart().then(setItems) would overwrite state set by addItem/etc.
 */
async function renderCart() {
  const hook = renderHook(() => useCart(), { wrapper });
  // Flush the initial loadCart microtask so it doesn't race with test actions
  await act(async () => {
    await Promise.resolve();
  });
  return hook;
}

function makeItem(variantId: string, overrides: Partial<CartItem> = {}): CartItem {
  return {
    variant_id: variantId,
    product_id: `prod-${variantId}`,
    product_name: `Produit ${variantId}`,
    product_price: 10.0,
    quantity: 1,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CartContext', () => {
  describe('addItem', () => {
    it('ajoute un nouvel article au panier', async () => {
      const { result } = await renderCart();
      const item = makeItem('v1');

      await act(async () => {
        result.current.addItem(item);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toEqual(item);
    });

    it('incrémente la quantité si la variante existe déjà', async () => {
      const { result } = await renderCart();
      const item = makeItem('v1', { quantity: 2 });

      await act(async () => {
        result.current.addItem(item);
        result.current.addItem({ ...item, quantity: 3 });
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(5);
    });

    it('ajoute plusieurs articles distincts', async () => {
      const { result } = await renderCart();

      await act(async () => {
        result.current.addItem(makeItem('v1'));
        result.current.addItem(makeItem('v2'));
        result.current.addItem(makeItem('v3'));
      });

      expect(result.current.items).toHaveLength(3);
    });
  });

  describe('removeItem', () => {
    it("supprime l'article correspondant à la variante", async () => {
      const { result } = await renderCart();

      await act(async () => {
        result.current.addItem(makeItem('v1'));
        result.current.addItem(makeItem('v2'));
      });

      await act(async () => {
        result.current.removeItem('v1');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].variant_id).toBe('v2');
    });

    it("ne plante pas si la variante n'existe pas", async () => {
      const { result } = await renderCart();

      await act(async () => {
        result.current.addItem(makeItem('v1'));
      });

      await act(async () => {
        result.current.removeItem('inexistant');
      });

      expect(result.current.items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it("met à jour la quantité d'un article existant", async () => {
      const { result } = await renderCart();

      await act(async () => {
        result.current.addItem(makeItem('v1', { quantity: 1 }));
      });

      await act(async () => {
        result.current.updateQuantity('v1', 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
    });

    it("supprime l'article si la quantité est 0", async () => {
      const { result } = await renderCart();

      await act(async () => {
        result.current.addItem(makeItem('v1'));
      });

      await act(async () => {
        result.current.updateQuantity('v1', 0);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it("supprime l'article si la quantité est négative", async () => {
      const { result } = await renderCart();

      await act(async () => {
        result.current.addItem(makeItem('v1'));
      });

      await act(async () => {
        result.current.updateQuantity('v1', -1);
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('vide tous les articles du panier', async () => {
      const { result } = await renderCart();

      await act(async () => {
        result.current.addItem(makeItem('v1'));
        result.current.addItem(makeItem('v2'));
        result.current.addItem(makeItem('v3'));
      });

      await act(async () => {
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('totalItems et totalPrice', () => {
    it("calcule correctement le nombre total d'articles", async () => {
      const { result } = await renderCart();

      await act(async () => {
        result.current.addItem(makeItem('v1', { quantity: 3 }));
        result.current.addItem(makeItem('v2', { quantity: 2 }));
      });

      expect(result.current.totalItems).toBe(5);
    });

    it('calcule correctement le prix total', async () => {
      const { result } = await renderCart();

      await act(async () => {
        result.current.addItem(makeItem('v1', { product_price: 20.0, quantity: 2 }));
        result.current.addItem(makeItem('v2', { product_price: 15.5, quantity: 1 }));
      });

      expect(result.current.totalPrice).toBeCloseTo(55.5, 2);
    });

    it('retourne 0 pour un panier vide', async () => {
      const { result } = await renderCart();

      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPrice).toBe(0);
    });
  });

  describe('persistance AsyncStorage', () => {
    it('sauvegarde le panier dans AsyncStorage quand il change', async () => {
      const { result } = await renderCart();
      const item = makeItem('v1');

      // Clear any calls from the initial mount save
      (AsyncStorage.setItem as jest.Mock).mockClear();

      await act(async () => {
        result.current.addItem(item);
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@leico:cart',
        JSON.stringify([item]),
      );
    });

    it('restaure le panier depuis AsyncStorage au montage', async () => {
      const stored = [makeItem('v1', { quantity: 3 })];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(stored));

      const { result } = renderHook(() => useCart(), { wrapper });

      await waitFor(() =>
        expect(result.current.items).toEqual(stored),
      );
    });

    it('démarre avec un panier vide si AsyncStorage est vide', async () => {
      const { result } = await renderCart();
      expect(result.current.items).toEqual([]);
    });
  });

  describe('useCart hors CartProvider', () => {
    it('lance une erreur si utilisé hors du provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => renderHook(() => useCart())).toThrow(/CartProvider/);

      consoleSpy.mockRestore();
    });
  });
});
