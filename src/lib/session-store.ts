import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginMerchant } from './api';

/**
 * Hardcoded credentials for testing (ONLY for Platform Admin).
 * Merchants now use Firestore records.
 */
const ADMIN_CREDENTIALS = {
  username: '1111',
  password: '1111',
};

export type UserRole = 'admin' | 'merchant' | null;

interface SessionState {
  isLoggedIn: boolean;
  role: UserRole;
  username: string | null;
  storeSlug: string | null;
  loginTime: string | null;

  loginAsAdmin: (username: string, password: string) => boolean;
  loginAsMerchant: (username: string, password: string) => Promise<boolean>;
  setStoreSlug: (slug: string | null) => void;
  logout: () => void;
}

/**
 * Global session store for authentication.
 * Persisted to localStorage.
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      role: null,
      username: null,
      storeSlug: null,
      loginTime: null,

      loginAsAdmin: (username: string, password: string) => {
        if (
          username === ADMIN_CREDENTIALS.username &&
          password === ADMIN_CREDENTIALS.password
        ) {
          const newState = {
            isLoggedIn: true,
            role: 'admin' as UserRole,
            username,
            storeSlug: 'demo', 
            loginTime: new Date().toISOString(),
          };
          set(newState);
          if (typeof document !== 'undefined') {
            document.cookie = `buyers-auth-role=admin; path=/; max-age=${60 * 60 * 24 * 7}`;
            document.cookie = `buyers-auth-user=${username}; path=/; max-age=${60 * 60 * 24 * 7}`;
          }
          return true;
        }
        return false;
      },

      loginAsMerchant: async (username: string, password: string) => {
        const merchant = await loginMerchant(username, password);
        
        if (merchant) {
          const newState = {
            isLoggedIn: true,
            role: 'merchant' as UserRole,
            username: merchant.username,
            storeSlug: merchant.storeSlug || null, 
            loginTime: new Date().toISOString(),
          };
          set(newState);
          if (typeof document !== 'undefined') {
            document.cookie = `buyers-auth-role=merchant; path=/; max-age=${60 * 60 * 24 * 7}`;
            document.cookie = `buyers-auth-user=${username}; path=/; max-age=${60 * 60 * 24 * 7}`;
          }
          return true;
        }
        return false;
      },

      setStoreSlug: (slug: string | null) => set({ storeSlug: slug }),

      logout: () => {
        set({
          isLoggedIn: false,
          role: null,
          username: null,
          storeSlug: null,
          loginTime: null,
        });
        if (typeof document !== 'undefined') {
          document.cookie = "buyers-auth-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "buyers-auth-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
      },
    }),
    {
      name: 'buyers-session',
    }
  )
);
