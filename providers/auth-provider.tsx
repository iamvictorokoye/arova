"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";

import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import { useChatNotificationsStore } from "@/store/chat-store";

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

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    if (apiKey) {
      StreamChat.getInstance(apiKey)
        .disconnectUser()
        .catch(() => {});
    }

    router.push("/auth");
  };
}