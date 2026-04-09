import { create } from 'zustand';
import { StoreInfo } from './api';

interface AuthState {
  storeSlug: string | null;
  storeName: string | null;
  storeLogo: string | null;
  isResolved: boolean;
  setStoreInfo: (info: StoreInfo | null) => void;
  clearStoreInfo: () => void;
}

/**
 * Global store to keep track of the authenticated merchant's store details.
 * This prevents repeated database lookups for the store slug.
 */
export const useAuthStore = create<AuthState>((set) => ({
  storeSlug: null,
  storeName: null,
  storeLogo: null,
  isResolved: false,
  setStoreInfo: (info) => set({ 
    storeSlug: info?.slug || null, 
    storeName: info?.name || null,
    storeLogo: info?.logo || null,
    isResolved: true 
  }),
  clearStoreInfo: () => set({ 
    storeSlug: null, 
    storeName: null, 
    storeLogo: null, 
    isResolved: false 
  }),
}));
