import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setInitialized: (initialized: boolean) => void;
}

/**
 * Holds the current Supabase auth user. The actual subscription to
 * Supabase's `onAuthStateChange` lives in `providers/auth-provider.tsx`,
 * this store just exposes the resulting state to the rest of the app so
 * any component can read it without prop drilling or context boilerplate.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  setUser: (user) => set({ user }),
  setInitialized: (initialized) => set({ initialized }),
}));
