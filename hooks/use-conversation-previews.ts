"use client";

import { useEffect, useRef, useState } from "react";
import { StreamChat, type Channel } from "stream-chat";

import { useAuthStore } from "@/store/auth-store";
import { withRetry } from "@/lib/retry";

export interface ConversationPreview {
  otherUserId: string;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

async function waitForConnection(client: StreamChat, cancelled: { current: boolean }) {
  const start = Date.now();
  while (!client.userID && !cancelled.current && Date.now() - start < 8000) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

export function useConversationPreviews() {
  const user = useAuthStore((state) => state.user);
  const [previews, setPreviews] = useState<Record<string, ConversationPreview>>({});
  const [isLoading, setIsLoading] = useState(true);
  const channelsRef = useRef<Channel[]>([]);

  useEffect(() => {
    if (!user) {
      setPreviews({});
      setIsLoading(false);
      return;
    }

    const cancelled = { current: false };
    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    if (!apiKey) {
      setIsLoading(false);
      return;
    }

    const client = StreamChat.getInstance(apiKey);

    function buildPreviews() {
      const next: Record<string, ConversationPreview> = {};

      for (const channel of channelsRef.current) {
        const otherMemberId = Object.keys(channel.state.members).find((id) => id !== user!.id);
        if (!otherMemberId) continue;

        const messages = channel.state.messages;
        const lastMessage = messages[messages.length - 1];

        next[otherMemberId] = {
          otherUserId: otherMemberId,
          lastMessageText: lastMessage?.text ?? null,
          lastMessageAt: (lastMessage?.created_at as unknown as string | undefined) ?? null,
          unreadCount: channel.countUnread(),
        };
      }

      if (!cancelled.current) setPreviews(next);
    }

    async function load() {
      try {
        await waitForConnection(client, cancelled);
        if (cancelled.current || !client.userID) return;

        channelsRef.current = await withRetry(
          () =>
            client.queryChannels(
              { type: "messaging", members: { $in: [user!.id] } },
              { last_message_at: -1 },
              { state: true, watch: true, presence: false, message_limit: 1 },
            ),
          { label: "Conversation previews: queryChannels" },
        );
        buildPreviews();
      } catch (error) {
        console.error("Failed to load conversation previews:", error);
      } finally {
        if (!cancelled.current) setIsLoading(false);
      }
    }

    load();

    function handleUpdate() {
      buildPreviews();
    }

    client.on("message.new", handleUpdate);
    client.on("notification.message_new", handleUpdate);
    client.on("notification.mark_read", handleUpdate);
    client.on("message.read", handleUpdate);

    return () => {
      cancelled.current = true;
      client.off("message.new", handleUpdate);
      client.off("notification.message_new", handleUpdate);
      client.off("notification.mark_read", handleUpdate);
      client.off("message.read", handleUpdate);
    };
  }, [user]);

  return { previews, isLoading };
}