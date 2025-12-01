'use client';

import { create } from "zustand";

import { clearToken, getStoredToken, storeToken } from "@/lib/auth-storage";
import api from "@/lib/api";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  initializing: boolean;
  setAuth: (payload: { token: string; user: User }) => void;
  setUser: (user: User) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  initializing: true,
  setAuth: ({ token, user }) => {
    storeToken(token);
    set({ token, user });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    clearToken();
    set({ token: null, user: null });
  },
  initialize: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ initializing: false });
      return;
    }

    try {
      const { data } = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      set({ token, user: data, initializing: false });
    } catch {
      clearToken();
      set({ token: null, user: null, initializing: false });
    }
  },
}));


