import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SESSION_KEY = '@leico:auth_session';

/**
 * Retourne le backend de storage selon la plateforme.
 * Lazy : Platform.OS est lu à l'appel, pas au chargement du module.
 * Cela permet de mocker Platform dans les tests sans hacks.
 */
function getStorage() {
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) =>
        Promise.resolve(typeof window !== 'undefined' ? window.localStorage.getItem(key) : null),
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') window.localStorage.removeItem(key);
        return Promise.resolve();
      },
    };
  }
  return AsyncStorage;
}

export async function saveSession(session: Session): Promise<void> {
  try {
    const serialized = JSON.stringify(session);
    await getStorage().setItem(SESSION_KEY, serialized);
  } catch (error) {
    console.error('[storage] Erreur lors de la sauvegarde de la session :', error);
  }
}

/**
 * Récupère et désérialise la session depuis le storage.
 * Retourne null si aucune session n'existe ou en cas d'erreur.
 */
export async function getStoredSession(): Promise<Session | null> {
  try {
    const raw = await getStorage().getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch (error) {
    console.error('[storage] Erreur lors de la récupération de la session :', error);
    return null;
  }
}

/**
 * Supprime la session du storage (à appeler au logout).
 */
export async function clearSession(): Promise<void> {
  try {
    await getStorage().removeItem(SESSION_KEY);
  } catch (error) {
    console.error('[storage] Erreur lors de la suppression de la session :', error);
  }
}
