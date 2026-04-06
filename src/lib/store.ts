import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

export interface UserInfo {
  id: string;
  label: 'home' | 'work' | 'other';
  fullName: string;
  phone: string;
  city: string;
  region: string;
  details: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  address: UserInfo;
}

interface CartStore {
  items: CartItem[];
  addresses: UserInfo[];
  selectedAddressId: string | null;
  orders: Order[];
  wishlist: string[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, selectedOptions?: Record<string, string>) => void;
  updateQuantity: (id: string, quantity: number, selectedOptions?: Record<string, string>) => void;
  clearCart: () => void;
  addAddress: (address: UserInfo) => void;
  removeAddress: (id: string) => void;
  setSelectedAddress: (id: string) => void;
  addOrder: (order: Order) => void;
  cancelOrder: (orderId: string) => void;
  toggleWishlist: (id: string) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addresses: [],
      selectedAddressId: null,
      orders: [],
      wishlist: [],
      
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find((i) => 
            i.id === item.id && JSON.stringify(i.selectedOptions) === JSON.stringify(item.selectedOptions)
          );
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                (i.id === item.id && JSON.stringify(i.selectedOptions) === JSON.stringify(item.selectedOptions)) 
                  ? { ...i, quantity: i.quantity + item.quantity } : i
              ),
            };
          }
          return { items: [...state.items, item] };
        });
      },
      
      removeItem: (id, selectedOptions) => {
        set((state) => ({
          items: state.items.filter((i) => !(i.id === id && JSON.stringify(i.selectedOptions) === JSON.stringify(selectedOptions))),
        }));
      },
      
      updateQuantity: (id, quantity, selectedOptions) => {
        if (quantity <= 0) {
          get().removeItem(id, selectedOptions);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            (i.id === id && JSON.stringify(i.selectedOptions) === JSON.stringify(selectedOptions)) ? { ...i, quantity } : i
          ),
        }));
      },
      
      clearCart: () => set({ items: [] }),

      addAddress: (address) => {
        set((state) => ({
          addresses: [...state.addresses, address],
          selectedAddressId: address.id
        }));
      },

      removeAddress: (id) => {
        set((state) => ({
          addresses: state.addresses.filter((a) => a.id !== id),
          selectedAddressId: state.selectedAddressId === id ? null : state.selectedAddressId
        }));
      },

      setSelectedAddress: (id) => {
        set({ selectedAddressId: id });
      },

      addOrder: (order) => {
        set((state) => ({
          orders: [order, ...state.orders]
        }));
      },

      cancelOrder: (id) => {
        set((state) => ({
          orders: state.orders.map(o => 
            o.id === id ? { ...o, status: 'cancelled' as const } : o
          )
        }));
      },

      toggleWishlist: (id) => {
        set((state) => ({
          wishlist: state.wishlist.includes(id) 
            ? state.wishlist.filter(i => i !== id)
            : [...state.wishlist, id]
        }));
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'buyers-cart-storage',
    }
  )
);
