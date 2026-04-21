import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { clearSession, getStoredSession, saveSession } from '@/utils/storage';

// ─── Session mock ────────────────────────────────────────────────────────────

const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: {
    id: 'user-123',
    email: 'test@leico.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
  },
};

const SESSION_KEY = '@leico:auth_session';

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe('saveSession', () => {
  it('stocke la session sérialisée en JSON dans AsyncStorage', async () => {
    await saveSession(mockSession);

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      SESSION_KEY,
      JSON.stringify(mockSession)
    );
  });

  it("ne lance pas d'erreur si AsyncStorage.setItem échoue", async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
      new Error('Storage full')
    );

    // Ne doit pas rejeter
    await expect(saveSession(mockSession)).resolves.toBeUndefined();
  });
});

describe('getStoredSession', () => {
  it('retourne la session désérialisée quand elle existe', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(mockSession)
    );

    const result = await getStoredSession();

    expect(AsyncStorage.getItem).toHaveBeenCalledWith(SESSION_KEY);
    expect(result).toEqual(mockSession);
  });

  it('retourne null si aucune session stockée', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const result = await getStoredSession();

    expect(result).toBeNull();
  });

  it('retourne null et log une erreur si le JSON est corrompu', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('json-invalide{{{');

    const result = await getStoredSession();

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('clearSession', () => {
  it('supprime la clé de session depuis AsyncStorage', async () => {
    await clearSession();

    expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(SESSION_KEY);
  });

  it("ne lance pas d'erreur si AsyncStorage.removeItem échoue", async () => {
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(
      new Error('Disk error')
    );

    await expect(clearSession()).resolves.toBeUndefined();
  });
});

describe('flux complet: save → get → clear', () => {
  it('stocke, retrouve, puis supprime la session correctement', async () => {
    // Simule un storage en mémoire
    let stored: string | null = null;
    (AsyncStorage.setItem as jest.Mock).mockImplementation((_key: string, value: string) => {
      stored = value;
      return Promise.resolve();
    });
    (AsyncStorage.getItem as jest.Mock).mockImplementation(() =>
      Promise.resolve(stored)
    );
    (AsyncStorage.removeItem as jest.Mock).mockImplementation(() => {
      stored = null;
      return Promise.resolve();
    });

    await saveSession(mockSession);
    const retrieved = await getStoredSession();
    expect(retrieved).toEqual(mockSession);

    await clearSession();
    const afterClear = await getStoredSession();
    expect(afterClear).toBeNull();
  });
});
