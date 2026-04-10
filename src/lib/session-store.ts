import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Hardcoded credentials for testing.
 * In production, these would come from a secure backend.
 */
const ADMIN_CREDENTIALS = {
  username: '1111',
  password: '1111',
};

const MERCHANT_CREDENTIALS = {
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
  loginAsMerchant: (username: string, password: string) => boolean;
  setStoreSlug: (slug: string | null) => void;
  logout: () => void;
}

/**
 * Global session store for lightweight authentication.
 * Persisted to localStorage so sessions survive page refreshes.
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
            storeSlug: 'demo', // Admin gets demo access
            loginTime: new Date().toISOString(),
          };
          set(newState);
          // Set cookie for proxy/middleware access
          if (typeof document !== 'undefined') {
            document.cookie = `buyers-auth-role=admin; path=/; max-age=${60 * 60 * 24 * 7}`;
            document.cookie = `buyers-auth-user=${username}; path=/; max-age=${60 * 60 * 24 * 7}`;
          }
          return true;
        }
        return false;
      },

      loginAsMerchant: (username: string, password: string) => {
        if (
          username === MERCHANT_CREDENTIALS.username &&
          password === MERCHANT_CREDENTIALS.password
        ) {
          const newState = {
            isLoggedIn: true,
            role: 'merchant' as UserRole,
            username,
            storeSlug: null, // Initially null, will be fetched or set via setup
            loginTime: new Date().toISOString(),
          };
          set(newState);
          // Set cookie for proxy/middleware access
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
        // Remove cookies
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
