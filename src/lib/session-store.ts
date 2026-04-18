import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginMerchant } from './api';

/**
 * Credentials for Platform Admin.
 * IMPORTANT: NEVER hardcode credentials in source code.
 * These should be managed via Environment Variables or a secure database.
 */
const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || '1111'; // Fallback for dev only
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '1111'; // Fallback for dev only

export type UserRole = 'admin' | 'merchant' | 'employee' | null;


interface SessionState {
  isLoggedIn: boolean;
  role: UserRole;
  username: string | null;
  storeSlug: string | null;
  permissions: string[]; // e.g. ['all'] or ['orders.view']
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
      permissions: [],
      loginTime: null,

      loginAsAdmin: (username: string, password: string) => {
        if (
          username === ADMIN_USERNAME &&
          password === ADMIN_PASSWORD
        ) {
          const newState = {
            isLoggedIn: true,
            role: 'admin' as UserRole,
            username,
            storeSlug: 'demo', 
            permissions: ['all'],
            loginTime: new Date().toISOString(),
          };
          set(newState);
          if (typeof document !== 'undefined') {
            const secure = window.location.protocol === 'https:' ? '; Secure' : '';
            document.cookie = `buyers-auth-role=admin; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
            document.cookie = `buyers-auth-user=${username}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
          }
          return true;
        }

        return false;
      },

      loginAsMerchant: async (username: string, password: string) => {
        const user = await loginMerchant(username, password);
        
        if (user) {
          const newState = {
            isLoggedIn: true,
            role: user.role as UserRole,
            username: user.username,
            storeSlug: user.storeSlug || null, 
            permissions: user.permissions || [],
            loginTime: new Date().toISOString(),
          };
          set(newState);
          if (typeof document !== 'undefined') {
            const secure = window.location.protocol === 'https:' ? '; Secure' : '';
            document.cookie = `buyers-auth-role=${user.role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
            document.cookie = `buyers-auth-user=${username}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
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
          permissions: [],
          loginTime: null,
        });
        if (typeof document !== 'undefined') {
          const secure = window.location.protocol === 'https:' ? '; Secure' : '';
          document.cookie = `buyers-auth-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
          document.cookie = `buyers-auth-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
        }
      },
    }),
    {
      name: 'buyers-session',
    }
  )
);
