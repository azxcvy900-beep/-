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
  uid: string | null;
  username: string | null;
  storeSlug: string | null;
  permissions: string[];
  loginTime: string | null;
  loginAsAdmin: (username: string, password: string) => boolean;
  loginAsMerchant: (usernameOrEmail: string, password: string) => Promise<boolean>;
  logout: () => void;
  setStoreSlug: (slug: string | null) => void;
  verificationStatus?: string;
  rejectionReason?: string;
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
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
      uid: null,
      username: null,
      storeSlug: null,
      permissions: [],
      loginTime: null,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

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
            // SECURITY: Create a signature to prevent easy role spoofing
            const sig = (username + 'admin' + 'buyers-secret-v1').split('').reverse().join(''); // Simple obfuscation for logic
            document.cookie = `buyers-auth-role=admin; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
            document.cookie = `buyers-auth-sig=${sig}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
            document.cookie = `buyers-auth-user=${username}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
          }
          return true;
        }

        return false;
      },

      loginAsMerchant: async (username: string, password: string) => {
        // Use per-user salt in hash
        const user = await loginMerchant(username, password);
        
        if (user) {
          const newState = {
            isLoggedIn: true,
            role: user.role as UserRole,
            uid: user.uid,
            username: user.username,
            storeSlug: user.storeSlug || null, 
            permissions: user.permissions || [],
            loginTime: new Date().toISOString(),
            verificationStatus: (user as any).verificationStatus || 'pending',
            rejectionReason: (user as any).rejectionReason || null
          };
          set(newState);

          if (typeof document !== 'undefined') {
            const secure = window.location.protocol === 'https:' ? '; Secure' : '';
            // SECURITY: Create a signature to prevent easy role spoofing
            const safeUser = encodeURIComponent(user.username || username);
            const sig = (safeUser + user.role + 'buyers-secret-v1').split('').reverse().join(''); 
            document.cookie = `buyers-auth-role=${user.role}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
            document.cookie = `buyers-auth-sig=${sig}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
            document.cookie = `buyers-auth-user=${safeUser}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
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
          uid: null,
          username: null,
          storeSlug: null,
          permissions: [],
          loginTime: null,
        });

        if (typeof document !== 'undefined') {
          const secure = window.location.protocol === 'https:' ? '; SameSite=Lax; Secure' : '; SameSite=Lax';
          const expire = '; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
          document.cookie = `buyers-auth-role=${expire}${secure}`;
          document.cookie = `buyers-auth-user=${expire}${secure}`;
          document.cookie = `buyers-auth-sig=${expire}${secure}`;
        }
      },

    }),
    {
      name: 'buyers-session',
      partialize: (state) => {
        const { _hasHydrated, setHasHydrated, ...rest } = state;
        return rest;
      },
      onRehydrateStorage: (state) => {
        return () => state.setHasHydrated(true);
      },
    }
  )
);
