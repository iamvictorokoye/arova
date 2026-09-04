"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";

import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import { useChatNotificationsStore } from "@/store/chat-store";

/**
 * Subscribes to Supabase auth state once and mirrors it into the
 * `useAuthStore` zustand store, so any component can read `user` /
 * `initialized` without needing a React context each has to subscribe to.
 *
 * Also clears the React Query cache whenever the authenticated user id
 * actually changes. Query keys like ["profile", "me"] don't include a user
 * id, so without this, signing out and into a different account would keep
 * serving the previous account's cached profile/matches/etc. until a full
 * page reload recreated the QueryClient from scratch.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const queryClient = useQueryClient();
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      previousUserIdRef.current = session?.user?.id ?? null;
      setUser(session?.user ?? null);
      setInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id ?? null;
      if (newUserId !== previousUserIdRef.current) {
        queryClient.clear();
        previousUserIdRef.current = newUserId;
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setInitialized, queryClient]);

  return <>{children}</>;
}

export function useSignOut() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setUnreadCount = useChatNotificationsStore((state) => state.setUnreadCount);

  return async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUnreadCount(0);

    // Best-effort: drop the shared Stream Chat connection so the next
    // person to use this browser doesn't inherit this user's session.
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    if (apiKey) {
      StreamChat.getInstance(apiKey)
        .disconnectUser()
        .catch(() => {});
    }

    router.push("/auth");
  };
}