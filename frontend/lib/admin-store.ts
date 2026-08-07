"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, ApiError } from "./api";

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

interface AdminStoreState {
  token: string | null;
  refreshToken: string | null;
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  /** Local-dev-only: view the dashboard UI without a real backend/DB. */
  devLogin: () => void;
}

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

export const useAdminStore = create<AdminStoreState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,

      login: async (email, password) => {
        try {
          const data = await api.post<LoginResponse>("/auth/login", { email, password });
          if (!ADMIN_ROLES.includes(data.user.role)) {
            return { ok: false, error: "This account doesn't have admin access." };
          }
          set({ token: data.accessToken, refreshToken: data.refreshToken, user: data.user });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof ApiError ? err.message : "Login failed" };
        }
      },

      logout: () => set({ token: null, refreshToken: null, user: null }),

      devLogin: () =>
        set({
          token: "dev-fake-token",
          refreshToken: "dev-fake-refresh",
          user: { id: "dev", email: "admin@gamaexpress.com", firstName: "Admin", lastName: "User", role: "SUPER_ADMIN" },
        }),
    }),
    { name: "gama-express-admin-store" }
  )
);
