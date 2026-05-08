import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginCustomer } from './api';

interface CustomerSessionState {
  isLoggedIn: boolean;
  uid: string | null;
  email: string | null;
  username: string | null;
  phone: string | null;
  loginTime: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
}

/**
 * Global session store for customer authentication.
 * Persisted to localStorage as 'buyers-customer-session'.
 */
export const useCustomerSessionStore = create<CustomerSessionState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      uid: null,
      email: null,
      username: null,
      phone: null,
      loginTime: null,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      login: async (email: string, password: string) => {
        try {
          const user = await loginCustomer(email, password);
          if (user) {
            set({
              isLoggedIn: true,
              uid: user.uid,
              email: user.email || null,
              username: user.username,
              phone: user.phone || null,
              loginTime: new Date().toISOString(),
            });
            return true;
          }
          return false;
        } catch (error) {
          console.error("Customer login error:", error);
          return false;
        }
      },

      logout: () => {
        set({
          isLoggedIn: false,
          uid: null,
          email: null,
          username: null,
          phone: null,
          loginTime: null,
        });
      },
    }),
    {
      name: 'buyers-customer-session',
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
