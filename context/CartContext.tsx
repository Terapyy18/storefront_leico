import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CartItem = {
  variant_id: string; // product_variant id (clé unique du panier)
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  size?: string;
  color?: string;
};

export type CartContextType = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, qty: number) => void;
  clearCart: () => void;
};

// ─── Storage helpers ──────────────────────────────────────────────────────────

const CART_KEY = '@leico:cart';

async function saveCart(items: CartItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('[CartContext] Erreur lors de la sauvegarde du panier :', error);
  }
}

async function loadCart(): Promise<CartItem[]> {
  try {
    const raw = await AsyncStorage.getItem(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch (error) {
    console.error('[CartContext] Erreur lors du chargement du panier :', error);
    return [];
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const CartContext = createContext<CartContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Restaure le panier au démarrage
  useEffect(() => {
    loadCart().then(setItems);
  }, []);

  // Persiste à chaque modification
  useEffect(() => {
    saveCart(items);
  }, [items]);

  // ── Métriques ────────────────────────────────────────────────────────────────

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = items.reduce((sum, item) => sum + item.product_price * item.quantity, 0);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variant_id === newItem.variant_id);
      if (existing) {
        // Variante déjà présente → on incrémente la quantité
        return prev.map((i) =>
          i.variant_id === newItem.variant_id
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i,
        );
      }
      return [...prev, newItem];
    });
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variant_id !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId: string, qty: number) => {
    if (qty <= 0) {
      // Quantité nulle ou négative → on retire la ligne
      setItems((prev) => prev.filter((i) => i.variant_id !== variantId));
      return;
    }
    setItems((prev) => prev.map((i) => (i.variant_id === variantId ? { ...i, quantity: qty } : i)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <CartContext.Provider
      value={{ items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error(
      'useCart must be used within a CartProvider. Wrap your app with <CartProvider>.',
    );
  }
  return context;
}
