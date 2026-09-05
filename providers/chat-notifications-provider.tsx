"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { StreamChat, type Event } from "stream-chat";
import { toast } from "sonner";

import { getStreamUserToken } from "@/lib/actions/stream";
import { playNotificationSound } from "@/lib/sound";
import { withRetry } from "@/lib/retry";
import { useAuthStore } from "@/store/auth-store";
import { useChatNotificationsStore } from "@/store/chat-store";
import { useSoundStore } from "@/store/sound-store";

/**
 * Keeps one Stream Chat connection open for the lifetime of the session,
 * purely to track the total unread count for the Navbar badge, surface a
 * toast for messages in conversations you don't have open, and play a
 * notification sound for the same.
 *
 * `StreamChat.getInstance(apiKey)` is a singleton per API key, so this is
 * the *same* client `StreamChatInterface` reuses once a conversation is
 * opened — connecting here doesn't create a second connection.
 */
export function ChatNotificationsProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const setUnreadCount = useChatNotificationsStore((state) => state.setUnreadCount);
  const soundEffectsEnabled = useSoundStore((state) => state.soundEffectsEnabled);
  const soundEnabledRef = useRef(soundEffectsEnabled);
  const router = useRouter();

  useEffect(() => {
    soundEnabledRef.current = soundEffectsEnabled;
  }, [soundEffectsEnabled]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    if (!apiKey) return;

    const client = StreamChat.getInstance(apiKey);

    function updateBadge(event: Event) {
      if (typeof event.total_unread_count === "number") {
        setUnreadCount(event.total_unread_count);
      }
    }
    
    function handleBackgroundMessage(event: Event) {
      updateBadge(event);

      const senderId = event.message?.user?.id;
      const senderName = event.message?.user?.name || "Someone";
      const text = event.message?.text;
      const isCallInvite = text?.includes("📹 Video call invitation");

      if (soundEnabledRef.current) playNotificationSound();

      if (senderId && text && !isCallInvite) {
        toast.message(senderName, {
          description: text.length > 80 ? `${text.slice(0, 80)}…` : text,
          action: {
            label: "Open",
            onClick: () => router.push(`/chat/${senderId}`),
          },
        });
      } else if (senderId && isCallInvite) {
        toast.message(`${senderName} is calling you`, {
          action: {
            label: "Open",
            onClick: () => router.push(`/chat/${senderId}`),
          },
        });
      }
    }

    async function connect() {
      try {
        if (!client.userID) {
          const result = await withRetry(async () => {
            const tokenResult = await getStreamUserToken();
            if (!("token" in tokenResult) || !tokenResult.token || !tokenResult.userId) {
              throw new Error("error" in tokenResult ? tokenResult.error : "Failed to get chat token.");
            }
            return tokenResult;
          }, { label: "Chat notifications: get token" });

          if (cancelled) return;

          await withRetry(
            () =>
              client.connectUser(
                { id: result.userId, name: result.userName, image: result.userImage },
                result.token,
              ),
            { label: "Chat notifications: connectUser" },
          );
        }
        if (cancelled) return;

        setUnreadCount(
          (client.user as { total_unread_count?: number } | undefined)?.total_unread_count ?? 0,
        );
        client.on("notification.message_new", handleBackgroundMessage);
        client.on("notification.mark_read", updateBadge);
      } catch (error) {
        console.error("Failed to connect chat notifications:", error);
      }
    }

    connect();

    return () => {
      cancelled = true;
      client.off("notification.message_new", handleBackgroundMessage);
      client.off("notification.mark_read", updateBadge);
    };
  }, [user, setUnreadCount, router]);

  return <>{children}</>;
}