"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser, CartLine, Product, SelectedVehicle } from "./types";
import { demoAccounts } from "./mock-data";
import type { Locale } from "./i18n";

interface StoreState {
  cart: CartLine[];
  wishlist: string[];
  vehicle: SelectedVehicle | null;
  user: AuthUser | null;
  locale: Locale;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleWishlist: (productId: string) => void;
  setVehicle: (vehicle: SelectedVehicle | null) => void;
  clearCart: () => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setLocale: (locale: Locale) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      vehicle: null,
      user: null,
      locale: "sq",

      addToCart: (product, quantity = 1) => {
        const existing = get().cart.find((l) => l.product.id === product.id);
        if (existing) {
          set({
            cart: get().cart.map((l) =>
              l.product.id === product.id ? { ...l, quantity: l.quantity + quantity } : l
            ),
          });
        } else {
          set({ cart: [...get().cart, { product, quantity }] });
        }
      },

      removeFromCart: (productId) => set({ cart: get().cart.filter((l) => l.product.id !== productId) }),

      updateQuantity: (productId, quantity) =>
        set({
          cart: get().cart.map((l) => (l.product.id === productId ? { ...l, quantity: Math.max(1, quantity) } : l)),
        }),

      toggleWishlist: (productId) => {
        const list = get().wishlist;
        set({
          wishlist: list.includes(productId) ? list.filter((id) => id !== productId) : [...list, productId],
        });
      },

      setVehicle: (vehicle) => set({ vehicle }),

      clearCart: () => set({ cart: [] }),

      login: (email, password) => {
        const account = demoAccounts.find(
          (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
        );
        if (!account) return false;
        set({
          user: {
            id: account.id,
            name: account.name,
            email: account.email,
            discountPercent: account.discountPercent,
            accountLabel: account.accountLabel,
          },
        });
        return true;
      },

      logout: () => set({ user: null }),

      setLocale: (locale) => set({ locale }),
    }),
    { name: "gama-express-store" }
  )
);
