"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser, CartLine, Product, SelectedVehicle } from "./types";
import type { Locale } from "./i18n";
import { api, ApiError } from "./api";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isBusinessAccount: boolean;
    companyName: string | null;
    wholesaleDiscountPct: number | null;
  };
}

function toAuthUser(raw: LoginResponse["user"]): AuthUser {
  return {
    id: raw.id,
    name: `${raw.firstName} ${raw.lastName}`.trim(),
    email: raw.email,
    discountPercent: raw.wholesaleDiscountPct ?? 0,
    accountLabel: raw.companyName || (raw.isBusinessAccount ? "Business account" : undefined),
  };
}

interface StoreState {
  cart: CartLine[];
  wishlist: string[];
  vehicle: SelectedVehicle | null;
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  locale: Locale;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleWishlist: (productId: string) => void;
  setVehicle: (vehicle: SelectedVehicle | null) => void;
  clearCart: () => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
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
      token: null,
      refreshToken: null,
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

      login: async (email, password) => {
        try {
          const data = await api.post<LoginResponse>("/auth/login", { email, password });
          set({ token: data.accessToken, refreshToken: data.refreshToken, user: toAuthUser(data.user) });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof ApiError ? err.message : "Login failed" };
        }
      },

      logout: () => set({ user: null, token: null, refreshToken: null }),

      setLocale: (locale) => set({ locale }),
    }),
    { name: "gama-express-store" }
  )
);
