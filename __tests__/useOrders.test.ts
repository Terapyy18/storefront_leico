import { renderHook, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/services/supabaseClient', () => ({
  supabase: { from: jest.fn() },
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useOrders, type Order } from '@/hooks/useOrders';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockFrom = supabase.from as jest.Mock;

const MOCK_USER = { id: 'user-abc', email: 'test@leico.com' } as any;

const MOCK_ORDERS: Order[] = [
  {
    id: 'order-1',
    user_id: 'user-abc',
    total_amount: 59.99,
    shipping_address: '10 rue de Paris',
    status: 'paid',
    created_at: '2026-01-10T12:00:00Z',
    updated_at: '2026-01-10T12:00:00Z',
  },
  {
    id: 'order-2',
    user_id: 'user-abc',
    total_amount: 120.0,
    shipping_address: '10 rue de Paris',
    status: 'shipped',
    created_at: '2026-01-05T08:00:00Z',
    updated_at: '2026-01-06T10:00:00Z',
  },
];

function buildQueryChain(resolvedValue: { data: any; error: any }) {
  const mockOrder = jest.fn().mockResolvedValue(resolvedValue);
  const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
  const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
  return { select: mockSelect, mockOrder, mockEq };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useOrders', () => {
  describe('sans utilisateur connecté', () => {
    it('ne fait pas de requête et passe loading à false', async () => {
      mockUseAuth.mockReturnValue({ user: null } as any);

      const { result } = renderHook(() => useOrders());

      // With null user, the effect sets loading=false synchronously — just wait for it
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.orders).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('avec utilisateur connecté', () => {
    it('retourne les commandes et passe loading à false', async () => {
      mockUseAuth.mockReturnValue({ user: MOCK_USER } as any);
      const chain = buildQueryChain({ data: MOCK_ORDERS, error: null });
      mockFrom.mockReturnValue({ select: chain.select });

      const { result } = renderHook(() => useOrders());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.orders).toEqual(MOCK_ORDERS);
      expect(result.current.error).toBeNull();
    });

    it('filtre par user_id et trie par date décroissante', async () => {
      mockUseAuth.mockReturnValue({ user: MOCK_USER } as any);
      const chain = buildQueryChain({ data: MOCK_ORDERS, error: null });
      mockFrom.mockReturnValue({ select: chain.select });

      renderHook(() => useOrders());

      await waitFor(() => {
        expect(chain.mockEq).toHaveBeenCalledWith('user_id', MOCK_USER.id);
        expect(chain.mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      });
    });

    it('retourne un tableau vide si Supabase renvoie null', async () => {
      mockUseAuth.mockReturnValue({ user: MOCK_USER } as any);
      const chain = buildQueryChain({ data: null, error: null });
      mockFrom.mockReturnValue({ select: chain.select });

      const { result } = renderHook(() => useOrders());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.orders).toEqual([]);
    });
  });

  describe("gestion d'erreur", () => {
    it('set error.message si Supabase renvoie une erreur', async () => {
      mockUseAuth.mockReturnValue({ user: MOCK_USER } as any);
      const chain = buildQueryChain({
        data: null,
        error: { message: 'Connexion perdue' },
      });
      mockFrom.mockReturnValue({ select: chain.select });

      const { result } = renderHook(() => useOrders());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('Connexion perdue');
      expect(result.current.orders).toEqual([]);
    });

    it('set un message par défaut si l\'erreur n\'a pas de message', async () => {
      mockUseAuth.mockReturnValue({ user: MOCK_USER } as any);
      // Simule une exception sans message
      const mockOrder = jest.fn().mockRejectedValue({});
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const { result } = renderHook(() => useOrders());

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBe('Failed to load orders');
    });
  });

  describe('état initial', () => {
    it('démarre avec loading=true, orders=[], error=null', () => {
      mockUseAuth.mockReturnValue({ user: MOCK_USER } as any);
      const mockOrder = jest.fn().mockReturnValue(new Promise(() => {})); // pending forever
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: mockEq }) });

      const { result } = renderHook(() => useOrders());

      expect(result.current.loading).toBe(true);
      expect(result.current.orders).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });
});
