import { renderHook, act } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/services/supabaseClient', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('@/hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('@/hooks/useCart', () => ({ useCart: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'expo-router';
import { useMockCheckout } from '@/hooks/useMockCheckout';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseCart = useCart as jest.MockedFunction<typeof useCart>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockFrom = supabase.from as jest.Mock;

const MOCK_USER = { id: 'user-abc', email: 'test@leico.com' } as any;

const MOCK_CART_ITEMS = [
  {
    variant_id: 'variant-1',
    product_id: 'prod-1',
    product_name: 'T-shirt',
    product_price: 29.99,
    quantity: 2,
    size: 'M',
    color: 'Noir',
  },
  {
    variant_id: 'variant-2',
    product_id: 'prod-2',
    product_name: 'Jean',
    product_price: 59.99,
    quantity: 1,
  },
];

const TOTAL_PRICE = MOCK_CART_ITEMS.reduce((s, i) => s + i.product_price * i.quantity, 0);

const CREATED_ORDER = {
  id: 'order-xyz',
  user_id: 'user-abc',
  total_amount: TOTAL_PRICE,
  shipping_address: '10 rue de Paris',
  status: 'paid',
};

function buildSuccessfulSupabaseMocks() {
  const mockSingle = jest.fn().mockResolvedValue({ data: CREATED_ORDER, error: null });
  const mockSelectAfterInsert = jest.fn().mockReturnValue({ single: mockSingle });
  const mockInsertOrder = jest.fn().mockReturnValue({ select: mockSelectAfterInsert });
  const mockInsertItems = jest.fn().mockResolvedValue({ data: null, error: null });

  mockFrom.mockImplementation((table: string) => {
    if (table === 'order') return { insert: mockInsertOrder };
    if (table === 'order_item') return { insert: mockInsertItems };
  });

  return { mockInsertOrder, mockInsertItems, mockSingle };
}

function setupDefaultHooks(overrides: { user?: any; items?: any[]; clearCart?: jest.Mock } = {}) {
  const clearCart = overrides.clearCart ?? jest.fn();
  // Use explicit 'in' check to allow passing null as user
  const user = 'user' in overrides ? overrides.user : MOCK_USER;
  const items = 'items' in overrides ? overrides.items : MOCK_CART_ITEMS;
  mockUseAuth.mockReturnValue({ user } as any);
  mockUseCart.mockReturnValue({
    items,
    totalPrice: TOTAL_PRICE,
    clearCart,
  } as any);
  mockUseRouter.mockReturnValue({ push: jest.fn() } as any);
  return { clearCart };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useMockCheckout', () => {
  describe('validations', () => {
    it('lance une erreur si l\'utilisateur n\'est pas connecté', async () => {
      setupDefaultHooks({ user: null });

      const { result } = renderHook(() => useMockCheckout());

      await expect(
        act(() => result.current.processPayment('Jean Dupont', 'jean@test.com', '10 rue de Paris')),
      ).rejects.toThrow('Not authenticated');
    });

    it('lance une erreur si le panier est vide', async () => {
      setupDefaultHooks({ items: [] });

      const { result } = renderHook(() => useMockCheckout());

      await expect(
        act(() => result.current.processPayment('Jean Dupont', 'jean@test.com', '10 rue de Paris')),
      ).rejects.toThrow('Cart is empty');
    });

    it('lance une erreur si le nom est manquant', async () => {
      setupDefaultHooks();

      const { result } = renderHook(() => useMockCheckout());

      await expect(
        act(() => result.current.processPayment('', 'jean@test.com', '10 rue de Paris')),
      ).rejects.toThrow('All fields are required');
    });

    it('lance une erreur si l\'email est manquant', async () => {
      setupDefaultHooks();

      const { result } = renderHook(() => useMockCheckout());

      await expect(
        act(() => result.current.processPayment('Jean Dupont', '', '10 rue de Paris')),
      ).rejects.toThrow('All fields are required');
    });

    it('lance une erreur si l\'adresse est manquante', async () => {
      setupDefaultHooks();

      const { result } = renderHook(() => useMockCheckout());

      await expect(
        act(() => result.current.processPayment('Jean Dupont', 'jean@test.com', '')),
      ).rejects.toThrow('All fields are required');
    });
  });

  describe('paiement réussi', () => {
    it('crée la commande avec les bonnes données', async () => {
      setupDefaultHooks();
      const { mockInsertOrder } = buildSuccessfulSupabaseMocks();

      const { result } = renderHook(() => useMockCheckout());

      await act(() =>
        result.current.processPayment('Jean Dupont', 'jean@test.com', '10 rue de Paris'),
      );

      expect(mockInsertOrder).toHaveBeenCalledWith({
        user_id: MOCK_USER.id,
        total_amount: TOTAL_PRICE,
        shipping_address: '10 rue de Paris',
        status: 'paid',
      });
    });

    it('insère les articles de commande avec les bons champs', async () => {
      setupDefaultHooks();
      const { mockInsertItems } = buildSuccessfulSupabaseMocks();

      const { result } = renderHook(() => useMockCheckout());

      await act(() =>
        result.current.processPayment('Jean Dupont', 'jean@test.com', '10 rue de Paris'),
      );

      expect(mockInsertItems).toHaveBeenCalledWith([
        {
          order_id: CREATED_ORDER.id,
          variant_id: 'variant-1',
          quantity: 2,
          unit_price: 29.99,
        },
        {
          order_id: CREATED_ORDER.id,
          variant_id: 'variant-2',
          quantity: 1,
          unit_price: 59.99,
        },
      ]);
    });

    it('vide le panier après succès', async () => {
      const { clearCart } = setupDefaultHooks();
      buildSuccessfulSupabaseMocks();

      const { result } = renderHook(() => useMockCheckout());

      await act(() =>
        result.current.processPayment('Jean Dupont', 'jean@test.com', '10 rue de Paris'),
      );

      expect(clearCart).toHaveBeenCalledTimes(1);
    });

    it('navigue vers /order-confirmation avec l\'id de commande', async () => {
      setupDefaultHooks();
      buildSuccessfulSupabaseMocks();
      const mockPush = jest.fn();
      mockUseRouter.mockReturnValue({ push: mockPush } as any);

      const { result } = renderHook(() => useMockCheckout());

      await act(() =>
        result.current.processPayment('Jean Dupont', 'jean@test.com', '10 rue de Paris'),
      );

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/order-confirmation',
        params: { orderId: CREATED_ORDER.id },
      });
    });

    it('repasse loading à false après succès', async () => {
      setupDefaultHooks();
      buildSuccessfulSupabaseMocks();

      const { result } = renderHook(() => useMockCheckout());

      expect(result.current.loading).toBe(false);

      await act(() =>
        result.current.processPayment('Jean Dupont', 'jean@test.com', '10 rue de Paris'),
      );

      expect(result.current.loading).toBe(false);
    });
  });

  describe("gestion d'erreur Supabase", () => {
    it('propage l\'erreur si la création de commande échoue', async () => {
      setupDefaultHooks();

      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'DB error' } });
      const mockSelectAfterInsert = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsertOrder = jest.fn().mockReturnValue({ select: mockSelectAfterInsert });
      mockFrom.mockImplementation(() => ({ insert: mockInsertOrder }));

      const { result } = renderHook(() => useMockCheckout());

      await expect(
        act(() =>
          result.current.processPayment('Jean Dupont', 'jean@test.com', '10 rue de Paris'),
        ),
      ).rejects.toMatchObject({ message: 'DB error' });
    });

    it('propage l\'erreur si l\'insertion des articles échoue', async () => {
      setupDefaultHooks();

      const mockSingle = jest.fn().mockResolvedValue({ data: CREATED_ORDER, error: null });
      const mockSelectAfterInsert = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsertOrder = jest.fn().mockReturnValue({ select: mockSelectAfterInsert });
      const mockInsertItems = jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'Items insert failed' } });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'order') return { insert: mockInsertOrder };
        if (table === 'order_item') return { insert: mockInsertItems };
      });

      const { result } = renderHook(() => useMockCheckout());

      await expect(
        act(() =>
          result.current.processPayment('Jean Dupont', 'jean@test.com', '10 rue de Paris'),
        ),
      ).rejects.toMatchObject({ message: 'Items insert failed' });
    });

    it('repasse loading à false même en cas d\'erreur', async () => {
      setupDefaultHooks({ user: null });

      const { result } = renderHook(() => useMockCheckout());

      try {
        await act(() =>
          result.current.processPayment('Jean Dupont', 'jean@test.com', '10 rue de Paris'),
        );
      } catch {
        // expected
      }

      expect(result.current.loading).toBe(false);
    });
  });
});
